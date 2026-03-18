<?php

use App\Actions\Applications\BulkDeleteApplication;
use App\Actions\Applications\CreateApplication;
use App\Actions\Applications\DeleteApplication;
use App\Actions\Applications\EditApplication;
use App\Actions\Applications\ListApplications;
use App\Actions\Applications\StoreApplication;
use App\Actions\Applications\UpdateApplication;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Applications\ApplicationsController;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {
     Route::get('/applications', ListApplications::class)->name('applications.index');
        Route::get('/applications/create', CreateApplication::class)->name('applications.create');
        Route::post('/applications', StoreApplication::class)->name('applications.store');
        Route::get('/applications/{id}/edit', EditApplication::class)->name('applications.edit');
        Route::put('/applications/{id}', UpdateApplication::class)->name('applications.update');
        Route::delete('/applications/{id}', DeleteApplication::class)->name('applications.destroy');
        Route::post('/applications/bulk-destroy', BulkDeleteApplication::class)->name('applications.bulk-destroy');
        
        Route::get('/applications/{id}', [ApplicationsController::class, 'show'])->name('applications.show');

        Route::get('/applications/applicant/search', [ApplicationsController::class, 'searchApplicant'])
        ->name('applications.applicants.search');
        Route::get('/applications/vacancy/search', [ApplicationsController::class, 'searchVacancy'])
        ->name('applications.vacancies.search');
        Route::get('/applications/applicant/{applicantId}/vacancy/{vacancyId}/requirement', [ApplicationsController::class, 'getRequirements'])
        ->name('applications.requirements');
});



