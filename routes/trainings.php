<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\TrainingController;

Route::middleware(['web', 'auth.any'])->group(function () {
    Route::get('/trainings', [TrainingController::class, 'index'])->name('trainings.index');
});


