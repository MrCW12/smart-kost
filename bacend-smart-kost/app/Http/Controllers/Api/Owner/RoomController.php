<?php

namespace App\Http\Controllers\Api\Owner;

use App\Enums\RoomStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoomRequest;
use App\Http\Requests\UpdateRoomRequest;
use App\Http\Resources\RoomResource;
use App\Models\Property;
use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    public function index(Request $request, Property $property): JsonResponse
    {
        if (!$this->canAccess($request, $property)) {
            return $this->forbidden();
        }

        $query = $property->rooms()->with(['roomType']);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('number', 'like', "%{$request->search}%")
                  ->orWhere('floor', 'like', "%{$request->search}%");
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->room_type_id) {
            $query->where('room_type_id', $request->room_type_id);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $rooms = $query->latest()->paginate($request->get('per_page', 15));

        return $this->successWithMeta(
            RoomResource::collection($rooms),
            [
                'current_page' => $rooms->currentPage(),
                'last_page' => $rooms->lastPage(),
                'per_page' => $rooms->perPage(),
                'total' => $rooms->total(),
            ]
        );
    }

    public function store(StoreRoomRequest $request, Property $property): JsonResponse
    {
        if (!$this->canAccess($request, $property)) {
            return $this->forbidden();
        }

        $exists = $property->rooms()->where('number', $request->number)->exists();
        if ($exists) {
            return $this->error('Room number already exists in this property', 422);
        }

        $room = $property->rooms()->create(array_merge(
            $request->validated(),
            ['status' => $request->input('status', RoomStatus::AVAILABLE->value)]
        ));

        return $this->success(
            new RoomResource($room->load('roomType')),
            'Room created successfully',
            201
        );
    }

    public function show(Request $request, Property $property, Room $room): JsonResponse
    {
        if (!$this->canAccess($request, $property)) {
            return $this->forbidden();
        }

        return $this->success(
            new RoomResource($room->load(['roomType', 'property']))
        );
    }

    public function update(UpdateRoomRequest $request, Property $property, Room $room): JsonResponse
    {
        if (!$this->canAccess($request, $property)) {
            return $this->forbidden();
        }

        if ($request->has('number') && $request->number !== $room->number) {
            $exists = $property->rooms()->where('number', $request->number)->where('id', '!=', $room->id)->exists();
            if ($exists) {
                return $this->error('Room number already exists in this property', 422);
            }
        }

        $room->update($request->validated());

        return $this->success(
            new RoomResource($room->fresh()->load('roomType')),
            'Room updated successfully'
        );
    }

    public function destroy(Request $request, Property $property, Room $room): JsonResponse
    {
        if (!$this->canAccess($request, $property)) {
            return $this->forbidden();
        }

        if ($room->status === RoomStatus::OCCUPIED) {
            return $this->error('Cannot delete occupied room', 422);
        }

        $room->delete();

        return $this->success(null, 'Room deleted successfully');
    }

    public function updateStatus(Request $request, Property $property, Room $room): JsonResponse
    {
        if (!$this->canAccess($request, $property)) {
            return $this->forbidden();
        }

        $request->validate([
            'status' => 'required|string|in:' . implode(',', array_column(RoomStatus::cases(), 'value')),
        ]);

        $room->update(['status' => $request->status]);

        return $this->success(
            new RoomResource($room->fresh()),
            'Room status updated successfully'
        );
    }

    private function canAccess(Request $request, Property $property): bool
    {
        if ($request->user()->isDeveloper()) return true;
        if ($request->user()->isOwner()) return $property->owner_id === $request->user()->owner->id;
        return $request->user()->properties->contains('id', $property->id);
    }
}
