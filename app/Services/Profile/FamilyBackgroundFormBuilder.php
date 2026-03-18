<?php

namespace App\Services\Profile;

use App\Traits\FetchFamilyBackground;

class FamilyBackgroundFormBuilder
{
    use FetchFamilyBackground;

    public function build(array $context): object
    {
        $user = $context['user'];
        $type = $context['type'];
        $appConn = $context['appConn'];
        $staffConn = $context['staffConn'];
        $isStaffDb = $user->ipms_id ? true : false;
        $idKey = $isStaffDb ? $user->ipms_id : $user->id;
        $conn = $isStaffDb ? $staffConn : $appConn;

        $familyBackground = (object) [
            'isThereSpouse' => false,
            'father' => [],
            'mother' => [],
            'spouse' => [],
            'children' => [],
        ];

        $applicantSpouseData = $this->fetchApplicantSpouse($appConn, $user->id, $user->ipms_id ? 'Staff' : 'Applicant');

        if ($applicantSpouseData) {

            $familyBackground->isThereSpouse = $applicantSpouseData->hasSpouse;
            $familyBackground->spouse = $applicantSpouseData;

        } elseif ($user->ipms_id) {
            
            $staffSpouseData = $this->fetchStaffSpouse($staffConn, $user->ipms_id);

            $personal = $staffSpouseData['personal'];
            $spouseOccupation = $staffSpouseData['spouseOccupation'];

            $familyBackground->isThereSpouse = !empty($personal->spouse_surname ?? null);
            $familyBackground->spouse = (object) [
                'hasSpouse' => !empty($personal->spouse_surname ?? null),
                'last_name' => $personal->spouse_surname ?? '',
                'first_name' => $personal->spouse_firstname ?? '',
                'middle_name' => $personal->spouse_middlename ?? '',
                'ext_name' => '',
                'occupation' => $spouseOccupation->occupation ?? '',
                'employer_name' => $spouseOccupation->employer_business_name ?? '',
                'business_address' => $spouseOccupation->business_address ?? '',
                'telephone_no' => $spouseOccupation->tel_no ?? '',
                'birth_date' => '',
            ];
        }

        $applicantFatherData = $this->fetchApplicantParent($appConn, $user->id, 'father',  $user->ipms_id ? 'Staff' : 'Applicant');

        if ($applicantFatherData) {

            $familyBackground->father = $applicantFatherData;

        } elseif ($user->ipms_id) {
            
            $staffFatherData = $this->fetchStaffParent($staffConn, $user->ipms_id);

            $familyBackground->father = (object) [
                'last_name' => $staffFatherData->father_surname ?? '',
                'first_name' => $staffFatherData->father_firstname ?? '',
                'middle_name' => $staffFatherData->father_middlename ?? '',
                'ext_name' => '',
                'birth_date' => $staffFatherData->father_birthday ?? '',
            ];
        }

        $applicantMotherData = $this->fetchApplicantParent($appConn, $user->id, 'mother',  $user->ipms_id ? 'Staff' : 'Applicant');

        if ($applicantMotherData) {

            $familyBackground->mother = $applicantMotherData;

        } elseif ($user->ipms_id) {
            
            $staffMotherData = $this->fetchStaffParent($staffConn, $user->ipms_id);

            $familyBackground->mother = (object) [
                'last_name' => $staffMotherData->mother_surname ?? '',
                'first_name' => $staffMotherData->mother_firstname ?? '',
                'middle_name' => $staffMotherData->mother_middlename ?? '',
                'maiden_name' => $staffMotherData->mother_maiden_name ?? '',
                'birth_date' => $staffMotherData->mother_birthday ?? '',
            ];
        }

        $applicantChildrenData = $this->fetchApplicantChildren($appConn, $user->id, $isStaffDb ? 'Staff' : 'Applicant');

        if ($applicantChildrenData && $applicantChildrenData->isNotEmpty()) {
            $familyBackground->children = $applicantChildrenData;
        } elseif ($isStaffDb) {
            $staffChildrenData = $this->fetchStaffChildren($staffConn, $user->ipms_id);

            $children = [];
            
            if($staffChildrenData->isNotEmpty()) {
                foreach($staffChildrenData as $child) {
                    $children[] = (object) [
                        'last_name'   => $child->child_name ?? '',
                        'birth_date'  => $child->birthday ?? '',
                    ];
                }
            }

            $familyBackground->children = $children;
        }

        return $familyBackground;
    }
}
