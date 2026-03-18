<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Policies\ProfilePolicy;

class ProfileServiceProvider extends ServiceProvider
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
        $abilities = [
            'view',
            'change'
        ];

        foreach ($abilities as $ability) {
            Gate::define("profile.$ability", [ProfilePolicy::class, $ability]);
        }
    }
}
