<?php

namespace App\Policies;

use Illuminate\Auth\Access\Response;
use Illuminate\Contracts\Auth\Authenticatable;

class PerformancePolicy
{
    public function ipcr(Authenticatable $user): Response
    {
        return method_exists($user, 'hasRole') && $user->hasRole('HRIS_Staff')
            ? Response::allow()
            : Response::deny('Only staff users can access IPCR.');
    }

    public function dpcr(Authenticatable $user): Response
    {
        return method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['HRIS_DC', 'HRIS_ADC'])
            ? Response::allow()
            : Response::deny('Only division chiefs and assistant division chiefs can access DPCR.');
    }

    public function opcr(Authenticatable $user): Response
    {
        return method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['HRIS_DC', 'HRIS_RD', 'HRIS_ARD'])
            ? Response::allow()
            : Response::deny('Only division chiefs, ARD, and RD can access OPCR.');
    }

    public function libraries(Authenticatable $user): Response
    {
        return method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['HRIS_HR', 'HRIS_Administrator'])
            ? Response::allow()
            : Response::deny('Only HR users and administrators can access performance libraries.');
    }
}
