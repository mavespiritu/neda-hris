<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Laravel\Socialite\Facades\Socialite;
use Inertia\Inertia;
use App\Http\Controllers\UserController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\MyCgaController;
use App\Http\Controllers\StaffCgaController;
use App\Http\Controllers\ReviewCgaController;
use App\Http\Controllers\CompareCgaController;
use App\Http\Controllers\TrainingController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\Auth\GoogleController;

/* Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
}); */

Route::get('/', function () {
    return auth()->check()
        ? redirect('/dashboard')
        : Inertia::render('Home');
});

Route::get('/jobs', fn () => Inertia::render('Jobs'));
Route::get('/jobs/{id}', fn () => Inertia::render('JobDetails'));

Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/roles', [UserController::class, 'roles'])->name('user.roles');
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
});


Route::get('/dashboard', function () {
    return Inertia::render('Dashboard/index');
})->middleware(['auth.any', 'verified'])->name('dashboard');

/*
|--------------------------------------------------------------------------
| Socialite Authentication
|--------------------------------------------------------------------------
*/

Route::middleware('auth.any')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::get('auth/google', [GoogleController::class, 'redirectToGoogle'])->name('auth.google');
Route::get('auth/google/callback', [GoogleController::class, 'handleGoogleCallback']);


Route::get('/auth/microsoft', function () {
    return Socialite::driver('microsoft')
        ->scopes(['User.Read', 'Mail.Read']) // add more if needed
        ->redirect();
});

Route::get('/auth/callback', function () {
    $microsoftUser = Socialite::driver('microsoft')->user();

    $user = \App\Models\User::firstOrCreate(
        ['email' => $microsoftUser->getEmail()],
        [
            'name' => $microsoftUser->getName(),
        ]
    );

    Auth::login($user);

    return redirect('/dashboard');
});

require __DIR__.'/auth.php';

require __DIR__ . '/cga.php';
require __DIR__ . '/cga.submissions.php';
require __DIR__ . '/competency.php';

require __DIR__ . '/my-cga.php';
require __DIR__ . '/review-cga.php';
require __DIR__ . '/staff-cga.php';
require __DIR__ . '/compare-cga.php';


require __DIR__ . '/dtr.php';

require __DIR__ . '/employees.php';
require __DIR__ . '/notifications.php';
require __DIR__ . '/settings.php';

require __DIR__ . '/applicant.php';

require __DIR__ . '/publications.php';
require __DIR__ . '/vacancies.php';
require __DIR__ . '/trainings.php';

require __DIR__ . '/file.php';
