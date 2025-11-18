<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Publications\IpcrController;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {

    Route::get('/ipcrs', [IpcrController::class, 'index'])->name('ipcrs.index');

    Route::post('/ipcrs', [IpcrController::class, 'store'])->name('ipcrs.store');

    Route::put('/ipcrs/{id}', [IpcrController::class, 'update'])->name('ipcrs.update');

    Route::delete('/ipcrs/{id}', [IpcrController::class, 'destroy'])->name('ipcrs.destroy');

    Route::get('/ipcrs/{id}', [IpcrController::class, 'show'])->name('ipcrs.show');
    
});


