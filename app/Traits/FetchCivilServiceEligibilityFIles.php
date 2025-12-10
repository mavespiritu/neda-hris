<?php

namespace App\Traits;

use Illuminate\Support\Facades\DB;

trait FetchCivilServiceEligibilityFiles
{
    protected function fetchCivilServiceEligibilityFiles($applicant, $vacancyId, $type)
    {
        $conn  = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        // Recruitment requirement definition
        $eligibilityReq = $conn2->table('recruitment_requirements')
            ->where('connected_to', 'Civil Service Eligibility')
            ->first();

        // Grab applicant eligibilities
        $eligibilities = $conn->table('applicant_eligibility')
            ->where('applicant_id', $applicant->id)
            ->get();

        $newEligibilityFiles = collect();
        $eligibilityRequirementMap = collect();

        if ($eligibilityReq) {
            $newEligibilities = $conn->table('application_requirement')
                ->where('applicant_id', $applicant->id)
                ->where('vacancy_id', $vacancyId)
                ->where('requirement_id', $eligibilityReq->id)
                ->where('requirement', $eligibilityReq->requirement)
                ->get();

            if ($newEligibilities->isNotEmpty()) {
                $files = $conn->table('file')
                    ->where('model', 'Vacancy_' . $vacancyId . '_' . $eligibilityReq->requirement)
                    ->whereIn('itemId', $newEligibilities->pluck('id'))
                    ->get();
                
                // Build a quick map: application_requirement.id → sub_requirement_id
                $eligibilityRequirementMap = $newEligibilities->pluck('sub_requirement_id', 'id');
                
                // Group new files by sub_requirement_id (→ applicant_learning.id)
                $newEligibilityFiles = $files->groupBy(function ($file) use ($eligibilityRequirementMap) {
                    return $eligibilityRequirementMap[$file->itemId] ?? null;
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

            if ($type === 'reuse' && $newEligibilityFiles->isEmpty()) {
                $latestApp = $conn->table('application')
                    ->where('user_id', auth()->id())
                    ->where('status', 'Submitted')
                    ->latest('date_submitted')
                    ->first();

                if ($latestApp) {
                    $latestEligibilities = $conn->table('application_requirement')
                        ->where('applicant_id', $applicant->id)
                        ->where('vacancy_id', $latestApp->vacancy_id)
                        ->where('requirement_id', $eligibilityReq->id)
                        ->where('requirement', $eligibilityReq->requirement)
                        ->get();

                    if ($latestEligibilities->isNotEmpty()) {
                        $files = $conn->table('file')
                            ->where('model', 'Vacancy_' . $latestApp->vacancy_id . '_' . $eligibilityReq->requirement)
                            ->whereIn('itemId', $latestEligibilities->pluck('id'))
                            ->get();

                        $eligibilityRequirementMap = $latestEligibilities->pluck('sub_requirement_id', 'id');

                        $newEligibilityFiles = $files->groupBy(function ($file) use ($eligibilityRequirementMap) {
                            return $eligibilityRequirementMap[$file->itemId] ?? null;
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
            }
        }

        // Old system files
        $oldEligibilities = $conn3->table('tblemp_civil_service as c')
            ->select([
                'c.*',
            ])
            ->where('c.emp_id', $applicant->emp_id)
            ->where('c.approval', 'yes')
            ->get()
            ->map(function ($files) {
                return $files->map(function ($file) {
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
            });

        // Attach files to learnings
        $eligibilities = $eligibilities->map(function ($elig) use ($newEligibilityFiles, $oldEligibilities, $applicant) {
            $files = collect();

            // NEW files
            if ($newEligibilityFiles->has($elig->id)) {
                $files = $files->merge($newEligibilityFiles[$elig->id]);
            }

            // OLD files (legacy system)
            $key = $applicant->emp_id . '|' . $elig->eligibility . '|' . $elig->exam_date;
            if ($oldEligibilities->has($key)) {
                $files = $files->merge($oldEligibilities[$key]);
            }

            $elig->files = $files->values();

            return $elig;
        });

        return $eligibilities;
    }
}
