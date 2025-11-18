<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Publications\OpcrController;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {

    Route::get('/opcrs', [OpcrController::class, 'index'])->name('opcrs.index');

    Route::post('/opcrs', [OpcrController::class, 'store'])->name('opcrs.store');

    Route::put('/opcrs/{id}', [OpcrController::class, 'update'])->name('opcrs.update');

    Route::delete('/opcrs/{id}', [OpcrController::class, 'destroy'])->name('opcrs.destroy');

    Route::get('/opcrs/{id}', [OpcrController::class, 'show'])->name('opcrs.show');
    
});


