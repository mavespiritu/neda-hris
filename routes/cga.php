<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\UserController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\Competencies\CgaController;
use App\Http\Controllers\StaffCgaController;
use App\Http\Controllers\ReviewCgaController;
use App\Http\Controllers\CompareCgaController;
use App\Http\Controllers\TrainingController;
use App\Http\Controllers\NotificationController;

Route::middleware(['web', 'auth.any'])->group(function () {

    Route::get('/cga', [CgaController::class, 'index'])->name('cga.index');

    Route::get('/cga/{id}/competencies', [CgaController::class, 'getCompetencies'])->name('cga.competencies');

    Route::get('/cga/{id}/competency-indicators', [CgaController::class, 'getCompetencyIndicators'])->name('cga.competency-indicators');

    Route::put('/cga/{id}/update-competency-indicator', [CgaController::class, 'updateCompetencyIndicator'])->name('cga.update-competency-indicator');

    Route::get('/cga/{id}/indicator-evidences', [CgaController::class, 'getIndicatorEvidences'])->name('cga.indicator-evidences');

    Route::get('/cga/{id}/evidence', [CgaController::class, 'getEvidence'])->name('cga.evidence');

    Route::delete('/cga/{id}/evidence', [CgaController::class, 'destroyEvidence'])->name('cga.evidence.destroy');

    Route::delete('/cga/evidences/destroy', [CgaController::class, 'destroyEvidences'])->name('cga.evidence.bulk-destroy');

    Route::get('/cga/{id}/trainings', [CgaController::class, 'getTrainings'])->name('cga.trainings');

    Route::post('/cga/{id}/trainings', [CgaController::class, 'storeTraining'])->name('cga.training.store');

    Route::get('/cga/{id}/awards', [CgaController::class, 'getAwards'])->name('cga.awards');

    Route::post('/cga/{id}/awards', [CgaController::class, 'storeAward'])->name('cga.award.store');

    Route::get('/cga/{id}/performances', [CgaController::class, 'getPerformances'])->name('cga.performances');

    Route::post('/cga/{id}/performances', [CgaController::class, 'storePerformance'])->name('cga.performance.store');
    
    Route::post('/cga/{id}/others', [CgaController::class, 'storeOthers'])->name('cga.others.store');

    Route::get('/cga/{id}/designations', [CgaController::class, 'getDesignations'])->name('cga.designations');

    Route::get('/cga/{id}/career-paths', [CgaController::class, 'getCareerPaths'])->name('cga.career-paths');

    Route::get('/cga/{id}/career-path-options', [CgaController::class, 'getCareerPathOptions'])->name('cga.career-path-options');

    Route::post('/cga/{id}/career-paths', [CgaController::class, 'storeCareerPath'])->name('cga.career-path.store');

    Route::delete('/cga/{id}/career-paths', [CgaController::class, 'destroyCareerPath'])->name('cga.career-path.destroy');

    Route::get('/cga/{id}/proposed-trainings', [CgaController::class, 'getProposedTrainings'])->name('cga.proposed-trainings');

    Route::post('/cga/proposed-trainings', [CgaController::class, 'storeProposedTraining'])->name('cga.proposed-trainings.store');
    
    Route::put('/cga/{id}/proposed-trainings', [CgaController::class, 'updateProposedTraining'])->name('cga.proposed-trainings.update');

    Route::delete('/cga/{id}/proposed-trainings', [CgaController::class, 'destroyProposedTraining'])->name('cga.proposed-trainings.destroy');

    Route::delete('/cga/proposed-trainings/destroy', [CgaController::class, 'destroyProposedTrainings'])->name('cga.proposed-trainings.bulk-destroy');

    Route::get('/cga/{id}/submissions', [CgaController::class, 'getSubmissions'])->name('cga.submissions');

    Route::delete('/cga/{id}/submissions', [CgaController::class, 'destroySubmission'])->name('cga.submissions.destroy');

    Route::delete('/cga/submissions/destroy', [CgaController::class, 'destroySubmissions'])->name('cga.submissions.bulk-destroy');

    Route::get('/cga/{id}/submissions/competencies', [CgaController::class, 'getSubmittedCompetencies'])->name('cga.submissions.competencies');

    Route::get('/cga/{id}/submitted-competency-indicators', [CgaController::class, 'getSubmittedCompetencyIndicators'])->name('cga.submitted-competency-indicators');

    Route::get('/cga/submission-window', [CgaController::class, 'getSubmissionWindow'])->name('cga.submission-window');

    Route::get('/cga/{id}/gap-analysis', [CgaController::class, 'getGapAnalysis'])->name('cga.gap-analysis');

    Route::post('/cga/gap-analysis', [CgaController::class, 'storeGapAnalysis'])->name('cga.gap-analysis.store');
});
