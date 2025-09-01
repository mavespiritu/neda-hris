<?php

namespace App\Traits;

trait FetchPersonalInformation
{
    protected function fetchApplicantPersonalInfo($conn, $userId, $type)
    {
        return $conn->table('applicant')
            ->where('type', $type)
            ->where('user_id', $userId)
            ->first();
    }

    protected function fetchStaffPersonalInfo($conn, $ipmsId)
    {
        $personal = $conn->table('tblemployee')->where('emp_id', $ipmsId)->first();
        $permanent = $conn->table('tblemp_address')->where('emp_id', $ipmsId)->where('type', 'permanent')->first();
        $residential = $conn->table('tblemp_address')->where('emp_id', $ipmsId)->where('type', 'residential')->first();

        return [
            'personal' => $personal,
            'permanent' => $permanent,
            'residential' => $residential
        ];
    }
}
