<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\UtilityReading;
use App\Models\UtilitySetting;
use App\Models\Room;
use App\Models\Property;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UtilityController extends Controller
{
    use \App\Traits\ScopedByProperty;

    // Utility Settings
    public function indexSettings(Request $request, Property $property): JsonResponse
    {
        if (!$this->canAccess($request, $property)) {
            return $this->forbidden();
        }

        $settings = $property->utilitySettings()->get();

        return $this->success($settings);
    }

    public function storeSetting(Request $request, Property $property): JsonResponse
    {
        if (!$this->canAccess($request, $property)) {
            return $this->forbidden();
        }

        $request->validate([
            'type' => 'required|string|in:electricity,water,internet,parking,garbage,other',
            'name' => 'required|string|max:100',
            'unit' => 'required|string|max:20',
            'rate' => 'required|numeric|min:0',
            'min_usage' => 'nullable|numeric|min:0',
        ]);

        $setting = $property->utilitySettings()->create($request->only([
            'type', 'name', 'unit', 'rate', 'min_usage',
        ]));

        return $this->success($setting, 'Utility setting created successfully', 201);
    }

    public function updateSetting(Request $request, Property $property, UtilitySetting $setting): JsonResponse
    {
        if (!$this->canAccess($request, $property)) {
            return $this->forbidden();
        }

        $request->validate([
            'name' => 'sometimes|string|max:100',
            'rate' => 'sometimes|numeric|min:0',
            'min_usage' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $setting->update($request->only(['name', 'rate', 'min_usage', 'is_active']));

        return $this->success($setting->fresh(), 'Utility setting updated successfully');
    }

    public function destroySetting(Request $request, Property $property, UtilitySetting $setting): JsonResponse
    {
        if (!$this->canAccess($request, $property)) {
            return $this->forbidden();
        }

        $setting->delete();

        return $this->success(null, 'Utility setting deleted successfully');
    }

    // Utility Readings
    public function indexReadings(Request $request): JsonResponse
    {
        $query = UtilityReading::with(['room', 'utilitySetting', 'contract']);

        // Scope by owner/admin/staff properties
        $propertyIds = $this->getUserPropertyIds($request);
        $query->whereIn('property_id', $propertyIds);

        if ($request->property_id) {
            $query->where('property_id', $request->property_id);
        }

        if ($request->room_id) {
            $query->where('room_id', $request->room_id);
        }

        if ($request->contract_id) {
            $query->where('contract_id', $request->contract_id);
        }

        if ($request->period_month && $request->period_year) {
            $query->where('period_month', $request->period_month)
                  ->where('period_year', $request->period_year);
        }

        $readings = $query->latest()->paginate($request->get('per_page', 15));

        return $this->successWithMeta(
            $readings->getCollection()->map(fn ($r) => [
                'id' => $r->id,
                'room' => ['id' => $r->room->id, 'number' => $r->room->number],
                'utility_setting' => ['id' => $r->utilitySetting->id, 'name' => $r->utilitySetting->name, 'type' => $r->utilitySetting->type, 'unit' => $r->utilitySetting->unit, 'rate' => $r->utilitySetting->rate, 'min_usage' => (float) $r->utilitySetting->min_usage],
                'period_month' => $r->period_month,
                'period_year' => $r->period_year,
                'reading_start' => $r->reading_start,
                'reading_end' => $r->reading_end,
                'usage_amount' => $r->usage_amount,
                'amount' => $r->amount,
                'input_at' => $r->input_at,
            ]),
            [
                'current_page' => $readings->currentPage(),
                'last_page' => $readings->lastPage(),
                'per_page' => $readings->perPage(),
                'total' => $readings->total(),
            ]
        );
    }

    public function storeReading(Request $request): JsonResponse
    {
        $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'utility_setting_id' => 'required|exists:utility_settings,id',
            'contract_id' => 'required|exists:contracts,id',
            'period_month' => 'required|integer|between:1,12',
            'period_year' => 'required|integer',
            'reading_start' => 'required|numeric|min:0',
            'reading_end' => 'nullable|numeric|min:0|gte:reading_start',
        ]);

        $room = Room::findOrFail($request->room_id);
        $propertyIds = $this->getUserPropertyIds($request);
        if (!in_array($room->property_id, $propertyIds)) {
            return $this->error('Unauthorized', 403);
        }

        $exists = UtilityReading::where('room_id', $request->room_id)
            ->where('utility_setting_id', $request->utility_setting_id)
            ->where('period_month', $request->period_month)
            ->where('period_year', $request->period_year)
            ->exists();

        if ($exists) {
            return $this->error('Reading already exists for this room, utility, and period', 422);
        }

        $room = Room::findOrFail($request->room_id);

        $reading = UtilityReading::create([
            'room_id' => $request->room_id,
            'property_id' => $room->property_id,
            'utility_setting_id' => $request->utility_setting_id,
            'contract_id' => $request->contract_id,
            'period_month' => $request->period_month,
            'period_year' => $request->period_year,
            'reading_start' => $request->reading_start,
            'reading_end' => $request->reading_end,
            'input_by' => $request->user()->id,
            'input_at' => now(),
        ]);

        if ($request->reading_end !== null) {
            $reading->calculateUsage();
            $reading->save();
        }

        return $this->success($reading, 'Utility reading created successfully', 201);
    }

    public function updateReading(Request $request, UtilityReading $reading): JsonResponse
    {
        $propertyIds = $this->getUserPropertyIds($request);
        if (!in_array($reading->property_id, $propertyIds)) {
            return $this->error('Unauthorized', 403);
        }

        $request->validate([
            'reading_end' => 'required|numeric|min:0|gte:reading_start',
        ]);

        $reading->update([
            'reading_end' => $request->reading_end,
            'input_by' => $request->user()->id,
            'input_at' => now(),
        ]);

        $reading->calculateUsage();
        $reading->save();

        return $this->success($reading->fresh(), 'Utility reading updated successfully');
    }

    private function canAccess(Request $request, Property $property): bool
    {
        if ($request->user()->isDeveloper()) return true;
        if ($request->user()->isOwner()) return $property->owner_id === $request->user()->owner->id;
        return $request->user()->properties->contains('id', $property->id);
    }
}
