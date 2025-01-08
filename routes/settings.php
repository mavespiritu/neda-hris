<?php

use App\Http\Controllers\SettingsController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/settings/cga-enable-updating', [SettingsController::class, 'getCgaEnableUpdatingDates'])->name('settings.get-cga-enable-updating');
    Route::post('/settings/cga-enable-updating', [SettingsController::class, 'setCgaEnableUpdatingDates'])->name('settings.set-cga-enable-updating');
});
