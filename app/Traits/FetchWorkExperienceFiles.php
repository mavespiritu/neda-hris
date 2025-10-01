<?php

namespace App\Traits;

use Illuminate\Support\Facades\DB;

trait FetchWorkExperienceFiles
{
    protected function fetchWorkExperienceFiles($applicant, $vacancyId)
    {
        $conn  = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');

        // Recruitment requirement definition
        $workReq = $conn2->table('recruitment_requirements')
            ->where('connected_to', 'Work Experience')
            ->first();

        // Grab applicant work experiences
        $works = $conn->table('applicant_work_experience')
            ->where('applicant_id', $applicant->id)
            ->get();

        $newWorkFiles = collect();
        $workRequirementMap = collect();

        if ($workReq) {
            $newWorks = $conn->table('application_requirement')
                ->where('applicant_id', $applicant->id)
                ->where('vacancy_id', $vacancyId)
                ->where('requirement_id', $workReq->id)
                ->where('requirement', $workReq->requirement)
                ->get();

            if ($newWorks->isNotEmpty()) {
                $files = $conn->table('file')
                    ->where('model', 'Vacancy_' . $vacancyId . '_' . $workReq->requirement)
                    ->whereIn('itemId', $newWorks->pluck('id'))
                    ->get();

                // group by the sub_requirement_id (link to applicant_work_experience.id)
                $newWorkFiles = $files->groupBy('itemId')->map(function ($files) use ($newWorks) {
                    return $files->map(function ($file) {
                        return (object) [
                            'id'       => $file->id,
                            'source'   => 'new',
                            'filename' => $file->name ?? null,
                            'filepath' => $file->path ?? null,
                            'filetype' => $file->type ?? null,
                            'filesize' => $file->size ?? null,
                        ];
                    });
                });

                // Build a quick map of application_requirement.id → sub_requirement_id
                $workRequirementMap = $newWorks->pluck('sub_requirement_id', 'id');
            }
        }

        // Attach files per work experience
        $works = $works->map(function ($work) use ($newWorkFiles, $workRequirementMap) {
            $files = collect();

            // Find all application_requirements that point to this work->id
            $matchingRequirementIds = $workRequirementMap
                ? $workRequirementMap->filter(fn($subId) => $subId == $work->id)->keys()
                : collect();

            foreach ($matchingRequirementIds as $reqId) {
                if ($newWorkFiles->has($reqId)) {
                    $files = $files->merge($newWorkFiles[$reqId]);
                }
            }

            $work->files = $files->values();

            return $work;
        });

        return $works;
    }
}
