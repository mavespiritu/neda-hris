<?php

namespace App\Policies;

use Illuminate\Auth\Access\Response;
use Illuminate\Contracts\Auth\Authenticatable;

class PublicationsPolicy
{
    public function list(Authenticatable $user): Response
    {
        return $this->allowHrOnly($user);
    }

    public function create(Authenticatable $user): Response
    {
        return $this->allowHrOnly($user);
    }

    public function edit(Authenticatable $user): Response
    {
        return $this->allowHrOnly($user);
    }

    public function delete(Authenticatable $user): Response
    {
        return $this->allowHrOnly($user);
    }

    protected function allowHrOnly(Authenticatable $user): Response
    {
        return method_exists($user, 'hasRole') && $user->hasRole('HRIS_HR')
            ? Response::allow()
            : Response::deny('Only HR users are allowed to manage publications.');
    }
}

