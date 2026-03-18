<?php

namespace App\Services\Profile;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ProfileContextResolver
{
    public function resolve(): array
    {
        $user = Auth::user();

        if (! $user) {
            throw new RuntimeException('Unauthenticated user.');
        }

        $type = $user->ipms_id ? 'Staff' : 'Applicant';
        $appConn = DB::connection('mysql');
        $staffConn = DB::connection('mysql3');

        $applicant = $appConn->table('applicant')
            ->where('user_id', $user->id)
            ->where('type', $type)
            ->first();

        return [
            'user' => $user,
            'type' => $type,
            'isStaff' => (bool) $user->ipms_id,
            'appConn' => $appConn,
            'staffConn' => $staffConn,
            'applicant' => $applicant,
        ];
    }
}
