<?php

namespace App\Actions\AccessControl;

use App\Actions\AccessControl\Concerns\BuildsAccessControlData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowAccessControlRoles
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

        $roles = $conn->table('roles as r')
            ->leftJoin('model_has_roles as mhr', 'mhr.role_id', '=', 'r.id')
            ->leftJoin('role_has_permissions as rhp', 'rhp.role_id', '=', 'r.id')
            ->select([
                'r.id',
                'r.name',
                'r.guard_name',
                'r.created_at',
                'r.updated_at',
                DB::raw('COUNT(DISTINCT mhr.model_id) as users_count'),
                DB::raw('COUNT(DISTINCT rhp.permission_id) as permissions_count'),
            ])
            ->groupBy('r.id', 'r.name', 'r.guard_name', 'r.created_at', 'r.updated_at')
            ->orderBy('r.name')
            ->get()
            ->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'guard_name' => $role->guard_name,
                    'users_count' => (int) $role->users_count,
                    'permissions_count' => (int) $role->permissions_count,
                    'priority' => $this->rolePriorities()[$role->name] ?? 0,
                    'created_at' => optional($role->created_at)?->format('M d, Y h:i A'),
                    'updated_at' => optional($role->updated_at)?->format('M d, Y h:i A'),
                ];
            });

        return Inertia::render('AccessControl/Roles', [
            'roles' => $roles,
            'role_priorities' => $this->rolePriorities(),
        ]);
    }
}

