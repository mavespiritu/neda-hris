<?php

namespace App\Services\Applicants;

use Illuminate\Database\ConnectionInterface;

class CivilServiceEligibilityFormBuilder
{
    public function build(ConnectionInterface $connection, ?int $applicantId = null): array
    {
        if ($applicantId === null) {
            return [];
        }

        return $connection->table('applicant_eligibility')
            ->where('applicant_id', $applicantId)
            ->orderByDesc('exam_date')
            ->orderByDesc('id')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id ?? null,
                'applicant_id' => $applicantId,
                'eligibility' => $item->eligibility ?? '',
                'rating' => $item->rating ?? '',
                'exam_date' => $item->exam_date ?? '',
                'exam_place' => $item->exam_place ?? '',
                'license_no' => $item->license_no ?? '',
                'validity_date' => $item->validity_date ?? '',
            ])
            ->toArray();
    }
}
