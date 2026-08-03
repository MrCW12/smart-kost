<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePropertyRequest;
use App\Http\Requests\UpdatePropertyRequest;
use App\Http\Resources\PropertyResource;
use App\Models\Property;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PropertyController extends Controller
{
    use \App\Traits\ScopedByProperty;

    public function index(Request $request): JsonResponse
    {
        $query = Property::with(['rooms', 'owner']);

        // Scope by owner/admin/staff properties
        $propertyIds = $this->getUserPropertyIds($request);
        $query->whereIn('id', $propertyIds);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('city', 'like', "%{$request->search}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $properties = $query->latest()->paginate($request->get('per_page', 15));

        return $this->successWithMeta(
            PropertyResource::collection($properties),
            [
                'current_page' => $properties->currentPage(),
                'last_page' => $properties->lastPage(),
                'per_page' => $properties->perPage(),
                'total' => $properties->total(),
            ]
        );
    }

    public function store(StorePropertyRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['owner_id'] = $request->user()->owner?->id ?? $request->user()->owner_id;

        $property = Property::create($data);

        return $this->success(
            new PropertyResource($property->load('owner')),
            'Property created successfully',
            201
        );
    }

    public function show(Request $request, Property $property): JsonResponse
    {
        if (!$this->canAccess($request, $property)) {
            return $this->forbidden();
        }

        return $this->success(
            new PropertyResource($property->load(['rooms', 'roomTypes', 'owner']))
        );
    }

    public function update(UpdatePropertyRequest $request, Property $property): JsonResponse
    {
        if (!$this->canAccess($request, $property)) {
            return $this->forbidden();
        }

        $property->update($request->validated());

        return $this->success(
            new PropertyResource($property->fresh()->load('owner')),
            'Property updated successfully'
        );
    }

    public function destroy(Request $request, Property $property): JsonResponse
    {
        if (!$this->canAccess($request, $property)) {
            return $this->forbidden();
        }

        $hasActiveTenants = $property->rooms()->where('status', 'occupied')->exists();
        if ($hasActiveTenants) {
            return $this->error('Cannot delete property with active tenants', 422);
        }

        $property->delete();

        return $this->success(null, 'Property deleted successfully');
    }

    private function canAccess(Request $request, Property $property): bool
    {
        return $this->authorizePropertyAccess($request, $property->id);
    }
}
