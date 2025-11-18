<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\NotificationController as GeneralNotificationController;
use App\Http\Controllers\Vacancies\NotificationController as VacancyNotificationController;
use App\Http\Controllers\JobPortal\NotificationController as JobPortalNotificationController;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {
    Route::post('/notification/submit-gap-analysis', [GeneralNotificationController::class, 'submitGapAnalysis'])->name('notification.submit-gap-analysis');
    Route::post('/notification/endorse-gap-analysis', [GeneralNotificationController::class, 'endorseGapAnalysis'])->name('notification.endorse-gap-analysis');
    Route::post('/notification/approve-gap-analysis', [GeneralNotificationController::class, 'approveGapAnalysis'])->name('notification.approve-gap-analysis');
    Route::post('/notification/return-gap-analysis', [GeneralNotificationController::class, 'returnGapAnalysis'])->name('notification.return-gap-analysis');
    Route::post('/notification/disapprove-gap-analysis', [GeneralNotificationController::class, 'disapproveGapAnalysis'])->name('notification.disapprove-gap-analysis');

    Route::post('/notification/{id}/submit-rto', [GeneralNotificationController::class, 'submitRto'])->name('notification.submit-rto');
    Route::post('/notification/{id}/endorse-rto/{userId}', [GeneralNotificationController::class, 'endorseRto'])->name('notification.endorse-rto');
    Route::post('/notification/{id}/approve-rto/{userId}', [GeneralNotificationController::class, 'approveRto'])->name('notification.approve-rto');
    Route::post('/notification/{id}/return-rto/{userId}', [GeneralNotificationController::class, 'returnRto'])->name('notification.return-rto');
    Route::post('/notification/{id}/disapprove-rto/{userId}', [GeneralNotificationController::class, 'disapproveRto'])->name('notification.disapprove-rto');

    Route::post('/notification/{id}/submit-raa', [GeneralNotificationController::class, 'submitRaa'])->name('notification.submit-raa');
    Route::post('/notification/{id}/endorse-raa/{userId}', [GeneralNotificationController::class, 'endorseRaa'])->name('notification.endorse-raa');
    Route::post('/notification/{id}/approve-raa/{userId}', [GeneralNotificationController::class, 'approveRaa'])->name('notification.approve-raa');
    Route::post('/notification/{id}/return-raa/{userId}', [GeneralNotificationController::class, 'returnRaa'])->name('notification.return-raa');
    Route::post('/notification/{id}/disapprove-raa/{userId}', [GeneralNotificationController::class, 'disapproveRaa'])->name('notification.disapprove-raa');

    Route::post('/notification/{id}/submit-vacancy', [VacancyNotificationController::class, 'submit'])->name('notification.submit-vacancy');
    Route::post('/notification/{id}/approve-vacancy/{userId}', [VacancyNotificationController::class, 'approve'])->name('notification.approve-vacancy');
    Route::post('/notification/{id}/return-vacancy/{userId}', [VacancyNotificationController::class, 'return'])->name('notification.return-vacancy');
    Route::post('/notification/{id}/disapprove-vacancy/{userId}', [VacancyNotificationController::class, 'disapprove'])->name('notification.disapprove-vacancy');

    Route::post('/notification/{id}/submit-application', [JobPortalNotificationController::class, 'submitApplication'])->name('notification.submit-application');
    Route::post('/notification/{id}/receive-application', [JobPortalNotificationController::class, 'receiveApplication'])->name('notification.receive-application');
});
