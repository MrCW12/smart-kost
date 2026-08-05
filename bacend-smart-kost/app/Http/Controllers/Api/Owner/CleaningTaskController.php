<?php

namespace App\Http\Controllers\Api\Owner;

use App\Enums\CleaningTaskStatus;
use App\Enums\CleaningTaskType;
use App\Enums\RoomStatus;
use App\Http\Controllers\Controller;
use App\Models\CleaningTask;
use App\Models\CleaningTaskPhoto;
use App\Models\Property;
use App\Models\TaskGroup;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CleaningTaskController extends Controller
{
    use \App\Traits\ScopedByProperty;

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'property_id' => 'required|exists:properties,id',
            'room_id' => 'required|exists:rooms,id',
            'type' => 'required|string|in:cleaning,checkout,periodic,maintenance,request',
            'priority' => 'nullable|string|in:low,medium,high,urgent',
            'assigned_to' => 'nullable|exists:users,id',
            'group_id' => 'nullable|exists:task_groups,id',
            'notes' => 'nullable|string|max:1000',
            'file' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        $property = Property::find($request->property_id);
        if (!$property || !in_array($property->id, $this->getUserPropertyIds($request))) {
            return $this->error('Unauthorized', 403);
        }

        if ($request->group_id) {
            $group = TaskGroup::find($request->group_id);
            if ($group && $group->owner_id && $group->owner_id !== $property->owner_id) {
                return $this->error('Group tidak cocok dengan properti ini', 422);
            }
        }

        $room = $property->rooms()->find($request->room_id);
        if (!$room) {
            return $this->error('Room not found in this property', 422);
        }

        $task = CleaningTask::create([
            'property_id' => $property->id,
            'room_id' => $room->id,
            'type' => $request->type,
            'status' => CleaningTaskStatus::WAITING,
            'priority' => $request->priority ?? 'medium',
            'assigned_to' => $request->assigned_to,
            'group_id' => $request->group_id,
            'notes' => $request->notes,
        ]);

        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('task-photos', 'public');
            $task->photos()->create([
                'path' => $path,
                'type' => 'before',
                'caption' => 'Foto task',
            ]);
        }

        // Update room status based on task type
        $roomStatus = match ($request->type) {
            CleaningTaskType::MAINTENANCE->value => RoomStatus::MAINTENANCE,
            default => RoomStatus::CLEANING,
        };
        $room->update(['status' => $roomStatus]);

        return $this->success(
            $task->load(['room', 'property', 'taskGroup']),
            'Task created successfully',
            201
        );
    }

    public function index(Request $request): JsonResponse
    {
        $query = CleaningTask::with(['room', 'property', 'assignedUser', 'taskGroup']);

        // Scope by owner/admin/staff properties
        $propertyIds = $this->getUserPropertyIds($request);
        $query->whereIn('property_id', $propertyIds);

        if ($request->boolean('mine')) {
            $query->where('assigned_to', auth()->id());
        }

        if ($request->boolean('available')) {
            $query->where('status', 'waiting')->whereNull('assigned_to');
        }

        if ($request->property_id) {
            $query->where('property_id', $request->property_id);
        }

        if ($request->type) {
            $query->where('type', $request->type);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->assigned_to) {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->group_id) {
            $query->where('group_id', $request->group_id);
        }

        $tasks = $query->latest()->paginate($request->get('per_page', 15));

        $meta = [
            'current_page' => $tasks->currentPage(),
            'last_page' => $tasks->lastPage(),
            'per_page' => $tasks->perPage(),
            'total' => $tasks->total(),
        ];

        if ($request->boolean('mine')) {
            $meta['status_counts'] = CleaningTask::where('assigned_to', auth()->id())
                ->whereIn('property_id', $propertyIds)
                ->selectRaw('status, count(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status');
        }

        if ($request->boolean('available')) {
            $meta['available_count'] = CleaningTask::where('status', 'waiting')
                ->whereNull('assigned_to')
                ->whereIn('property_id', $propertyIds)
                ->count();
        }

        return $this->successWithMeta(
            $tasks->map(fn ($t) => [
                'id' => $t->id,
                'room' => ['id' => $t->room->id, 'number' => $t->room->number],
                'property' => ['id' => $t->property->id, 'name' => $t->property->name],
                'assigned_to' => $t->assignedUser?->name,
                'group' => $t->taskGroup ? ['id' => $t->taskGroup->id, 'name' => $t->taskGroup->name] : null,
                'type' => $t->type,
                'status' => $t->status,
                'status_label' => $t->status,
                'priority' => $t->priority,
                'notes' => $t->notes,
                'started_at' => $t->started_at,
                'completed_at' => $t->completed_at,
                'verified_at' => $t->verified_at,
                'photos_count' => $t->photos->count(),
                'created_at' => $t->created_at,
            ]),
            $meta
        );
    }

    public function assignableUsers(Request $request): JsonResponse
    {
        $request->validate([
            'property_id' => 'required|exists:properties,id',
            'group_id' => 'nullable|exists:task_groups,id',
        ]);

        $property = Property::find($request->property_id);
        if (!$property || !in_array($property->id, $this->getUserPropertyIds($request))) {
            return $this->error('Unauthorized', 403);
        }

        $users = User::with('roles')
            ->where(function ($q) use ($property) {
                // Staff & admin yang bernaung di bawah owner properti ini
                $q->where('owner_id', $property->owner_id)
                  ->whereHas('roles', fn ($rq) => $rq->whereIn('name', ['admin', 'staff']));
            })
            ->orWhere('id', $property->owner?->user_id)
            ->get()
            ->unique('id');

        // Filter ke anggota group yang dipilih (helpdesk style)
        if ($request->group_id) {
            $memberIds = TaskGroup::find($request->group_id)?->members()->pluck('users.id')->toArray() ?? [];
            $users = $users->filter(fn ($u) => in_array($u->id, $memberIds))->values();
        }

        return $this->success($users->map(fn ($u) => [
            'id' => $u->id,
            'name' => $u->name,
            'role' => $u->roles->pluck('name')->first(),
        ]));
    }

    public function show(CleaningTask $cleaningTask): JsonResponse
    {
        $propertyIds = $this->getUserPropertyIds(request());
        if (!in_array($cleaningTask->property_id, $propertyIds)) {
            return $this->error('Unauthorized', 403);
        }

        $cleaningTask->load(['room', 'property', 'assignedUser', 'verifiedUser', 'photos', 'taskGroup']);

        return $this->success([
            'id' => $cleaningTask->id,
            'room' => ['id' => $cleaningTask->room->id, 'number' => $cleaningTask->room->number],
            'property' => ['id' => $cleaningTask->property->id, 'name' => $cleaningTask->property->name],
            'assigned_to' => $cleaningTask->assignedUser?->name,
            'group' => $cleaningTask->taskGroup ? ['id' => $cleaningTask->taskGroup->id, 'name' => $cleaningTask->taskGroup->name] : null,
            'type' => $cleaningTask->type,
            'status' => $cleaningTask->status,
            'priority' => $cleaningTask->priority,
            'notes' => $cleaningTask->notes,
            'started_at' => $cleaningTask->started_at,
            'completed_at' => $cleaningTask->completed_at,
            'verified_at' => $cleaningTask->verified_at,
            'photos' => $cleaningTask->photos->map(fn ($p) => [
                'id' => $p->id,
                'path' => $p->path,
                'url' => Storage::disk('public')->url($p->path),
                'type' => $p->type,
                'caption' => $p->caption,
            ]),
            'created_at' => $cleaningTask->created_at,
        ]);
    }

    public function updateStatus(Request $request, CleaningTask $cleaningTask): JsonResponse
    {
        $propertyIds = $this->getUserPropertyIds($request);
        if (!in_array($cleaningTask->property_id, $propertyIds)) {
            return $this->error('Unauthorized', 403);
        }

        $request->validate([
            'status' => 'required|string|in:in_progress,done,verified',
            'notes' => 'nullable|string',
        ]);

        $status = $request->status;

        switch ($status) {
            case 'in_progress':
                $cleaningTask->update([
                    'status' => CleaningTaskStatus::IN_PROGRESS,
                    'started_at' => now(),
                    'assigned_to' => $cleaningTask->assigned_to ?? $request->user()->id,
                ]);
                break;

            case 'done':
                $cleaningTask->update([
                    'status' => CleaningTaskStatus::DONE,
                    'completed_at' => now(),
                    'notes' => $request->notes ?? $cleaningTask->notes,
                ]);
                // Update room status
                $cleaningTask->room->update(['status' => RoomStatus::READY_TO_RENT]);
                break;

            case 'verified':
                $cleaningTask->update([
                    'status' => CleaningTaskStatus::VERIFIED,
                    'verified_by' => $request->user()->id,
                    'verified_at' => now(),
                ]);
                // Update room status
                $cleaningTask->room->update(['status' => RoomStatus::AVAILABLE]);
                break;
        }

        return $this->success(
            $cleaningTask->fresh(['room', 'assignedUser']),
            'Cleaning task status updated successfully'
        );
    }

    public function addPhoto(Request $request, CleaningTask $cleaningTask): JsonResponse
    {
        $propertyIds = $this->getUserPropertyIds($request);
        if (!in_array($cleaningTask->property_id, $propertyIds)) {
            return $this->error('Unauthorized', 403);
        }

        $request->validate([
            'file' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            'path' => 'nullable|string|max:500',
            'type' => 'required|string|in:before,after,during',
            'caption' => 'nullable|string|max:255',
        ]);

        $path = $request->path;
        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('task-photos', 'public');
        }

        if (!$path) {
            return $this->error('Foto atau path wajib diisi', 422);
        }

        $photo = $cleaningTask->photos()->create([
            'path' => $path,
            'type' => $request->type,
            'caption' => $request->caption,
        ]);

        return $this->success([
            'id' => $photo->id,
            'path' => $photo->path,
            'url' => Storage::disk('public')->url($photo->path),
            'type' => $photo->type,
            'caption' => $photo->caption,
        ], 'Photo added successfully', 201);
    }
}
