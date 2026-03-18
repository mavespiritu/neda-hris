<?php

namespace App\Policies;

use Illuminate\Auth\Access\Response;
use Illuminate\Contracts\Auth\Authenticatable;

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
}
