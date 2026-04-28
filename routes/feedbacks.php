<?php

use App\Actions\Feedbacks\ListFeedbacks;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth.any', 'verified'])->group(function () {
    Route::get('/feedbacks', ListFeedbacks::class)->name('feedbacks.index');
});
