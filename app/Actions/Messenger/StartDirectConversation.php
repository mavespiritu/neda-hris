<?php

namespace App\Actions\Messenger;

use App\Models\Conversation;
use App\Support\MessengerConversationToken;
use App\Traits\UsesMessengerRedisCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class StartDirectConversation
{
    use AsAction, UsesMessengerRedisCache;

    public function rules(): array
    {
        $user = new \App\Models\User();
        $table = $user->getTable();
        $connection = $user->getConnectionName();
        $target = $connection ? "{$connection}.{$table}" : $table;

        return [
            'user_id' => ['required', 'integer', Rule::exists($target, 'id')],
        ];
    }

    public function asController(ActionRequest $request): JsonResponse
    {
        $me = (int) $request->user()->id;
        $other = (int) $request->validated('user_id');

        abort_if($me === $other, 422, 'You cannot message yourself.');

        $conversation = Conversation::query()
            ->where('type', 'direct')
            ->whereHas('participants', fn ($q) => $q->where('users.id', $me))
            ->whereHas('participants', fn ($q) => $q->where('users.id', $other))
            ->withCount('participants')
            ->get()
            ->first(fn ($c) => (int) $c->participants_count === 2);

        if (! $conversation) {
            $conversation = DB::transaction(function () use ($me, $other) {
                $c = Conversation::create(['type' => 'direct']);
                $c->participants()->sync([$me, $other]);
                return $c;
            });
        }

        $this->bumpConversationListVersion($me);
        $this->bumpConversationListVersion($other);

        return response()->json([
            'id' => $conversation->id,
            'conversation_token' => MessengerConversationToken::encode((int) $conversation->id),
        ]);
    }
}
