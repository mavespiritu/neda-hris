<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\JobPortal\ApplicationsController;

Route::middleware(['web', 'auth.any'])->group(function () {
    Route::get('/applications', [ApplicationsController::class, 'index'])->name('applications.index');
});


