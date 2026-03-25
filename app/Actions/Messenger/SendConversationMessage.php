<?php

namespace App\Actions\Messenger;

use App\Events\ConversationPing;
use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
use App\Traits\BuildsEmployeeNameMap;
use App\Traits\UsesMessengerRedisCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class SendConversationMessage
{
    use AsAction, BuildsEmployeeNameMap, UsesMessengerRedisCache;

    public function authorize(ActionRequest $request): bool
    {
        $conversation = $request->route('conversation');

        return Gate::forUser($request->user())->allows('send', $conversation);
    }

    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'max:5000'],
            'reply_to_id' => ['nullable', 'integer', 'exists:mysql4.messages,id'],
        ];
    }

    public function asController(ActionRequest $request, Conversation $conversation): JsonResponse
    {
        $validated = $request->validated();

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $request->user()->id,
            'body' => $validated['body'],
            'reply_to_id' => $validated['reply_to_id'] ?? null,
        ]);

        $conversation->touch();
        $message->load(['sender:id,name,ipms_id', 'replyTo.sender:id,name,ipms_id']);

        $empIds = collect([
            $message->sender?->ipms_id,
            $message->replyTo?->sender?->ipms_id,
        ])->filter()->unique()->values();

        $employeesById = $this->employeeNamesById($empIds, 'mysql3');
        $gendersById = $this->employeeGenderById($empIds, 'mysql3');

        $senderName = $this->employeeName($employeesById, $message->sender?->ipms_id)
            ?? $message->sender?->name
            ?? 'User';

        $senderGender = $gendersById[$message->sender?->ipms_id] ?? null;

        $replySenderName = $message->replyTo
            ? ($this->employeeName($employeesById, $message->replyTo->sender?->ipms_id)
                ?? $message->replyTo->sender?->name
                ?? 'User')
            : null;

        $replySenderGender = $message->replyTo
            ? ($gendersById[$message->replyTo->sender?->ipms_id] ?? null)
            : null;

        $recipientIds = $conversation->participants()
            ->where('users.id', '!=', $request->user()->id)
            ->pluck('users.id')
            ->map(fn ($id) => (int) $id)
            ->values();

        $this->bumpConversationMessagesVersion((int) $conversation->id);
        $this->bumpConversationListVersion((int) $request->user()->id);

        foreach ($recipientIds as $recipientId) {
            $this->bumpConversationListVersion($recipientId);

            broadcast(new ConversationPing(
                recipientUserId: $recipientId,
                conversationId: (int) $conversation->id,
                senderId: (int) $message->sender_id,
                senderName: (string) $senderName,
                message: (string) $message->body,
                createdAt: $message->created_at?->toISOString()
            ));
        }

        broadcast(new MessageSent($message))->toOthers();

        return response()->json([
            'data' => [
                'id' => $message->id,
                'sender_id' => $message->sender_id,
                'sender_name' => $senderName,
                'sender_ipms_id' => $message->sender?->ipms_id,
                'sender_gender' => $senderGender,
                'body' => $message->body,
                'created_at' => $message->created_at?->toISOString(),
                'reply_to' => $message->replyTo ? [
                    'id' => $message->replyTo->id,
                    'sender_id' => $message->replyTo->sender_id,
                    'sender_name' => $replySenderName,
                    'sender_gender' => $replySenderGender,
                    'body' => $message->replyTo->body,
                ] : null,
            ],
        ]);
    }
}
