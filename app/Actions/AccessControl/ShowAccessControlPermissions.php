<?php

namespace App\Actions\AccessControl;

use App\Actions\AccessControl\Concerns\BuildsAccessControlData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowAccessControlPermissions
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

        $permissions = $conn->table('permissions as p')
            ->leftJoin('role_has_permissions as rhp', 'rhp.permission_id', '=', 'p.id')
            ->leftJoin('model_has_permissions as mhp', 'mhp.permission_id', '=', 'p.id')
            ->select([
                'p.id',
                'p.name',
                'p.guard_name',
                'p.created_at',
                'p.updated_at',
                DB::raw('COUNT(DISTINCT rhp.role_id) as roles_count'),
                DB::raw('COUNT(DISTINCT mhp.model_id) as direct_users_count'),
            ])
            ->groupBy('p.id', 'p.name', 'p.guard_name', 'p.created_at', 'p.updated_at')
            ->orderBy('p.name')
            ->get()
            ->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                    'guard_name' => $permission->guard_name,
                    'roles_count' => (int) $permission->roles_count,
                    'direct_users_count' => (int) $permission->direct_users_count,
                    'created_at' => optional($permission->created_at)?->format('M d, Y h:i A'),
                    'updated_at' => optional($permission->updated_at)?->format('M d, Y h:i A'),
                ];
            });

        return Inertia::render('AccessControl/Permissions', [
            'permissions' => $permissions,
        ]);
    }
}

