<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar' => $this->avatar,
            'avatar_url' => $this->avatar ? Storage::disk('public')->url($this->avatar) : null,
            'is_active' => $this->is_active,
            'last_login_at' => $this->last_login_at,
            'email_verified_at' => $this->email_verified_at,
            'created_at' => $this->created_at,
            'roles' => $this->whenLoaded('roles', function () {
                return $this->roles->map(fn ($role) => [
                    'id' => $role->id,
                    'name' => $role->name,
                ]);
            }),
            'owner' => $this->whenLoaded('owner', function () {
                return [
                    'id' => $this->owner->id,
                    'company_name' => $this->owner->company_name,
                    'nik' => $this->owner->nik,
                    'phone' => $this->owner->phone,
                    'address' => $this->owner->address,
                    'bank_name' => $this->owner->bank_name,
                    'bank_account_number' => $this->owner->bank_account_number,
                    'bank_account_name' => $this->owner->bank_account_name,
                    'status' => $this->owner->status,
                ];
            }),
            'owner_id' => $this->owner_id,
            'assigned_owner' => $this->whenLoaded('assignedOwner', function () {
                return [
                    'id' => $this->assignedOwner->id,
                    'company_name' => $this->assignedOwner->company_name,
                ];
            }),
            'permissions' => $this->when($request->user()?->isDeveloper(), function () {
                return $this->getDirectPermissions()->pluck('name');
            }),
            'permissions_locked' => (bool) $this->permissions_locked,
            'effective_permissions' => $this->permissions_locked && ! $this->isDeveloper()
                ? $this->getDirectPermissions()->pluck('name')
                : $this->getAllPermissions()->pluck('name'),
        ];
    }
}
