<?php

namespace App\Policies;

use Illuminate\Auth\Access\Response;
use Illuminate\Contracts\Auth\Authenticatable;

class FlexiplaceDtrPolicy
{
    protected function allowStaffOnly(Authenticatable $user): Response
    {
        return method_exists($user, 'hasRole') && $user->hasRole('HRIS_Staff')
            ? Response::allow()
            : Response::deny('You are not allowed to access the flexiplace DTR.');
    }

    public function show(Authenticatable $user): Response
    {
        return $this->allowStaffOnly($user);
    }

    public function store(Authenticatable $user): Response
    {
        return $this->allowStaffOnly($user);
    }
}
