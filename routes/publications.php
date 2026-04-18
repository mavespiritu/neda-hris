<?php

use App\Actions\Publications\BulkDeletePublication;
use App\Actions\Publications\DeletePublication;
use App\Actions\Publications\ListPublication;
use App\Actions\Publications\ShowPublication;
use App\Actions\Publications\StorePublication;
use App\Actions\Publications\UpdatePublication;
use App\Actions\Publications\PublishPublication;
use App\Actions\Publications\BulkDeletePublicationVacancies;
use App\Actions\Publications\DeletePublicationVacancy;
use App\Actions\Publications\GetPublicationVacancies;
use App\Actions\Publications\StorePublicationVacancy;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {

    Route::get('/publications', ListPublication::class)->name('publications.index');

    Route::post('/publications', StorePublication::class)->name('publications.store');

    Route::post('/publications/{id}', UpdatePublication::class)->name('publications.update');

    Route::delete('/publications/{id}', DeletePublication::class)->name('publications.destroy');

    Route::get('/publications/{id}', ShowPublication::class)->name('publications.show');

    Route::get('/publications/{id}/vacancies', GetPublicationVacancies::class)->name('publications.vacancies');

    Route::post('/publications/{id}/vacancy', StorePublicationVacancy::class)->name('publications.vacancies.store');

    Route::delete('/publications/{id}/vacancy', DeletePublicationVacancy::class)->name('publications.vacancies.destroy');

    Route::post('/publications/{id}/vacancies', BulkDeletePublicationVacancies::class)->name('publications.vacancies.bulk-destroy');

    Route::post('/publications/bulk-destroy', BulkDeletePublication::class)->name('publications.bulk-destroy');

    Route::patch('/publications/{id}/toggle-visibility', PublishPublication::class)->name('publications.toggle-visibility');
});











