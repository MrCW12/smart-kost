<?php

namespace App\Http\Controllers\Api\Developer;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SwitchOwnerController extends Controller
{
    public function __invoke(Request $request, User $user): JsonResponse
    {
        if (!$user->isOwner()) {
            return $this->error('User is not an owner', 422);
        }

        $request->user()->switchTenant('owner', [
            'original_user_id' => $request->user()->id,
            'switched_to_user_id' => $user->id,
        ]);

        $token = $request->user()->createToken('switched-token')->plainTextToken;

        return $this->success([
            'user' => new UserResource($user->load('owner')),
            'token' => $token,
        ], 'Switched to owner: ' . $user->name);
    }
}
