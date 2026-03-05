<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Policies\TripTicketPolicy;

class TripTicketsServiceProvider extends ServiceProvider
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
            'viewAny',
            'view',
            'create',
            'edit',
            'delete',
            'viewByVehicleRequest',
            'createByVehicleRequest',
            'editByVehicleRequest',
            'deleteByVehicleRequest',
            'generate',
            'completeTrip'
        ];

        foreach ($abilities as $ability) {
            Gate::define("tt.$ability", [TripTicketPolicy::class, $ability]);
        }
    }
}
