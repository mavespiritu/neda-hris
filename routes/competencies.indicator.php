<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Competencies\IndicatorController;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {
    Route::get('/indicators', [IndicatorController::class, 'index'])->name('indicators.index');
    Route::post('/indicators', [IndicatorController::class, 'store'])->name('indicators.store');
    Route::put('/indicators/{id}', [IndicatorController::class, 'update'])->name('indicators.update');
    Route::delete('/indicators/{id}', [IndicatorController::class, 'destroy'])->name('indicators.destroy');
    Route::post('/indicators/bulk-destroy', [IndicatorController::class, 'bulkDestroy'])->name('indicators.bulk-destroy');

    Route::get('/indicators/competencies/list', [IndicatorController::class, 'getCompetencyList'])
    ->name('competencies.list');
});


