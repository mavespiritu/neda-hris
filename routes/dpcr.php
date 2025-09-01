<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Publications\DpcrController;

Route::middleware(['web', 'auth.any'])->group(function () {

    Route::get('/dpcrs', [DpcrController::class, 'index'])->name('dpcrs.index');

    Route::post('/dpcrs', [DpcrController::class, 'store'])->name('dpcrs.store');

    Route::put('/dpcrs/{id}', [DpcrController::class, 'update'])->name('dpcrs.update');

    Route::delete('/dpcrs/{id}', [DpcrController::class, 'destroy'])->name('dpcrs.destroy');

    Route::get('/dpcrs/{id}', [DpcrController::class, 'show'])->name('dpcrs.show');
    
});


