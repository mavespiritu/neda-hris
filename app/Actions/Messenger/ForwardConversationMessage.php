<?php

namespace App\Actions\Messenger;

use App\Events\ConversationPing;
use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
use App\Support\MessengerConversationToken;
use App\Traits\BuildsEmployeeNameMap;
use App\Traits\UsesMessengerRedisCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class ForwardConversationMessage
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
            'message_id' => ['required', 'integer', 'exists:mysql4.messages,id'],
        ];
    }

    public function asController(ActionRequest $request, Conversation $conversation): JsonResponse
    {
        $validated = $request->validated();

        $sourceMessage = Message::query()
            ->with(['sender:id,name,ipms_id', 'replyTo.sender:id,name,ipms_id', 'conversation'])
            ->findOrFail((int) $validated['message_id']);

        if (! Gate::forUser($request->user())->allows('send', $sourceMessage->conversation)) {
            abort(403);
        }

        $forwardedMessage = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $request->user()->id,
            'body' => (string) $sourceMessage->body,
            'attachment_path' => $sourceMessage->attachment_path,
            'attachment_name' => $sourceMessage->attachment_name,
            'attachment_type' => $sourceMessage->attachment_type,
            'attachment_size' => $sourceMessage->attachment_size,
            'reply_to_id' => null,
        ]);

        $forwardedMessage->load(['sender:id,name,ipms_id', 'replyTo.sender:id,name,ipms_id']);

        $empIds = collect([
            $forwardedMessage->sender?->ipms_id,
            $forwardedMessage->replyTo?->sender?->ipms_id,
        ])->filter()->unique()->values();

        $employeesById = $this->employeeNamesById($empIds, 'mysql3');
        $senderName = $this->employeeName($employeesById, $forwardedMessage->sender?->ipms_id)
            ?? $forwardedMessage->sender?->name
            ?? $request->user()->name
            ?? 'You';
        $senderGender = null;

        $attachmentUrl = $forwardedMessage->attachment_path
            ? Storage::disk('public')->url($forwardedMessage->attachment_path)
            : null;

        $participantSnapshots = $conversation->type === 'group'
            ? $conversation->participants()
                ->select(['users.id', 'users.ipms_id', 'users.name'])
                ->get()
                ->filter(fn ($participant) => (int) $participant->id !== (int) $request->user()->id)
                ->map(fn ($participant) => [
                    'id' => (int) $participant->id,
                    'ipms_id' => (string) ($participant->ipms_id ?? ''),
                    'name' => (string) ($participant->name ?? 'Member'),
                    'avatar' => !empty($participant->ipms_id)
                        ? "/employees/image/{$participant->ipms_id}"
                        : 'https://www.gravatar.com/avatar/?d=mp&s=200',
                ])
                ->values()
                ->all()
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
                conversationToken: MessengerConversationToken::encode((int) $conversation->id),
                conversationType: (string) $conversation->type,
                conversationTitle: $conversation->title ? (string) $conversation->title : null,
                participants: $participantSnapshots,
                senderId: (int) $forwardedMessage->sender_id,
                senderName: (string) $senderName,
                message: (string) $forwardedMessage->body,
                attachmentPath: $forwardedMessage->attachment_path,
                attachmentName: $forwardedMessage->attachment_name,
                attachmentType: $forwardedMessage->attachment_type,
                attachmentSize: $forwardedMessage->attachment_size,
                attachmentUrl: $attachmentUrl,
                createdAt: $forwardedMessage->created_at?->toISOString()
            ));
        }

        broadcast(new MessageSent($forwardedMessage))->toOthers();

        return response()->json([
            'data' => [
                'id' => $forwardedMessage->id,
                'sender_id' => $forwardedMessage->sender_id,
                'sender_name' => $senderName,
                'sender_ipms_id' => $forwardedMessage->sender?->ipms_id,
                'sender_gender' => $senderGender,
                'body' => $forwardedMessage->body,
                'attachment_path' => $forwardedMessage->attachment_path,
                'attachment_url' => $attachmentUrl,
                'attachment_name' => $forwardedMessage->attachment_name,
                'attachment_type' => $forwardedMessage->attachment_type,
                'attachment_size' => $forwardedMessage->attachment_size,
                'created_at' => $forwardedMessage->created_at?->toISOString(),
                'reply_to' => null,
            ],
        ]);
    }
}
