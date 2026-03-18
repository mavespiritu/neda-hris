<?php

namespace App\Services\Profile;

use App\Traits\FetchWorkExperience;
use Carbon\Carbon;

class WorkExperienceTableBuilder
{
    use FetchWorkExperience;

    public function build(array $context): array
    {
        $user = $context['user'];
        $appConn = $context['appConn'];
        $staffConn = $context['staffConn'];

        $rows = [];

        $applicantData = $this->fetchApplicantWorkExperience(
            $appConn,
            $user->id,
            $user->ipms_id ? 'Staff' : 'Applicant'
        );

        if ($applicantData->isNotEmpty()) {
            foreach ($applicantData as $workExperience) {
                $rows[] = [
                    'id' => $workExperience->id ?? null,
                    'from_date' => $this->formatDate($workExperience->from_date ?? null),
                    'to_date' => $this->formatDate($workExperience->to_date ?? null),
                    'agency' => $workExperience->agency ?? '',
                    'position' => $workExperience->position ?? '',
                    'appointment' => $workExperience->appointment ?? '',
                    'isGovtService' => $workExperience->isGovtService ?? '',
                    'isPresent' => $workExperience->isPresent ?? '',
                ];
            }
        } elseif ($user->ipms_id) {
            $staffData = $this->fetchStaffWorkExperience($staffConn, $user->ipms_id);

            if ($staffData->isNotEmpty()) {
                foreach ($staffData as $workExperience) {
                    $rows[] = [
                        'id' => null,
                        'from_date' => $this->formatDate($workExperience->from_date ?? null),
                        'to_date' => $this->formatDate($workExperience->to_date ?? null),
                        'agency' => $workExperience->agency ?? '',
                        'position' => $workExperience->position ?? '',
                        'appointment' => $workExperience->appointment ?? '',
                        'isGovtService' => $workExperience->isGovtService ?? '',
                        'isPresent' => $workExperience->isPresent ?? '',
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
