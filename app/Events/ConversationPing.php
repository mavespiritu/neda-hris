<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConversationPing implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public string $connection = 'redis';
    public string $queue = 'messenger';

    public function __construct(
        public int $recipientUserId,
        public int $conversationId,
        public int $senderId,
        public string $senderName,
        public string $message,
        public ?string $createdAt = null
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.' . $this->recipientUserId)];
    }

    public function broadcastAs(): string
    {
        return 'messenger.conversation.ping';
    }

    public function broadcastWith(): array
    {
        return [
            'conversation_id' => $this->conversationId,
            'sender_id' => $this->senderId,
            'sender_name' => $this->senderName,
            'last_message' => $this->message,
            'last_message_at' => $this->createdAt,
        ];
    }
}
