<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Policies\VehicleRequestPolicy;

class VehicleRequestsServiceProvider extends ServiceProvider
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
            'submit',
            'endorse',
            'approve',
            'review',
            'disapprove',
            'return',
            'authorize',
            'resubmit'
        ];

        foreach ($abilities as $ability) {
            Gate::define("vr.$ability", [VehicleRequestPolicy::class, $ability]);
        }
    }
}
