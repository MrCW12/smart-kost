<?php

namespace App\Http\Controllers\Api\Owner;

use App\Enums\RoomStatus;
use App\Enums\TenantStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\CheckOutRequest;
use App\Http\Requests\StoreTenantRequest;
use App\Http\Requests\UpdateTenantRequest;
use App\Http\Resources\TenantResource;
use App\Models\Contract;
use App\Models\Room;
use App\Models\Tenant;
use App\Models\UtilityReading;
use App\Models\UtilitySetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TenantController extends Controller
{
    use \App\Traits\ScopedByProperty;

    public function index(Request $request): JsonResponse
    {
        $query = Tenant::with(['activeContract.room.roomType', 'activeContract.property']);

        // Scope by owner/admin/staff properties
        $propertyIds = $this->getUserPropertyIds($request);
        $query->whereHas('contracts', fn ($q) => $q->whereIn('property_id', $propertyIds));

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('nik', 'like', "%{$request->search}%")
                  ->orWhere('phone', 'like', "%{$request->search}%");
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->property_id) {
            $query->whereHas('contracts', function ($q) use ($request) {
                $q->where('property_id', $request->property_id)
                  ->where('status', 'active');
            });
        }

        $tenants = $query->latest()->paginate($request->get('per_page', 15));

        return $this->successWithMeta(
            TenantResource::collection($tenants),
            [
                'current_page' => $tenants->currentPage(),
                'last_page' => $tenants->lastPage(),
                'per_page' => $tenants->perPage(),
                'total' => $tenants->total(),
            ]
        );
    }

    public function store(StoreTenantRequest $request): JsonResponse
    {
        if (!$this->authorizePropertyAccess($request, (int) $request->property_id)) {
            return $this->error('Unauthorized', 403);
        }

        return DB::transaction(function () use ($request) {
            // Create tenant
            $tenant = Tenant::create([
                'name' => $request->name,
                'nik' => $request->nik,
                'phone' => $request->phone,
                'email' => $request->email,
                'address' => $request->address,
                'occupation' => $request->occupation,
                'emergency_contact' => $request->emergency_contact,
                'emergency_phone' => $request->emergency_phone,
                'notes' => $request->notes,
                'status' => TenantStatus::ACTIVE,
            ]);

            // Check-in: Create contract and update room
            $room = Room::findOrFail($request->room_id);

            if ($room->status !== RoomStatus::AVAILABLE) {
                return $this->error('Room is not available', 422);
            }

            $contract = Contract::create([
                'tenant_id' => $tenant->id,
                'room_id' => $room->id,
                'property_id' => $request->property_id,
                'contract_number' => Contract::generateContractNumber(),
                'start_date' => $request->start_date,
                'monthly_price' => $request->monthly_price,
                'deposit_amount' => $request->deposit_amount ?? 0,
                'payment_day' => $request->payment_day,
                'status' => 'active',
            ]);

            $room->update(['status' => RoomStatus::OCCUPIED]);

            // Create initial utility readings
            if ($request->filled('initial_electricity_reading')) {
                $electricitySetting = UtilitySetting::where('property_id', $request->property_id)
                    ->where('type', 'electricity')
                    ->where('is_active', true)
                    ->first();
                if ($electricitySetting) {
                    UtilityReading::create([
                        'room_id' => $room->id,
                        'property_id' => $request->property_id,
                        'utility_setting_id' => $electricitySetting->id,
                        'contract_id' => $contract->id,
                        'period_month' => now()->month,
                        'period_year' => now()->year,
                        'reading_start' => $request->initial_electricity_reading,
                        'reading_end' => null,
                        'input_by' => $request->user()->id,
                        'input_at' => now(),
                    ]);
                }
            }

            if ($request->filled('initial_water_reading')) {
                $waterSetting = UtilitySetting::where('property_id', $request->property_id)
                    ->where('type', 'water')
                    ->where('is_active', true)
                    ->first();
                if ($waterSetting) {
                    UtilityReading::create([
                        'room_id' => $room->id,
                        'property_id' => $request->property_id,
                        'utility_setting_id' => $waterSetting->id,
                        'contract_id' => $contract->id,
                        'period_month' => now()->month,
                        'period_year' => now()->year,
                        'reading_start' => $request->initial_water_reading,
                        'reading_end' => null,
                        'input_by' => $request->user()->id,
                        'input_at' => now(),
                    ]);
                }
            }

            return $this->success(
                new TenantResource($tenant->load(['activeContract.room.roomType', 'activeContract.property'])),
                'Tenant checked in successfully',
                201
            );
        });
    }

    public function show(Tenant $tenant): JsonResponse
    {
        $propertyIds = $this->getUserPropertyIds(request());
        if (!$tenant->contracts()->whereIn('property_id', $propertyIds)->exists()) {
            return $this->error('Unauthorized', 403);
        }

        return $this->success(
            new TenantResource($tenant->load(['activeContract.room.roomType', 'activeContract.property', 'contracts.room', 'contracts.property']))
        );
    }

    public function update(UpdateTenantRequest $request, Tenant $tenant): JsonResponse
    {
        $propertyIds = $this->getUserPropertyIds($request);
        if (!$tenant->contracts()->whereIn('property_id', $propertyIds)->exists()) {
            return $this->error('Unauthorized', 403);
        }

        $tenant->update($request->validated());

        // Update standing awal (initial utility readings) for the active contract
        $contract = $tenant->activeContract;
        if ($contract) {
            if ($request->filled('initial_electricity_reading')) {
                $this->updateInitialReading($request, $contract, 'electricity', $request->initial_electricity_reading);
            }
            if ($request->filled('initial_water_reading')) {
                $this->updateInitialReading($request, $contract, 'water', $request->initial_water_reading);
            }
        }

        return $this->success(
            new TenantResource($tenant->fresh()->load(['activeContract.room.roomType', 'activeContract.property'])),
            'Tenant updated successfully'
        );
    }

    private function updateInitialReading(Request $request, Contract $contract, string $type, mixed $value): void
    {
        $setting = UtilitySetting::where('property_id', $contract->property_id)
            ->where('type', $type)
            ->where('is_active', true)
            ->first();

        if (!$setting) return;

        $reading = UtilityReading::where('contract_id', $contract->id)
            ->where('utility_setting_id', $setting->id)
            ->whereNull('reading_end')
            ->first();

        if ($reading) {
            $reading->update([
                'reading_start' => $value,
                'input_by' => $request->user()->id,
                'input_at' => now(),
            ]);
        } else {
            UtilityReading::create([
                'room_id' => $contract->room_id,
                'property_id' => $contract->property_id,
                'utility_setting_id' => $setting->id,
                'contract_id' => $contract->id,
                'period_month' => now()->month,
                'period_year' => now()->year,
                'reading_start' => $value,
                'reading_end' => null,
                'input_by' => $request->user()->id,
                'input_at' => now(),
            ]);
        }
    }

    public function checkoutPreview(Request $request, Tenant $tenant): JsonResponse
    {
        $propertyIds = $this->getUserPropertyIds($request);
        if (!$tenant->contracts()->whereIn('property_id', $propertyIds)->exists()) {
            return $this->error('Unauthorized', 403);
        }

        if (!$tenant->isActive()) {
            return $this->error('Tenant is not active', 422);
        }

        $contract = $tenant->activeContract;
        if (!$contract) {
            return $this->error('No active contract found', 422);
        }

        $depositAmount = (float) $contract->deposit_amount;

        $utilityCosts = [];
        $totalUtilityCost = 0;

        $utilitySettings = UtilitySetting::where('property_id', $contract->property_id)
            ->where('is_active', true)
            ->get();

        foreach ($utilitySettings as $setting) {
            $start = $request->input($setting->type === 'electricity' ? 'final_electricity_reading' : 'final_water_reading');

            $lastReading = UtilityReading::where('contract_id', $contract->id)
                ->where('utility_setting_id', $setting->id)
                ->whereNotNull('reading_end')
                ->latest()
                ->first();

            $readingStart = $lastReading ? (float) $lastReading->reading_end : 0;

            if ($start === null) continue;

            $usage = max(0, (float) $start - $readingStart);
            $minUsage = (float) $setting->min_usage;
            $billableUsage = max(0, $usage - $minUsage);
            $rate = (float) $setting->rate;
            $cost = $billableUsage * $rate;

            $utilityCosts[] = [
                'utility_setting_id' => $setting->id,
                'type' => $setting->type,
                'name' => $setting->name,
                'unit' => $setting->unit,
                'rate' => $rate,
                'reading_start' => $readingStart,
                'reading_end' => (float) $start,
                'usage' => $usage,
                'subsidy' => $minUsage,
                'billable_usage' => $billableUsage,
                'cost' => $cost,
            ];

            $totalUtilityCost += $cost;
        }

        $totalAdditionalCharges = 0;
        $charges = $request->input('additional_charges', []);
        if (!empty($charges)) {
            $totalAdditionalCharges = collect($charges)->sum('amount');
        }

        $totalDeductions = $totalUtilityCost + $totalAdditionalCharges;
        $refundAmount = $depositAmount - $totalDeductions;

        return $this->success([
            'deposit_amount' => $depositAmount,
            'utility_costs' => $utilityCosts,
            'total_utility_cost' => $totalUtilityCost,
            'additional_charges' => $charges,
            'total_additional_charges' => $totalAdditionalCharges,
            'total_deductions' => $totalDeductions,
            'refund_amount' => max(0, $refundAmount),
            'remaining_owed' => $refundAmount < 0 ? abs($refundAmount) : 0,
        ]);
    }

    public function checkout(CheckOutRequest $request, Tenant $tenant): JsonResponse
    {
        $propertyIds = $this->getUserPropertyIds($request);
        if (!$tenant->contracts()->whereIn('property_id', $propertyIds)->exists()) {
            return $this->error('Unauthorized', 403);
        }

        if (!$tenant->isActive()) {
            return $this->error('Tenant is not active', 422);
        }

        $contract = $tenant->activeContract;
        if (!$contract) {
            return $this->error('No active contract found', 422);
        }

        return DB::transaction(function () use ($request, $tenant, $contract) {
            // Update tenant status
            $tenant->update(['status' => TenantStatus::CHECKED_OUT]);

            // Update contract
            $contract->update([
                'end_date' => $request->checkout_date,
                'status' => 'completed',
            ]);

            // Update room status
            $contract->room->update(['status' => RoomStatus::CHECKOUT_PROCESS]);

            // Create cleaning task
            $contract->room->cleaningTasks()->create([
                'property_id' => $contract->property_id,
                'type' => 'checkout',
                'status' => 'waiting',
                'priority' => 'high',
            ]);

            // Finalize utility readings
            if ($request->filled('final_electricity_reading')) {
                $reading = UtilityReading::where('contract_id', $contract->id)
                    ->whereHas('utilitySetting', fn ($q) => $q->where('type', 'electricity'))
                    ->whereNull('reading_end')
                    ->first();
                if ($reading) {
                    $reading->update([
                        'reading_end' => $request->final_electricity_reading,
                        'input_by' => $request->user()->id,
                        'input_at' => now(),
                    ]);
                    $reading->calculateUsage();
                    $reading->save();
                }
            }

            if ($request->filled('final_water_reading')) {
                $reading = UtilityReading::where('contract_id', $contract->id)
                    ->whereHas('utilitySetting', fn ($q) => $q->where('type', 'water'))
                    ->whereNull('reading_end')
                    ->first();
                if ($reading) {
                    $reading->update([
                        'reading_end' => $request->final_water_reading,
                        'input_by' => $request->user()->id,
                        'input_at' => now(),
                    ]);
                    $reading->calculateUsage();
                    $reading->save();
                }
            }

            // Create additional charges as invoice items if any
            if ($request->filled('additional_charges')) {
                $totalAdditional = collect($request->additional_charges)->sum('amount');
                if ($totalAdditional > 0) {
                    $invoice = $tenant->invoices()->create([
                        'invoice_number' => \App\Models\Invoice::generateInvoiceNumber(),
                        'property_id' => $contract->property_id,
                        'contract_id' => $contract->id,
                        'period_month' => now()->month,
                        'period_year' => now()->year,
                        'total_amount' => $totalAdditional,
                        'status' => 'unpaid',
                        'due_date' => now()->addDays(7),
                    ]);

                    foreach ($request->additional_charges as $charge) {
                        $invoice->items()->create([
                            'description' => $charge['description'],
                            'amount' => $charge['amount'],
                            'quantity' => 1,
                            'unit_price' => $charge['amount'],
                            'subtotal' => $charge['amount'],
                        ]);
                    }
                }
            }

            return $this->success(
                new TenantResource($tenant->fresh()->load(['activeContract.room.roomType', 'activeContract.property'])),
                'Tenant checked out successfully'
            );
        });
    }

    public function destroy(Tenant $tenant): JsonResponse
    {
        $propertyIds = $this->getUserPropertyIds(request());
        if (!$tenant->contracts()->whereIn('property_id', $propertyIds)->exists()) {
            return $this->error('Unauthorized', 403);
        }

        if ($tenant->isActive()) {
            return $this->error('Cannot delete active tenant. Please check out first.', 422);
        }

        $tenant->delete();

        return $this->success(null, 'Tenant deleted successfully');
    }
}
