<?php

use App\Actions\Performance\Program\ManagePrograms;
use App\Actions\Performance\Mfo\ManageMfos;
use App\Actions\Performance\Ppa\ManagePpas;
use App\Actions\Performance\ShowPerformanceLibraries;
use App\Actions\Performance\SuccessIndicator\ManageSuccessIndicators;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {
    Route::get('/performance/libraries', ShowPerformanceLibraries::class)->name('performance.libraries');

    Route::get('/performance/libraries/programs', [ManagePrograms::class, 'asController'])->name('performance.programs.index');
    Route::post('/performance/libraries/programs', [ManagePrograms::class, 'store'])->name('performance.programs.store');
    Route::put('/performance/libraries/programs/{id}', [ManagePrograms::class, 'update'])->name('performance.programs.update');
    Route::delete('/performance/libraries/programs/{id}', [ManagePrograms::class, 'destroy'])->name('performance.programs.destroy');
    Route::delete('/performance/libraries/programs/destroy', [ManagePrograms::class, 'bulkDestroy'])->name('performance.programs.bulk-destroy');

    Route::get('/performance/libraries/mfos', [ManageMfos::class, 'asController'])->name('performance.mfos.index');
    Route::post('/performance/libraries/mfos', [ManageMfos::class, 'store'])->name('performance.mfos.store');
    Route::put('/performance/libraries/mfos/{id}', [ManageMfos::class, 'update'])->name('performance.mfos.update');
    Route::delete('/performance/libraries/mfos/{id}', [ManageMfos::class, 'destroy'])->name('performance.mfos.destroy');
    Route::delete('/performance/libraries/mfos/destroy', [ManageMfos::class, 'bulkDestroy'])->name('performance.mfos.bulk-destroy');

    Route::get('/performance/libraries/ppas', [ManagePpas::class, 'asController'])->name('performance.ppas.index');
    Route::post('/performance/libraries/ppas', [ManagePpas::class, 'store'])->name('performance.ppas.store');
    Route::put('/performance/libraries/ppas/{id}', [ManagePpas::class, 'update'])->name('performance.ppas.update');
    Route::delete('/performance/libraries/ppas/{id}', [ManagePpas::class, 'destroy'])->name('performance.ppas.destroy');
    Route::delete('/performance/libraries/ppas/destroy', [ManagePpas::class, 'bulkDestroy'])->name('performance.ppas.bulk-destroy');

    Route::get('/performance/libraries/success-indicators', [ManageSuccessIndicators::class, 'asController'])->name('performance.success-indicators.index');
    Route::post('/performance/libraries/success-indicators', [ManageSuccessIndicators::class, 'store'])->name('performance.success-indicators.store');
    Route::put('/performance/libraries/success-indicators/{id}', [ManageSuccessIndicators::class, 'update'])->name('performance.success-indicators.update');
    Route::delete('/performance/libraries/success-indicators/{id}', [ManageSuccessIndicators::class, 'destroy'])->name('performance.success-indicators.destroy');
    Route::delete('/performance/libraries/success-indicators/destroy', [ManageSuccessIndicators::class, 'bulkDestroy'])->name('performance.success-indicators.bulk-destroy');
});


