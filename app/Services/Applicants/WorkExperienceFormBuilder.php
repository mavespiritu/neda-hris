<?php

namespace App\Services\Applicants;

use Illuminate\Database\ConnectionInterface;

class WorkExperienceFormBuilder
{
    public function build(ConnectionInterface $connection, ?int $applicantId = null): array
    {
        if ($applicantId === null) {
            return [];
        }

        return $connection->table('applicant_work_experience')
            ->where('applicant_id', $applicantId)
            ->orderByDesc('from_date')
            ->orderByDesc('id')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id ?? null,
                'applicant_id' => $applicantId,
                'agency' => $item->agency ?? '',
                'position' => $item->position ?? '',
                'appointment' => $item->appointment ?? '',
                'grade' => $item->grade ?? '',
                'step' => $item->step ?? '',
                'monthly_salary' => $item->monthly_salary ?? '',
                'from_date' => $item->from_date ?? '',
                'to_date' => $item->to_date ?? '',
                'isGovtService' => (bool) ($item->isGovtService ?? false),
                'isPresent' => (bool) ($item->isPresent ?? false),
            ])
            ->toArray();
    }
}
