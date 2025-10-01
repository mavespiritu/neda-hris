<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\JobPortal\JobsController;

Route::middleware(['web', 'auth.any'])->group(function () {
    Route::get('/jobs', [JobsController::class, 'index'])->name('jobs.index');
    Route::post('/jobs/{hashedId}', [JobsController::class, 'store'])->name('jobs.store');
    Route::get('/jobs/{hashedId}', [JobsController::class, 'show'])->name('jobs.show');
    Route::get('/jobs/{hashedId}/apply', [JobsController::class, 'apply'])->name('jobs.apply');
    Route::get('/jobs/{hashedId}/requirements', [JobsController::class, 'getRequirements'])->name('jobs.requirements');
    Route::post('/jobs/{hashedId}/requirements', [JobsController::class, 'storeRequirement'])->name('jobs.requirements.store');
    Route::delete('/jobs/{hashedId}/requirements/{requirementId}/file/{id}', [JobsController::class, 'destroyRequirement'])->name('jobs.requirements.destroy');
/*     Route::post('/vacancy-requirements', [RequirementsController::class, 'store'])->name('vacancy-requirements.store');
    Route::put('/vacancy-requirements/{id}', [RequirementsController::class, 'update'])->name('vacancy-requirements.update');
    Route::delete('/vacancy-requirements/{id}', [RequirementsController::class, 'destroy'])->name('vacancy-requirements.destroy');
    Route::post('/vacancy-requirements/bulk-destroy', [RequirementsController::class, 'bulkDestroy'])->name('vacancy-requirements.bulk-destroy'); */
});


