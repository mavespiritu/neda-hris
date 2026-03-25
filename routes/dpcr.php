<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Actions\Performance\ShowDpcr;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {

    Route::get('/dpcrs', ShowDpcr::class)->name('dpcrs.index');
    
});


