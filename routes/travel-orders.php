<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\TravelOrders\TravelOrdersController;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {
    Route::resource('travel-orders', TravelOrdersController::class);
    Route::post('/travel-orders/bulk-destroy', [TravelOrdersController::class, 'bulkDestroy'])
        ->name('travel-orders.bulk-destroy');
});


