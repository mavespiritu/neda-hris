<?php

use Inertia\Inertia;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Application;
use App\Http\Controllers\Dtr\FwaController;
use App\Http\Controllers\Dtr\RtoController;
use App\Http\Controllers\Dtr\RaaController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Dtr\ScheduleController;
use App\Http\Controllers\Dtr\ReportController as FwaReportController;
use App\Http\Middleware\AccessControl;

Route::middleware(['web', 'auth.any'])->group(function () {

    Route::get('/fwa', [FwaController::class, 'index'])->name('fwa.index');
    Route::post('/fwa', [FwaController::class, 'store'])->name('fwa.store');

    Route::get('/fwa/schedule', [ScheduleController::class, 'index'])
        ->name('fwa.schedule.index');
    Route::post('/fwa/schedule', [ScheduleController::class, 'store'])->name('fwa.schedule.store');
    Route::post('/fwa/schedule/bulk', [ScheduleController::class, 'bulkStore'])->name('fwa.schedule.bulk-store');

    Route::get('/rto', [RtoController::class, 'index'])->name('rto.index');
    Route::post('/rto', [RtoController::class, 'store'])->name('rto.store');
    Route::get('/rto/{id}', [RtoController::class, 'edit'])->name('rto.edit');
    Route::put('/rto/{id}', [RtoController::class, 'update'])->name('rto.update');
    Route::delete('/rto/{id}', [RtoController::class, 'destroy'])->name('rto.destroy');
    Route::post('/rto/bulk-destroy', [RtoController::class, 'bulkDestroy'])->name('rto.bulk-destroy');

    Route::post('/rto/{id}/submit', [RtoController::class, 'submit'])->name('rto.submit');
    Route::post('/rto/{id}/endorse', [RtoController::class, 'endorse'])->name('rto.endorse');
    Route::post('/rto/{id}/approve', [RtoController::class, 'approve'])->name('rto.approve');
    Route::post('/rto/{id}/disapprove', [RtoController::class, 'disapprove'])->name('rto.disapprove');
    Route::post('/rto/{id}/return', [RtoController::class, 'return'])->name('rto.return');
    Route::get('/rto/{id}/report', [RtoController::class, 'generate'])
     ->name('rto.generate');

    Route::get('/raa', [RaaController::class, 'index'])->name('raa.index');
    Route::post('/raa/{id}', [RaaController::class, 'store'])->name('raa.store');
    Route::get('/raa/{id}', [RaaController::class, 'edit'])->name('raa.edit');
    Route::put('/raa/{id}', [RaaController::class, 'update'])->name('raa.update');
    Route::delete('/raa/{id}', [RaaController::class, 'destroy'])->name('raa.destroy');
    Route::post('/raa/bulk-destroy', [RaaController::class, 'bulkDestroy'])->name('raa.bulk-destroy');

    Route::post('/ra/{id}/submit', [RaaController::class, 'submit'])->name('raa.submit');
    Route::post('/raa/{id}/endorse', [RaaController::class, 'endorse'])->name('raa.endorse');
    Route::post('/raa/{id}/approve', [RaaController::class, 'approve'])->name('raa.approve');
    Route::post('/raa/{id}/disapprove', [RaaController::class, 'disapprove'])->name('raa.disapprove');
    Route::post('/raa/{id}/return', [RaaController::class, 'return'])->name('raa.return');
    Route::get('/raa/{id}/report', [RaaController::class, 'generate'])
     ->name('raa.generate');

    Route::get('/fwa/reports', [FwaReportController::class, 'index'])
        ->name('fwa.reports.index');
    Route::get('/fwa/reports/time-records', [FwaReportController::class, 'timeRecords'])
        ->name('fwa.reports.time-records');
    Route::get('/fwa/reports/time-records/export', [FwaReportController::class, 'exportTimeRecords'])->name('fwa.reports.time-records.export');
     
});

Route::middleware(['web'])->group(function () {

    Route::get('/rto/endorse/{token}', [RtoController::class, 'endorseViaEmail'])
    ->name('rto.endorse.email')
    ->middleware('signed');

    Route::get('/rto/approve/{token}', [RtoController::class, 'approveViaEmail'])
    ->name('rto.approve.email')
    ->middleware('signed');

    Route::get('/raa/endorse/{token}', [RaaController::class, 'endorseViaEmail'])
    ->name('raa.endorse.email')
    ->middleware('signed');

    Route::get('/raa/approve/{token}', [RaaController::class, 'approveViaEmail'])
    ->name('raa.approve.email')
    ->middleware('signed');

    Route::get('/fwa/schedule/{key}', [ScheduleController::class, 'indexPublic'])
    ->where('key', env('PUBLIC_FWA_KEY'));

});
