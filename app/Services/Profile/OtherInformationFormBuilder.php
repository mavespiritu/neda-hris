<?php

namespace App\Services\Profile;

use App\Traits\FetchOtherInformation;

class OtherInformationFormBuilder
{
    use FetchOtherInformation;

    public function build(array $context): object
    {
        $user = $context['user'];
        $type = $context['type'];
        $appConn = $context['appConn'];
        $staffConn = $context['staffConn'];
        $isStaffDb = $user->ipms_id ? true : false;
        $idKey = $isStaffDb ? $user->ipms_id : $user->id;
        $conn = $isStaffDb ? $staffConn : $appConn;

        $otherInformation = (object) [
            'skills' => [],
            'recognitions' => [],
            'memberships' => [],
            'questions' => [],
            'references' => [],
        ];

        $categories = [
            'skills'       => 'hobbies',
            'recognitions' => 'recognition',
            'memberships'  => 'membership',
        ];

        foreach ($categories as $key => $type) {
        
            $applicantData = $this->fetchApplicantOtherInformation(
                $appConn, 
                $user->id, 
                $isStaffDb ? 'Staff' : 'Applicant', 
                $type
            );

            if ($applicantData->isNotEmpty()) {
                foreach ($applicantData as $item) {
                    $otherInformation->{$key}[] = $item;
                }
            } elseif ($isStaffDb) {

                $staffData = $this->fetchStaffOtherInformation($staffConn, $user->ipms_id, $type);

                if ($staffData->isNotEmpty()) {
                    foreach ($staffData as $item) {
                        $otherInformation->{$key}[] = (object) [
                            'type'        => $item->type ?? '',
                            'description' => $item->description ?? '',
                            'year'        => $item->year ?? '',
                        ];
                    }
                }
            }
        }

        $questionsData = $this->fetchApplicantQuestions($appConn, $user->id, $isStaffDb ? 'Staff' : 'Applicant');

        if (!empty($questionsData)) {
            foreach ($questionsData as $question) {
                $otherInformation->questions[] = $question;
            }
        } elseif ($isStaffDb) {
            $staffQuestions = $this->fetchStaffQuestions($staffConn, $user->ipms_id);

            $otherInformation->questions = $staffQuestions;
        }

        $applicantReferenceData = $this->fetchApplicantReferences($appConn, $user->id, $user->ipms_id ? 'Staff' : 'Applicant');

        if ($applicantReferenceData->isNotEmpty()) {
            foreach ($applicantReferenceData as $reference) {
                $otherInformation->references[] = $reference;
            }
        } elseif ($user->ipms_id) {

            $staffReferenceData = $this->fetchStaffReferences($staffConn, $user->ipms_id);

            if ($staffReferenceData->isNotEmpty()) {
                foreach ($staffReferenceData as $reference) {
                    $otherInformation->references[] = (object) [
                        'name'       => $reference->ref_name ?? '',
                        'address'    => $reference->address ?? '',
                        'contact_no' => $reference->tel_no ?? '',
                    ];
                }
            }
        }

        return $otherInformation;
    }
}
