<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Policies\RtoPolicy;

class RtoServiceProvider extends ServiceProvider
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
            'visibleEmployeeIds',
        ];

        foreach ($abilities as $ability) {
            Gate::define("rto.$ability", [RtoPolicy::class, $ability]);
        }
    }
}
