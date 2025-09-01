<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\NotificationController;

Route::middleware(['web', 'auth.any'])->group(function () {
    Route::post('/notification/submit-gap-analysis', [NotificationController::class, 'submitGapAnalysis'])->name('notification.submit-gap-analysis');
    Route::post('/notification/endorse-gap-analysis', [NotificationController::class, 'endorseGapAnalysis'])->name('notification.endorse-gap-analysis');
    Route::post('/notification/approve-gap-analysis', [NotificationController::class, 'approveGapAnalysis'])->name('notification.approve-gap-analysis');
    Route::post('/notification/return-gap-analysis', [NotificationController::class, 'returnGapAnalysis'])->name('notification.return-gap-analysis');
    Route::post('/notification/disapprove-gap-analysis', [NotificationController::class, 'disapproveGapAnalysis'])->name('notification.disapprove-gap-analysis');

    Route::post('/notification/{id}/submit-rto', [NotificationController::class, 'submitRto'])->name('notification.submit-rto');
    Route::post('/notification/{id}/endorse-rto/{userId}', [NotificationController::class, 'endorseRto'])->name('notification.endorse-rto');
    Route::post('/notification/{id}/approve-rto/{userId}', [NotificationController::class, 'approveRto'])->name('notification.approve-rto');
    Route::post('/notification/{id}/return-rto/{userId}', [NotificationController::class, 'returnRto'])->name('notification.return-rto');
    Route::post('/notification/{id}/disapprove-rto/{userId}', [NotificationController::class, 'disapproveRto'])->name('notification.disapprove-rto');

    Route::post('/notification/{id}/submit-raa', [NotificationController::class, 'submitRaa'])->name('notification.submit-raa');
    Route::post('/notification/{id}/endorse-raa/{userId}', [NotificationController::class, 'endorseRaa'])->name('notification.endorse-raa');
    Route::post('/notification/{id}/approve-raa/{userId}', [NotificationController::class, 'approveRaa'])->name('notification.approve-raa');
    Route::post('/notification/{id}/return-raa/{userId}', [NotificationController::class, 'returnRaa'])->name('notification.return-raa');
    Route::post('/notification/{id}/disapprove-raa/{userId}', [NotificationController::class, 'disapproveRaa'])->name('notification.disapprove-raa');
});
