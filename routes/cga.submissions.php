<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Competencies\CgaSubmissionController;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {
    Route::get('/cga/review', [CgaSubmissionController::class, 'index'])->name('cga.review');

    Route::post('/cga/review/{id}/update-indicator', [CgaSubmissionController::class, 'updateIndicator'])->name('cga.review.update-indicator');

    Route::post('/cga/review/{id}/update-remarks', [CgaSubmissionController::class, 'updateRemarks'])->name('cga.review.update-indicator.remarks');

    Route::post('/cga/review/{id}/take-action', [CgaSubmissionController::class, 'takeAction'])->name('cga.review.take-action');

    Route::post('/cga/review/{id}/disapprove', [CgaSubmissionController::class, 'disapprove'])->name('cga.review.disapprove-submission');

    Route::get('/cga/review/{id}/history', [CgaSubmissionController::class, 'getSubmissionHistory'])->name('cga.review.history');

    Route::get('/cga/review/summary', [CgaSubmissionController::class, 'getSubmissionSummary'])->name('cga.review.summary');
});
