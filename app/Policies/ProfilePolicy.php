<?php

namespace App\Policies;

use Illuminate\Auth\Access\Response;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\DB;

class ProfilePolicy
{
    public function view(Authenticatable $user, ?int $applicantId = null): Response
    {
        if (method_exists($user, 'hasRole') && $user->hasRole('HRIS_HR')) {
            return Response::allow();
        }

        if (empty($applicantId)) {
            return Response::allow();
        }

        $ownsApplicant = DB::connection('mysql')
            ->table('applicant')
            ->where('id', $applicantId)
            ->where('user_id', $user->id)
            ->exists();

        return $ownsApplicant
            ? Response::allow()
            : Response::deny();
    }
}
