<?php

namespace App\Policies;

use App\Models\Room;
use App\Models\User;

class RoomPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isDeveloper() || $user->isOwner() || $user->isAdmin() || $user->isStaff();
    }

    public function view(User $user, Room $room): bool
    {
        if ($user->isDeveloper()) return true;
        if ($user->isOwner()) return $room->property->owner_id === $user->owner->id;
        return $user->properties->contains('id', $room->property_id);
    }

    public function create(User $user): bool
    {
        return $user->isDeveloper() || $user->isOwner();
    }

    public function update(User $user, Room $room): bool
    {
        if ($user->isDeveloper()) return true;
        if ($user->isOwner()) return $room->property->owner_id === $user->owner->id;
        return $user->properties->contains('id', $room->property_id);
    }

    public function delete(User $user, Room $room): bool
    {
        if ($user->isDeveloper()) return true;
        if ($user->isOwner()) return $room->property->owner_id === $user->owner->id;
        return false;
    }
}
