<?php

namespace App\Policies;

use App\Models\Tenant;
use App\Models\User;

class TenantPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isDeveloper() || $user->isOwner() || $user->isAdmin();
    }

    public function view(User $user, Tenant $tenant): bool
    {
        if ($user->isDeveloper()) return true;
        if ($user->isOwner()) {
            return $tenant->contracts()->whereHas('property', function ($q) use ($user) {
                $q->where('owner_id', $user->owner->id);
            })->exists();
        }
        return false;
    }

    public function create(User $user): bool
    {
        return $user->isDeveloper() || $user->isOwner() || $user->isAdmin();
    }

    public function update(User $user, Tenant $tenant): bool
    {
        return $this->view($user, $tenant);
    }

    public function delete(User $user, Tenant $tenant): bool
    {
        if ($user->isDeveloper()) return true;
        return false;
    }
}
