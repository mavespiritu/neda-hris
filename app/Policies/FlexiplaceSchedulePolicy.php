<?php

namespace App\Policies;

use Illuminate\Auth\Access\Response;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\DB;

class FlexiplaceSchedulePolicy
{
    protected function allowScheduleUsers(Authenticatable $user): Response
    {
        return method_exists($user, 'hasAnyRole') && $user->hasAnyRole([
            'HRIS_HR',
            'HRIS_DC',
            'HRIS_ADC',
            'HRIS_Staff',
        ])
            ? Response::allow()
            : Response::deny('You are not allowed to manage flexiplace schedules.');
    }

    public function list(Authenticatable $user): Response
    {
        return $this->allowScheduleUsers($user);
    }

    public function store(Authenticatable $user): Response
    {
        return $this->allowScheduleUsers($user);
    }

    public function bulkStore(Authenticatable $user): Response
    {
        return $this->allowScheduleUsers($user);
    }

    public function visibleEmployeeIds(Authenticatable $user)
    {
        $conn3 = DB::connection('mysql3');

        $q = $conn3->table('tblemployee')
            ->select('emp_id')
            ->where('work_status', 'active');

        $userDivision = $user->division ?: $conn3->table('tblemployee')
            ->where('emp_id', $user->ipms_id)
            ->value('division_id');

        if ($user->hasAnyRole(['HRIS_HR'])) {
            return $q;
        }

        if ($user->hasAnyRole(['HRIS_DC', 'HRIS_ADC'])) {
            return $q->where('division_id', $userDivision);
        }

        if ($user->hasAnyRole(['HRIS_Staff'])) {
            return $q->where('emp_id', $user->ipms_id);
        }

        return $q->whereRaw('1=0');
    }
}

