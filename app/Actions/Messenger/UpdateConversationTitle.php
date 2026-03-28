<?php

namespace App\Actions\Messenger;

use App\Events\ConversationRenamed;
use App\Events\ConversationPing;
use App\Models\Conversation;
use App\Support\MessengerConversationToken;
use App\Traits\UsesMessengerRedisCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class UpdateConversationTitle
{
    use AsAction, UsesMessengerRedisCache;

    public function authorize(ActionRequest $request): bool
    {
        $conversationId = (int) $request->route('conversation');
        $conversation = Conversation::query()->find($conversationId);

        if (! $conversation) {
            return false;
        }

        return Gate::forUser($request->user())->allows('update', $conversation);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
        ];
    }

    public function handle(Conversation $conversation, string $title): Conversation
    {
        $conversation->forceFill([
            'title' => trim($title),
            'is_title_custom' => true,
        ])->save();

        $latestMessage = $conversation->messages()
            ->with(['sender:id,name,ipms_id'])
            ->latest('id')
            ->first();

        $participantIds = $conversation->participants()
            ->pluck('users.id')
            ->map(fn ($id) => (int) $id)
            ->values();

        foreach ($participantIds as $participantId) {
            $this->bumpConversationListVersion($participantId);

            broadcast(new ConversationRenamed(
                recipientUserId: $participantId,
                conversationId: (int) $conversation->id,
                title: (string) $conversation->title,
                name: (string) ($conversation->title ?: 'Conversation'),
            ));

            broadcast(new ConversationPing(
                recipientUserId: $participantId,
                conversationId: (int) $conversation->id,
                conversationToken: MessengerConversationToken::encode((int) $conversation->id),
                conversationType: (string) $conversation->type,
                conversationTitle: $conversation->title ? (string) $conversation->title : null,
                participants: $conversation->type === 'group'
                    ? $conversation->participants()
                        ->select(['users.id', 'users.ipms_id', 'users.name'])
                        ->get()
                        ->filter(fn ($participant) => (int) $participant->id !== (int) $participantId)
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
                    : null,
                senderId: (int) ($latestMessage?->sender_id ?? 0),
                senderName: (string) ($latestMessage?->sender?->name ?? 'System'),
                senderIpmsId: (string) ($latestMessage?->sender?->ipms_id ?? ''),
                message: (string) ($latestMessage?->body ?? ''),
                attachmentPath: $latestMessage?->attachment_path,
                attachmentUrl: $latestMessage?->attachment_path
                    ? Storage::disk('public')->url($latestMessage->attachment_path)
                    : null,
                attachmentName: $latestMessage?->attachment_name,
                attachmentType: $latestMessage?->attachment_type,
                attachmentSize: $latestMessage?->attachment_size,
                createdAt: $latestMessage?->created_at?->toISOString(),
            ));
        }

        return $conversation->refresh();
    }

    public function asController(ActionRequest $request): JsonResponse
    {
        $conversation = Conversation::query()->findOrFail((int) $request->route('conversation'));
        $updated = $this->handle($conversation, (string) $request->validated('title'));

        return response()->json([
            'id' => (int) $updated->id,
            'title' => (string) $updated->title,
            'name' => (string) ($updated->title ?: 'Conversation'),
        ]);
    }
}
