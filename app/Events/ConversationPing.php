<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConversationPing implements ShouldBroadcastNow
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
        public int $senderId,
        public string $senderName,
        public string $message,
        public ?string $attachmentPath = null,
        public ?string $attachmentUrl = null,
        public ?string $attachmentName = null,
        public ?string $attachmentType = null,
        public ?int $attachmentSize = null,
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
            'conversation_token' => $this->conversationToken,
            'conversation_type' => $this->conversationType,
            'conversation_title' => $this->conversationTitle,
            'participants' => $this->participants,
            'sender_id' => $this->senderId,
            'sender_name' => $this->senderName,
            'last_message' => $this->message,
            'last_message_attachment_path' => $this->attachmentPath,
            'last_message_attachment_url' => $this->attachmentUrl,
            'last_message_attachment_name' => $this->attachmentName,
            'last_message_attachment_type' => $this->attachmentType,
            'last_message_at' => $this->createdAt,
        ];
    }
}
