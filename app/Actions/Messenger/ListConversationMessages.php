<?php

namespace App\Actions\Messenger;

use App\Events\ConversationReadReceipt;
use App\Models\Conversation;
use App\Traits\BuildsEmployeeNameMap;
use App\Traits\UsesMessengerRedisCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class ListConversationMessages
{
    use AsAction, BuildsEmployeeNameMap, UsesMessengerRedisCache;

    public function authorize(ActionRequest $request): bool
    {
        $conversation = $request->route('conversation');
        return Gate::forUser($request->user())->allows('view', $conversation);
    }

    public function rules(): array
    {
        return [
            'before_id' => ['nullable', 'integer'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }

    public function asController(ActionRequest $request, Conversation $conversation): JsonResponse
    {
        $beforeId = $request->integer('before_id');
        $limit = max(1, min($request->integer('limit', 20), 50));
        $hiddenState = $conversation->hiddenUsers()
            ->where('users.id', (int) $request->user()->id)
            ->first();
        $deletedAfterMessageId = (int) ($hiddenState?->pivot?->deleted_after_message_id ?? 0);
        $deletedAt = $hiddenState?->pivot?->created_at;
        $version = $this->currentConversationMessagesVersion((int) $conversation->id);
        $cacheKey = "messenger:messages:{$conversation->id}:{$version}:{$limit}:{$deletedAfterMessageId}:" . ($beforeId ?: 'latest');

        $payload = $this->messengerCache()->remember($cacheKey, now()->addSeconds(15), function () use ($conversation, $beforeId, $limit, $deletedAfterMessageId, $deletedAt) {
            $q = $conversation->messages()
                ->with(['sender:id,name,ipms_id', 'replyTo.sender:id,name,ipms_id'])
                ->when($deletedAfterMessageId > 0, fn ($qq) => $qq->where('id', '>', $deletedAfterMessageId))
                ->when($deletedAfterMessageId <= 0 && $deletedAt, fn ($qq) => $qq->where('created_at', '>', $deletedAt))
                ->when($beforeId, fn ($qq) => $qq->where('id', '<', $beforeId))
                ->orderByDesc('id')
                ->limit($limit + 1);

            $rows = $q->get();
            $hasMore = $rows->count() > $limit;
            $rows = $rows->take($limit)->reverse()->values();

            $empIds = $rows
                ->flatMap(function ($m) {
                    return [
                        $m->sender?->ipms_id,
                        $m->replyTo?->sender?->ipms_id,
                    ];
                })
                ->filter()
                ->values();

            $employeesById = $this->employeeNamesById($empIds, 'mysql3');
            $gendersById = $this->employeeGenderById($empIds, 'mysql3');

            $data = $rows->map(fn ($m) => [
                'id' => $m->id,
                'sender_id' => $m->sender_id,
                'sender_name' => $this->employeeName($employeesById, $m->sender?->ipms_id),
                'sender_ipms_id' => $m->sender?->ipms_id,
                'body' => $m->body,
                'attachment_path' => $m->attachment_path,
                'attachment_url' => $m->attachment_path
                    ? Storage::disk('public')->url($m->attachment_path)
                    : null,
                'attachment_name' => $m->attachment_name,
                'attachment_type' => $m->attachment_type,
                'attachment_size' => $m->attachment_size,
                'created_at' => $m->created_at?->toISOString(),
                'sender_gender' => $gendersById[$m->sender?->ipms_id] ?? null,
                'reply_to' => $m->replyTo ? [
                    'id' => $m->replyTo->id,
                    'body' => $m->replyTo->body,
                    'attachment_path' => $m->replyTo->attachment_path,
                    'attachment_url' => $m->replyTo->attachment_path
                        ? Storage::disk('public')->url($m->replyTo->attachment_path)
                        : null,
                    'attachment_name' => $m->replyTo->attachment_name,
                    'attachment_type' => $m->replyTo->attachment_type,
                    'attachment_size' => $m->replyTo->attachment_size,
                    'sender_name' => $this->employeeName($employeesById, $m->replyTo->sender?->ipms_id) ?? $m->replyTo->sender?->name ?? 'User',
                    'sender_gender' => $gendersById[$m->replyTo->sender?->ipms_id] ?? null,
                ] : null,
            ]);

            return [
                'data' => $data,
                'has_more' => $hasMore,
            ];
        });

        $latestVisibleMessageId = $conversation->messages()
            ->when($deletedAfterMessageId > 0, fn ($qq) => $qq->where('id', '>', $deletedAfterMessageId))
            ->when($deletedAfterMessageId <= 0 && $deletedAt, fn ($qq) => $qq->where('created_at', '>', $deletedAt))
            ->max('id');

        if ($latestVisibleMessageId) {
            $readRow = DB::connection('mysql4')->table('conversation_reads')
                ->where('conversation_id', (int) $conversation->id)
                ->where('user_id', (int) $request->user()->id)
                ->first();

            $currentLastReadMessageId = (int) ($readRow?->last_read_message_id ?? 0);

            if (! $readRow || $currentLastReadMessageId < (int) $latestVisibleMessageId) {
                DB::connection('mysql4')->table('conversation_reads')->updateOrInsert(
                    [
                        'conversation_id' => (int) $conversation->id,
                        'user_id' => (int) $request->user()->id,
                    ],
                    [
                        'last_read_message_id' => (int) $latestVisibleMessageId,
                        'last_read_at' => now(),
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );

                broadcast(new ConversationReadReceipt(
                    conversationId: (int) $conversation->id,
                    userId: (int) $request->user()->id,
                    readerName: (string) ($request->user()->name ?? 'User'),
                    lastReadMessageId: (int) $latestVisibleMessageId,
                    lastReadAt: now()->toISOString(),
                ));
            }
        }

        $readReceipts = DB::connection('mysql4')->table('conversation_reads as cr')
            ->join('users', 'users.id', '=', 'cr.user_id')
            ->where('cr.conversation_id', (int) $conversation->id)
            ->select([
                'cr.user_id',
                'cr.last_read_message_id',
                'cr.last_read_at',
                'users.name as reader_name',
                'users.ipms_id as reader_ipms_id',
            ])
            ->get()
            ->map(fn ($row) => [
                'user_id' => (int) $row->user_id,
                'last_read_message_id' => $row->last_read_message_id !== null ? (int) $row->last_read_message_id : null,
                'last_read_at' => $row->last_read_at,
                'reader_name' => $row->reader_name,
                'reader_ipms_id' => $row->reader_ipms_id,
            ])
            ->values()
            ->all();

        $payload['data'] = collect($payload['data'] ?? [])
            ->map(function ($message) use ($readReceipts) {
                $messageId = (int) ($message['id'] ?? 0);

                $seenBy = collect($readReceipts)
                    ->filter(fn ($receipt) => (int) ($receipt['last_read_message_id'] ?? 0) >= $messageId)
                    ->filter(fn ($receipt) => (int) ($receipt['user_id'] ?? 0) !== (int) ($message['sender_id'] ?? 0))
                    ->values()
                    ->all();

                $message['seen_by'] = $seenBy;

                return $message;
            })
            ->values()
            ->all();

        $payload['read_receipts'] = $readReceipts;

        return response()->json($payload);
    }
}
