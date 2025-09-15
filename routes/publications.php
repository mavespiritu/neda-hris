<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Publications\PublicationController;

Route::middleware(['web', 'auth.any'])->group(function () {

    Route::get('/publications', [PublicationController::class, 'index'])->name('publications.index');

    Route::post('/publications', [PublicationController::class, 'store'])->name('publications.store');

    Route::put('/publications/{id}', [PublicationController::class, 'update'])->name('publications.update');

    Route::delete('/publications/{id}', [PublicationController::class, 'destroy'])->name('publications.destroy');

    Route::get('/publications/{id}', [PublicationController::class, 'show'])->name('publications.show');

    Route::get('/publications/{id}/vacancies', [PublicationController::class, 'getVacancies'])->name('publications.vacancies');

    Route::post('/publications/{id}/vacancy', [PublicationController::class, 'storeVacancies'])->name('publications.vacancies.store');

    Route::delete('/publications/{id}/vacancy', [PublicationController::class, 'destroyVacancy'])->name('publications.vacancies.destroy');

    Route::post('/publications/{id}/vacancies', [PublicationController::class, 'bulkDestroyVacancies'])->name('publications.vacancies.bulk-destroy');

    Route::post('/publications/bulk-destroy', [PublicationController::class, 'bulkDestroy'])->name('publications.bulk-destroy');

    Route::patch('/publications/{id}/toggle-visibility', [PublicationController::class, 'toggleVisibility'])->name('publications.toggle-visibility');
});


