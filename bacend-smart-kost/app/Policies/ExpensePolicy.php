<?php

namespace App\Policies;

use App\Models\Expense;
use App\Models\User;

class ExpensePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isDeveloper() || $user->isOwner() || $user->isAdmin();
    }

    public function view(User $user, Expense $expense): bool
    {
        if ($user->isDeveloper()) return true;
        if ($user->isOwner()) return $expense->property->owner_id === $user->owner->id;
        return $user->properties->contains('id', $expense->property_id);
    }

    public function create(User $user): bool
    {
        return $user->isDeveloper() || $user->isOwner() || $user->isAdmin();
    }

    public function update(User $user, Expense $expense): bool
    {
        return $this->view($user, $expense);
    }

    public function delete(User $user, Expense $expense): bool
    {
        return $this->view($user, $expense);
    }
}
