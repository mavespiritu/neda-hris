<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\JobPortal\ApplicationsController;

Route::middleware(['web', 'auth.any'])->group(function () {
    Route::get('/my-applications', [ApplicationsController::class, 'index'])->name('my-applications.index');
});


