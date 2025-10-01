<?php

namespace App\Traits;
use Illuminate\Support\Facades\DB;

trait FetchRequirementFiles
{
    protected function fetchRequirementFiles($applicantId, $vacancyId, $req, $type)
    {
        $conn = DB::connection('mysql');

        // requirements for this applicant + vacancy
        $requirements = $conn->table('application_requirement')
        ->where('applicant_id', $applicantId)
        ->where('vacancy_id', $vacancyId)
        ->where('requirement_id', $req->requirement_id)
        ->where('requirement', $req->requirement)
        ->get();

        //dd($requirements);

        if ($requirements->isEmpty()) {
            return collect();
        }

        // check if current vacancy already has files
        $currentFiles = $requirements->flatMap(function ($requirement) use ($conn, $vacancyId) {
            return $conn->table('file')
                ->where('model', 'Vacancy_'.$vacancyId.'_'.$requirement->requirement)
                ->where('itemId', $requirement->id)
                ->get();
        });

        if ($currentFiles->isNotEmpty()) {
            return $currentFiles;
        }

        if ($type === 'manual') {
            return collect();
        }

        // if reuse and no current files, look for latest submitted application
        if ($type === 'reuse') {
            $latestApp = $conn->table('application')
                ->where('user_id', auth()->id())
                ->where('status', 'Submitted')
                ->latest('date_submitted')
                ->first();

            if ($latestApp) {
                $latestRequirements = $conn->table('application_requirement')
                    ->where('applicant_id', $applicantId)
                    ->where('vacancy_id', $latestApp->vacancy_id)
                    ->where('requirement_id', $req->requirement_id)
                    ->where('requirement', $req->requirement)
                    ->get();

                return $latestRequirements->flatMap(function ($requirement) use ($conn, $latestApp) {
                    return $conn->table('file')
                        ->where('model', 'Vacancy_' . $latestApp->vacancy_id . '_' . $requirement->requirement)
                        ->where('itemId', $requirement->id)
                        ->get();
                });
            }
        }

        return collect();
    }
}
