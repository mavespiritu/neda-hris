<?php

use App\Http\Controllers\FileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ProfileController;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {
    Route::get('/files/{id}/download', [FileController::class, 'download'])->name('files.download');
    Route::get('/files/{id}/preview', [FileController::class, 'preview'])->name('files.preview');
});