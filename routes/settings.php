<?php

use App\Http\Controllers\SettingsController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['web', 'auth.any'])->group(function () {
    Route::get('/settings/cga-enable-updating', [SettingsController::class, 'getCgaEnableUpdatingDates'])->name('settings.get-cga-enable-updating');

    Route::get('/settings/cga-submission-schedules', [SettingsController::class, 'getCgaSubmissionSchedules'])->name('settings.cga.submission-schedules');

    Route::post('/settings/cga-enable-updating', [SettingsController::class, 'setCgaEnableUpdatingDates'])->name('settings.set-cga-enable-updating');

    Route::get('/settings/account', [SettingsController::class, 'account'])->name('settings.account');
    Route::post('/settings/account', [SettingsController::class, 'updateAccount'])->name('settings.account.update');

    Route::get('/settings/organization', [SettingsController::class, 'organization'])->name('settings.organization');
    Route::patch('/settings/organization', [SettingsController::class, 'updateOrganization'])->name('settings.organization.update');

    Route::get('/settings/recruitment', [SettingsController::class, 'recruitment'])->name('settings.recruitment');
    Route::patch('/settings/recruitment', [SettingsController::class, 'updateRecruitment'])
    ->name('settings.recruitment.update');
});
