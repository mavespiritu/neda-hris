<?php

use App\Actions\Applicants\BulkDeleteApplicants;
use App\Actions\Applicants\CreateApplicant;

use App\Actions\Applicants\CreateCivilServiceEligibility;
use App\Actions\Applicants\DeleteApplicant;
use App\Actions\Applicants\EditApplicant;
use App\Actions\Applicants\ListApplicants;
use App\Actions\Applicants\CreateLearningAndDevelopment;
use App\Actions\Applicants\CreateVoluntaryWork;
use App\Actions\Applicants\CreateWorkExperience;
use App\Actions\Applicants\DeleteCivilServiceEligibility;
use App\Actions\Applicants\DeleteLearningAndDevelopment;
use App\Actions\Applicants\DeleteVoluntaryWork;
use App\Actions\Applicants\DeleteWorkExperience;
use App\Actions\Applicants\EditCivilServiceEligibility;
use App\Actions\Applicants\EditLearningAndDevelopment;
use App\Actions\Applicants\EditVoluntaryWork;
use App\Actions\Applicants\EditWorkExperience;
use App\Actions\Applicants\StoreCivilServiceEligibility;
use App\Actions\Applicants\StoreLearningAndDevelopment;
use App\Actions\Applicants\StoreVoluntaryWork;
use App\Actions\Applicants\StoreWorkExperience;
use App\Actions\Applicants\UpdateCivilServiceEligibility;
use App\Actions\Applicants\UpdateLearningAndDevelopment;
use App\Actions\Applicants\UpdateVoluntaryWork;
use App\Actions\Applicants\UpdateWorkExperience;
use App\Http\Controllers\Applicants\ApplicantsController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {
    Route::get('/applicants', ListApplicants::class)->name('applicants.index');
    Route::get('/applicants/create', CreateApplicant::class)->name('applicants.create');
    Route::post('/applicants', [ApplicantsController::class, 'store'])->name('applicants.store');
    Route::get('/applicants/{id}/edit', EditApplicant::class)->name('applicants.edit');
    Route::put('/applicants/{id}', [ApplicantsController::class, 'update'])->name('applicants.update');
    Route::delete('/applicants/{id}', DeleteApplicant::class)->name('applicants.destroy');
    Route::post('/applicants/bulk-destroy', BulkDeleteApplicants::class)->name('applicants.bulk-destroy');

    Route::get('/applicants-pds', [ApplicantsController::class, 'getPds'])->name('applicants.pds');
    Route::get('/applicants-pds/{section}', [ApplicantsController::class, 'getPdsSection'])->name('applicants.pds.section');

    Route::get('/applicants/{applicantId}/civil-service-eligibility/create', CreateCivilServiceEligibility::class)->name('applicants.create-civil-service-eligibility');
    Route::get('/applicants/{applicantId}/civil-service-eligibility/{id}/edit', EditCivilServiceEligibility::class)->name('applicants.edit-civil-service-eligibility');
    Route::post('/applicants/{applicantId}/civil-service-eligibility', StoreCivilServiceEligibility::class)->name('applicants.store-civil-service-eligibility');
    Route::put('/applicants/{applicantId}/civil-service-eligibility/{id}', UpdateCivilServiceEligibility::class)->name('applicants.update-civil-service-eligibility');
    Route::delete('/applicants/{applicantId}/civil-service-eligibility/{id}', DeleteCivilServiceEligibility::class)->name('applicants.delete-civil-service-eligibility');

    Route::get('/applicants/{applicantId}/work-experience/create', CreateWorkExperience::class)->name('applicants.create-work-experience');
    Route::get('/applicants/{applicantId}/work-experience/{id}/edit', EditWorkExperience::class)->name('applicants.edit-work-experience');
    Route::post('/applicants/{applicantId}/work-experience', StoreWorkExperience::class)->name('applicants.store-work-experience');
    Route::put('/applicants/{applicantId}/work-experience/{id}', UpdateWorkExperience::class)->name('applicants.update-work-experience');
    Route::delete('/applicants/{applicantId}/work-experience/{id}', DeleteWorkExperience::class)->name('applicants.delete-work-experience');

    Route::get('/applicants/{applicantId}/voluntary-work/create', CreateVoluntaryWork::class)->name('applicants.create-voluntary-work');
    Route::get('/applicants/{applicantId}/voluntary-work/{id}/edit', EditVoluntaryWork::class)->name('applicants.edit-voluntary-work');
    Route::post('/applicants/{applicantId}/voluntary-work', StoreVoluntaryWork::class)->name('applicants.store-voluntary-work');
    Route::put('/applicants/{applicantId}/voluntary-work/{id}', UpdateVoluntaryWork::class)->name('applicants.update-voluntary-work');
    Route::delete('/applicants/{applicantId}/voluntary-work/{id}', DeleteVoluntaryWork::class)->name('applicants.delete-voluntary-work');

    Route::get('/applicants/{applicantId}/learning-and-development/create', CreateLearningAndDevelopment::class)->name('applicants.create-learning-and-development');
    Route::get('/applicants/{applicantId}/learning-and-development/{id}/edit', EditLearningAndDevelopment::class)->name('applicants.edit-learning-and-development');
    Route::post('/applicants/{applicantId}/learning-and-development', StoreLearningAndDevelopment::class)->name('applicants.store-learning-and-development');
    Route::put('/applicants/{applicantId}/learning-and-development/{id}', UpdateLearningAndDevelopment::class)->name('applicants.update-learning-and-development');
    Route::delete('/applicants/{applicantId}/learning-and-development/{id}', DeleteLearningAndDevelopment::class)->name('applicants.delete-learning-and-development');
});


