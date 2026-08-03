<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;

class InvoicePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isDeveloper() || $user->isOwner() || $user->isAdmin();
    }

    public function view(User $user, Invoice $invoice): bool
    {
        if ($user->isDeveloper()) return true;
        if ($user->isOwner()) return $invoice->property->owner_id === $user->owner->id;
        return $user->properties->contains('id', $invoice->property_id);
    }

    public function update(User $user, Invoice $invoice): bool
    {
        return $this->view($user, $invoice);
    }

    public function delete(User $user, Invoice $invoice): bool
    {
        return $this->view($user, $invoice);
    }
}
