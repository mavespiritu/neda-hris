<?php

namespace App\Policies;

use Illuminate\Auth\Access\Response;
use Illuminate\Contracts\Auth\Authenticatable;

class GapAnalysisPolicy
{
    public function gapAnalysis(Authenticatable $user): Response
    {
        return method_exists($user, 'hasRole') && $user->hasRole('HRIS_Staff')
            ? Response::allow()
            : Response::deny('Only staff users can access gap analysis.');
    }

    public function submissions(Authenticatable $user): Response
    {
        return method_exists($user, 'hasAnyRole') && $user->hasAnyRole([
            'HRIS_DC',
            'HRIS_ADC',
            'HRIS_HR',
            'HRIS_ARD',
            'HRIS_RD',
        ])
            ? Response::allow()
            : Response::deny('You are not allowed to access competency submissions.');
    }

    public function libraries(Authenticatable $user): Response
    {
        return method_exists($user, 'hasRole') && $user->hasRole('HRIS_HR')
            ? Response::allow()
            : Response::deny('Only HR users can access competency libraries.');
    }
}
