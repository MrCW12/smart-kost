<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::before(function ($user, $ability) {
            if (! $user instanceof \App\Models\User) {
                return null;
            }

            if ($user->permissions_locked) {
                return $user->getDirectPermissions()->pluck('name')->contains($ability);
            }

            return $user->checkPermissionTo($ability) ?: null;
        });
    }
}
