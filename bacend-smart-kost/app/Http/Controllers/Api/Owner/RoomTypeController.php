<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoomTypeRequest;
use App\Http\Resources\RoomTypeResource;
use App\Models\Property;
use App\Models\RoomType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomTypeController extends Controller
{
    public function index(Request $request, Property $property): JsonResponse
    {
        if (!$this->canAccess($request, $property)) {
            return $this->forbidden();
        }

        $roomTypes = $property->roomTypes()->withCount('rooms')->latest()->paginate($request->get('per_page', 15));

        return $this->successWithMeta(
            RoomTypeResource::collection($roomTypes),
            [
                'current_page' => $roomTypes->currentPage(),
                'last_page' => $roomTypes->lastPage(),
                'per_page' => $roomTypes->perPage(),
                'total' => $roomTypes->total(),
            ]
        );
    }

    public function store(StoreRoomTypeRequest $request, Property $property): JsonResponse
    {
        if (!$this->canAccess($request, $property)) {
            return $this->forbidden();
        }

        $roomType = $property->roomTypes()->create($request->validated());

        return $this->success(
            new RoomTypeResource($roomType),
            'Room type created successfully',
            201
        );
    }

    public function update(StoreRoomTypeRequest $request, Property $property, RoomType $roomType): JsonResponse
    {
        if (!$this->canAccess($request, $property)) {
            return $this->forbidden();
        }

        $roomType->update($request->validated());

        return $this->success(
            new RoomTypeResource($roomType->fresh()),
            'Room type updated successfully'
        );
    }

    public function destroy(Request $request, Property $property, RoomType $roomType): JsonResponse
    {
        if (!$this->canAccess($request, $property)) {
            return $this->forbidden();
        }

        if ($roomType->rooms()->exists()) {
            return $this->error('Cannot delete room type with existing rooms', 422);
        }

        $roomType->delete();

        return $this->success(null, 'Room type deleted successfully');
    }

    private function canAccess(Request $request, Property $property): bool
    {
        if ($request->user()->isDeveloper()) return true;
        if ($request->user()->isOwner()) return $property->owner_id === $request->user()->owner->id;
        return $request->user()->properties->contains('id', $property->id);
    }
}
