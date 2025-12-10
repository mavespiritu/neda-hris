<?php

namespace App\Traits;

use Illuminate\Support\Facades\DB;

trait FetchLearningAndDevelopmentFiles
{
    protected function fetchLearningAndDevelopmentFiles($applicant, $vacancyId)
    {
        $conn  = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        // Recruitment requirement definition
        $learningReq = $conn2->table('recruitment_requirements')
            ->where('connected_to', 'Learning and Development')
            ->first();

        // Grab applicant learnings
        $learnings = $conn->table('applicant_learning')
            ->where('applicant_id', $applicant->id)
            ->get();

        $newLearningFiles = collect();
        $learningRequirementMap = collect();

        if ($learningReq) {
            $newLearnings = $conn->table('application_requirement')
                ->where('applicant_id', $applicant->id)
                ->where('vacancy_id', $vacancyId)
                ->where('requirement_id', $learningReq->id)
                ->where('requirement', $learningReq->requirement)
                ->get();

            if ($newLearnings->isNotEmpty()) {
                $files = $conn->table('file')
                    ->where('model', 'Vacancy_' . $vacancyId . '_' . $learningReq->requirement)
                    ->whereIn('itemId', $newLearnings->pluck('id'))
                    ->get();

                // Build map: application_requirement.id → sub_requirement_id
                $learningRequirementMap = $newLearnings->pluck('sub_requirement_id', 'id');

                // Group new files by sub_requirement_id (→ applicant_learning.id)
                $newLearningFiles = $files->groupBy(function ($file) use ($learningRequirementMap) {
                    return $learningRequirementMap[$file->itemId] ?? null;
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
        $oldLearnings = $conn3->table('tblemp_training_program as t')
            ->select([
                't.*'
            ])
            ->where('t.emp_id', $applicant->emp_id)
            ->where('t.approval', 'yes')
            ->get()
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

        // Attach files to learnings
        $learnings = $learnings->map(function ($learn) use ($newLearningFiles, $oldLearnings, $applicant) {
            $files = collect();

            // NEW files
            if ($newLearningFiles->has($learn->id)) {
                $files = $files->merge($newLearningFiles[$learn->id]);
            }

            // OLD files (legacy system)
            $key = $applicant->emp_id . '|' . $learn->seminar_title . '|' . $learn->from_date;
            if ($oldLearnings->has($key)) {
                $files = $files->merge($oldLearnings[$key]);
            }

            $learn->files = $files->values();

            return $learn;
        });

        return $learnings;
    }
}
