<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class RaaPolicy
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

        $userRoles = $user->roles->pluck('name')->toArray();

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
            'HRIS_ADC', 'HRIS_DC'            => $q->where('division_id', $user->division),
            'HRIS_Staff'                     => $q->where('emp_id', $user->ipms_id),
            default                          => $q->whereRaw('1=0'),
        };
    }
}
