<?php

use App\Actions\AccessControl\ShowAccessControlPages;
use App\Actions\AccessControl\ShowAccessControlPermissions;
use App\Actions\AccessControl\ShowAccessControlRoles;
use App\Actions\AccessControl\ShowAccessControlScope;
use App\Actions\AccessControl\ShowAccessControlUsers;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth.any', 'verified'])
    ->prefix('access-control')
    ->name('access-control.')
    ->group(function () {
        Route::redirect('/', '/access-control/users')->name('index');
        Route::get('/users', ShowAccessControlUsers::class)->name('users');
        Route::get('/roles', ShowAccessControlRoles::class)->name('roles');
        Route::get('/permissions', ShowAccessControlPermissions::class)->name('permissions');
        Route::get('/pages', ShowAccessControlPages::class)->name('pages');
        Route::get('/scope', ShowAccessControlScope::class)->name('scope');
    });
