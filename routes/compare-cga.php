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
    Route::get('/compare-cga', [CompareCgaController::class, 'index'])->name('compare-cga');
    Route::get('/compare-cga/compare/', [CompareCgaController::class, 'showComparison'])->name('compare-cga.show-comparison');
    Route::get('/compare-cga/compare/competency/{id}', [CompareCgaController::class, 'showComparisonIndicators'])->name('compare-cga.show-comparison-indicators');
});
