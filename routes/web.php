<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\UserController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\MyCgaController;
use App\Http\Controllers\ReviewCgaController;

/* Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
}); */

Route::get('/', function () {
    return Inertia::render('Home');
});

Route::middleware(['auth'])->group(function () {
    Route::get('/roles', [UserController::class, 'roles'])->name('user.roles');

    //Page: My CGA
    Route::get('/my-cga', [MyCgaController::class, 'index'])->name('my-cga');
    Route::get('/my-cga/competencies/{id}', [MyCgaController::class, 'showCompetencies'])->name('my-cga.show-competencies');
    Route::get('/my-cga/competency/{id}', [MyCgaController::class, 'showCompetency'])->name('my-cga.show-competency');
    Route::get('/my-cga/compliances/{id}', [MyCgaController::class, 'showCompliances'])->name('my-cga.show-compliances');
    Route::post('/my-cga/compliances/{id}', [MyCgaController::class, 'updateCompliances'])->name('my-cga.update-compliances');
    Route::post('/my-cga/indicator/{id}', [MyCgaController::class, 'showIndicator'])->name('my-cga.show-indicator');
    Route::get('/my-cga/indicator/{id}', [MyCgaController::class, 'showEvidences'])->name('my-cga.show-evidences');
    Route::get('/my-cga/evidences/{id}', [MyCgaController::class, 'showEvidencesCount'])->name('my-cga.show-evidences-count');

    Route::get('/my-cga/trainings', [MyCgaController::class, 'showTrainings'])->name('my-cga.trainings');
    Route::get('/my-cga/awards', [MyCgaController::class, 'showAwards'])->name('my-cga.awards');
    Route::get('/my-cga/performances', [MyCgaController::class, 'showPerformances'])->name('my-cga.performances');
    Route::get('/my-cga/careers', [MyCgaController::class, 'showCareers'])->name('my-cga.careers');
    Route::get('/my-cga/designations', [MyCgaController::class, 'showDesignations'])->name('my-cga.designations');
    Route::get('/my-cga/career-positions', [MyCgaController::class, 'showCareerPositions'])->name('my-cga.career-positions');

    Route::post('/my-cga/career-path', [MyCgaController::class, 'storeCareerPath'])->name('my-cga.store-career-path');
    Route::delete('/my-cga/career-path', [MyCgaController::class, 'deleteCareerPath'])->name('my-cga.delete-career-path');

    Route::post('/my-cga/training/{id}', [MyCgaController::class, 'storeTrainings'])->name('my-cga.store-trainings');
    Route::post('/my-cga/update-training/{id}', [MyCgaController::class, 'updateTrainings'])->name('my-cga.update-trainings');

    Route::post('/my-cga/award/{id}', [MyCgaController::class, 'storeAwards'])->name('my-cga.store-awards');
    Route::post('/my-cga/update-award/{id}', [MyCgaController::class, 'updateAwards'])->name('my-cga.update-awards');

    Route::post('/my-cga/performance/{id}', [MyCgaController::class, 'storePerformances'])->name('my-cga.store-performances');
    Route::post('/my-cga/update-performance/{id}', [MyCgaController::class, 'updatePerformances'])->name('my-cga.update-performances');

    Route::post('/my-cga/other-evidence/{id}', [MyCgaController::class, 'storeOtherEvidences'])->name('my-cga.store-other-evidences');
    Route::post('/my-cga/update-other-evidence/{id}', [MyCgaController::class, 'updateOtherEvidences'])->name('my-cga.update-other-evidences');

    Route::get('/my-cga/evidence/{id}', [MyCgaController::class, 'showEvidence'])->name('my-cga.show-evidence');
    Route::delete('/my-cga/evidence/{id}', [MyCgaController::class, 'deleteEvidence'])->name('my-cga.delete-evidence');

    // Page: Review CGA
    Route::get('/review-cga', [ReviewCgaController::class, 'index'])->name('review-cga');

    Route::get('/employees/all-employees/', [EmployeeController::class, 'showAllEmployees'])->name('review-cga.show-all-employees');
    Route::get('/employees/active-employees/', [EmployeeController::class, 'showActiveEmployees'])->name('review-cga.show-active-employees');
    Route::get('/employees/image/{id}', [EmployeeController::class, 'showImage'])->name('review-cga.show-image');

    Route::get('/review-cga/evidences', [ReviewCgaController::class, 'showEvidences'])->name('review-cga.show-evidences');
    Route::get('/review-cga/competencies/', [ReviewCgaController::class, 'showCompetencies'])->name('review-cga.show-competencies');
    Route::post('/review-cga/evidences/approve/{id}', [ReviewCgaController::class, 'approveEvidence'])->name('review-cga.approve-evidences');
    Route::post('/review-cga/evidences/disapprove/{id}', [ReviewCgaController::class, 'disapproveEvidence'])->name('review-cga.disapprove-evidences');
});


Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
