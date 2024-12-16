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

/* Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
}); */

Route::get('/', function () {
    return Inertia::render('Home');
});

Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/roles', [UserController::class, 'roles'])->name('user.roles');

    //Page: My CGA
    Route::get('/my-cga', [MyCgaController::class, 'index'])->name('my-cga');

    Route::get('/my-cga/competencies/{id}', [MyCgaController::class, 'showCompetencies'])->name('my-cga.show-competencies');
    Route::get('/my-cga/competency/{id}', [MyCgaController::class, 'showCompetency'])->name('my-cga.show-competency');

    Route::get('/my-cga/compliances/{id}', [MyCgaController::class, 'showCompliances'])->name('my-cga.show-compliances');
    Route::post('/my-cga/compliances/{id}', [MyCgaController::class, 'updateCompliances'])->name('my-cga.update-compliances');
    Route::get('/my-cga/indicator/{id}', [MyCgaController::class, 'showEvidences'])->name('my-cga.show-evidences');
    Route::post('/my-cga/indicator/{id}', [MyCgaController::class, 'showIndicator'])->name('my-cga.show-indicator');

    Route::get('/my-cga/evidences/{id}', [MyCgaController::class, 'showEvidencesCount'])->name('my-cga.show-evidences-count');

    Route::get('/my-cga/trainings/{id}', [MyCgaController::class, 'showTrainings'])->name('my-cga.trainings');
    Route::get('/my-cga/awards/{id}', [MyCgaController::class, 'showAwards'])->name('my-cga.awards');
    Route::get('/my-cga/performances/{id}', [MyCgaController::class, 'showPerformances'])->name('my-cga.performances');
    Route::get('/my-cga/careers/{id}', [MyCgaController::class, 'showCareers'])->name('my-cga.careers');
    Route::get('/my-cga/designations/{id}', [MyCgaController::class, 'showDesignations'])->name('my-cga.designations');
    Route::get('/my-cga/career-positions/{id}', [MyCgaController::class, 'showCareerPositions'])->name('my-cga.career-positions');

    Route::post('/my-cga/career-path/{id}', [MyCgaController::class, 'storeCareerPath'])->name('my-cga.store-career-path');
    Route::delete('/my-cga/career-path/{id}', [MyCgaController::class, 'deleteCareerPath'])->name('my-cga.delete-career-path');

    Route::post('/my-cga/training/{id}', [MyCgaController::class, 'storeTrainings'])->name('my-cga.store-trainings');
    Route::post('/my-cga/update-training/{id}', [MyCgaController::class, 'updateTrainings'])->name('my-cga.update-trainings');

    Route::post('/my-cga/award/{id}', [MyCgaController::class, 'storeAwards'])->name('my-cga.store-awards');
    Route::post('/my-cga/update-award/{id}', [MyCgaController::class, 'updateAwards'])->name('my-cga.update-awards');

    Route::post('/my-cga/performance/{id}', [MyCgaController::class, 'storePerformances'])->name('my-cga.store-performances');
    Route::post('/my-cga/update-performance/{id}', [MyCgaController::class, 'updatePerformances'])->name('my-cga.update-performances');

    Route::post('/my-cga/other-evidence/{id}', [MyCgaController::class, 'storeOtherEvidences'])->name('my-cga.store-other-evidences');
    Route::post('/my-cga/update-other-evidence/{id}', [MyCgaController::class, 'updateOtherEvidences'])->name('my-cga.update-other-evidences');

    Route::get('/my-cga/histories/{id}', [MyCgaController::class, 'showHistories'])->name('my-cga.show-histories');
    Route::post('/my-cga/history/', [MyCgaController::class, 'storeHistories'])->name('my-cga.store-histories');
    Route::delete('/my-cga/delete-history/{id}', [MyCgaController::class, 'deleteHistory'])->name('my-cga.delete-history');
    Route::get('/my-cga/history-summary/{id}', [MyCgaController::class, 'showHistorySummary'])->name('my-cga.history-summary');
    Route::get('/my-cga/history-summary/competency/{id}', [MyCgaController::class, 'showHistoryIndicators'])->name('my-cga.show-history-indicators');

    Route::get('/my-cga/evidence/{id}', [MyCgaController::class, 'showEvidence'])->name('my-cga.show-evidence');
    Route::delete('/my-cga/evidence/{id}', [MyCgaController::class, 'deleteEvidence'])->name('my-cga.delete-evidence');


    Route::get('/my-cga/proposed-trainings/{id}', [MyCgaController::class, 'showProposedTrainings'])->name('my-cga.show-proposed-trainings');
    Route::post('/my-cga/proposed-trainings/', [MyCgaController::class, 'addProposedTraining'])->name('my-cga.add-proposed-trainings');
    Route::put('/my-cga/proposed-trainings/{id}', [MyCgaController::class, 'editProposedTraining'])->name('my-cga.edit-proposed-trainings');
    Route::delete('/my-cga/proposed-trainings/{id}', [MyCgaController::class, 'deleteProposedTraining'])->name('my-cga.delete-proposed-trainings');

    // Page: Review CGA
    Route::get('/review-cga', [ReviewCgaController::class, 'index'])->name('review-cga');

    Route::get('/review-cga/evidences', [ReviewCgaController::class, 'showEvidences'])->name('review-cga.show-evidences');
    Route::get('/review-cga/competencies/', [ReviewCgaController::class, 'showCompetencies'])->name('review-cga.show-competencies');
    Route::post('/review-cga/evidences/approve/{id}', [ReviewCgaController::class, 'approveEvidence'])->name('review-cga.approve-evidences');
    Route::post('/review-cga/evidences/disapprove/{id}', [ReviewCgaController::class, 'disapproveEvidence'])->name('review-cga.disapprove-evidences');
    Route::get('/review-cga/competencies-for-review/', [ReviewCgaController::class, 'showCompetenciesForReview'])->name('review-cga.show-competencies-for-review');
    Route::get('/review-cga/competencies-for-review/total', [ReviewCgaController::class, 'showCompetenciesForReviewCount'])->name('review-cga.show-competencies-for-review-count');
    Route::get('/review-cga/competencies-for-review/{id}', [ReviewCgaController::class, 'showCompetencyForReview'])->name('review-cga.show-competency-for-review');
    Route::get('/review-cga/competencies-for-review/competency/{id}', [ReviewCgaController::class, 'showIndicatorsForReview'])->name('review-cga.show-indicators-for-review');
    Route::post('/review-cga/competencies-for-review/competency/{id}', [ReviewCgaController::class, 'updateIndicatorsForReview'])->name('review-cga.update-indicators-for-review');
    Route::post('/review-cga/competencies-for-review/approve/{id}', [ReviewCgaController::class, 'approveCompetency'])->name('review-cga.approveCompetency');
    Route::post('/review-cga/competencies-for-review/indicator/{id}', [ReviewCgaController::class, 'updateRemarks'])->name('review-cga.update-remarks');

    // Page: Staff CGA
    Route::get('/staff-cga', [StaffCgaController::class, 'index'])->name('staff-cga');

    // Page: Compare CGA
    Route::get('/compare-cga', [CompareCgaController::class, 'index'])->name('compare-cga');
    Route::get('/compare-cga/compare/', [CompareCgaController::class, 'showComparison'])->name('compare-cga.show-comparison');
    Route::get('/compare-cga/compare/competency/{id}', [CompareCgaController::class, 'showComparisonIndicators'])->name('compare-cga.show-comparison-indicators');

    // Employee Filters
    Route::get('/employees/all-employees/', [EmployeeController::class, 'showAllEmployees'])->name('employees.show-all-employees');
    Route::get('/employees/active-employees/', [EmployeeController::class, 'showActiveEmployees'])->name('employees.show-active-employees');
    Route::get('/employees/filtered-employees/', [EmployeeController::class, 'showFilteredEmployees'])->name('employees.show-filtered-employees');
    Route::get('/employees/image/{id}', [EmployeeController::class, 'showImage'])->name('employees.show-image');
    Route::get('/employees/current-position/{id}', [EmployeeController::class, 'showCurrentPosition'])->name('employees.show-current-position');

    Route::get('/trainings/', [TrainingController::class, 'show'])->name('trainings.show');

    // Email Notification
    Route::post('/notification/submit-cga/', [NotificationController::class, 'submitCga'])->name('notification.submit-cga');
    Route::post('/notification/approve-cga/', [NotificationController::class, 'approveCga'])->name('notification.approve-cga');
});


Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
