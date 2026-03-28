<?php

namespace App\Actions\Messenger;

use App\Models\User;
use App\Support\MessengerConversationToken;
use App\Traits\BuildsEmployeeNameMap;
use App\Traits\UsesMessengerRedisCache;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowMessengerPage
{
    use AsAction, BuildsEmployeeNameMap, UsesMessengerRedisCache;

    public function asController(Request $request): Response
    {
        $me = $request->user();
        $initialConversationId = MessengerConversationToken::decode(
            $request->route('conversationToken') ? (string) $request->route('conversationToken') : null
        );

        if (!$me || blank($me->ipms_id ?? null)) {
            abort(404, 'Page not found');
        }

        $cacheKey = 'messenger:users:' . ($me?->id ?? 'guest');

        $payload = $this->messengerCache()->remember($cacheKey, now()->addMinutes(10), function () use ($me) {
            $users = User::query()
                ->select(['id', 'ipms_id', 'email'])
                ->when($me, fn ($q) => $q->where('id', '!=', $me->id))
                ->get();

            $employeesById = $this->employeeNamesById($users->pluck('ipms_id'), 'mysql3');

            return $users
                ->map(fn ($u) => [
                    'id' => (int) $u->id,
                    'ipms_id' => (string) $u->ipms_id,
                    'name' => $this->employeeName($employeesById, $u->ipms_id) ?? (string) $u->email,
                    'email' => (string) ($u->email ?? ''),
                ])
                ->sortBy('name')
                ->values();
        });

        return Inertia::render('Messenger/index', [
            'users' => $payload,
            'initialConversationId' => $initialConversationId,
        ]);
    }
}
