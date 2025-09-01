<?php

namespace App\Traits;

trait FetchWorkExperience
{
    protected function fetchApplicantWorkExperience($conn, $userId, $type)
    {
        return $conn->table('applicant_work_experience')
            ->select(
                'applicant_work_experience.id',
                'applicant_work_experience.agency',
                'applicant_work_experience.position',
                'applicant_work_experience.appointment',
                'applicant_work_experience.grade',
                'applicant_work_experience.step',
                'applicant_work_experience.monthly_salary',
                'applicant_work_experience.from_date',
                'applicant_work_experience.to_date',
                'applicant_work_experience.isGovtService',
                'applicant_work_experience.isPresent',
            )
            ->leftJoin('applicant', function ($join) use ($type) {
                $join->on('applicant.id', '=', 'applicant_work_experience.applicant_id')
                    ->where('applicant.type', '=', $type);
            })
            ->where('applicant.user_id', $userId)
            ->orderBy('from_date', 'desc')
            ->get();
    }

    protected function fetchStaffWorkExperience($conn, $ipmsId)
    {
        return $conn->table('tblemp_work_experience')
            ->where('emp_id', $ipmsId)
            ->orderBy('date_start', 'desc')
            ->get();
    }
}
