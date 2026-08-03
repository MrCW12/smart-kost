<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Owner;
use App\Models\TaskGroup;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskGroupController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $ownerId = $this->resolveOwnerId($request);
        $query = TaskGroup::with('members');

        if (!$request->user()->isDeveloper()) {
            $query->where(function ($q) use ($ownerId) {
                $q->where('owner_id', $ownerId)->orWhereNull('owner_id');
            });
        }

        return $this->success(
            $query->latest()->get()->map(fn ($g) => $this->mapGroup($g))
        );
    }

    public function candidates(Request $request): JsonResponse
    {
        $ownerId = $this->resolveOwnerId($request);
        $users = $this->candidateUsers($request, $ownerId);

        return $this->success($users->map(fn ($u) => [
            'id' => $u->id,
            'name' => $u->name,
            'role' => $u->roles->pluck('name')->first(),
        ]));
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'member_ids' => 'nullable|array|max:50',
            'member_ids.*' => 'integer',
        ]);

        $ownerId = $this->resolveOwnerId($request);
        $allowedIds = $this->candidateUserIds($request, $ownerId);
        $memberIds = $this->filterMembers($request->member_ids, $allowedIds);

        $group = TaskGroup::create([
            'name' => $request->name,
            'description' => $request->description,
            'owner_id' => $ownerId,
            'created_by' => $request->user()->id,
        ]);
        $group->members()->sync($memberIds);

        return $this->success($this->mapGroup($group->load('members')), 'Group created successfully', 201);
    }

    public function update(Request $request, TaskGroup $taskGroup): JsonResponse
    {
        if (!$this->canAccess($request, $taskGroup)) {
            return $this->error('Unauthorized', 403);
        }

        $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'member_ids' => 'nullable|array|max:50',
            'member_ids.*' => 'integer',
        ]);

        $ownerId = $this->resolveOwnerId($request);
        $allowedIds = $this->candidateUserIds($request, $ownerId);
        $memberIds = $this->filterMembers($request->member_ids, $allowedIds);

        $taskGroup->update([
            'name' => $request->name,
            'description' => $request->description,
        ]);
        $taskGroup->members()->sync($memberIds);

        return $this->success($this->mapGroup($taskGroup->load('members')), 'Group updated successfully');
    }

    public function destroy(Request $request, TaskGroup $taskGroup): JsonResponse
    {
        if (!$this->canAccess($request, $taskGroup)) {
            return $this->error('Unauthorized', 403);
        }

        $taskGroup->delete();

        return $this->success(null, 'Group deleted successfully');
    }

    private function canAccess(Request $request, TaskGroup $taskGroup): bool
    {
        if ($request->user()->isDeveloper()) return true;
        return $taskGroup->owner_id === $this->resolveOwnerId($request);
    }

    private function resolveOwnerId(Request $request): ?int
    {
        $user = $request->user();

        if ($user->isDeveloper()) {
            return $request->owner_id ? Owner::where('id', $request->owner_id)->value('id') : null;
        }

        if ($user->isOwner()) {
            return $user->owner?->id;
        }

        // Admin / Staff — inherit the owner they report to
        return $user->owner_id;
    }

    private function candidateUsers(Request $request, ?int $ownerId)
    {
        $user = $request->user();

        if ($user->isDeveloper() && !$ownerId) {
            return User::with('roles')->where('is_active', true)->get();
        }

        return User::with('roles')
            ->where('is_active', true)
            ->where(function ($q) use ($ownerId) {
                $q->where(function ($q2) use ($ownerId) {
                    $q2->where('owner_id', $ownerId)
                       ->whereHas('roles', fn ($rq) => $rq->whereIn('name', ['admin', 'staff']));
                })
                ->orWhereIn('id', Owner::where('id', $ownerId)->pluck('user_id'));
            })
            ->orWhereHas('roles', fn ($rq) => $rq->where('name', 'developer'))
            ->get();
    }

    private function candidateUserIds(Request $request, ?int $ownerId): array
    {
        return $this->candidateUsers($request, $ownerId)->pluck('id')->toArray();
    }

    private function filterMembers(?array $memberIds, array $allowedIds): array
    {
        if (!$memberIds) {
            return [];
        }
        return array_values(array_intersect($memberIds, $allowedIds));
    }

    private function mapGroup(TaskGroup $group): array
    {
        return [
            'id' => $group->id,
            'name' => $group->name,
            'description' => $group->description,
            'members' => $group->members->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'role' => $u->roles->pluck('name')->first(),
            ])->values(),
            'created_at' => $group->created_at,
        ];
    }
}
