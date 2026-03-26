<?php

namespace App\Traits;

use Illuminate\Support\Facades\DB;

trait FetchWorkExperienceFiles
{
    protected function fetchWorkExperienceFiles($applicant, $vacancyId, $type = null)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');

        $workReq = $conn2->table('recruitment_requirements')
            ->where('connected_to', 'Work Experience')
            ->first();

        $works = $conn->table('applicant_work_experience')
            ->where('applicant_id', $applicant->id)
            ->get();

        $newWorkFiles = collect();

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

                $workRequirementMap = $newWorks->pluck('sub_requirement_id', 'id');

                $newWorkFiles = $files->groupBy(function ($file) use ($workRequirementMap) {
                    return $workRequirementMap[$file->itemId] ?? null;
                })->map(function ($groupedFiles) {
                    return $groupedFiles->map(function ($file) {
                        return (object) [
                            'id' => $file->id,
                            'source' => 'new',
                            'filename' => $file->name ?? null,
                            'filepath' => $file->path ?? null,
                            'filetype' => $file->type ?? null,
                            'filesize' => $file->size ?? null,
                        ];
                    })->values();
                });
            }
        }

        return $works->map(function ($work) use ($newWorkFiles) {
            $work->files = collect($newWorkFiles->get($work->id, []))->values();

            return $work;
        });
    }
}
