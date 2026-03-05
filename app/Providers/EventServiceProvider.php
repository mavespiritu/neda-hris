<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        /* \SocialiteProviders\Manager\SocialiteWasCalled::class => [
            'SocialiteProviders\\Microsoft\\MicrosoftExtendSocialite@handle',
        ], */
        \App\Events\VehicleRequestStateChanged::class => [
            \App\Actions\VehicleRequests\DispatchVehicleRequestNotification::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        //
    }
}