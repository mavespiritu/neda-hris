<?php

namespace App\Traits;

trait FetchEducationalBackground
{
    protected function fetchApplicantEducationalBackground($conn, $userId, $type)
    {
        return $conn->table('applicant_education')
            ->select(
                'applicant_education.id',
                'applicant_education.ipms_id',
                'applicant_education.level',
                'applicant_education.course',
                'applicant_education.school',
                'applicant_education.highest_attainment',
                'applicant_education.from_date',
                'applicant_education.to_date',
                'applicant_education.award',
                'applicant_education.year_graduated',
                'applicant_education.is_graduated',
            )
            ->leftJoin('applicant', function ($join) use ($type) {
                $join->on('applicant.id', '=', 'applicant_education.applicant_id')
                    ->where('applicant.type', '=', $type);
            })
            ->where('applicant.user_id', $userId)
            ->get();
    }

    protected function fetchStaffEducationalBackground($conn, $ipmsId, $level)
    {
        return $conn->table('tblemp_educational_attainment')
            ->where('emp_id', $ipmsId)
            ->where('level', $level)
            ->where('approval', 'yes')
            ->get();
    }
}
