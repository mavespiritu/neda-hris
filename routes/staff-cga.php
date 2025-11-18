<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\UserController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\MyCgaController;
use App\Http\Controllers\StaffCgaController;
use App\Http\Controllers\ReviewCgaController;
use App\Http\Controllers\CompareCgaController;
use App\Http\Controllers\TrainingController;
use App\Http\Controllers\NotificationController;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {
    Route::get('/staff-cga', [StaffCgaController::class, 'index'])->name('staff-cga');
});
