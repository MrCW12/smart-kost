<?php

namespace App\Policies;

use App\Models\Owner;
use App\Models\User;

class OwnerPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isDeveloper();
    }

    public function view(User $user, Owner $owner): bool
    {
        if ($user->isDeveloper()) return true;
        if ($user->isOwner()) return $owner->user_id === $user->id;
        return false;
    }

    public function create(User $user): bool
    {
        return $user->isDeveloper();
    }

    public function update(User $user, Owner $owner): bool
    {
        if ($user->isDeveloper()) return true;
        if ($user->isOwner()) return $owner->user_id === $user->id;
        return false;
    }

    public function delete(User $user, Owner $owner): bool
    {
        if ($user->isDeveloper()) return true;
        return false;
    }
}
