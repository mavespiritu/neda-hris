<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Vacancies\VacancyController;

Route::middleware(['web', 'auth.any'])->group(function () {

    Route::get('/vacancies', [VacancyController::class, 'index'])->name('vacancies.index');

    Route::get('/vacancies/positions', [VacancyController::class, 'getPositions'])->name('vacancies.get-positions');
    
    Route::get('/vacancies/competencies', [VacancyController::class, 'getCompetencies'])->name('vacancies.get-competencies');

    Route::get('/vacancies/questions', [VacancyController::class, 'getQuestions'])->name('vacancies.get-questions');

    Route::get('/vacancies/{id}/competencies', [VacancyController::class, 'getCompetenciesPerPosition'])->name('vacancies.get-competencies-per-position');

    Route::get('/vacancies/create', [VacancyController::class, 'create'])->name('vacancies.create');

    Route::post('/vacancies', [VacancyController::class, 'store'])->name('vacancies.store');

    Route::get('/vacancies/{id}/edit', [VacancyController::class, 'edit'])->name('vacancies.edit');

    Route::put('/vacancies/{id}', [VacancyController::class, 'update'])->name('vacancies.update');

    Route::delete('/vacancies/{id}', [VacancyController::class, 'destroy'])->name('vacancies.destroy');

    Route::get('/vacancies/{id}', [VacancyController::class, 'show'])->name('vacancies.show');

    Route::post('/vacancies/bulk-destroy', [VacancyController::class, 'bulkDestroy'])->name('vacancies.bulk-destroy');

    Route::post('/vacancies/bulk-approve', [VacancyController::class, 'bulkApprove'])->name('vacancies.bulk-approve');

    Route::post('/vacancies/bulk-disapprove', [VacancyController::class, 'bulkDisapprove'])->name('vacancies.bulk-disapprove');

    Route::post('/vacancies/bulk-submit', [VacancyController::class, 'bulkSubmit'])->name('vacancies.bulk-submit');

    Route::post('/vacancies/bulk-request-for-changes', [VacancyController::class, 'bulkRequestForChanges'])->name('vacancies.bulk-request-for-changes');

    Route::post('/vacancies/bulk-ready-for-approval', [VacancyController::class, 'bulkReadyForApproval'])->name('vacancies.bulk-ready-for-approval');

    Route::post('/vacancies/{vacancy}/questions', [VacancyController::class, 'storeQuestion'])->name('vacancies.questions.store');

    Route::put('/vacancies/{vacancy}/questions/{question}', [VacancyController::class, 'updateQuestion'])->name('vacancies.questions.update');

    Route::delete('/vacancies/{vacancy}/questions/{question}', [VacancyController::class, 'deleteQuestion'])->name('vacancies.questions.delete');

});
