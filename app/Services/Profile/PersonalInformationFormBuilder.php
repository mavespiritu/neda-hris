<?php

namespace App\Services\Profile;

use App\Traits\FetchPersonalInformation;

class PersonalInformationFormBuilder
{
    use FetchPersonalInformation;

    public function build(array $context): object
    {
        $user = $context['user'];
        $type = $context['type'];
        $appConn = $context['appConn'];
        $staffConn = $context['staffConn'];

        $basicInformation = (object) [
            'emp_id' => '',
            'type' => 'Applicant',
            'email_address' => '',
            'last_name' => '',
            'first_name' => '',
            'middle_name' => '',
            'ext_name' => '',
            'birth_date' => '',
            'birth_place' => '',
            'gender' => '',
            'civil_status' => '',
            'height' => 0,
            'weight' => 0,
            'blood_type' => '',
            'gsis_no' => '',
            'umid_no' => '',
            'pag_ibig_no' => '',
            'philhealth_no' => '',
            'sss_no' => '',
            'tin_no' => '',
            'philsys_no' => '',
            'agency_employee_no' => '',
            'citizenship' => '',
            'citizenship_by' => '',
            'citizenship_country' => '',
            'isResidenceSameWithPermanentAddress' => false,

            'permanent_house_no' => '',
            'permanent_street' => '',
            'permanent_subdivision' => '',
            'permanent_barangay' => '',
            'permanent_barangay_name' => '',
            'permanent_city' => '',
            'permanent_city_name' => '',
            'permanent_province' => '',
            'permanent_province_name' => '',
            'permanent_is_metro_manila' => false,
            'permanent_district' => '',
            'permanent_district_name' => '',
            'permanent_zip' => '',

            'residential_house_no' => '',
            'residential_street' => '',
            'residential_subdivision' => '',
            'residential_barangay' => '',
            'residential_barangay_name' => '',
            'residential_city' => '',
            'residential_city_name' => '',
            'residential_province' => '',
            'residential_province_name' => '',
            'residential_is_metro_manila' => false,
            'residential_district' => '',
            'residential_district_name' => '',
            'residential_zip' => '',
            'telephone_no' => '',
            'mobile_no' => '',
        ];

        if ($type === 'Staff') {
            $applicantData = $this->fetchApplicantPersonalInfo($appConn, $user->id, 'Staff');

            if ($applicantData) {
                return (object) $applicantData;
            }

            $staffData = $this->fetchStaffPersonalInfo($staffConn, $user->ipms_id);
            $staff = $staffData['personal'] ?? null;
            $permanent = $staffData['permanent'] ?? null;
            $residential = $staffData['residential'] ?? null;

            if ($staff) {
                $basicInformation->type = 'Staff';
                $basicInformation->emp_id = $staff->emp_id;
                $basicInformation->email_address = $user->email;
                $basicInformation->last_name = $staff->lname;
                $basicInformation->first_name = $staff->fname;
                $basicInformation->middle_name = $staff->mname;
                $basicInformation->birth_date = $staff->birth_date;
                $basicInformation->birth_place = $staff->birth_place;
                $basicInformation->gender = $staff->gender;
                $basicInformation->civil_status = $staff->civil_status;
                $basicInformation->height = $staff->height;
                $basicInformation->weight = $staff->weight;
                $basicInformation->blood_type = ($staff->blood_type ?? '') . '+';
                $basicInformation->gsis_no = $staff->GSIS;
                $basicInformation->pag_ibig_no = $staff->Pag_ibig;
                $basicInformation->philhealth_no = $staff->Philhealth;
                $basicInformation->sss_no = $staff->SSS;
                $basicInformation->tin_no = $staff->TIN;
                $basicInformation->citizenship = $staff->citizenship;
                $basicInformation->mobile_no = $staff->cell_no;
            }

            if ($permanent) {
                $basicInformation->permanent_house_no = $permanent->house_no;
                $basicInformation->permanent_street = $permanent->street;
                $basicInformation->permanent_subdivision = $permanent->subdivision;
                $basicInformation->permanent_zip = $permanent->zipcode;
            }

            if ($residential) {
                $basicInformation->residential_house_no = $residential->house_no;
                $basicInformation->residential_street = $residential->street;
                $basicInformation->residential_subdivision = $residential->subdivision;
                $basicInformation->residential_zip = $residential->zipcode;
            }

            return $basicInformation;
        }

        $applicantData = $this->fetchApplicantPersonalInfo($appConn, $user->id, 'Applicant');

        if ($applicantData) {
            return (object) $applicantData;
        }

        $basicInformation->email_address = $user->email;

        return $basicInformation;
    }
}
