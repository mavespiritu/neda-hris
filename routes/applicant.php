<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\UserController;
use App\Http\Controllers\JobPortal\MyProfileController;
use App\Actions\Profile\ShowProfile;
use App\Actions\Profile\ShowPersonalInformation;
use App\Actions\Profile\StorePersonalInformation;
use App\Actions\Profile\ShowFamilyBackground;
use App\Actions\Profile\StoreFamilyBackground;
use App\Actions\Profile\ShowEducationalBackground;
use App\Actions\Profile\StoreEducationalBackground;
use App\Actions\Profile\ShowCivilServiceEligibility;
use App\Actions\Profile\CreateCivilServiceEligibility;
use App\Actions\Profile\EditCivilServiceEligibility;
use App\Actions\Profile\StoreCivilServiceEligibility;
use App\Actions\Profile\UpdateCivilServiceEligibility;
use App\Actions\Profile\DeleteCivilServiceEligibility;
use App\Actions\Profile\StoreCivilServiceEligibilitySection;
use App\Actions\Profile\ShowWorkExperience;
use App\Actions\Profile\CreateWorkExperience;
use App\Actions\Profile\EditWorkExperience;
use App\Actions\Profile\StoreWorkExperience;
use App\Actions\Profile\UpdateWorkExperience;
use App\Actions\Profile\DeleteWorkExperience;
use App\Actions\Profile\StoreWorkExperienceSection;
use App\Actions\Profile\ShowVoluntaryWork;
use App\Actions\Profile\CreateVoluntaryWork;
use App\Actions\Profile\EditVoluntaryWork;
use App\Actions\Profile\StoreVoluntaryWork;
use App\Actions\Profile\UpdateVoluntaryWork;
use App\Actions\Profile\DeleteVoluntaryWork;
use App\Actions\Profile\StoreVoluntaryWorkSection;
use App\Actions\Profile\ShowLearningAndDevelopment;
use App\Actions\Profile\CreateLearningAndDevelopment;
use App\Actions\Profile\EditLearningAndDevelopment;
use App\Actions\Profile\StoreLearningAndDevelopment;
use App\Actions\Profile\UpdateLearningAndDevelopment;
use App\Actions\Profile\DeleteLearningAndDevelopment;
use App\Actions\Profile\StoreLearningAndDevelopmentSection;
use App\Actions\Profile\ShowOtherInformation;
use App\Actions\Profile\StoreOtherInformation;
use App\Actions\Profile\ShowReview;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {
    Route::get('/my-profile', ShowProfile::class)->name('profile.index');


    Route::get('/applicant/profile', [MyProfileController::class, 'showApplicantInformation'])->name('applicant.show-applicant-information');

    // Progress
    Route::get('/applicant/pds/progress', [MyProfileController::class, 'getProgress'])->name('applicant.pds.progress');

    // Whole PDS
    Route::get('/applicant/pds', [MyProfileController::class, 'getPds'])->name('applicant.pds');

    // Personal Information
    Route::get('/applicant/personal-information', [MyProfileController::class, 'getPersonalInformation'])->name('applicant.personal-information');
    Route::get('/profile/personal-information', ShowPersonalInformation::class)->name('profile.personal-information');


    Route::post('/applicant/personal-information', [MyProfileController::class, 'storePersonalInformation'])->name('applicant.store-personal-information');
    Route::put('/applicant/personal-information', [MyProfileController::class, 'updatePersonalInformation'])->name('applicant.update-personal-information');
    Route::post('/profile/personal-information', StorePersonalInformation::class)->name('profile.store-personal-information');

    // Family Background
    Route::get('/applicant/family-background', [MyProfileController::class, 'getFamilyBackground'])->name('applicant.family-background');
     Route::get('/profile/family-background', ShowFamilyBackground::class)->name('profile.family-background');

    Route::post('/applicant/family-background', [MyProfileController::class, 'storeFamilyBackground'])->name('applicant.store-family-background');
    Route::put('/applicant/family-background', [MyProfileController::class, 'updateFamilyBackground'])->name('applicant.update-family-background');
    Route::post('/profile/family-background', StoreFamilyBackground::class)->name('profile.store-family-background');

    // Education Background
    Route::get('/applicant/educational-background', [MyProfileController::class, 'getEducationalBackground'])->name('applicant.educational-background');
    Route::get('/profile/educational-background', ShowEducationalBackground::class)->name('profile.educational-background');
    
    Route::post('/applicant/educational-background', [MyProfileController::class, 'storeEducationalBackground'])->name('applicant.store-educational-background');
    Route::put('/applicant/educational-background', [MyProfileController::class, 'updateEducationalBackground'])->name('applicant.update-educational-background');
    Route::post('/profile/educational-background', StoreEducationalBackground::class)->name('profile.store-educational-background');

    // Civil Service Eligibility
    Route::get('/applicant/civil-service-eligibility', [MyProfileController::class, 'getCivilServiceEligibility'])->name('applicant.civil-service-eligibility');
    Route::get('/profile/civil-service-eligibility', ShowCivilServiceEligibility::class)->name('profile.civil-service-eligibility');
    Route::get('/profile/civil-service-eligibility/create', CreateCivilServiceEligibility::class)
    ->name('profile.create-civil-service-eligibility');
    Route::get('/profile/civil-service-eligibility/{id}/edit', EditCivilServiceEligibility::class)
    ->name('profile.edit-civil-service-eligibility');
    Route::post('/profile/civil-service-eligibility', StoreCivilServiceEligibility::class)
        ->name('profile.store-civil-service-eligibility');
    Route::put('/profile/civil-service-eligibility/{id}', UpdateCivilServiceEligibility::class)
        ->name('profile.update-civil-service-eligibility');
    Route::delete('/profile/civil-service-eligibility/{id}', DeleteCivilServiceEligibility::class)
        ->name('profile.delete-civil-service-eligibility');
    Route::post('/profile/civil-service-eligibility/section', StoreCivilServiceEligibilitySection::class)
    ->name('profile.store-civil-service-eligibility-section');

    Route::post('/applicant/civil-service-eligibility', [MyProfileController::class, 'storeCivilServiceEligibility'])->name('applicant.store-civil-service-eligibility');
    Route::put('/applicant/civil-service-eligibility', [MyProfileController::class, 'updateCivilServiceEligibility'])->name('applicant.update-civil-service-eligibility');

    // Work Experience
    Route::get('/applicant/work-experience', [MyProfileController::class, 'getWorkExperience'])->name('applicant.work-experience');
    Route::get('/profile/work-experience', ShowWorkExperience::class)->name('profile.work-experience');
    Route::get('/profile/work-experience/create', CreateWorkExperience::class)
    ->name('profile.create-work-experience');
    Route::get('/profile/work-experience/{id}/edit', EditWorkExperience::class)
    ->name('profile.edit-work-experience');
    Route::post('/profile/work-experience', StoreWorkExperience::class)
        ->name('profile.store-work-experience');
    Route::put('/profile/work-experience/{id}', UpdateWorkExperience::class)
        ->name('profile.update-work-experience');
    Route::delete('/profile/work-experience/{id}', DeleteWorkExperience::class)
        ->name('profile.delete-work-experience');
    Route::post('/profile/work-experience/section', StoreWorkExperienceSection::class)
    ->name('profile.store-work-experience-section');

    Route::post('/applicant/work-experience', [MyProfileController::class, 'storeWorkExperience'])->name('applicant.store-work-experience');
    Route::put('/applicant/work-experience', [MyProfileController::class, 'updateWorkExperience'])->name('applicant.update-work-experience');

    // Voluntary Work
    Route::get('/applicant/voluntary-work', [MyProfileController::class, 'getVoluntaryWork'])->name('applicant.voluntary-work');
    Route::get('/profile/voluntary-work', ShowVoluntaryWork::class)->name('profile.voluntary-work');
    Route::get('/profile/voluntary-work/create', CreateVoluntaryWork::class)
    ->name('profile.create-voluntary-work');
    Route::get('/profile/voluntary-work/{id}/edit', EditVoluntaryWork::class)
    ->name('profile.edit-voluntary-work');
    Route::post('/profile/voluntary-work', StoreVoluntaryWork::class)
        ->name('profile.store-voluntary-work');
    Route::put('/profile/voluntary-work/{id}', UpdateVoluntaryWork::class)
        ->name('profile.update-voluntary-work');
    Route::delete('/profile/voluntary-work/{id}', DeleteVoluntaryWork::class)
        ->name('profile.delete-voluntary-work');
    Route::post('/profile/voluntary-work/section', StoreVoluntaryWorkSection::class)
    ->name('profile.store-voluntary-work-section');

    Route::post('/applicant/voluntary-work', [MyProfileController::class, 'storeVoluntaryWork'])->name('applicant.store-voluntary-work');
    Route::put('/applicant/voluntary-work', [MyProfileController::class, 'updateVoluntaryWork'])->name('applicant.update-voluntary-work');

    // Learning and Development
    Route::get('/applicant/learning-and-development', [MyProfileController::class, 'getLearningAndDevelopment'])->name('applicant.learning-and-development');
    Route::get('/profile/learning-and-development', ShowLearningAndDevelopment::class)->name('profile.learning-and-development');
    Route::get('/profile/learning-and-development/create', CreateLearningAndDevelopment::class)
    ->name('profile.create-learning-and-development');
    Route::get('/profile/learning-and-development/{id}/edit', EditLearningAndDevelopment::class)
    ->name('profile.edit-learning-and-development');
    Route::post('/profile/learning-and-development', StoreLearningAndDevelopment::class)
        ->name('profile.store-learning-and-development');
    Route::put('/profile/learning-and-development/{id}', UpdateLearningAndDevelopment::class)
        ->name('profile.update-learning-and-development');
    Route::delete('/profile/learning-and-development/{id}', DeleteLearningAndDevelopment::class)
        ->name('profile.delete-learning-and-development');
    Route::post('/profile/learning-and-development/section', StoreLearningAndDevelopmentSection::class)
    ->name('profile.store-learning-and-development-section');

    Route::post('/applicant/learning-and-development', [MyProfileController::class, 'storeLearningAndDevelopment'])->name('applicant.store-learning-and-development');
    Route::put('/applicant/learning-and-development', [MyProfileController::class, 'updateLearningAndDevelopment'])->name('applicant.update-learning-and-development');

    // Other Information
    Route::get('/applicant/other-information', [MyProfileController::class, 'getOtherInformation'])->name('applicant.other-information');
    Route::get('/profile/other-information', ShowOtherInformation::class)->name('profile.other-information');

    Route::post('/applicant/other-information', [MyProfileController::class, 'storeOtherInformation'])->name('applicant.store-other-information');
    Route::put('/applicant/other-information', [MyProfileController::class, 'updateOtherInformation'])->name('applicant.update-other-information');
    Route::post('/profile/other-information', StoreOtherInformation::class)->name('profile.store-other-information');

    Route::get('/profile/review', ShowReview::class)->name('profile.review');

    // Requirements
    Route::get('/applicant/requirements', [MyProfileController::class, 'getRequirements'])->name('applicant.requirements');

});
