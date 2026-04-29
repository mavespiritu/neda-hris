<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Actions\Performance\ShowDpcr;
use App\Actions\Performance\Dpcr\ShowDivisions;
use App\Actions\Performance\Dpcr\ListDivisionEmployees;
use App\Actions\Performance\Dpcr\ManageDpcrSuccessIndicators;
use App\Actions\Performance\Dpcr\ListSuccessIndicators;
use App\Actions\Performance\Dpcr\ManageDpcrItems;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {

    Route::get('/dpcrs', ShowDpcr::class)->name('dpcrs.index');
    Route::get('/dpcrs/divisions', ShowDivisions::class)->name('dpcrs.divisions.index');
    Route::get('/dpcrs/division-employees', ListDivisionEmployees::class)->name('dpcrs.division-employees.index');
    Route::get('/dpcrs/success-indicators', ListSuccessIndicators::class)->name('dpcrs.success-indicators.index');
    Route::post('/dpcrs/{recordId}/success-indicators', [ManageDpcrSuccessIndicators::class, 'store'])->name('dpcrs.success-indicators.store');
    Route::put('/dpcrs/{recordId}/success-indicators/{itemId}', [ManageDpcrSuccessIndicators::class, 'update'])->name('dpcrs.success-indicators.update');
    Route::delete('/dpcrs/{recordId}/success-indicators/{itemId}', [ManageDpcrSuccessIndicators::class, 'destroy'])->name('dpcrs.success-indicators.destroy');
    Route::post('/dpcrs/{recordId}/specific-activities/{parentItemId}', [ManageDpcrItems::class, 'store'])->name('dpcrs.specific-activities.store');
    
});
