<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Vacancies\RequirementsController;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {
    Route::get('/vacancy-requirements/{id}', [RequirementsController::class, 'index'])->name('vacancy-requirements.index');
    Route::post('/vacancy-requirements', [RequirementsController::class, 'store'])->name('vacancy-requirements.store');
    Route::put('/vacancy-requirements/{id}', [RequirementsController::class, 'update'])->name('vacancy-requirements.update');
    Route::delete('/vacancy-requirements/{id}', [RequirementsController::class, 'destroy'])->name('vacancy-requirements.destroy');
    Route::post('/vacancy-requirements/bulk-destroy', [RequirementsController::class, 'bulkDestroy'])->name('vacancy-requirements.bulk-destroy');
});


