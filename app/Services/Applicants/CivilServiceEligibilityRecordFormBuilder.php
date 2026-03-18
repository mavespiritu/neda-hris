<?php

namespace App\Services\Applicants;

use Illuminate\Database\ConnectionInterface;

class CivilServiceEligibilityRecordFormBuilder
{
    public function build(ConnectionInterface $connection, int $applicantId, ?int $id = null): array
    {
        if ($id === null) {
            return $this->defaults();
        }

        $record = $connection->table('applicant_eligibility')
            ->where('applicant_id', $applicantId)
            ->where('id', $id)
            ->first();

        abort_unless($record, 404);

        return [
            'id' => $record->id,
            'eligibility' => $record->eligibility ?? '',
            'rating' => $record->rating ?? '',
            'exam_date' => $record->exam_date ?? null,
            'exam_place' => $record->exam_place ?? '',
            'license_no' => $record->license_no ?? '',
            'validity_date' => $record->validity_date ?? null,
        ];
    }

    protected function defaults(): array
    {
        return [
            'id' => null,
            'eligibility' => '',
            'rating' => '',
            'exam_date' => null,
            'exam_place' => '',
            'license_no' => '',
            'validity_date' => null,
        ];
    }
}
