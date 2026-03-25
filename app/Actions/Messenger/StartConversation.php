<?php

namespace App\Actions\Messenger;

use App\Models\Conversation;
use App\Models\User;
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
        $userIds = collect($request->validated('user_ids', []))
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id !== $me)
            ->unique()
            ->values();

        abort_if($userIds->isEmpty(), 422, 'Select at least one recipient.');

        if ($userIds->count() === 1) {
            return $this->createDirectConversation($me, (int) $userIds->first());
        }

        return $this->createGroupConversation($me, $userIds, (string) $request->input('title', ''));
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

        return response()->json(['id' => $conversation->id]);
    }

    protected function createGroupConversation(int $me, Collection $userIds, string $title = ''): JsonResponse
    {
        $participantIds = $userIds->push($me)->unique()->values();
        $resolvedTitle = trim($title);

        if ($resolvedTitle === '') {
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

        $conversation = DB::transaction(function () use ($participantIds, $resolvedTitle) {
            $c = Conversation::create([
                'type' => 'group',
                'title' => $resolvedTitle !== '' ? $resolvedTitle : null,
            ]);

            $c->participants()->sync($participantIds->all());

            return $c;
        });

        $allUserIds = $participantIds->all();
        foreach ($allUserIds as $userId) {
            $this->bumpConversationListVersion((int) $userId);
        }

        return response()->json(['id' => $conversation->id]);
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
