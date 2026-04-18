<?php

use App\Actions\Vacancies\DownloadApplicantRequirements;
use App\Actions\Vacancies\ListApplicants;
use App\Actions\Vacancies\ShowApplicantAssessment;
use App\Actions\Vacancies\ShowApplicantHrmpsbAssessment;
use App\Actions\Vacancies\ShowApplicantPds;
use App\Actions\Vacancies\ShowApplicantQualifications;
use App\Actions\Vacancies\ShowApplicantRequirements;
use App\Actions\Vacancies\ShowVacancyApplicantSummary;
use App\Actions\Vacancies\StoreApplicantAssessment;
use App\Actions\Vacancies\StoreApplicantAssessmentOverride;
use App\Actions\Vacancies\StoreApplicantEditRequest;
use App\Actions\Vacancies\StoreApplicantExamResult;
use App\Actions\Vacancies\StoreApplicantRankingResult;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {
    Route::get('/vacancy-applicants/{id}', ListApplicants::class)->name('vacancies.applicants.index');
    Route::get('/vacancies/{vacancy}/applicants-summary/{type}', ShowVacancyApplicantSummary::class)->name('vacancies.applicants.summary');
    Route::get('/vacancy-applicants-pds/{id}', ShowApplicantPds::class)->name('vacancies.applicants.pds');
    Route::get('/vacancy-applicants-requirements/{id}', ShowApplicantRequirements::class)->name('vacancies.applicants.requirements');
    Route::get('/vacancy-applicants-qualifications/{id}', ShowApplicantQualifications::class)->name('vacancies.applicants.qualifications');
    Route::get('/vacancy-applicants-requirements/{id}/download', DownloadApplicantRequirements::class)->name('vacancies.applicants.requirements.download');
    Route::get('/vacancies/{vacancy}/applicants/{application}/assessment', ShowApplicantAssessment::class)->name('vacancies.applicants.assessment');
    Route::get('/vacancies/{vacancy}/applicants/{application}/secretariat-assessment', ShowApplicantAssessment::class)->name('vacancies.applicants.secretariat-assessment');
    Route::get('/vacancies/{vacancy}/applicants/{application}/hrmpsb-assessment', ShowApplicantHrmpsbAssessment::class)->name('vacancies.applicants.hrmpsb-assessment');
    Route::post('/vacancies/{vacancy}/applicants/{application}/assessment', StoreApplicantAssessment::class)->name('vacancies.applicants.assessment.store');
    Route::post('/vacancies/{vacancy}/applicants/{application}/assessment/override', StoreApplicantAssessmentOverride::class)->name('vacancies.applicants.assessment.override.store');
    Route::post('/vacancies/{vacancy}/applicants/{application}/edit-request', StoreApplicantEditRequest::class)->name('vacancies.applicants.edit-request.store');
    Route::post('/vacancies/{vacancy}/applicants/{application}/exam-result', StoreApplicantExamResult::class)->name('vacancies.applicants.exam-result.store');
    Route::post('/vacancies/{vacancy}/applicants/{application}/ranking-result', StoreApplicantRankingResult::class)->name('vacancies.applicants.ranking-result.store');
});
