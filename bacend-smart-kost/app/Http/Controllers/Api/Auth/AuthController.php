<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Http\Resources\UserResource;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (!$user->is_active) {
            return $this->error('Your account has been deactivated.', 403);
        }

        $user->update(['last_login_at' => now()]);

        $token = $user->createToken('auth-token')->plainTextToken;

        AuditLogger::log('auth.login', $user, [], ['ip' => $request->ip()], $user->id);

        return $this->success([
            'user' => new UserResource($user->load('owner', 'roles')),
            'token' => $token,
        ], 'Login successful');
    }

    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,
            'phone' => $request->phone,
        ]);

        $user->assignRole('owner');

        $owner = $user->owner()->create([
            'phone' => $request->phone,
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return $this->success([
            'user' => new UserResource($user->load('owner')),
            'token' => $token,
        ], 'Registration successful', 201);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        AuditLogger::log('auth.logout', $user, [], [], $user->id);

        $user->currentAccessToken()->delete();

        return $this->success(null, 'Logged out successfully');
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('owner', 'roles', 'assignedOwner');

        return $this->success(new UserResource($user));
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
        ]);

        $user->update($request->only(['name', 'phone', 'email']));

        if ($user->owner) {
            $user->owner->update($request->only(['phone', 'company_name', 'address', 'bank_name', 'bank_account_number', 'bank_account_name']));
        }

        return $this->success(new UserResource($user->fresh()->load('owner')), 'Profile updated successfully');
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return $this->error('Password lama salah', 422);
        }

        $user->update(['password' => $request->password]);

        return $this->success(null, 'Password berhasil diubah');
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $user = $request->user();

        if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('file')->store('avatars', 'public');
        $user->update(['avatar' => $path]);

        return $this->success([
            'avatar' => $path,
            'avatar_url' => Storage::disk('public')->url($path),
        ], 'Foto profil berhasil diunggah');
    }
}
