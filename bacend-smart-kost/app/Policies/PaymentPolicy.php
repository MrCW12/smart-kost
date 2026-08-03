<?php

namespace App\Policies;

use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isDeveloper() || $user->isOwner() || $user->isAdmin();
    }

    public function view(User $user, Payment $payment): bool
    {
        if ($user->isDeveloper()) return true;
        if ($user->isOwner()) return $payment->property->owner_id === $user->owner->id;
        return $user->properties->contains('id', $payment->property_id);
    }

    public function create(User $user): bool
    {
        return $user->isDeveloper() || $user->isOwner() || $user->isAdmin();
    }

    public function confirm(User $user, Payment $payment): bool
    {
        return $this->view($user, $payment);
    }
}
