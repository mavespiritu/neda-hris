<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Actions\Messenger\ListConversationMessages;
use App\Actions\Messenger\ListConversations;
use App\Actions\Messenger\SendConversationMessage;
use App\Actions\Messenger\ShowMessengerPage;
use App\Actions\Messenger\StartConversation;

Route::middleware(['web', 'auth.any', 'verified'])
    ->prefix('messenger')
    ->name('messenger.')
    ->group(function () {
        Route::get('/', ShowMessengerPage::class)->name('index');
        Route::get('/conversations', ListConversations::class)->name('conversations');
        Route::get('/conversations/{conversation}/messages', ListConversationMessages::class)->name('messages');
        Route::post('/conversations/{conversation}/messages', SendConversationMessage::class)->name('send');
        Route::post('/start-conversation', StartConversation::class)->name('start-conversation');
        Route::post('/start-direct', \App\Actions\Messenger\StartDirectConversation::class)->name('start-direct');
    });
