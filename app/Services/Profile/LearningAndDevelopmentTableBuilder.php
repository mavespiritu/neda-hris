<?php

namespace App\Services\Profile;

use App\Traits\FetchLearningAndDevelopment;
use Carbon\Carbon;

class LearningAndDevelopmentTableBuilder
{
    use FetchLearningAndDevelopment;

    public function build(array $context): array
    {
        $user = $context['user'];
        $appConn = $context['appConn'];
        $staffConn = $context['staffConn'];

        $rows = [];

        $applicantData = $this->fetchApplicantLearningAndDevelopment(
            $appConn,
            $user->id,
            $user->ipms_id ? 'Staff' : 'Applicant'
        );

        if ($applicantData->isNotEmpty()) {
            foreach ($applicantData as $learningAndDevelopment) {
                $rows[] = [
                    'id' => $learningAndDevelopment->id ?? null,
                    'seminar_title' => $learningAndDevelopment->seminar_title ?? '',
                    'from_date' => $this->formatDate($learningAndDevelopment->from_date ?? null),
                    'to_date' => $this->formatDate($learningAndDevelopment->to_date ?? null),
                    'hours' => $learningAndDevelopment->hours ?? 0,
                    'participation' => $learningAndDevelopment->participation ?? '',
                    'type' => $learningAndDevelopment->type ?? '',
                    'conducted_by' => $learningAndDevelopment->conducted_by ?? '',
                ];
            }
        } elseif ($user->ipms_id) {
            $staffData = $this->fetchStaffLearningAndDevelopment($staffConn, $user->ipms_id);

            if ($staffData->isNotEmpty()) {
                foreach ($staffData as $learningAndDevelopment) {
                    $rows[] = [
                        'id' => null,
                        'seminar_title' => $learningAndDevelopment->seminar_title ?? '',
                        'from_date' => $this->formatDate($learningAndDevelopment->from_date ?? null),
                        'to_date' => $this->formatDate($learningAndDevelopment->to_date ?? null),
                        'hours' => $learningAndDevelopment->hours ?? 0,
                        'participation' => $learningAndDevelopment->participation ?? '',
                        'type' => $learningAndDevelopment->type ?? '',
                        'conducted_by' => $learningAndDevelopment->conducted_by ?? '',
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
