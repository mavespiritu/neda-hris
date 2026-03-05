<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Policies\TravelRequestPolicy;

class TravelRequestsServiceProvider extends ServiceProvider
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
            'create',
            'viewAny',
            'view',
            'edit',
            'delete',
            'submit',
        ];

        foreach ($abilities as $ability) {
            Gate::define("tr.$ability", [TravelRequestPolicy::class, $ability]);
        }
    }
}
