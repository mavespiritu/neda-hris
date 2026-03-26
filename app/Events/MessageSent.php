<?php

namespace App\Events;

use App\Models\Message;
use App\Traits\BuildsEmployeeNameMap;
use Illuminate\Support\Facades\Storage;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
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
            'attachment_path' => $this->message->attachment_path,
            'attachment_url' => $this->message->attachment_path
                ? Storage::disk('public')->url($this->message->attachment_path)
                : null,
            'attachment_name' => $this->message->attachment_name,
            'attachment_type' => $this->message->attachment_type,
            'attachment_size' => $this->message->attachment_size,
            'created_at' => $this->message->created_at?->toISOString(),
            'reply_to' => $this->message->replyTo ? [
                'id' => $this->message->replyTo->id,
                'sender_id' => $this->message->replyTo->sender_id,
                'body' => $this->message->replyTo->body,
                'attachment_path' => $this->message->replyTo->attachment_path,
                'attachment_url' => $this->message->replyTo->attachment_path
                    ? Storage::disk('public')->url($this->message->replyTo->attachment_path)
                    : null,
                'attachment_name' => $this->message->replyTo->attachment_name,
                'attachment_type' => $this->message->replyTo->attachment_type,
                'attachment_size' => $this->message->replyTo->attachment_size,
                'sender_name' => $replySenderName,
                'sender_gender' => $replySenderGender,
            ] : null,
        ];
    }
}
