<?php

namespace App\Traits;

use Illuminate\Support\Facades\DB;

trait FetchEducationalBackgroundFiles
{
    protected function fetchEducationalBackgroundFiles($applicant, $vacancyId)
    {
        $conn  = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        // Recruitment requirement definition
        $educationReq = $conn2->table('recruitment_requirements')
            ->where('connected_to', 'Educational Background')
            ->first();

        // Grab applicant education
        $educations = $conn->table('applicant_education')
            ->where('applicant_id', $applicant->id)
            ->whereIn('level', ['College', 'Graduate Studies', 'Vocational/Trade Course'])
            ->get();

        $newEducationFiles = collect();
        $educationRequirementMap = collect();

        if ($educationReq) {
            $newEducations = $conn->table('application_requirement')
                ->where('applicant_id', $applicant->id)
                ->where('vacancy_id', $vacancyId)
                ->where('requirement_id', $educationReq->id)
                ->where('requirement', $educationReq->requirement)
                ->get();

            if ($newEducations->isNotEmpty()) {
                $files = $conn->table('file')
                    ->where('model', 'Vacancy_' . $vacancyId . '_' . $educationReq->requirement)
                    ->whereIn('itemId', $newEducations->pluck('id'))
                    ->get();

                // Build a quick map: application_requirement.id → sub_requirement_id
                $educationRequirementMap = $newEducations->pluck('sub_requirement_id', 'id');

                // Group by sub_requirement_id (applicant_education.id)
                $newEducationFiles = $files->groupBy(function ($file) use ($educationRequirementMap) {
                    return $educationRequirementMap[$file->itemId] ?? null;
                })->map(function ($files) {
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
            }
        }

        // Old system files
        $oldEducations = $conn3->table('tblemp_educational_attainment as e')
            ->select([
                'e.*'
            ])
            ->where('e.emp_id', $applicant->emp_id)
            ->where('e.approval', 'yes')
            ->get()
            ->keyBy(function ($item) {
                return $item->emp_id . '|' . $item->level . '|' . $item->course . '|' . $item->school . '|' . $item->from_date;
            })
            ->map(function ($file) {
                return (object) [
                    'id'       => $file->id ?? null,
                    'source'   => 'old',
                    'filename' => $file->filename ?? "",
                    'filepath' => $file->filepath ? str_replace(
                        ['D:/wamp/www/NPIS/', 'C:/wamp/www/NPIS/'],
                        '',
                        $file->filepath
                    ) : null,
                    'filetype' => $file->filetype ?? "",
                    'filesize' => $file->filesize ?? "",
                ];
            });

        // Attach files to each education record
        $educations = $educations->map(function ($educ) use ($newEducationFiles, $oldEducations, $applicant) {
            $files = collect();

            // NEW files (vacancy-specific, mapped by sub_requirement_id)
            if ($newEducationFiles->has($educ->id)) {
                $files = $files->merge($newEducationFiles[$educ->id]);
            }

            // OLD files (legacy system, matched by composite key)
            $key = $applicant->emp_id . '|' . $educ->level . '|' . $educ->course . '|' . $educ->school . '|' . $educ->from_date;
            if ($oldEducations->has($key)) {
                $files->push($oldEducations[$key]);
            }

            $educ->files = $files->values();

            return $educ;
        });

        return $educations;
    }
}
