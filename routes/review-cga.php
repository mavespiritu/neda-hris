<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\UserController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\MyCgaController;
use App\Http\Controllers\StaffCgaController;
use App\Http\Controllers\ReviewCgaController;
use App\Http\Controllers\CompareCgaController;
use App\Http\Controllers\TrainingController;
use App\Http\Controllers\NotificationController;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {
    Route::get('/review-cga', [ReviewCgaController::class, 'index'])->name('review-cga');

    Route::get('/review-cga/evidences', [ReviewCgaController::class, 'showEvidences'])->name('review-cga.show-evidences');
    Route::get('/review-cga/competencies', [ReviewCgaController::class, 'showCompetencies'])->name('review-cga.show-competencies');
    Route::post('/review-cga/evidences/approve/{id}', [ReviewCgaController::class, 'approveEvidence'])->name('review-cga.approve-evidences');
    Route::post('/review-cga/evidences/disapprove/{id}', [ReviewCgaController::class, 'disapproveEvidence'])->name('review-cga.disapprove-evidences');
    Route::get('/review-cga/competencies-for-review/', [ReviewCgaController::class, 'showCompetenciesForReview'])->name('review-cga.show-competencies-for-review');
    Route::get('/review-cga/competencies-for-review/total', [ReviewCgaController::class, 'showCompetenciesForReviewCount'])->name('review-cga.show-competencies-for-review-count');
    Route::get('/review-cga/competencies-for-review/{id}', [ReviewCgaController::class, 'showCompetencyForReview'])->name('review-cga.show-competency-for-review');
    Route::get('/review-cga/competencies-for-review/competency/{id}', [ReviewCgaController::class, 'showIndicatorsForReview'])->name('review-cga.show-indicators-for-review');
    Route::post('/review-cga/competencies-for-review/competency/{id}', [ReviewCgaController::class, 'updateIndicatorsForReview'])->name('review-cga.update-indicators-for-review');
    Route::post('/review-cga/competencies-for-review/endorse/{id}', [ReviewCgaController::class, 'endorseCompetency'])->name('review-cga.endorseCompetency');
    Route::post('/review-cga/competencies-for-review/approve/{id}', [ReviewCgaController::class, 'approveCompetency'])->name('review-cga.approveCompetency');
    Route::post('/review-cga/competencies-for-review/indicator/{id}', [ReviewCgaController::class, 'updateRemarks'])->name('review-cga.update-remarks');
});
