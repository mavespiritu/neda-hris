<?php

namespace App\Actions\Messenger;

use App\Models\User;
use App\Traits\BuildsEmployeeNameMap;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowMessengerPage
{
    use AsAction, BuildsEmployeeNameMap;

    public function asController(Request $request): Response
    {
        $me = $request->user();

        $users = User::query()
            ->select(['id', 'ipms_id', 'email'])
            ->when($me, fn ($q) => $q->where('id', '!=', $me->id))
            ->get();

        $employeesById = $this->employeeNamesById($users->pluck('ipms_id'), 'mysql3');

        $payload = $users
            ->map(fn ($u) => [
                'id' => (int) $u->id,
                'ipms_id' => (string) $u->ipms_id,
                'name' => $this->employeeName($employeesById, $u->ipms_id) ?? (string) $u->email,
                'email' => (string) ($u->email ?? ''),
            ])
            ->sortBy('name')
            ->values();

        return Inertia::render('Messenger/index', [
            'users' => $payload,
        ]);
    }
}
