<?php

namespace App\Services\Applicants;

use Illuminate\Database\ConnectionInterface;

class PersonalInformationFormBuilder
{
    public function build(ConnectionInterface $connection, ?int $applicantId = null): object
    {
        $defaults = (object) [
            'id' => null,
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
            'permanent_city' => '',
            'permanent_province' => '',
            'permanent_zip' => '',
            'residential_house_no' => '',
            'residential_street' => '',
            'residential_subdivision' => '',
            'residential_barangay' => '',
            'residential_city' => '',
            'residential_province' => '',
            'residential_zip' => '',
            'telephone_no' => '',
            'mobile_no' => '',
        ];

        if ($applicantId === null) {
            return $defaults;
        }

        $applicant = $connection->table('applicant')
            ->where('id', $applicantId)
            ->first();

        if (! $applicant) {
            abort(404);
        }

        foreach (array_keys((array) $defaults) as $field) {
            if ($field === 'isResidenceSameWithPermanentAddress') {
                $defaults->{$field} = (bool) ($applicant->{$field} ?? false);
                continue;
            }

            $defaults->{$field} = $applicant->{$field} ?? $defaults->{$field};
        }

        return $defaults;
    }
}
