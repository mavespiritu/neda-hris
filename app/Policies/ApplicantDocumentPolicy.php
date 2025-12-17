<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class ApplicantDocumentPolicy
{
    /**
     * Create a new policy instance.
     */
    public function __construct()
    {
        //
    }

    public function downloadRequirements(User $user): bool
    {
        return $user
        ->getAllPermissionsRecursive()
        ->contains('name', 'HRIS_vacancies.download-applicant-documents');
    }
}
