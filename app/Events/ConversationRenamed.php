<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConversationRenamed implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public string $connection = 'redis';
    public string $queue = 'messenger';

    public function __construct(
        public int $recipientUserId,
        public int $conversationId,
        public ?string $title,
        public ?string $name,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->recipientUserId),
            new PrivateChannel('conversation.' . $this->conversationId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'messenger.conversation.renamed';
    }

    public function broadcastWith(): array
    {
        return [
            'conversation_id' => $this->conversationId,
            'title' => $this->title,
            'name' => $this->name,
        ];
    }
}
