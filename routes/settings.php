<?php

use App\Http\Controllers\SettingsController;
use App\Http\Controllers\TravelOrders\SignatoriesController;
use App\Http\Controllers\TravelOrders\VehiclesController;
use App\Http\Controllers\TravelOrders\PrioritizationsController;
use App\Http\Controllers\TravelOrders\CategoriesController;
use App\Http\Controllers\TravelOrders\FundSourcesController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {
    Route::get('/settings/cga-enable-updating', [SettingsController::class, 'getCgaEnableUpdatingDates'])->name('settings.get-cga-enable-updating');

    Route::get('/settings/cga-submission-schedules', [SettingsController::class, 'getCgaSubmissionSchedules'])->name('settings.cga.submission-schedules');
    Route::post('/settings/cga-submission-schedules', [SettingsController::class, 'storeCgaSubmissionSchedules'])->name('settings.cga.submission-schedules.store');
    Route::put('/settings/cga-submission-schedules/{id}', [SettingsController::class, 'updateCgaSubmissionSchedules'])->name('settings.cga.submission-schedules.update');
    Route::delete('/settings/cga-submission-schedules/{id}', [SettingsController::class, 'destroyCgaSubmissionSchedules'])->name('settings.cga.submission-schedules.destroy');
    Route::post('/settings/cga-submission-schedules/bulk-destroy', [SettingsController::class, 'bulkDestroyCgaSubmissionSchedules'])->name('settings.cga.submission-schedules.bulk-destroy');
    Route::get('/settings/cga-submission-schedules/list', [SettingsController::class, 'getCgaSubmissionSchedulesList'])->name('settings.cga.submission-schedules.list');

    Route::get('/settings/travel-orders/signatories', [SignatoriesController::class, 'index'])->name('settings.travel-orders.signatories');
    Route::post('/settings/travel-orders/signatories', [SignatoriesController::class, 'store'])->name('settings.travel-orders.signatories.store');
    Route::put('/settings/travel-orders/signatories/{id}', [SignatoriesController::class, 'update'])->name('settings.travel-orders.signatories.update');
    Route::delete('/settings/travel-orders/signatories/{id}', [SignatoriesController::class, 'destroy'])->name('settings.travel-orders.signatories.destroy');
    Route::post('/settings/travel-orders/signatories/bulk-destroy', [SignatoriesController::class, 'bulkDestroy'])->name('settings.travel-orders.signatories.bulk-destroy');

    Route::get('/settings/travel-orders/vehicles', [VehiclesController::class, 'index'])->name('settings.travel-orders.vehicles');
    Route::post('/settings/travel-orders/vehicles', [VehiclesController::class, 'store'])->name('settings.travel-orders.vehicles.store');
    Route::put('/settings/travel-orders/vehicles/{id}', [VehiclesController::class, 'update'])->name('settings.travel-orders.vehicles.update');
    Route::delete('/settings/travel-orders/vehicles/{id}', [VehiclesController::class, 'destroy'])->name('settings.travel-orders.vehicles.destroy');
    Route::post('/settings/travel-orders/vehicles/bulk-destroy', [VehiclesController::class, 'bulkDestroy'])->name('settings.travel-orders.vehicles.bulk-destroy');

    Route::get('/settings/travel-orders/prioritizations', [PrioritizationsController::class, 'index'])->name('settings.travel-orders.prioritizations');
    Route::post('/settings/travel-orders/prioritizations', [PrioritizationsController::class, 'store'])->name('settings.travel-orders.prioritizations.store');
    Route::put('/settings/travel-orders/prioritizations/{id}', [PrioritizationsController::class, 'update'])->name('settings.travel-orders.prioritizations.update');
    Route::delete('/settings/travel-orders/prioritizations/{id}', [PrioritizationsController::class, 'destroy'])->name('settings.travel-orders.prioritizations.destroy');
    Route::post('/settings/travel-orders/prioritizations/bulk-destroy', [PrioritizationsController::class, 'bulkDestroy'])->name('settings.travel-orders.prioritizations.bulk-destroy');

    Route::get('/settings/travel-orders/categories', [CategoriesController::class, 'index'])->name('settings.travel-orders.categories');
    Route::post('/settings/travel-orders/categories', [CategoriesController::class, 'store'])->name('settings.travel-orders.categories.store');
    Route::put('/settings/travel-orders/categories/{id}', [CategoriesController::class, 'update'])->name('settings.travel-orders.categories.update');
    Route::delete('/settings/travel-orders/categories/{id}', [CategoriesController::class, 'destroy'])->name('settings.travel-orders.categories.destroy');
    Route::post('/settings/travel-orders/categories/bulk-destroy', [CategoriesController::class, 'bulkDestroy'])->name('settings.travel-orders.categories.bulk-destroy');

    Route::get('/settings/travel-orders/fund-sources', [FundSourcesController::class, 'index'])->name('settings.travel-orders.fund-sources');
    Route::post('/settings/travel-orders/fund-sources', [FundSourcesController::class, 'store'])->name('settings.travel-orders.fund-sources.store');
    Route::put('/settings/travel-orders/fund-sources/{id}', [FundSourcesController::class, 'update'])->name('settings.travel-orders.fund-sources.update');
    Route::delete('/settings/travel-orders/fund-sources/{id}', [FundSourcesController::class, 'destroy'])->name('settings.travel-orders.fund-sources.destroy');
    Route::post('/settings/travel-orders/fund-sources/bulk-destroy', [FundSourcesController::class, 'bulkDestroy'])->name('settings.travel-orders.fund-sources.bulk-destroy');

    Route::post('/settings/cga-enable-updating', [SettingsController::class, 'setCgaEnableUpdatingDates'])->name('settings.set-cga-enable-updating');

    Route::get('/settings/account', [SettingsController::class, 'account'])->name('settings.account');
    Route::post('/settings/account', [SettingsController::class, 'updateAccount'])->name('settings.account.update');

    Route::get('/settings/organization', [SettingsController::class, 'organization'])->name('settings.organization');
    Route::patch('/settings/organization', [SettingsController::class, 'updateOrganization'])->name('settings.organization.update');

    Route::get('/settings/recruitment', [SettingsController::class, 'recruitment'])->name('settings.recruitment');
    Route::patch('/settings/recruitment', [SettingsController::class, 'updateRecruitment'])
    ->name('settings.recruitment.update');
});
