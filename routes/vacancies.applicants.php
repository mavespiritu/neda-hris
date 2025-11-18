<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Vacancies\ApplicantsController;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {
    Route::get('/vacancy-applicants/{id}', [ApplicantsController::class, 'index'])->name('vacancies.applicants.index');
    Route::get('/vacancy-applicants-pds/{id}', [ApplicantsController::class, 'getPds'])->name('vacancies.applicants.pds');
    Route::get('/vacancy-applicants-requirements/{id}', [ApplicantsController::class, 'getRequirements'])->name('vacancies.applicants.requirements');
    Route::get('/vacancy-applicants-qualifications/{id}', [ApplicantsController::class, 'getQualifications'])->name('vacancies.applicants.qualifications');
});


