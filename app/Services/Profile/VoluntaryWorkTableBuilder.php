<?php

namespace App\Services\Profile;

use App\Traits\FetchVoluntaryWork;
use Carbon\Carbon;

class VoluntaryWorkTableBuilder
{
    use FetchVoluntaryWork;

    public function build(array $context): array
    {
        $user = $context['user'];
        $appConn = $context['appConn'];
        $staffConn = $context['staffConn'];

        $rows = [];

        $applicantData = $this->fetchApplicantVoluntaryWork(
            $appConn,
            $user->id,
            $user->ipms_id ? 'Staff' : 'Applicant'
        );

        if ($applicantData->isNotEmpty()) {
            foreach ($applicantData as $voluntaryWork) {
                $rows[] = [
                    'id' => $voluntaryWork->id ?? null,
                    'org_name' => $voluntaryWork->org_name ?? '',
                    'org_address' => $voluntaryWork->org_address ?? '',
                    'from_date' => $this->formatDate($voluntaryWork->from_date ?? null),
                    'to_date' => $this->formatDate($voluntaryWork->to_date ?? null),
                    'hours' => $voluntaryWork->hours ?? 0,
                    'nature_of_work' => $voluntaryWork->nature_of_work ?? '',
                    'isPresent' => $voluntaryWork->isPresent ?? '',
                ];
            }
        } elseif ($user->ipms_id) {
            $staffData = $this->fetchStaffVoluntaryWork($staffConn, $user->ipms_id);

            if ($staffData->isNotEmpty()) {
                foreach ($staffData as $voluntaryWork) {
                    $rows[] = [
                        'id' => null,
                        'org_name' => $voluntaryWork->org_name ?? '',
                        'org_address' => $voluntaryWork->org_address ?? '',
                        'from_date' => $this->formatDate($voluntaryWork->from_date ?? null),
                        'to_date' => $this->formatDate($voluntaryWork->to_date ?? null),
                        'hours' => $voluntaryWork->hours ?? 0,
                        'nature_of_work' => $voluntaryWork->nature_of_work ?? '',
                        'isPresent' => $voluntaryWork->isPresent ?? '',
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
