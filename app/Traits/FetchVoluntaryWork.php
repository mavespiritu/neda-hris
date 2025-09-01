<?php

namespace App\Traits;

trait FetchVoluntaryWork
{
    protected function fetchApplicantVoluntaryWork($conn, $userId, $type)
    {
        return $conn->table('applicant_voluntary_work')
            ->select(
                'applicant_voluntary_work.id',
                'applicant_voluntary_work.org_name',
                'applicant_voluntary_work.org_address',
                'applicant_voluntary_work.from_date',
                'applicant_voluntary_work.to_date',
                'applicant_voluntary_work.hours',
                'applicant_voluntary_work.nature_of_work',
                'applicant_voluntary_work.isPresent',
            )
            ->leftJoin('applicant', function ($join) use ($type) {
                $join->on('applicant.id', '=', 'applicant_voluntary_work.applicant_id')
                    ->where('applicant.type', '=', $type);
            })
            ->where('applicant.user_id', $userId)
            ->orderBy('from_date', 'desc')
            ->get();
    }

    protected function fetchStaffVoluntaryWork($conn, $ipmsId)
    {
        return $conn->table('tblemp_voluntary_work')
            ->where('emp_id', $ipmsId)
            ->where('approval', 'yes')
            ->orderBy('from_date', 'desc')
            ->get();
    }
}
