<?php

namespace App\Actions\Messenger;

use App\Events\ConversationPing;
use App\Models\Conversation;
use App\Models\User;
use App\Support\MessengerConversationToken;
use App\Traits\BuildsEmployeeNameMap;
use App\Traits\UsesMessengerRedisCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class StartConversation
{
    use AsAction, BuildsEmployeeNameMap, UsesMessengerRedisCache;

    public function rules(): array
    {
        $user = new \App\Models\User();
        $table = $user->getTable();
        $connection = $user->getConnectionName();
        $target = $connection ? "{$connection}.{$table}" : $table;

        return [
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => ['integer', Rule::exists($target, 'id')],
            'title' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function asController(ActionRequest $request): JsonResponse
    {
        $me = (int) $request->user()->id;
        $senderName = (string) ($request->user()->name ?? 'You');
        $userIds = collect($request->validated('user_ids', []))
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id !== $me)
            ->unique()
            ->values();

        abort_if($userIds->isEmpty(), 422, 'Select at least one recipient.');

        if ($userIds->count() === 1) {
            return $this->createDirectConversation($me, (int) $userIds->first());
        }

        return $this->createGroupConversation($me, $senderName, $userIds, (string) $request->input('title', ''));
    }

    protected function createDirectConversation(int $me, int $other): JsonResponse
    {
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

    protected function createGroupConversation(int $me, string $senderName, Collection $userIds, string $title = ''): JsonResponse
    {
        $participantIds = $userIds->push($me)->unique()->values();
        $resolvedTitle = trim($title);
        $isCustomTitle = $resolvedTitle !== '';

        if (! $isCustomTitle) {
            $users = User::query()
                ->select(['id', 'ipms_id', 'email'])
                ->whereIn('id', $participantIds->all())
                ->get();

            $employeesById = $this->employeeNamesById($users->pluck('ipms_id'), 'mysql3');
            $names = $users
                ->reject(fn ($u) => (int) $u->id === $me)
                ->map(fn ($u) => $this->employeeName($employeesById, $u->ipms_id) ?? (string) $u->email ?? 'Member')
                ->values();

            $resolvedTitle = $this->buildGroupTitle($names);
        }

        $conversation = DB::transaction(function () use ($participantIds, $resolvedTitle, $isCustomTitle) {
            $c = Conversation::create([
                'type' => 'group',
                'title' => $resolvedTitle !== '' ? $resolvedTitle : null,
                'is_title_custom' => $isCustomTitle,
            ]);

            $c->participants()->sync($participantIds->all());

            return $c;
        });

        $allUserIds = $participantIds->all();
        foreach ($allUserIds as $userId) {
            $this->bumpConversationListVersion((int) $userId);
        }

        $participantSnapshots = User::query()
            ->select(['id', 'ipms_id', 'name'])
            ->whereIn('id', $participantIds->all())
            ->get()
            ->map(fn ($participant) => [
                'id' => (int) $participant->id,
                'ipms_id' => (string) ($participant->ipms_id ?? ''),
                'name' => (string) ($participant->name ?? 'Member'),
                'avatar' => !empty($participant->ipms_id)
                    ? "/employees/image/{$participant->ipms_id}"
                    : 'https://www.gravatar.com/avatar/?d=mp&s=200',
            ])
            ->values()
            ->all();

        foreach ($allUserIds as $userId) {
            broadcast(new ConversationPing(
                recipientUserId: (int) $userId,
                conversationId: (int) $conversation->id,
                conversationToken: MessengerConversationToken::encode((int) $conversation->id),
                conversationType: 'group',
                conversationTitle: $conversation->title ? (string) $conversation->title : null,
                participants: collect($participantSnapshots)
                    ->filter(fn ($participant) => (int) $participant['id'] !== (int) $userId)
                    ->values()
                    ->all(),
                senderId: $me,
                senderName: $senderName,
                senderIpmsId: (string) ($conversation->participants()->where('users.id', $me)->first()?->ipms_id ?? ''),
                message: '',
                createdAt: now()->toISOString()
            ));
        }

        return response()->json([
            'id' => $conversation->id,
            'conversation_token' => MessengerConversationToken::encode((int) $conversation->id),
        ]);
    }

    protected function buildGroupTitle(Collection $names): string
    {
        $clean = $names
            ->filter()
            ->map(fn ($name) => trim((string) $name))
            ->filter()
            ->values();

        if ($clean->isEmpty()) {
            return 'Group Chat';
        }

        if ($clean->count() <= 3) {
            return $clean->implode(', ');
        }

        return $clean->take(2)->implode(', ') . ' + ' . ($clean->count() - 2) . ' others';
    }
}
