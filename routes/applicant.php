<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\UserController;
use App\Http\Controllers\JobPortal\MyProfileController;

Route::middleware(['web', 'auth.any'])->group(function () {
    Route::get('/profile', [MyProfileController::class, 'index'])->name('applicant.index');

    Route::get('/applicant/profile', [MyProfileController::class, 'showApplicantInformation'])->name('applicant.show-applicant-information');

    // Progress
    Route::get('/applicant/pds/progress', [MyProfileController::class, 'getProgress'])->name('applicant.pds.progress');

    // Whole PDS
    Route::get('/applicant/pds', [MyProfileController::class, 'getPds'])->name('applicant.pds');

    // Personal Information
    Route::get('/applicant/personal-information', [MyProfileController::class, 'getPersonalInformation'])->name('applicant.personal-information');
    Route::post('/applicant/personal-information', [MyProfileController::class, 'storePersonalInformation'])->name('applicant.store-personal-information');
    Route::put('/applicant/personal-information', [MyProfileController::class, 'updatePersonalInformation'])->name('applicant.update-personal-information');

    // Family Background
    Route::get('/applicant/family-background', [MyProfileController::class, 'getFamilyBackground'])->name('applicant.family-background');
    Route::post('/applicant/family-background', [MyProfileController::class, 'storeFamilyBackground'])->name('applicant.store-family-background');
    Route::put('/applicant/family-background', [MyProfileController::class, 'updateFamilyBackground'])->name('applicant.update-family-background');

    // Education Background
    Route::get('/applicant/educational-background', [MyProfileController::class, 'getEducationalBackground'])->name('applicant.educational-background');
    Route::post('/applicant/educational-background', [MyProfileController::class, 'storeEducationalBackground'])->name('applicant.store-educational-background');
    Route::put('/applicant/educational-background', [MyProfileController::class, 'updateEducationalBackground'])->name('applicant.update-educational-background');

    // Civil Service Eligibility
    Route::get('/applicant/civil-service-eligibility', [MyProfileController::class, 'getCivilServiceEligibility'])->name('applicant.civil-service-eligibility');
    Route::post('/applicant/civil-service-eligibility', [MyProfileController::class, 'storeCivilServiceEligibility'])->name('applicant.store-civil-service-eligibility');
    Route::put('/applicant/civil-service-eligibility', [MyProfileController::class, 'updateCivilServiceEligibility'])->name('applicant.update-civil-service-eligibility');

    // Work Experience
    Route::get('/applicant/work-experience', [MyProfileController::class, 'getWorkExperience'])->name('applicant.work-experience');
    Route::post('/applicant/work-experience', [MyProfileController::class, 'storeWorkExperience'])->name('applicant.store-work-experience');
    Route::put('/applicant/work-experience', [MyProfileController::class, 'updateWorkExperience'])->name('applicant.update-work-experience');

    // Voluntary Work
    Route::get('/applicant/voluntary-work', [MyProfileController::class, 'getVoluntaryWork'])->name('applicant.voluntary-work');
    Route::post('/applicant/voluntary-work', [MyProfileController::class, 'storeVoluntaryWork'])->name('applicant.store-voluntary-work');
    Route::put('/applicant/voluntary-work', [MyProfileController::class, 'updateVoluntaryWork'])->name('applicant.update-voluntary-work');

    // Learning and Development
    Route::get('/applicant/learning-and-development', [MyProfileController::class, 'getLearningAndDevelopment'])->name('applicant.learning-and-development');
    Route::post('/applicant/learning-and-development', [MyProfileController::class, 'storeLearningAndDevelopment'])->name('applicant.store-learning-and-development');
    Route::put('/applicant/learning-and-development', [MyProfileController::class, 'updateLearningAndDevelopment'])->name('applicant.update-learning-and-development');

    // Other Information
    Route::get('/applicant/other-information', [MyProfileController::class, 'getOtherInformation'])->name('applicant.other-information');
    Route::post('/applicant/other-information', [MyProfileController::class, 'storeOtherInformation'])->name('applicant.store-other-information');
    Route::put('/applicant/other-information', [MyProfileController::class, 'updateOtherInformation'])->name('applicant.update-other-information');

    // Requirements
    Route::get('/applicant/requirements', [MyProfileController::class, 'getRequirements'])->name('applicant.requirements');

});
