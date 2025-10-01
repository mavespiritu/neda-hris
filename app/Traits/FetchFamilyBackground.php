<?php

namespace App\Traits;

use Illuminate\Support\Facades\DB;

trait FetchFamilyBackground
{
    protected function fetchApplicantSpouse($conn, $userId, $userType)
    {
        return $conn->table('applicant_spouse')
        ->select(
            'applicant_spouse.id',
            'applicant_spouse.hasSpouse',
            'applicant_spouse.last_name',
            'applicant_spouse.first_name',
            'applicant_spouse.middle_name',
            'applicant_spouse.ext_name',
            'applicant_spouse.occupation',
            'applicant_spouse.employer_name',
            'applicant_spouse.business_address',
            'applicant_spouse.telephone_no',
        )
        ->leftJoin('applicant', function ($join) use ($userType) {
            $join->on('applicant.id', '=', 'applicant_spouse.applicant_id')
                 ->where('applicant.type', '=', $userType);
        })
        ->where('applicant.user_id', $userId)
        ->first();
        
    }

    protected function fetchStaffSpouse($conn, $ipmsId)
    {
        $personal = $conn->table('tblemployee')->where('emp_id', $ipmsId)->first();
        $spouseOccupation = $conn->table('tblemp_spouse_occupation')->where('emp_id', $ipmsId)->first();

        return [
            'personal' => $personal,
            'spouseOccupation' => $spouseOccupation,
        ];
    }

    protected function fetchApplicantParent($conn, $userId, $parentType, $userType)
    {
        $table = "applicant_{$parentType}";
        $selectFields = [
            "$table.id",
            "$table.last_name",
            "$table.first_name",
            "$table.middle_name",
            "$table.birth_date",
        ];

        // Only add mother_maiden_name if parentType is mother
        if ($parentType === 'mother') {
            $selectFields[] = "$table.maiden_name";
        }

        if ($parentType === 'father') {
            $selectFields[] = "$table.ext_name";
        }

        return $conn->table($table)
            ->select($selectFields)
            ->leftJoin('applicant', function ($join) use ($table, $userType) {
                $join->on("applicant.id", '=', "$table.applicant_id")
                    ->where('applicant.type', '=', $userType);
            })
            ->where('applicant.user_id', $userId)
            ->first();
    }

    protected function fetchStaffParent($conn, $ipmsId)
    {
        return $conn->table('tblemployee')->where('emp_id', $ipmsId)->first();
    }

    protected function fetchApplicantChildren($conn, $userId, $userType)
    {
        return $conn->table('applicant_child')
            ->select(
                'applicant_child.id',
                'applicant_child.last_name',
                'applicant_child.first_name',
                'applicant_child.middle_name',
                'applicant_child.ext_name',
                'applicant_child.birth_date',
            )
            ->leftJoin('applicant', function ($join) use ($userType) {
                $join->on('applicant.id', '=', 'applicant_child.applicant_id')
                    ->where('applicant.type', '=', $userType);
            })
            ->where('applicant.user_id', $userId)
            ->get();
    }

    protected function fetchStaffChildren($conn, $ipmsId)
    {
        return $conn->table('tblemp_children')->where('emp_id', $ipmsId)->get();
    }
}
