<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Applicants\ApplicantsController;

Route::middleware(['web', 'auth.any'])->group(function () {
     Route::get('/applicants', [ApplicantsController::class, 'index'])->name('applicants.index');
        Route::get('/applicants/create', [ApplicantsController::class, 'create'])->name('applicants.create');
        Route::post('/applicants', [ApplicantsController::class, 'store'])->name('applicants.store');
        Route::get('/applicants/{id}/edit', [ApplicantsController::class, 'edit'])->name('applicants.edit');
        Route::put('/applicants/{id}', [ApplicantsController::class, 'update'])->name('applicants.update');
        Route::delete('/applicants/{id}', [ApplicantsController::class, 'destroy'])->name('applicants.destroy');
        Route::post('/applicants/bulk-destroy', [ApplicantsController::class, 'bulkDestroy'])->name('applicants.bulk-destroy');

        Route::get('/applicants/personal-information', [ApplicantsController::class, 'getPersonalInformation'])->name('applicants.personal-information');
        Route::post('/applicants/personal-information', [ApplicantsController::class, 'storePersonalInformation'])->name('applicants.personal-information.store');
        Route::put('/applicants/personal-information/{id}', [ApplicantsController::class, 'updatePersonalInformation'])->name('applicants.personal-information.update');

        Route::get('/applicants/{id}', [ApplicantsController::class, 'show'])->name('applicants.show');
});


