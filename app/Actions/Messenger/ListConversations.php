<?php

namespace App\Actions\Messenger;

use App\Models\Conversation;
use App\Models\Message;
use App\Traits\BuildsEmployeeNameMap;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Lorisleiva\Actions\Concerns\AsAction;

class ListConversations
{
    use AsAction, BuildsEmployeeNameMap;

    public function asController(Request $request): JsonResponse
    {
        $userId = (int) $request->user()->id;
        $limit = max(1, min((int) $request->input('limit', 20), 50));
        $beforeId = $request->filled('before_id') ? (int) $request->input('before_id') : null;

        $query = Conversation::query()
            ->whereHas('participants', fn ($q) => $q->where('users.id', $userId))
            ->with(['participants:id,ipms_id,name'])
            ->when($beforeId, fn ($q) => $q->where('conversations.id', '<', $beforeId))
            ->orderByDesc('conversations.id')
            ->limit($limit + 1);

        $rows = $query->get();
        $hasMore = $rows->count() > $limit;
        $rows = $rows->take($limit)->values();

        $conversationIds = $rows->pluck('id')->map(fn ($v) => (int) $v)->values();

        $latestMessagesByConversation = Message::query()
            ->select(['id', 'conversation_id', 'body', 'created_at'])
            ->whereIn('conversation_id', $conversationIds)
            ->orderByDesc('id')
            ->get()
            ->unique('conversation_id')
            ->keyBy('conversation_id');

        $empIds = $rows
            ->flatMap(fn ($c) => $c->participants->pluck('ipms_id'))
            ->filter()
            ->values();

        $employeesById = $this->employeeNamesById($empIds, 'mysql3');

        $data = $rows->map(function ($c) use ($userId, $employeesById, $latestMessagesByConversation) {
            $other = $c->participants->firstWhere('id', '!=', $userId);

            $directName = $other
                ? ($this->employeeName($employeesById, $other->ipms_id) ?? $other->name ?? 'Direct Message')
                : 'Direct Message';

            $latest = $latestMessagesByConversation->get((int) $c->id);

            return [
                'id' => (int) $c->id,
                'type' => (string) $c->type,
                'name' => $c->type === 'direct' ? $directName : ((string) ($c->title ?: 'Conversation')),
                'title' => $c->title,
                'other_user_id' => $c->type === 'direct' ? (int) ($other?->id ?? 0) : null,
                'other_user_ipms_id' => $c->type === 'direct' ? (string) ($other?->ipms_id ?? '') : null,
                'other_user_avatar' => $c->type === 'direct' && !empty($other?->ipms_id)
                    ? "/employees/image/{$other->ipms_id}"
                    : 'https://www.gravatar.com/avatar/?d=mp&s=200',
                'last_message' => $latest?->body,
                'last_message_at' => $latest?->created_at,
            ];
        })->values();

        return response()->json([
            'data' => $data,
            'has_more' => $hasMore,
        ]);
    }
}
