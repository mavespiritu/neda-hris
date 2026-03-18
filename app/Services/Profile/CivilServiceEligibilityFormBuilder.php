<?php

namespace App\Services\Profile;

class CivilServiceEligibilityFormBuilder
{
    public function build(array $context, ?int $id = null): array
    {
        if ($id === null) {
            return $this->defaults();
        }

        $user = $context['user'];
        $type = $context['type'];
        $conn = $context['appConn'];

        $record = $conn->table('applicant_eligibility')
            ->select(
                'applicant_eligibility.id',
                'applicant_eligibility.eligibility',
                'applicant_eligibility.rating',
                'applicant_eligibility.exam_date',
                'applicant_eligibility.exam_place',
                'applicant_eligibility.license_no',
                'applicant_eligibility.validity_date'
            )
            ->join('applicant', function ($join) use ($user, $type) {
                $join->on('applicant.id', '=', 'applicant_eligibility.applicant_id')
                    ->where('applicant.user_id', '=', $user->id)
                    ->where('applicant.type', '=', $type);
            })
            ->where('applicant_eligibility.id', $id)
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
