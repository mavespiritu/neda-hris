<?php

use App\Models\Conversation;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    return Conversation::whereKey($conversationId)
        ->whereHas('participants', fn ($q) => $q->where('users.id', $user->id))
        ->exists();
});

Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});


Broadcast::channel('messenger.presence', function ($user) {
    return ['id' => $user->id, 'name' => $user->name];
});