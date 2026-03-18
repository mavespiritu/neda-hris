<?php

namespace App\Services\Profile;

use App\Traits\FetchCivilServiceEligibility;
use Carbon\Carbon;

class CivilServiceEligibilityTableBuilder
{
    use FetchCivilServiceEligibility;

    public function build(array $context): array
    {
        $user = $context['user'];
        $appConn = $context['appConn'];
        $staffConn = $context['staffConn'];

        $rows = [];

        $applicantData = $this->fetchApplicantCivilServiceEligibility(
            $appConn,
            $user->id,
            $user->ipms_id ? 'Staff' : 'Applicant'
        );

        if ($applicantData->isNotEmpty()) {
            foreach ($applicantData as $eligibility) {
                $rows[] = [
                    'id' => $eligibility->id ?? null,
                    'eligibility' => $eligibility->eligibility ?? '',
                    'rating' => $eligibility->rating ?? '',
                    'exam_date' => $this->formatDate($eligibility->exam_date ?? null),
                    'exam_place' => $eligibility->exam_place ?? '',
                    'license_no' => $eligibility->license_no ?? '',
                    'validity_date' => $this->formatDate($eligibility->validity_date ?? null),
                ];
            }
        } elseif ($user->ipms_id) {
            $staffData = $this->fetchStaffCivilServiceEligibility($staffConn, $user->ipms_id);

            if ($staffData->isNotEmpty()) {
                foreach ($staffData as $eligibility) {
                    $rows[] = [
                        'id' => null,
                        'eligibility' => $eligibility->eligibility ?? '',
                        'rating' => $eligibility->rating ?? '',
                        'exam_date' => $this->formatDate($eligibility->exam_date ?? null),
                        'exam_place' => $eligibility->exam_place ?? '',
                        'license_no' => $eligibility->license_number ?? '',
                        'validity_date' => $this->formatDate($eligibility->release_date ?? null),
                    ];
                }
            }
        }

        return $rows;
    }

    protected function formatDate($value): string
    {
        if (empty($value)) {
            return '';
        }

        try {
            return Carbon::parse($value)->format('m/d/Y');
        } catch (\Throwable $e) {
            return (string) $value;
        }
    }
}
