<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Actions\Performance\ShowOpcr;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {

    Route::get('/opcrs', ShowOpcr::class)->name('opcrs.index');
    
});


