<?php

namespace App\Http\Controllers\Api\Developer;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Owner;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::with('roles', 'owner', 'assignedOwner');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            });
        }

        if ($request->role) {
            $query->role($request->role);
        }

        $users = $query->latest()->paginate($request->get('per_page', 15));

        return $this->successWithMeta(
            UserResource::collection($users),
            [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ]
        );
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
            'role' => 'required|string|exists:roles,name',
            'is_active' => 'boolean',
            'owner_id' => 'required_if:role,admin,staff|nullable|exists:owners,id',
            'company_name' => 'required_if:role,owner|nullable|string|max:255',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,
            'phone' => $request->phone,
            'is_active' => $request->boolean('is_active', true),
            'owner_id' => in_array($request->role, ['admin', 'staff']) ? $request->owner_id : null,
        ]);

        $user->assignRole($request->role);

        if ($request->role === 'owner') {
            $user->owner()->create([
                'company_name' => $request->company_name,
                'phone' => $request->phone,
                'status' => 'active',
            ]);
        }

        return $this->success(
            new UserResource($user->load('roles', 'owner', 'assignedOwner')),
            'User created successfully',
            201
        );
    }

    public function show(User $user): JsonResponse
    {
        $user->load('roles', 'owner', 'assignedOwner');

        return $this->success(new UserResource($user));
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'is_active' => 'boolean',
            'role' => 'sometimes|string|exists:roles,name',
            'owner_id' => 'nullable|exists:owners,id',
        ]);

        $user->update($request->only(['name', 'email', 'phone', 'is_active', 'owner_id']));

        if ($request->has('role')) {
            $user->syncRoles($request->role);
        }

        return $this->success(
            new UserResource($user->fresh()->load('roles', 'owner', 'assignedOwner')),
            'User updated successfully'
        );
    }

    public function destroy(User $user): JsonResponse
    {
        if ($user->isDeveloper()) {
            return $this->error('Cannot delete developer account', 403);
        }

        $user->delete();

        return $this->success(null, 'User deleted successfully');
    }

    public function syncPermissions(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'permissions' => 'present|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $permissions = $data['permissions'];

        if ($user->isDeveloper()) {
            $protected = Permission::all()
                ->pluck('name')
                ->filter(fn ($name) => str_starts_with($name, 'user.') ||
                    str_starts_with($name, 'role.') ||
                    str_starts_with($name, 'system.') ||
                    $name === 'owner.switch')
                ->values()
                ->toArray();

            $permissions = array_values(array_unique(array_merge($permissions, $protected)));
        }

        $user->syncPermissions($permissions);

        return $this->success(
            $user->getDirectPermissions()->pluck('name'),
            'User permissions updated successfully'
        );
    }

    public function owners(): JsonResponse
    {
        $owners = Owner::with('user:id,name,email')->get();

        return $this->success($owners->map(fn ($o) => [
            'id' => $o->id,
            'company_name' => $o->company_name,
            'user_name' => $o->user->name ?? '-',
            'user_email' => $o->user->email ?? '-',
        ]));
    }
}
