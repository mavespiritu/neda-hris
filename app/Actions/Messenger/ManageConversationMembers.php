<?php

namespace App\Actions\Messenger;

use App\Events\ConversationMembersUpdated;
use App\Models\Conversation;
use App\Models\User;
use App\Support\MessengerConversationToken;
use App\Traits\BuildsEmployeeNameMap;
use App\Traits\UsesMessengerRedisCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class ManageConversationMembers
{
    use AsAction, BuildsEmployeeNameMap, UsesMessengerRedisCache;

    public function authorize(ActionRequest $request): bool
    {
        $conversation = $request->route('conversation');
        if (! $conversation instanceof Conversation) {
            $conversation = Conversation::query()->find($conversation);
        }

        if (! $conversation) {
            return false;
        }

        $action = (string) $request->input('action', 'add');

        if ($action === 'leave') {
            return Gate::forUser($request->user())->allows('leave', $conversation);
        }

        return Gate::forUser($request->user())->allows('manageMembers', $conversation);
    }

    public function rules(): array
    {
        $user = new User();
        $table = $user->getTable();
        $connection = $user->getConnectionName();
        $target = $connection ? "{$connection}.{$table}" : $table;

        return [
            'action' => ['required', Rule::in(['add', 'remove', 'leave'])],
            'user_ids' => ['nullable', 'array', 'min:1', 'required_if:action,add,remove'],
            'user_ids.*' => ['integer', Rule::exists($target, 'id')],
        ];
    }

    protected function buildParticipantSnapshots(Collection $participants, int $recipientUserId, Collection $employeesById): array
    {
        return $participants
            ->filter(fn ($participant) => (int) $participant->id !== $recipientUserId)
            ->map(fn ($participant) => $this->buildMemberSnapshot($participant, $employeesById))
            ->values()
            ->all();
    }

    protected function buildMemberSnapshot(object $participant, Collection $employeesById): array
    {
        $employeeName = $this->employeeName($employeesById, $participant->ipms_id);
        $fallbackName = (string) ($participant->name ?? $participant->email ?? 'Member');

        return [
            'id' => (int) $participant->id,
            'ipms_id' => (string) ($participant->ipms_id ?? ''),
            'name' => $employeeName ?: $fallbackName,
            'avatar' => ! empty($participant->ipms_id)
                ? "/employees/image/{$participant->ipms_id}"
                : 'https://www.gravatar.com/avatar/?d=mp&s=200',
        ];
    }

    protected function buildAutoGroupTitle(Collection $participants, Collection $employeesById): string
    {
        $names = $participants
            ->map(fn ($participant) => $this->employeeName($employeesById, $participant->ipms_id) ?: (string) ($participant->name ?? $participant->email ?? 'Member'))
            ->filter()
            ->map(fn ($name) => trim((string) $name))
            ->filter()
            ->values();

        if ($names->isEmpty()) {
            return 'Group Chat';
        }

        if ($names->count() <= 3) {
            return $names->implode(', ');
        }

        return $names->take(2)->implode(', ') . ' + ' . ($names->count() - 2) . ' others';
    }

    public function asController(ActionRequest $request, Conversation $conversation): JsonResponse
    {
        $validated = $request->validated();
        $action = (string) $validated['action'];
        $actorId = (int) $request->user()->id;
        $actorName = (string) ($request->user()->name ?? 'User');
        $targetIds = collect($validated['user_ids'] ?? [])
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0 && $id !== $actorId)
            ->unique()
            ->values();

        $result = DB::connection('mysql4')->transaction(function () use ($conversation, $action, $actorId, $actorName, $targetIds) {
            $existingParticipantIds = $conversation->participants()
                ->pluck('users.id')
                ->map(fn ($id) => (int) $id)
                ->values();

            $addedUserIds = collect();
            $removedUserIds = collect();

            if ($action === 'add') {
                $toAdd = $targetIds
                    ->diff($existingParticipantIds)
                    ->values();

                if ($toAdd->isNotEmpty()) {
                    $conversation->participants()->syncWithoutDetaching($toAdd->all());
                    $addedUserIds = $toAdd;
                }
            } elseif ($action === 'remove') {
                $toRemove = $targetIds
                    ->intersect($existingParticipantIds)
                    ->values();

                if ($toRemove->isNotEmpty()) {
                    $conversation->participants()->detach($toRemove->all());
                    $removedUserIds = $toRemove;
                }
            } else {
                $conversation->participants()->detach([$actorId]);
                $removedUserIds = collect([$actorId]);
            }

            $deleted = false;

            if ($action === 'leave' && $conversation->participants()->count() === 0) {
                $conversation->delete();
                $deleted = true;
            }

            $participants = $deleted
                ? collect()
                : $conversation->participants()
                    ->select(['users.id', 'users.ipms_id', 'users.name', 'users.email'])
                    ->get();

            $employeesById = $this->employeeNamesById(
                $participants->pluck('ipms_id')->filter()->values(),
                'mysql3'
            );

            $memberSnapshots = $participants
                ->map(fn ($participant) => $this->buildMemberSnapshot($participant, $employeesById))
                ->values()
                ->all();

            if (! $deleted && ! $conversation->is_title_custom) {
                $conversation->forceFill([
                    'title' => $this->buildAutoGroupTitle($participants, $employeesById),
                ])->save();
            }

            if (! $deleted) {
                $conversation->touch();
                $conversation->refresh();
            }

            $recipientIds = collect([
                $actorId,
                ...$addedUserIds->all(),
                ...$removedUserIds->all(),
                ...$participants->pluck('id')->map(fn ($id) => (int) $id)->all(),
            ])
                ->map(fn ($id) => (int) $id)
                ->filter(fn ($id) => $id > 0)
                ->unique()
                ->values();

            $recipientPayloads = $recipientIds->mapWithKeys(function ($recipientId) use ($conversation, $actorId, $actorName, $action, $deleted, $addedUserIds, $removedUserIds, $participants, $employeesById) {
                return [
                    $recipientId => [
                        'recipient_user_id' => $recipientId,
                        'conversation_id' => (int) $conversation->id,
                        'conversation_token' => MessengerConversationToken::encode((int) $conversation->id),
                        'conversation_type' => (string) $conversation->type,
                        'conversation_title' => $conversation->title ? (string) $conversation->title : null,
                        'conversation_updated_at' => $conversation->updated_at?->toISOString(),
                        'participants' => $this->buildParticipantSnapshots($participants, $recipientId, $employeesById),
                        'actor_id' => $actorId,
                        'actor_name' => $actorName,
                        'action' => $action,
                        'removed_user_ids' => $removedUserIds->all(),
                        'added_user_ids' => $addedUserIds->all(),
                        'deleted' => $deleted,
                    ],
                ];
            })->all();

            return [
                'conversation_id' => (int) $conversation->id,
                'conversation_token' => MessengerConversationToken::encode((int) $conversation->id),
                'conversation_type' => (string) $conversation->type,
                'conversation_title' => $conversation->title ? (string) $conversation->title : null,
                'conversation_updated_at' => $conversation->updated_at?->toISOString(),
                'participants' => $memberSnapshots,
                'recipient_payloads' => $recipientPayloads,
                'added_user_ids' => $addedUserIds->values()->all(),
                'removed_user_ids' => $removedUserIds->values()->all(),
                'deleted' => $deleted,
                'affected_user_ids' => $recipientIds->all(),
            ];
        });

        $recipientPayloads = $result['recipient_payloads'];
        $addedUserIds = collect($result['added_user_ids']);
        $removedUserIds = collect($result['removed_user_ids']);

        $affectedUserIds = collect($result['affected_user_ids'])
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values();

        foreach ($affectedUserIds as $userId) {
            $this->bumpConversationListVersion((int) $userId);
        }

        foreach ($recipientPayloads as $payload) {
            broadcast(new ConversationMembersUpdated(
                recipientUserId: (int) $payload['recipient_user_id'],
                conversationId: (int) $payload['conversation_id'],
                conversationToken: $payload['conversation_token'],
                conversationType: $payload['conversation_type'],
                conversationTitle: $payload['conversation_title'],
                participants: $payload['participants'],
                conversationUpdatedAt: $payload['conversation_updated_at'],
                actorId: (int) $payload['actor_id'],
                actorName: (string) $payload['actor_name'],
                action: (string) $payload['action'],
                removedUserIds: $removedUserIds->all(),
                addedUserIds: $addedUserIds->all(),
                deleted: (bool) $payload['deleted'],
            ));
        }

        return response()->json([
            'ok' => true,
            'conversation_id' => (int) $result['conversation_id'],
            'conversation_token' => $result['conversation_token'],
            'conversation_type' => $result['conversation_type'],
            'conversation_title' => $result['conversation_title'],
            'conversation_updated_at' => $result['conversation_updated_at'],
            'participants' => $result['participants'],
            'deleted' => (bool) $result['deleted'],
            'added_user_ids' => $addedUserIds->all(),
            'removed_user_ids' => $removedUserIds->all(),
        ]);
    }
}
