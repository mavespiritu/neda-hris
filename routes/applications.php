<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Applications\ApplicationsController;

Route::middleware(['web', 'auth.any'])->group(function () {
     Route::get('/applications', [ApplicationsController::class, 'index'])->name('applications.index');
        Route::get('/applications/create', [ApplicationsController::class, 'create'])->name('applications.create');
        Route::post('/applications', [ApplicationsController::class, 'store'])->name('applications.store');
        Route::get('/applications/{id}/edit', [ApplicationsController::class, 'edit'])->name('applications.edit');
        Route::put('/applications/{id}', [ApplicationsController::class, 'update'])->name('applications.update');
        Route::delete('/applications/{id}', [ApplicationsController::class, 'destroy'])->name('applications.destroy');
        Route::post('/applications/bulk-destroy', [ApplicationsController::class, 'bulkDestroy'])->name('applications.bulk-destroy');
        
        Route::get('/applications/{id}', [ApplicationsController::class, 'show'])->name('applications.show');
});


