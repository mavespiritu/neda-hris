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
    Route::get('/employees', [EmployeeController::class, 'getEmployees'])->name('employees');
    Route::get('/employees/all-employees', [EmployeeController::class, 'showAllEmployees'])->name('employees.show-all-employees');
    Route::get('/employees/active-employees', [EmployeeController::class, 'showActiveEmployees'])->name('employees.show-active-employees');
    Route::get('/employees/filtered-employees', [EmployeeController::class, 'showFilteredEmployees'])->name('employees.show-filtered-employees');
    Route::get('/employees/image/{id}', [EmployeeController::class, 'showImage'])->name('employees.show-image');
    Route::get('/employees/current-position/{id}', [EmployeeController::class, 'showCurrentPosition'])->name('employees.show-current-position');
});
