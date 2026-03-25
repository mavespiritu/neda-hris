<?php

use App\Actions\Vacancies\ShowApplicantAssessment;
use App\Actions\Vacancies\ShowApplicantHrmpsbAssessment;
use App\Actions\Vacancies\StoreApplicantAssessment;
use App\Actions\Vacancies\StoreApplicantExamResult;
use App\Actions\Vacancies\StoreApplicantAssessmentOverride;
use App\Actions\Vacancies\StoreApplicantEditRequest;
use App\Actions\Vacancies\StoreApplicantRankingResult;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Vacancies\ApplicantsController;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {
    Route::get('/vacancy-applicants/{id}', [ApplicantsController::class, 'index'])->name('vacancies.applicants.index');
    Route::get('/vacancy-applicants-pds/{id}', [ApplicantsController::class, 'getPds'])->name('vacancies.applicants.pds');
    Route::get('/vacancy-applicants-requirements/{id}', [ApplicantsController::class, 'getRequirements'])->name('vacancies.applicants.requirements');
    Route::get('/vacancy-applicants-qualifications/{id}', [ApplicantsController::class, 'getQualifications'])->name('vacancies.applicants.qualifications');
    Route::get('/vacancy-applicants-requirements/{id}/download', [ApplicantsController::class, 'downloadRequirements'])->name('vacancies.applicants.requirements.download');
    Route::get('/vacancies/{vacancy}/applicants/{application}/assessment', ShowApplicantAssessment::class)->name('vacancies.applicants.assessment');
    Route::get('/vacancies/{vacancy}/applicants/{application}/secretariat-assessment', ShowApplicantAssessment::class)->name('vacancies.applicants.secretariat-assessment');
    Route::get('/vacancies/{vacancy}/applicants/{application}/hrmpsb-assessment', ShowApplicantHrmpsbAssessment::class)->name('vacancies.applicants.hrmpsb-assessment');
    Route::post('/vacancies/{vacancy}/applicants/{application}/assessment', StoreApplicantAssessment::class)->name('vacancies.applicants.assessment.store');
    Route::post('/vacancies/{vacancy}/applicants/{application}/assessment/override', StoreApplicantAssessmentOverride::class)->name('vacancies.applicants.assessment.override.store');
    Route::post('/vacancies/{vacancy}/applicants/{application}/edit-request', StoreApplicantEditRequest::class)->name('vacancies.applicants.edit-request.store');
    Route::post('/vacancies/{vacancy}/applicants/{application}/exam-result', StoreApplicantExamResult::class)->name('vacancies.applicants.exam-result.store');
    Route::post('/vacancies/{vacancy}/applicants/{application}/ranking-result', StoreApplicantRankingResult::class)->name('vacancies.applicants.ranking-result.store');
});
