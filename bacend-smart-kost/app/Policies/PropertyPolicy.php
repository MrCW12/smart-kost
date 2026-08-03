<?php

namespace App\Policies;

use App\Models\Property;
use App\Models\User;

class PropertyPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isDeveloper() || $user->isOwner() || $user->isAdmin() || $user->isStaff();
    }

    public function view(User $user, Property $property): bool
    {
        if ($user->isDeveloper()) return true;
        if ($user->isOwner()) return $property->owner_id === $user->owner->id;
        return $user->properties->contains('id', $property->id);
    }

    public function create(User $user): bool
    {
        return $user->isDeveloper() || $user->isOwner();
    }

    public function update(User $user, Property $property): bool
    {
        if ($user->isDeveloper()) return true;
        if ($user->isOwner()) return $property->owner_id === $user->owner->id;
        return false;
    }

    public function delete(User $user, Property $property): bool
    {
        if ($user->isDeveloper()) return true;
        if ($user->isOwner()) return $property->owner_id === $user->owner->id;
        return false;
    }
}
