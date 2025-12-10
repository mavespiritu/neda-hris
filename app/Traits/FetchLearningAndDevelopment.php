<?php

namespace App\Traits;

trait FetchLearningAndDevelopment
{
    protected function fetchApplicantLearningAndDevelopment($conn, $userId, $type)
    {
        return $conn->table('applicant_learning')
            ->select(
                'applicant_learning.id',
                'applicant_learning.seminar_title',
                'applicant_learning.from_date',
                'applicant_learning.to_date',
                'applicant_learning.hours',
                'applicant_learning.participation',
                'applicant_learning.type',
                'applicant_learning.conducted_by',
            )
            ->leftJoin('applicant', function ($join) use ($type) {
                $join->on('applicant.id', '=', 'applicant_learning.applicant_id')
                    ->where('applicant.type', '=', $type);
            })
            ->where('applicant.user_id', $userId)
            ->orderBy('from_date', 'desc')
            ->get();
    }

    protected function fetchStaffLearningAndDevelopment($conn, $ipmsId)
    {
        return $conn->table('tblemp_training_program as e')
            ->select([
                'e.*'
            ])
            ->where('e.emp_id', $ipmsId)
            ->where('e.approval', 'yes')
            ->orderBy('e.from_date', 'desc')
            ->get();
    }
}
