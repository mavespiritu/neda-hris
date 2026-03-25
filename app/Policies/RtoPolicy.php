<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class RtoPolicy
{
    /**
     * Create a new policy instance.
     */
    public function __construct()
    {
        //
    }

    public function visibleEmployeeIds(User $user)
    {
        $conn3 = DB::connection('mysql3');

        $rolePriorities = config('roles.priorities', []);

        $userDivision = $user->division ?: $conn3->table('tblemployee')
            ->where('emp_id', $user->ipms_id)
            ->value('division_id');

        $userRoles = method_exists($user, 'getAllRolesRecursive')
            ? $user->getAllRolesRecursive()->pluck('name')->toArray()
            : $user->roles->pluck('name')->toArray();

        $highestRole = collect($userRoles)
            ->mapWithKeys(fn ($role) => [$role => $rolePriorities[$role] ?? 0])
            ->sortDesc()
            ->keys()
            ->first();

        $q = $conn3->table('tblemployee')
            ->select('emp_id')
            ->where('work_status', 'active');

        return match ($highestRole) {
            'HRIS_RD', 'HRIS_ARD', 'HRIS_HR' => $q,
            'HRIS_ADC', 'HRIS_DC'            => $q->where('division_id', $userDivision),
            'HRIS_Staff'                     => $q->where('emp_id', $user->ipms_id),
            default                          => $q->whereRaw('1=0'),
        };
    }
}


