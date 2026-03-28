<?php

namespace App\Policies;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ConversationPolicy
{
    public function view(User $user, Conversation $conversation): Response
    {
        $allowed = $conversation->participants()
            ->where('users.id', $user->id)
            ->exists();

        return $allowed
            ? Response::allow()
            : Response::deny('Not allowed.');
    }

    public function send(User $user, Conversation $conversation): Response
    {
        $allowed = $conversation->participants()
            ->where('users.id', $user->id)
            ->exists();

        return $allowed
            ? Response::allow()
            : Response::deny('Not allowed.');
    }

    public function delete(User $user, Conversation $conversation): Response
    {
        $allowed = $conversation->participants()
            ->where('users.id', $user->id)
            ->exists();

        return $allowed
            ? Response::allow()
            : Response::deny('Not allowed.');
    }

    public function update(User $user, Conversation $conversation): Response
    {
        if ($conversation->type !== 'group') {
            return Response::deny('Only group chats can be renamed.');
        }

        $allowed = $conversation->participants()
            ->where('users.id', $user->id)
            ->exists();

        return $allowed
            ? Response::allow()
            : Response::deny('Not allowed.');
    }

    public function manageMembers(User $user, Conversation $conversation): Response
    {
        if ($conversation->type !== 'group') {
            return Response::deny('Only group chats can be managed.');
        }

        $allowed = $conversation->participants()
            ->where('users.id', $user->id)
            ->exists();

        return $allowed
            ? Response::allow()
            : Response::deny('Not allowed.');
    }

    public function leave(User $user, Conversation $conversation): Response
    {
        if ($conversation->type !== 'group') {
            return Response::deny('Only group chats can be left.');
        }

        $allowed = $conversation->participants()
            ->where('users.id', $user->id)
            ->exists();

        return $allowed
            ? Response::allow()
            : Response::deny('Not allowed.');
    }
}
