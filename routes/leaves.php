<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Leaves\LeavesController;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {
    Route::resource('leaves', LeavesController::class);
    Route::post('/leaves/bulk-destroy', [LeavesController::class, 'bulkDestroy'])
        ->name('leaves.bulk-destroy');
});


