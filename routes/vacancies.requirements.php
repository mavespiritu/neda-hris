<?php

use App\Actions\Vacancies\BulkDeleteRequirements;
use App\Actions\Vacancies\CreateRequirement;
use App\Actions\Vacancies\DeleteRequirement;
use App\Actions\Vacancies\ListRequirements;
use App\Actions\Vacancies\UpdateRequirement;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {
    Route::get('/vacancy-requirements/{id}', ListRequirements::class)->name('vacancy-requirements.index');
    Route::post('/vacancy-requirements', CreateRequirement::class)->name('vacancy-requirements.store');
    Route::put('/vacancy-requirements/{id}', UpdateRequirement::class)->name('vacancy-requirements.update');
    Route::delete('/vacancy-requirements/{id}', DeleteRequirement::class)->name('vacancy-requirements.destroy');
    Route::post('/vacancy-requirements/bulk-destroy', BulkDeleteRequirements::class)->name('vacancy-requirements.bulk-destroy');
});
