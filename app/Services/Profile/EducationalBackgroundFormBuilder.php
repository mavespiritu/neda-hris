<?php

namespace App\Services\Profile;

use App\Traits\FetchEducationalBackground;

class EducationalBackgroundFormBuilder
{
    use FetchEducationalBackground;

    public function build(array $context): object
    {
        $user = $context['user'];
        $type = $context['type'];
        $appConn = $context['appConn'];
        $staffConn = $context['staffConn'];
        $isStaffDb = $user->ipms_id ? true : false;
        $idKey = $isStaffDb ? $user->ipms_id : $user->id;
        $conn = $isStaffDb ? $staffConn : $appConn;

        $levels = [
            'elementary' => 'Elementary',
            'secondary' => 'Secondary',
            'vocational' => 'Vocational/Trade Course',
            'college' => 'College',
            'graduate' => 'Graduate Studies',
        ];

        $levels = array_flip($levels);

        $educationalBackground = (object) [
            'elementary' => [],
            'secondary' => [],
            'vocational' => [],
            'college' => [],
            'graduate' => [],
        ];

        $applicantData = $this->fetchApplicantEducationalBackground($appConn, $user->id, $user->ipms_id ? 'Staff' : 'Applicant');

        if ($applicantData->isNotEmpty()) {
            foreach ($applicantData as $edu) {
                $levelKey = $levels[$edu->level];
                $educationalBackground->{$levelKey}[] = $edu;
            }
        } elseif ($user->ipms_id) {
            foreach ($levels as $key => $label) {
                $data = $this->fetchStaffEducationalBackground($staffConn, $user->ipms_id, $key);
                if ($data->isNotEmpty()) {
                    foreach ($data as $edu) {
                        $educationalBackground->{$label}[] = (object) [
                            'level' => $key,
                            'course' => $edu->course ?? '',
                            'school' => $edu->school ?? '',
                            'highest_attainment' => '',
                            'from_date' => $edu->from_date ?? '',
                            'from_year' => '',
                            'to_date' => $edu->to_date ?? '',
                            'to_year' => '',
                            'award' => $edu->award ?? '',
                            'year_graduated' => $edu->year_graduated ?? '',
                            'is_graduated' => !empty($edu->year_graduated),
                        ];
                    }
                }
            }
        }

        return $educationalBackground;
    }
}
