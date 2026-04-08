<?php

namespace App\Actions\AccessControl;

use App\Actions\AccessControl\Concerns\BuildsAccessControlData;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowAccessControlUsers
{
    use AsAction;
    use BuildsAccessControlData;

    public function authorize(Request $request): bool
    {
        return $this->canAccess($request);
    }

    public function asController(Request $request): Response
    {
        $users = User::query()
            ->select(['id', 'name', 'email', 'ipms_id', 'created_at', 'updated_at'])
            ->with(['roles:id,name'])
            ->orderBy('name')
            ->get()
            ->map(function (User $user) {
                $roles = $user->roles->pluck('name')->values()->all();

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'ipms_id' => $user->ipms_id,
                    'roles' => $this->rankedRoles($roles),
                    'primary_role' => $this->rankedRoles($roles)[0] ?? null,
                    'created_at' => optional($user->created_at)?->format('M d, Y h:i A'),
                    'updated_at' => optional($user->updated_at)?->format('M d, Y h:i A'),
                ];
            });

        return Inertia::render('AccessControl/Users', [
            'users' => $users,
            'role_priorities' => $this->rolePriorities(),
        ]);
    }
}

