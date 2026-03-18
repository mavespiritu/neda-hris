<?php

namespace App\Services\Applicants;

use Illuminate\Database\ConnectionInterface;

class FamilyBackgroundFormBuilder
{
    public function build(ConnectionInterface $connection, ?int $applicantId = null): array
    {
        $defaults = [
            'isThereSpouse' => false,
            'spouse' => [
                'id' => null,
                'applicant_id' => $applicantId,
                'hasSpouse' => false,
                'last_name' => '',
                'first_name' => '',
                'middle_name' => '',
                'ext_name' => '',
                'occupation' => '',
                'employer_name' => '',
                'business_address' => '',
                'telephone_no' => '',
            ],
            'father' => [
                'id' => null,
                'applicant_id' => $applicantId,
                'last_name' => '',
                'first_name' => '',
                'middle_name' => '',
                'ext_name' => '',
                'birth_date' => '',
            ],
            'mother' => [
                'id' => null,
                'applicant_id' => $applicantId,
                'last_name' => '',
                'first_name' => '',
                'middle_name' => '',
                'maiden_name' => '',
                'birth_date' => '',
            ],
            'children' => [],
        ];

        if ($applicantId === null) {
            return $defaults;
        }

        $spouse = $connection->table('applicant_spouse')
            ->where('applicant_id', $applicantId)
            ->first();
        $father = $connection->table('applicant_father')
            ->where('applicant_id', $applicantId)
            ->first();
        $mother = $connection->table('applicant_mother')
            ->where('applicant_id', $applicantId)
            ->first();
        $children = $connection->table('applicant_child')
            ->where('applicant_id', $applicantId)
            ->get();

        return [
            'isThereSpouse' => (bool) ($spouse->hasSpouse ?? false),
            'spouse' => [
                'id' => $spouse->id ?? null,
                'applicant_id' => $applicantId,
                'hasSpouse' => (bool) ($spouse->hasSpouse ?? false),
                'last_name' => $spouse->last_name ?? '',
                'first_name' => $spouse->first_name ?? '',
                'middle_name' => $spouse->middle_name ?? '',
                'ext_name' => $spouse->ext_name ?? '',
                'occupation' => $spouse->occupation ?? '',
                'employer_name' => $spouse->employer_name ?? '',
                'business_address' => $spouse->business_address ?? '',
                'telephone_no' => $spouse->telephone_no ?? '',
            ],
            'father' => [
                'id' => $father->id ?? null,
                'applicant_id' => $applicantId,
                'last_name' => $father->last_name ?? '',
                'first_name' => $father->first_name ?? '',
                'middle_name' => $father->middle_name ?? '',
                'ext_name' => $father->ext_name ?? '',
                'birth_date' => $father->birth_date ?? '',
            ],
            'mother' => [
                'id' => $mother->id ?? null,
                'applicant_id' => $applicantId,
                'last_name' => $mother->last_name ?? '',
                'first_name' => $mother->first_name ?? '',
                'middle_name' => $mother->middle_name ?? '',
                'maiden_name' => $mother->maiden_name ?? '',
                'birth_date' => $mother->birth_date ?? '',
            ],
            'children' => $children->map(fn ($child) => [
                'id' => $child->id ?? null,
                'applicant_id' => $applicantId,
                'last_name' => $child->last_name ?? '',
                'first_name' => $child->first_name ?? '',
                'middle_name' => $child->middle_name ?? '',
                'ext_name' => $child->ext_name ?? '',
                'birth_date' => $child->birth_date ?? '',
            ])->toArray(),
        ];
    }
}
