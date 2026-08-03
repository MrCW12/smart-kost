<?php

namespace App\Http\Controllers\Api\Owner;

use App\Enums\InvoiceStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateInvoiceRequest;
use App\Http\Resources\ContractResource;
use App\Http\Resources\InvoiceResource;
use App\Models\Contract;
use App\Models\Invoice;
use App\Models\UtilityReading;
use App\Models\UtilitySetting;
use App\Services\InvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    use \App\Traits\ScopedByProperty;

    public function __construct(
        private InvoiceService $invoiceService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Invoice::with(['tenant', 'room', 'property']);

        // Scope by owner/admin/staff properties
        $propertyIds = $this->getUserPropertyIds($request);
        $query->whereIn('property_id', $propertyIds);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('invoice_number', 'like', "%{$request->search}%")
                  ->orWhereHas('tenant', function ($tq) use ($request) {
                      $tq->where('name', 'like', "%{$request->search}%");
                  });
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->property_id) {
            $query->where('property_id', $request->property_id);
        }

        if ($request->period_month && $request->period_year) {
            $query->where('period_month', $request->period_month)
                  ->where('period_year', $request->period_year);
        }

        $invoices = $query->latest()->paginate($request->get('per_page', 15));

        return $this->successWithMeta(
            InvoiceResource::collection($invoices),
            [
                'current_page' => $invoices->currentPage(),
                'last_page' => $invoices->lastPage(),
                'per_page' => $invoices->perPage(),
                'total' => $invoices->total(),
            ]
        );
    }

    public function show(Invoice $invoice): JsonResponse
    {
        $propertyIds = $this->getUserPropertyIds(request());
        if (!in_array($invoice->property_id, $propertyIds)) {
            return $this->error('Unauthorized', 403);
        }

        return $this->success(
            new InvoiceResource($invoice->load(['tenant', 'room', 'property', 'items', 'payments']))
        );
    }

    public function store(CreateInvoiceRequest $request): JsonResponse
    {
        $contract = Contract::with(['tenant', 'room', 'property'])->findOrFail($request->contract_id);

        $propertyIds = $this->getUserPropertyIds($request);
        if (!in_array($contract->property_id, $propertyIds)) {
            return $this->error('Unauthorized', 403);
        }

        if (!$contract->isActive()) {
            return $this->error('Kontrak tidak aktif', 422);
        }

        try {
            $invoice = $this->invoiceService->createSingleInvoice(
                $contract,
                $request->period_month,
                $request->period_year,
                $request->utility_readings,
                $request->additional_charges
            );

            return $this->success(
                new InvoiceResource($invoice->load(['tenant', 'room', 'property', 'items'])),
                'Tagihan berhasil dibuat',
                201
            );
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    public function billingData(Request $request, Contract $contract): JsonResponse
    {
        $propertyIds = $this->getUserPropertyIds($request);
        if (!in_array($contract->property_id, $propertyIds)) {
            return $this->error('Unauthorized', 403);
        }

        $request->validate([
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer',
        ]);

        $month = $request->month;
        $year = $request->year;

        // Check if invoice already exists
        $existingInvoice = Invoice::where('tenant_id', $contract->tenant_id)
            ->where('period_month', $month)
            ->where('period_year', $year)
            ->first();

        // Get utility settings for this property
        $utilitySettings = UtilitySetting::where('property_id', $contract->property_id)
            ->where('is_active', true)
            ->get();

        // Get existing readings for this period
        $existingReadings = UtilityReading::where('contract_id', $contract->id)
            ->where('period_month', $month)
            ->where('period_year', $year)
            ->with('utilitySetting')
            ->get();

        // Get previous period's end readings (for default start values)
        $lastReadings = UtilityReading::where('contract_id', $contract->id)
            ->where(function ($q) use ($month, $year) {
                $q->where(function ($q2) use ($month, $year) {
                    $q2->where('period_year', '<', $year);
                })->orWhere(function ($q2) use ($month, $year) {
                    $q2->where('period_year', $year)->where('period_month', '<', $month);
                });
            })
            ->whereNotNull('reading_end')
            ->with('utilitySetting')
            ->get()
            ->keyBy(fn ($r) => $r->utility_setting_id);

        // Build readings data
        $readingsData = $utilitySettings->map(function ($setting) use ($existingReadings, $lastReadings) {
            $existing = $existingReadings->firstWhere('utility_setting_id', $setting->id);
            $lastReading = $lastReadings->get($setting->id);

            return [
                'utility_setting_id' => $setting->id,
                'type' => $setting->type,
                'name' => $setting->name,
                'unit' => $setting->unit,
                'rate' => $setting->rate,
                'min_usage' => (float) $setting->min_usage,
                'reading_start' => $existing?->reading_start ?? $lastReading?->reading_end ?? 0,
                'reading_end' => $existing?->reading_end ?? null,
                'usage' => $existing?->usage_amount ?? null,
                'amount' => $existing?->amount ?? null,
            ];
        });

        return $this->success([
            'contract' => new ContractResource($contract->load(['tenant', 'room', 'property'])),
            'readings' => $readingsData,
            'existing_invoice' => $existingInvoice ? [
                'id' => $existingInvoice->id,
                'invoice_number' => $existingInvoice->invoice_number,
                'total_amount' => $existingInvoice->total_amount,
            ] : null,
        ]);
    }

    public function generate(Request $request): JsonResponse
    {
        $request->validate([
            'property_id' => 'required|exists:properties,id',
            'period_month' => 'required|integer|between:1,12',
            'period_year' => 'required|integer',
        ]);

        $propertyIds = $this->getUserPropertyIds($request);
        if (!in_array((int) $request->property_id, $propertyIds)) {
            return $this->error('Unauthorized', 403);
        }

        $contracts = Contract::where('property_id', $request->property_id)
            ->where('status', 'active')
            ->get();

        $generated = 0;
        $skipped = 0;

        foreach ($contracts as $contract) {
            $invoice = $this->invoiceService->generateMonthlyInvoice(
                $contract,
                $request->period_month,
                $request->period_year
            );

            if ($invoice) {
                $generated++;
            } else {
                $skipped++;
            }
        }

        return $this->success([
            'generated' => $generated,
            'skipped' => $skipped,
            'total_contracts' => $contracts->count(),
        ], "Generated {$generated} invoices, skipped {$skipped}");
    }

    public function updateStatus(Request $request, Invoice $invoice): JsonResponse
    {
        $propertyIds = $this->getUserPropertyIds($request);
        if (!in_array($invoice->property_id, $propertyIds)) {
            return $this->error('Unauthorized', 403);
        }

        $request->validate([
            'status' => 'required|string|in:' . implode(',', array_column(InvoiceStatus::cases(), 'value')),
        ]);

        if ($request->status === 'paid') {
            $invoice->update([
                'status' => InvoiceStatus::PAID,
                'paid_at' => now(),
            ]);
        } else {
            $invoice->update(['status' => $request->status]);
        }

        return $this->success(
            new InvoiceResource($invoice->fresh()->load(['tenant', 'room', 'items'])),
            'Invoice status updated successfully'
        );
    }

    public function destroy(Invoice $invoice): JsonResponse
    {
        $propertyIds = $this->getUserPropertyIds(request());
        if (!in_array($invoice->property_id, $propertyIds)) {
            return $this->error('Unauthorized', 403);
        }

        if (in_array($invoice->status->value, ['paid', 'partial'])) {
            return $this->error('Invoice yang sudah dibayar tidak bisa dihapus', 422);
        }

        $pendingPayments = $invoice->payments()->where('status', 'pending')->get();
        if ($pendingPayments->isNotEmpty()) {
            $pendingPayments->each(fn($p) => $p->update(['status' => \App\Enums\PaymentStatus::REJECTED]));
        }

        $invoice->items()->delete();
        $invoice->delete();

        return $this->success(null, 'Invoice berhasil dihapus');
    }
}
