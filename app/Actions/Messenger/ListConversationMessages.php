<?php

namespace App\Actions\Messenger;

use App\Models\Conversation;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use App\Traits\BuildsEmployeeNameMap;

class ListConversationMessages
{
    use AsAction, BuildsEmployeeNameMap;

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
        $limit = $request->integer('limit', 20);

        $q = $conversation->messages()
            ->with(['sender:id,name,ipms_id', 'replyTo.sender:id,name,ipms_id'])
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
            'created_at' => $m->created_at?->toISOString(),
            'sender_gender' => $gendersById[$m->sender?->ipms_id] ?? null,
            'reply_to' => $m->replyTo ? [
                'id' => $m->replyTo->id,
                'body' => $m->replyTo->body,
                'sender_name' => $this->employeeName($employeesById, $m->replyTo->sender?->ipms_id) ?? $m->replyTo->sender?->name ?? 'User',
                'sender_gender' => $gendersById[$m->replyTo->sender?->ipms_id] ?? null,
            ] : null,
        ]);

        return response()->json([
            'data' => $data,
            'has_more' => $hasMore,
        ]);
    }
}
