<?php

use App\Actions\Tasks\ListEmails;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Socialite\Facades\Socialite;
use SocialiteProviders\Manager\Config;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {
    Route::get('/emails', ListEmails::class)->name('emails.index');
});



Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/auth/microsoft/connect', function () {
        $config = new Config(
            config('services.microsoft.client_id'),
            config('services.microsoft.client_secret'),
            config('services.microsoft.redirect'),
            [
                'tenant' => config('services.microsoft.tenant')
            ]
        );

        return Socialite::driver('microsoft')
            ->setConfig($config)
            ->redirect();
    })->name('auth.microsoft');

    Route::get('/auth/microsoft/callback', function () {
        if (request()->filled('error')) {
            return redirect()->route('emails.index')->with('error', request('error_description', 'Microsoft sign-in failed.'));
        }

        $config = new Config(
            config('services.microsoft.client_id'),
            config('services.microsoft.client_secret'),
            config('services.microsoft.redirect'),
            [
                'tenant' => config('services.microsoft.tenant'),
            ]
        );

        $microsoftUser = Socialite::driver('microsoft')
            ->setConfig($config)
            ->user();

        $user = auth()->user();

        $tokenPayload = $microsoftUser->accessTokenResponseBody ?? [];
        $expiresIn = (int) ($tokenPayload['expires_in'] ?? 3600);

        $user->forceFill([
            'microsoft_access_token' => $microsoftUser->token,
            'microsoft_refresh_token' => $microsoftUser->refreshToken ?? ($tokenPayload['refresh_token'] ?? null),
            'microsoft_token_expires_at' => now()->addSeconds(max($expiresIn - 60, 0)),
        ])->save();

        return redirect()->route('emails.index');
    })->name('auth.microsoft.callback');
});





