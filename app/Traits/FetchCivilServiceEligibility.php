<?php

namespace App\Traits;

trait FetchCivilServiceEligibility
{
    protected function fetchApplicantCivilServiceEligibility($conn, $userId, $type)
    {
        return $conn->table('applicant_eligibility')
            ->select(
                'applicant_eligibility.id',
                'applicant_eligibility.eligibility',
                'applicant_eligibility.rating',
                'applicant_eligibility.exam_date',
                'applicant_eligibility.exam_place',
                'applicant_eligibility.license_no',
                'applicant_eligibility.validity_date',
            )
            ->leftJoin('applicant', function ($join) use ($type) {
                $join->on('applicant.id', '=', 'applicant_eligibility.applicant_id')
                    ->where('applicant.type', '=', $type);
            })
            ->where('applicant.user_id', $userId)
            ->get();
    }

    protected function fetchStaffCivilServiceEligibility($conn, $ipmsId)
    {
        return $conn->table('tblemp_civil_service as c')
            ->select([
                'ci.id as id',
                'c.*'
            ])
            ->leftJoin('tblemp_civil_service_id as ci', function ($join) {
                $join->on('ci.emp_id', '=', 'c.emp_id')
                     ->on('ci.eligibility', '=', 'c.eligibility')
                     ->on('ci.exam_date', '=', 'c.exam_date');
            })
            ->where('c.emp_id', $ipmsId)
            ->where('c.approval', 'yes')
            ->get();
    }
}
