<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        Gate::define('view-index', function ($user, $resource, array $options = []) {
            // Allow based on roles
            if (!empty($options['allowed_roles']) && $user->hasAnyRole($options['allowed_roles'])) {
                return true;
            }

            // Allow based on permission
            if (!empty($options['required_permission']) && $user->hasPermissionTo($options['required_permission'])) {
                return true;
            }

            // Optional division-based logic
            if (!empty($options['division']) && $user->division === $options['division']) {
                return true;
            }

            return false;
        });
    }
}
