<?php

namespace App\Events;

use App\Models\Message;
use App\Traits\BuildsEmployeeNameMap;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, SerializesModels, BuildsEmployeeNameMap;

    public string $connection = 'redis';
    public string $queue = 'messenger';

    public function __construct(public Message $message)
    {
        $this->message->loadMissing(['sender:id,name,ipms_id', 'replyTo.sender:id,name,ipms_id']);
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('conversation.' . $this->message->conversation_id)];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    public function broadcastWith(): array
    {
        $empIds = collect([
            $this->message->sender?->ipms_id,
            $this->message->replyTo?->sender?->ipms_id,
        ])->filter()->unique()->values();

        $employeesById = $this->employeeNamesById($empIds, 'mysql3');
        $gendersById = $this->employeeGenderById($empIds, 'mysql3');

        $senderName = $this->employeeName($employeesById, $this->message->sender?->ipms_id)
            ?? $this->message->sender?->name
            ?? 'User';

        $senderGender = $gendersById[$this->message->sender?->ipms_id] ?? null;

        $replySenderName = $this->message->replyTo
            ? ($this->employeeName($employeesById, $this->message->replyTo->sender?->ipms_id)
                ?? $this->message->replyTo->sender?->name
                ?? 'User')
            : null;

        $replySenderGender = $this->message->replyTo
            ? ($gendersById[$this->message->replyTo->sender?->ipms_id] ?? null)
            : null;

        return [
            'id' => $this->message->id,
            'conversation_id' => $this->message->conversation_id,
            'sender_id' => $this->message->sender_id,
            'sender_name' => $senderName,
            'sender_ipms_id' => $this->message->sender?->ipms_id,
            'sender_gender' => $senderGender,
            'body' => $this->message->body,
            'created_at' => $this->message->created_at?->toISOString(),
            'reply_to' => $this->message->replyTo ? [
                'id' => $this->message->replyTo->id,
                'sender_id' => $this->message->replyTo->sender_id,
                'body' => $this->message->replyTo->body,
                'sender_name' => $replySenderName,
                'sender_gender' => $replySenderGender,
            ] : null,
        ];
    }
}
