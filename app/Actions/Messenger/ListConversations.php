<?php

namespace App\Actions\Messenger;

use App\Models\Conversation;
use App\Models\Message;
use App\Support\MessengerConversationToken;
use App\Traits\BuildsEmployeeNameMap;
use App\Traits\UsesMessengerRedisCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Lorisleiva\Actions\Concerns\AsAction;

class ListConversations
{
    use AsAction, BuildsEmployeeNameMap, UsesMessengerRedisCache;

    public function asController(Request $request): JsonResponse
    {
        $userId = (int) $request->user()->id;
        $limit = max(1, min((int) $request->input('limit', 20), 50));
        $beforeId = $request->filled('before_id') ? (int) $request->input('before_id') : null;
        $version = $this->currentConversationListVersion($userId);
        $cacheKey = "messenger:conversations:{$userId}:{$version}:{$limit}:" . ($beforeId ?: 'latest');

        $payload = $this->messengerCache()->remember($cacheKey, now()->addSeconds(20), function () use ($userId, $limit, $beforeId) {
            $latestMessageSub = Message::query()
                ->selectRaw('conversation_id, max(created_at) as last_message_at')
                ->groupBy('conversation_id');

            $deletedStateSub = DB::connection('mysql4')->table('conversation_hidden_users')
                ->select(['conversation_id', 'deleted_after_message_id', 'created_at'])
                ->where('user_id', $userId);
            $hiddenStates = DB::connection('mysql4')->table('conversation_hidden_users')
                ->where('user_id', $userId)
                ->get()
                ->keyBy('conversation_id');
            $readStates = DB::connection('mysql4')->table('conversation_reads')
                ->select(['conversation_id', 'last_read_message_id'])
                ->where('user_id', $userId)
                ->get()
                ->keyBy('conversation_id');

            $query = Conversation::query()
                ->whereHas('participants', fn ($q) => $q->where('users.id', $userId))
                ->leftJoinSub($latestMessageSub, 'lm', fn ($join) => $join->on('lm.conversation_id', '=', 'conversations.id'))
                ->leftJoinSub($deletedStateSub, 'chs', fn ($join) => $join->on('chs.conversation_id', '=', 'conversations.id'))
                ->where(function ($q) {
                    $q->whereNull('chs.conversation_id')
                        ->orWhere(function ($qq) {
                            $qq->whereNotNull('chs.deleted_after_message_id')
                                ->whereRaw(
                                    '(select coalesce(max(id), 0) from messages where messages.conversation_id = conversations.id) > chs.deleted_after_message_id'
                                );
                        })
                        ->orWhere(function ($qq) {
                            $qq->whereNull('chs.deleted_after_message_id')
                                ->whereRaw(
                                    '(select coalesce(max(created_at), "1970-01-01 00:00:00") from messages where messages.conversation_id = conversations.id) > chs.created_at'
                                );
                        });
                })
                ->select('conversations.*')
                ->with(['participants:id,ipms_id,name'])
                ->when($beforeId, fn ($q) => $q->where('conversations.id', '<', $beforeId))
                ->orderByRaw('coalesce(lm.last_message_at, conversations.created_at) desc')
                ->orderByDesc('conversations.id')
                ->limit($limit + 1);

            $rows = $query->get();
            $hasMore = $rows->count() > $limit;
            $rows = $rows->take($limit)->values();

            $conversationIds = $rows->pluck('id')->map(fn ($v) => (int) $v)->values();

            $latestMessagesByConversation = Message::query()
                ->select(['id', 'conversation_id', 'sender_id', 'body', 'attachment_path', 'attachment_type', 'attachment_name', 'created_at'])
                ->with('sender:id,name,ipms_id')
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

            $data = $rows->map(function ($c) use ($userId, $employeesById, $latestMessagesByConversation, $hiddenStates, $readStates) {
                $other = $c->participants->firstWhere('id', '!=', $userId);
                $groupParticipants = $c->type === 'group'
                    ? $c->participants
                        ->filter(fn ($participant) => (int) $participant->id !== $userId)
                        ->take(5)
                        ->values()
                    : collect();

                $directName = $other
                    ? ($this->employeeName($employeesById, $other->ipms_id) ?? $other->name ?? 'Direct Message')
                    : 'Direct Message';

                $latest = $latestMessagesByConversation->get((int) $c->id);
                $latestSenderName = $latest
                    ? ($this->employeeName($employeesById, $latest->sender?->ipms_id) ?? $latest->sender?->name ?? 'Someone')
                    : null;

                $hiddenState = $hiddenStates->get((int) $c->id);
                $readState = $readStates->get((int) $c->id);
                $lastReadMessageId = (int) ($readState?->last_read_message_id ?? 0);
                $deletedAfterMessageId = (int) ($hiddenState?->deleted_after_message_id ?? 0);
                $deletedAt = $hiddenState?->created_at;

                $unreadQuery = Message::query()
                    ->where('conversation_id', (int) $c->id)
                    ->where('sender_id', '!=', $userId);

                if ($deletedAfterMessageId > 0) {
                    $unreadQuery->where('id', '>', max($deletedAfterMessageId, $lastReadMessageId));
                } elseif ($deletedAt) {
                    $unreadQuery->where('created_at', '>', $deletedAt);

                    if ($lastReadMessageId > 0) {
                        $unreadQuery->where('id', '>', $lastReadMessageId);
                    }
                } elseif ($lastReadMessageId > 0) {
                    $unreadQuery->where('id', '>', $lastReadMessageId);
                }

                return [
                    'id' => (int) $c->id,
                    'conversation_token' => MessengerConversationToken::encode((int) $c->id),
                    'type' => (string) $c->type,
                    'name' => $c->type === 'direct' ? $directName : ((string) ($c->title ?: 'Conversation')),
                    'title' => $c->title,
                    'other_user_id' => $c->type === 'direct' ? (int) ($other?->id ?? 0) : null,
                    'other_user_ipms_id' => $c->type === 'direct' ? (string) ($other?->ipms_id ?? '') : null,
                    'other_user_avatar' => $c->type === 'direct' && !empty($other?->ipms_id)
                        ? "/employees/image/{$other->ipms_id}"
                        : 'https://www.gravatar.com/avatar/?d=mp&s=200',
                    'participants' => $groupParticipants->map(function ($participant) use ($employeesById) {
                        $name = $this->employeeName($employeesById, $participant->ipms_id) ?? $participant->name ?? 'Member';

                        return [
                            'id' => (int) $participant->id,
                            'ipms_id' => (string) ($participant->ipms_id ?? ''),
                            'name' => $name,
                            'avatar' => !empty($participant->ipms_id)
                                ? "/employees/image/{$participant->ipms_id}"
                                : 'https://www.gravatar.com/avatar/?d=mp&s=200',
                        ];
                    })->values(),
                    'last_message' => $latest?->body,
                    'last_message_sender_name' => $latestSenderName,
                    'last_message_attachment_path' => $latest?->attachment_path,
                    'last_message_attachment_type' => $latest?->attachment_type,
                    'last_message_attachment_name' => $latest?->attachment_name,
                    'last_message_at' => $latest?->created_at,
                    'unread_count' => (int) $unreadQuery->count(),
                ];
            })->values();

            return [
                'data' => $data,
                'has_more' => $hasMore,
            ];
        });

        return response()->json($payload);
    }
}
