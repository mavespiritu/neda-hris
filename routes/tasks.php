<?php

use App\Actions\Tasks\ListEmails;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Socialite\Facades\Socialite;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {
    Route::get('/emails', ListEmails::class)->name('emails.index');
});



Route::middleware('auth')->group(function () {
    Route::get('/auth/microsoft/connect', function () {
        return Socialite::driver('microsoft')
            ->scopes([
                'openid', 
                'profile', 
                'email', 
                'offline_access', 
                'User.Read', 
                'Mail.Read',
                'Mail.Read.Shared',
                'Mail.ReadBasic',
            ])
            ->with(['login_hint' => auth()->user()->email]) // optional
            ->redirect();
    })->name('auth.microsoft');

    Route::get('/auth/microsoft/callback', function () {
        $microsoftUser = Socialite::driver('microsoft')->user();
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





