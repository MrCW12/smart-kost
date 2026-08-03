<?php

namespace App\Policies;

use App\Models\Contract;
use App\Models\User;

class ContractPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isDeveloper() || $user->isOwner() || $user->isAdmin();
    }

    public function view(User $user, Contract $contract): bool
    {
        if ($user->isDeveloper()) return true;
        if ($user->isOwner()) return $contract->property->owner_id === $user->owner->id;
        return $user->properties->contains('id', $contract->property_id);
    }

    public function update(User $user, Contract $contract): bool
    {
        if ($user->isDeveloper()) return true;
        if ($user->isOwner()) return $contract->property->owner_id === $user->owner->id;
        return $user->properties->contains('id', $contract->property_id);
    }
}
