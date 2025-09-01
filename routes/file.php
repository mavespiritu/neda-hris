<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\FileController;

Route::middleware(['web', 'auth.any'])->group(function () {

    Route::get('/files/{id}/download', [FileController::class, 'download'])->name('files.download');
    
});


