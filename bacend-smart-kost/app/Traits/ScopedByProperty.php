<?php

namespace App\Traits;

use App\Models\Property;
use Illuminate\Http\Request;

trait ScopedByProperty
{
    public function getUserPropertyIds(Request $request): array
    {
        $user = $request->user();

        if ($user->isDeveloper()) {
            return Property::pluck('id')->toArray();
        }

        if ($user->isOwner()) {
            return Property::where('owner_id', $user->owner->id)->pluck('id')->toArray();
        }

        // Admin / Staff — inherit ALL properties of the owner they report to
        if ($user->owner_id) {
            return Property::where('owner_id', $user->owner_id)->pluck('id')->toArray();
        }

        return [];
    }

    public function authorizePropertyAccess(Request $request, int $propertyId): bool
    {
        $propertyIds = $this->getUserPropertyIds($request);
        return in_array($propertyId, $propertyIds);
    }
}
