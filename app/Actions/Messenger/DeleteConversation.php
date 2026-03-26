<?php

namespace App\Actions\Messenger;

use App\Models\Conversation;
use App\Traits\UsesMessengerRedisCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class DeleteConversation
{
    use AsAction, UsesMessengerRedisCache;

    public function authorize(ActionRequest $request): bool
    {
        $conversationId = (int) $request->route('conversation');
        $conversation = Conversation::query()->find($conversationId);

        if (! $conversation) {
            return false;
        }

        return Gate::forUser($request->user())->allows('delete', $conversation);
    }

    public function handle(Conversation $conversation, int $userId): void
    {
        $cutoffMessageId = (int) ($conversation->messages()->max('id') ?? 0);
        $cutoffMessageId = max(0, $cutoffMessageId);

        $conversation->hiddenUsers()->syncWithoutDetaching([
            $userId => [
                'deleted_after_message_id' => $cutoffMessageId,
            ],
        ]);

        $conversation->hiddenUsers()->updateExistingPivot($userId, [
            'deleted_after_message_id' => $cutoffMessageId,
        ]);

        $this->bumpConversationListVersion($userId);
    }

    public function asController(ActionRequest $request): JsonResponse
    {
        $conversationId = (int) $request->route('conversation');
        $conversation = Conversation::query()->findOrFail($conversationId);

        $this->handle($conversation, (int) $request->user()->id);

        return response()->json([
            'ok' => true,
        ]);
    }
}
