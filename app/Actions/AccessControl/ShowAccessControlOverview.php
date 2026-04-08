<?php

namespace App\Actions\AccessControl;

use App\Actions\AccessControl\Concerns\BuildsAccessControlData;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowAccessControlOverview
{
    use AsAction;
    use BuildsAccessControlData;

    public function authorize(Request $request): bool
    {
        return $this->canAccess($request);
    }

    public function asController(Request $request): Response
    {
        $conn = $this->sso();

        $summary = [
            'users' => $conn->table('users')->count(),
            'roles' => $conn->table('roles')->count(),
            'permissions' => $conn->table('permissions')->count(),
            'pages' => count($this->pageRegistry()),
        ];

        return Inertia::render('AccessControl/Index', [
            'summary' => $summary,
            'role_priorities' => $this->rolePriorities(),
            'current_user' => $this->currentUserPayload(),
            'sections' => [
                ['label' => 'User Management', 'route' => route('access-control.users')],
                ['label' => 'Role Management', 'route' => route('access-control.roles')],
                ['label' => 'Permission Management', 'route' => route('access-control.permissions')],
                ['label' => 'Page Management', 'route' => route('access-control.pages')],
                ['label' => 'Active Role / Scope', 'route' => route('access-control.scope')],
            ],
        ]);
    }
}
