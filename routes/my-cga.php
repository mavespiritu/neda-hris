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

Route::middleware(['web', 'auth.any'])->group(function () {
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
    Route::post('/my-cga/history', [MyCgaController::class, 'storeHistories'])->name('my-cga.store-histories');
    Route::delete('/my-cga/delete-history/{id}', [MyCgaController::class, 'deleteHistory'])->name('my-cga.delete-history');
    Route::get('/my-cga/history-summary/{id}', [MyCgaController::class, 'showHistorySummary'])->name('my-cga.history-summary');
    Route::get('/my-cga/history-summary/competency/{id}', [MyCgaController::class, 'showHistoryIndicators'])->name('my-cga.show-history-indicators');

    Route::get('/my-cga/evidence/{id}', [MyCgaController::class, 'showEvidence'])->name('my-cga.show-evidence');
    Route::delete('/my-cga/evidence/{id}', [MyCgaController::class, 'deleteEvidence'])->name('my-cga.delete-evidence');


    Route::get('/my-cga/proposed-trainings/{id}', [MyCgaController::class, 'showProposedTrainings'])->name('my-cga.show-proposed-trainings');
    Route::post('/my-cga/proposed-trainings', [MyCgaController::class, 'addProposedTraining'])->name('my-cga.add-proposed-trainings');
    Route::put('/my-cga/proposed-trainings/{id}', [MyCgaController::class, 'editProposedTraining'])->name('my-cga.edit-proposed-trainings');
    Route::delete('/my-cga/proposed-trainings/{id}', [MyCgaController::class, 'deleteProposedTraining'])->name('my-cga.delete-proposed-trainings');
});
