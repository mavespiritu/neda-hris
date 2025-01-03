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

Route::middleware(['web', 'auth'])->group(function () {
    Route::post('/notification/submit-cga', [NotificationController::class, 'submitCga'])->name('notification.submit-cga');
    Route::post('/notification/endorse-cga', [NotificationController::class, 'endorseCga'])->name('notification.endorse-cga');
    Route::post('/notification/approve-cga', [NotificationController::class, 'approveCga'])->name('notification.approve-cga');
});
