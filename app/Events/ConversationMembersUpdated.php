<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConversationMembersUpdated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public string $connection = 'redis';
    public string $queue = 'messenger';

    public function __construct(
        public int $recipientUserId,
        public int $conversationId,
        public ?string $conversationToken,
        public ?string $conversationType,
        public ?string $conversationTitle,
        public ?array $participants,
        public ?string $conversationUpdatedAt,
        public int $actorId,
        public string $actorName,
        public string $action,
        public array $removedUserIds = [],
        public array $addedUserIds = [],
        public bool $deleted = false,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.' . $this->recipientUserId)];
    }

    public function broadcastAs(): string
    {
        return 'messenger.conversation.members-updated';
    }

    public function broadcastWith(): array
    {
        return [
            'conversation_id' => $this->conversationId,
            'conversation_token' => $this->conversationToken,
            'conversation_type' => $this->conversationType,
            'conversation_title' => $this->conversationTitle,
            'participants' => $this->participants,
            'conversation_updated_at' => $this->conversationUpdatedAt,
            'actor_id' => $this->actorId,
            'actor_name' => $this->actorName,
            'action' => $this->action,
            'removed_user_ids' => $this->removedUserIds,
            'added_user_ids' => $this->addedUserIds,
            'deleted' => $this->deleted,
        ];
    }
}
