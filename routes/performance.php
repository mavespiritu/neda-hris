<?php

use App\Actions\Performance\Categories\ManageCategories;
use App\Actions\Performance\Mfo\ManageMfos;
use App\Actions\Performance\Ppa\ManagePpas;
use App\Actions\Performance\Activity\ManageActivities;
use App\Actions\Performance\Rating\ManageRatings;
use App\Actions\Performance\Ppmp\ShowHierarchy;
use App\Actions\Performance\ShowPerformanceLibraries;
use App\Actions\Performance\SuccessIndicator\ManageSuccessIndicators;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {
    Route::get('/performance/libraries', ShowPerformanceLibraries::class)->name('performance.libraries');

    Route::get('/performance/libraries/categories', [ManageCategories::class, 'asController'])->name('performance.categories.index');
    Route::post('/performance/libraries/categories', [ManageCategories::class, 'store'])->name('performance.categories.store');
    Route::put('/performance/libraries/categories/{id}', [ManageCategories::class, 'update'])->name('performance.categories.update');
    Route::delete('/performance/libraries/categories/{id}', [ManageCategories::class, 'destroy'])->name('performance.categories.destroy');
    Route::delete('/performance/libraries/categories/destroy', [ManageCategories::class, 'bulkDestroy'])->name('performance.categories.bulk-destroy');
    Route::post('/performance/libraries/categories/reorder', [ManageCategories::class, 'reorder'])->name('performance.categories.reorder');

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

    Route::get('/performance/libraries/activities', [ManageActivities::class, 'asController'])->name('performance.activities.index');
    Route::post('/performance/libraries/activities', [ManageActivities::class, 'store'])->name('performance.activities.store');
    Route::put('/performance/libraries/activities/{id}', [ManageActivities::class, 'update'])->name('performance.activities.update');
    Route::delete('/performance/libraries/activities/{id}', [ManageActivities::class, 'destroy'])->name('performance.activities.destroy');
    Route::delete('/performance/libraries/activities/destroy', [ManageActivities::class, 'bulkDestroy'])->name('performance.activities.bulk-destroy');

    Route::get('/performance/libraries/success-indicators', [ManageSuccessIndicators::class, 'asController'])->name('performance.success-indicators.index');
    Route::post('/performance/libraries/success-indicators', [ManageSuccessIndicators::class, 'store'])->name('performance.success-indicators.store');
    Route::put('/performance/libraries/success-indicators/{id}', [ManageSuccessIndicators::class, 'update'])->name('performance.success-indicators.update');
    Route::delete('/performance/libraries/success-indicators/{id}', [ManageSuccessIndicators::class, 'destroy'])->name('performance.success-indicators.destroy');
    Route::delete('/performance/libraries/success-indicators/destroy', [ManageSuccessIndicators::class, 'bulkDestroy'])->name('performance.success-indicators.bulk-destroy');

    Route::get('/performance/libraries/ratings', [ManageRatings::class, 'asController'])->name('performance.ratings.index');
    Route::post('/performance/libraries/ratings', [ManageRatings::class, 'store'])->name('performance.ratings.store');
    Route::put('/performance/libraries/ratings/{id}', [ManageRatings::class, 'update'])->name('performance.ratings.update');
    Route::delete('/performance/libraries/ratings/{id}', [ManageRatings::class, 'destroy'])->name('performance.ratings.destroy');
    Route::delete('/performance/libraries/ratings/destroy', [ManageRatings::class, 'bulkDestroy'])->name('performance.ratings.bulk-destroy');

    Route::get('/performance/libraries/ppmp-hierarchy', ShowHierarchy::class)->name('performance.ppmp.hierarchy');
});
