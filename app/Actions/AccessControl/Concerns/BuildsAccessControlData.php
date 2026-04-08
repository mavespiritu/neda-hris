<?php

namespace App\Actions\AccessControl\Concerns;

use App\Models\User;
use Illuminate\Database\Connection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

trait BuildsAccessControlData
{
    protected function allowedRoles(): array
    {
        return ['SSO_Administrator'];
    }

    protected function canAccess(Request $request): bool
    {
        $user = $request->user();
        $directRoles = $user?->getRoleNames()->values()->all() ?? [];

        return $user !== null
            && collect($directRoles)->intersect($this->allowedRoles())->isNotEmpty();
    }

    protected function sso(): Connection
    {
        return DB::connection('mysql4');
    }

    protected function rolePriorities(): array
    {
        return config('roles.priorities', []);
    }

    protected function rankedRoles(array $roles): array
    {
        $priorities = $this->rolePriorities();

        return collect($roles)
            ->sortByDesc(fn ($role) => $priorities[$role] ?? 0)
            ->values()
            ->all();
    }

    protected function currentUserPayload(): array
    {
        $user = auth()->user();
        $directRoles = $user?->getRoleNames()->values()->all() ?? [];
        $effectiveRoles = $user?->getAllRolesRecursive()->pluck('name')->values()->all() ?? [];

        return [
            'id' => $user?->id,
            'name' => $user?->name,
            'email' => $user?->email,
            'ipms_id' => $user?->ipms_id,
            'direct_roles' => $this->rankedRoles($directRoles),
            'effective_roles' => $this->rankedRoles($effectiveRoles),
            'recommended_role' => collect($directRoles)
                ->sortByDesc(fn ($role) => $this->rolePriorities()[$role] ?? 0)
                ->values()
                ->first(),
        ];
    }

    protected function pageRegistry(): array
    {
        return [
            [
                'module' => 'Performance',
                'page' => 'RTO / RAA / OPCR',
                'route' => '/rto, /raa, /opcrs',
                'description' => 'Performance forms and review workflows.',
                'default_access' => 'Staff + elevated roles',
            ],
            [
                'module' => 'Competencies',
                'page' => 'My CGA / Review CGA',
                'route' => '/cga, /cga/review',
                'description' => 'Competency gap analysis and submissions.',
                'default_access' => 'Staff + HR review roles',
            ],
            [
                'module' => 'DTR',
                'page' => 'RTO / RAA',
                'route' => '/rto, /raa',
                'description' => 'Flexiplace target outputs and accomplishments.',
                'default_access' => 'Staff + HR hierarchy',
            ],
            [
                'module' => 'Vacancies',
                'page' => 'Applicants / Assessment',
                'route' => '/vacancies, /applications',
                'description' => 'Recruitment and applicant evaluation.',
                'default_access' => 'HR only',
            ],
            [
                'module' => 'Access Control',
                'page' => 'User / Role / Permission Management',
                'route' => '/access-control/*',
                'description' => 'Administrative RBAC management pages.',
                'default_access' => 'Admin roles only',
            ],
        ];
    }
}
