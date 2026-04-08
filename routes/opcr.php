<?php

use App\Actions\Performance\Opcr\ManageOpcrItems;
use App\Actions\Performance\Opcr\ShowDivisions;
use App\Actions\Performance\Opcr\ShowOpcr;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {
    Route::get('/opcrs', ShowOpcr::class)->name('opcrs.index');
    Route::get('/performance/opcr/divisions', ShowDivisions::class)->name('performance.opcr.divisions');
    Route::post('/opcrs/{recordId}/items', [ManageOpcrItems::class, 'store'])->name('opcrs.items.store');
    Route::post('/opcrs/{recordId}/items/sync-tree', [ManageOpcrItems::class, 'syncTree'])->name('opcrs.items.sync-tree');
    Route::post('/opcrs/{recordId}/items/reorder', [ManageOpcrItems::class, 'reorder'])->name('opcrs.items.reorder');
    Route::put('/opcrs/items/{id}', [ManageOpcrItems::class, 'update'])->name('opcrs.items.update');
    Route::delete('/opcrs/items/{id}', [ManageOpcrItems::class, 'destroy'])->name('opcrs.items.destroy');
});
