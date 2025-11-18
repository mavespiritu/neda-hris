<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Competencies\CompetencyController;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {
    Route::get('/competencies', [CompetencyController::class, 'index'])->name('competencies.index');
    Route::post('/competencies', [CompetencyController::class, 'store'])->name('competencies.store');
    Route::put('/competencies/{id}', [CompetencyController::class, 'update'])->name('competencies.update');
    Route::delete('/competencies/{id}', [CompetencyController::class, 'destroy'])->name('competencies.destroy');
    Route::post('/competencies/bulk-destroy', [CompetencyController::class, 'bulkDestroy'])->name('competencies.bulk-destroy');
});


