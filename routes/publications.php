<?php

use App\Actions\Publications\BulkDeletePublication;
use App\Actions\Publications\DeletePublication;
use App\Actions\Publications\ListPublication;
use App\Actions\Publications\ShowPublication;
use App\Actions\Publications\StorePublication;
use App\Actions\Publications\UpdatePublication;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Publications\PublicationController;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {

    Route::get('/publications', ListPublication::class)->name('publications.index');

    Route::post('/publications', StorePublication::class)->name('publications.store');

    Route::post('/publications/{id}', UpdatePublication::class)->name('publications.update');

    Route::delete('/publications/{id}', DeletePublication::class)->name('publications.destroy');

    Route::get('/publications/{id}', ShowPublication::class)->name('publications.show');

    Route::get('/publications/{id}/vacancies', [PublicationController::class, 'getVacancies'])->name('publications.vacancies');

    Route::post('/publications/{id}/vacancy', [PublicationController::class, 'storeVacancies'])->name('publications.vacancies.store');

    Route::delete('/publications/{id}/vacancy', [PublicationController::class, 'destroyVacancy'])->name('publications.vacancies.destroy');

    Route::post('/publications/{id}/vacancies', [PublicationController::class, 'bulkDestroyVacancies'])->name('publications.vacancies.bulk-destroy');

    Route::post('/publications/bulk-destroy', BulkDeletePublication::class)->name('publications.bulk-destroy');

    Route::patch('/publications/{id}/toggle-visibility', [PublicationController::class, 'toggleVisibility'])->name('publications.toggle-visibility');
});


