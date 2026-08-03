<?php

namespace App\Policies;

use App\Models\CleaningTask;
use App\Models\User;

class CleaningTaskPolicy
{
    public function viewAny(User $user): bool
    {
        return true; // All roles can view cleaning tasks
    }

    public function view(User $user, CleaningTask $task): bool
    {
        if ($user->isDeveloper()) return true;
        if ($user->isOwner()) return $task->property->owner_id === $user->owner->id;
        return $user->properties->contains('id', $task->property_id);
    }

    public function update(User $user, CleaningTask $task): bool
    {
        if ($user->isDeveloper()) return true;
        if ($user->isOwner()) return $task->property->owner_id === $user->owner->id;
        if ($user->isStaff()) return $task->assigned_to === $user->id || $task->assigned_to === null;
        return $user->properties->contains('id', $task->property_id);
    }
}
