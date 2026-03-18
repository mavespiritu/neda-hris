<?php

namespace App\Policies;

use Illuminate\Auth\Access\Response;
use Illuminate\Contracts\Auth\Authenticatable;

class FlexiplaceReportsPolicy
{
    protected function allowReportUsers(Authenticatable $user): Response
    {
        return method_exists($user, 'hasAnyRole') && $user->hasAnyRole([
            'HRIS_HR',
            'HRIS_Administrator',
        ])
            ? Response::allow()
            : Response::deny('You are not allowed to access flexiplace reports.');
    }

    public function show(Authenticatable $user): Response
    {
        return $this->allowReportUsers($user);
    }

    public function export(Authenticatable $user): Response
    {
        return $this->allowReportUsers($user);
    }
}
