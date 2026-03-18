<?php

namespace App\Policies;

use Illuminate\Auth\Access\Response;
use Illuminate\Contracts\Auth\Authenticatable;

class SettingsPolicy
{
    public function viewPage(Authenticatable $user): Response
    {
        return method_exists($user, 'hasRole') && $user->hasRole('HRIS_Staff')
            ? Response::allow()
            : Response::deny('You are not allowed to access settings.');
    }

    public function account(Authenticatable $user): Response
    {
        return $this->viewPage($user);
    }

    public function organization(Authenticatable $user): Response
    {
        return method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['HRIS_HR', 'HRIS_Administrator'])
            ? Response::allow()
            : Response::deny('You are not allowed to manage organization settings.');
    }

    public function recruitment(Authenticatable $user): Response
    {
        return method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['HRIS_HR', 'HRIS_Administrator'])
            ? Response::allow()
            : Response::deny('You are not allowed to manage recruitment settings.');
    }

    public function competencies(Authenticatable $user): Response
    {
        return method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['HRIS_HR', 'HRIS_Administrator'])
            ? Response::allow()
            : Response::deny('You are not allowed to manage competency settings.');
    }

    public function activeCgaSchedules(Authenticatable $user): Response
    {
        return $this->viewPage($user);
    }
}
