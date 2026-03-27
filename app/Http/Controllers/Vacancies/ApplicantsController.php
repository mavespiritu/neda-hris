<?php

namespace App\Http\Controllers\Vacancies;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Arr;
use App\Traits\FetchCivilServiceEligibilityFiles;
use App\Traits\FetchLearningAndDevelopmentFiles;
use App\Traits\FetchEducationalBackgroundFiles;
use App\Traits\FetchWorkExperienceFiles;
use App\Traits\FetchRequirementFiles;
use App\Policies\ApplicantDocumentPolicy;
use ZipArchive;

class ApplicantsController extends Controller
{
    use FetchCivilServiceEligibilityFiles;
    use FetchLearningAndDevelopmentFiles;
    use FetchEducationalBackgroundFiles;
    use FetchWorkExperienceFiles;
    use FetchRequirementFiles;

    public function index($id, Request $request)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');

        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $allowedRoles = ['HRIS_HR', 'HRIS_RD', 'HRIS_ARD'];
        $userRoles = $user->roles->pluck('name')->toArray();
        if (!array_intersect($allowedRoles, $userRoles)) {
            return response()->json(['message' => 'Forbidden: Only HR roles can access'], 403);
        }

        $publication = $conn2->table('publication_vacancies as pv')
            ->join('publication as p', 'p.id', '=', 'pv.publication_id')
            ->where('pv.vacancy_id', $id)
            ->select('p.date_closed')
            ->first();

        $editRequestDeadline = $publication?->date_closed
            ? $this->addBusinessDays(Carbon::parse($publication->date_closed), 5)
            : null;

        if ($editRequestDeadline && now()->greaterThan($editRequestDeadline)) {
            $conn->table('app_edit_requests')
                ->where('vacancy_id', $id)
                ->where('status', 'Open')
                ->update([
                    'status' => 'Expired',
                    'closed_at' => now(),
                    'updated_at' => now(),
                ]);
        }

        $search = $request->input('search', '');

        $applicantsQuery = $conn->table('application as a')
            ->join('application_applicant as aa', 'aa.application_id', '=', 'a.id')
            ->select(
                'a.id',
                'a.applicant_id',
                'a.user_id',
                DB::raw("UPPER(aa.last_name) AS lastname"),
                DB::raw("UPPER(aa.first_name) AS firstname"),
                DB::raw("UPPER(LEFT(aa.middle_name, 1)) AS middlename"),
                DB::raw("
                    CONCAT(
                        aa.last_name,
                        ', ',
                        aa.first_name,
                        IF(
                            aa.middle_name IS NULL OR aa.middle_name = '',
                            '',
                            CONCAT(
                                ' ',
                                UPPER(LEFT(aa.middle_name, 1)),
                                '.'
                            )
                        )
                    ) AS name
                "),
                'aa.email_address',
                'aa.mobile_no',
                'a.date_submitted'
            )
            ->where('a.vacancy_id', $id)
            ->where('a.status', 'Submitted')
            ->orderBy('aa.last_name')
            ->orderBy('aa.first_name')
            ->orderBy('aa.middle_name')
            ->orderByDesc('a.id');

        if (!empty($search)) {
            $search = strtolower($search);
            $applicantsQuery->where(function ($query) use ($search) {
                $query->whereRaw('LOWER(aa.first_name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(aa.last_name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(aa.middle_name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(aa.email_address) LIKE ?', ["%{$search}%"]);
            });
        }

        $applicants = $applicantsQuery->get();

        $assessmentStatuses = $conn->table('app_assessments')
            ->select('application_id', 'stage', 'overall_status', 'assessed_at')
            ->whereIn('application_id', $applicants->pluck('id'))
            ->get()
            ->groupBy('application_id');
        $examResults = $conn->table('app_exam_results')
            ->select('application_id', 'test_type', 'status', 'date_conducted', 'score')
            ->whereIn('application_id', $applicants->pluck('id'))
            ->get()
            ->groupBy('application_id');
        $rankingResults = $conn->table('app_ranking_results')
            ->select('application_id', 'rank', 'date_ranked')
            ->whereIn('application_id', $applicants->pluck('id'))
            ->get()
            ->keyBy('application_id');
        $editRequests = $conn->table('app_edit_requests')
            ->select('application_id', 'status', 'remarks', 'opened_at', 'expires_at', 'closed_at')
            ->whereIn('application_id', $applicants->pluck('id'))
            ->orderByDesc('id')
            ->get()
            ->unique('application_id')
            ->keyBy('application_id');

        $applicants = $applicants->map(function ($applicant) use ($assessmentStatuses, $examResults, $rankingResults, $editRequests, $editRequestDeadline) {
            $statuses = $assessmentStatuses->get($applicant->id, collect())->keyBy('stage');
            $results = $examResults->get($applicant->id, collect())->keyBy('test_type');
            $skillTest = $results->get('Skill Test');
            $dpe = $results->get('DPE');
            $ranking = $rankingResults->get($applicant->id);
            $editRequest = $editRequests->get($applicant->id);

            $applicant->secretariat_assessment_status = optional($statuses->get('secretariat'))->overall_status;
            $applicant->hrmpsb_assessment_status = optional($statuses->get('hrmpsb'))->overall_status;
            $applicant->secretariat_assessed_at = optional($statuses->get('secretariat'))->assessed_at;
            $applicant->hrmpsb_assessed_at = optional($statuses->get('hrmpsb'))->assessed_at;
            $applicant->rank = $ranking->rank ?? null;
            $applicant->date_ranked = $ranking->date_ranked ?? null;
            $applicant->skill_test_result = $skillTest->status ?? null;
            $applicant->skill_test_date_conducted = $skillTest->date_conducted ?? null;
            $applicant->skill_test_score = $skillTest->score ?? null;
            $applicant->dpe_result = $dpe->status ?? null;
            $applicant->dpe_date_conducted = $dpe->date_conducted ?? null;
            $applicant->dpe_score = $dpe->score ?? null;
            $applicant->edit_request_status = $editRequest->status ?? null;
            $applicant->edit_request_remarks = $editRequest->remarks ?? null;
            $applicant->edit_request_opened_at = $editRequest->opened_at ?? null;
            $applicant->edit_request_expires_at = $editRequest->expires_at ?? $editRequestDeadline?->toDateTimeString();
            $applicant->edit_request_closed_at = $editRequest->closed_at ?? null;
            $applicant->edit_request_deadline = $editRequestDeadline?->toDateTimeString();
            $applicant->can_open_edit_request = $editRequestDeadline
                ? now()->lessThanOrEqualTo($editRequestDeadline) && ! empty($applicant->email_address)
                : false;

            return $applicant;
        })
            ->sortByDesc(function ($applicant) {
                return ($applicant->date_submitted ?? '') . '|' . str_pad((string) $applicant->id, 20, '0', STR_PAD_LEFT);
            })
            ->groupBy(function ($applicant) {
                $normalize = function ($value) {
                    return strtolower(trim((string) $value));
                };

                return implode('|', [
                    $normalize($applicant->lastname ?? ''),
                    $normalize($applicant->firstname ?? ''),
                    $normalize($applicant->middlename ?? ''),
                    $normalize($applicant->user_id ?? ''),
                ]);
            })
            ->map(function ($group) {
                return $group->first();
            })
            ->sortBy([
                ['lastname', 'asc'],
                ['firstname', 'asc'],
                ['middlename', 'asc'],
            ])
            ->values();

        return response()->json([
            'data' => $applicants
        ]);
    }

    private function addBusinessDays(Carbon $date, int $days): Carbon
    {
        $current = $date->copy()->startOfDay();
        $addedDays = 0;

        while ($addedDays < $days) {
            $current->addDay();

            if ($current->isWeekend()) {
                continue;
            }

            $addedDays++;
        }

        return $current->endOfDay();
    }

    private function buildRequirementsData($application)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');

        $applicant = $conn->table('applicant')
            ->where('id', $application->applicant_id)
            ->first();

        if (!$applicant) {
            abort(404, 'Applicant not found');
        }

        $educationReq = $conn2->table('recruitment_requirements')
            ->where('connected_to', 'Educational Background')
            ->first();

        $eligibilityReq = $conn2->table('recruitment_requirements')
            ->where('connected_to', 'Civil Service Eligibility')
            ->first();

        $learningReq = $conn2->table('recruitment_requirements')
            ->where('connected_to', 'Learning and Development')
            ->first();

        $workReq = $conn2->table('recruitment_requirements')
            ->where('connected_to', 'Work Experience')
            ->first();

        $educations = $this->fetchEducationalBackgroundFiles(
            $applicant,
            $application->vacancy_id,
            $application->type
        );

        $eligibilities = $this->fetchCivilServiceEligibilityFiles(
            $applicant,
            $application->vacancy_id,
            $application->type
        );

        $learnings = $this->fetchLearningAndDevelopmentFiles(
            $applicant,
            $application->vacancy_id,
            $application->type
        );

        $works = $this->fetchWorkExperienceFiles(
            $applicant,
            $application->vacancy_id,
            $application->type
        );

        $requirements = $conn2->table('vacancy_requirements')
            ->select([
                'vacancy_requirements.*',
                'recruitment_requirements.connected_to'
            ])
            ->leftJoin(
                'recruitment_requirements',
                'recruitment_requirements.id',
                '=',
                'vacancy_requirements.requirement_id'
            )
            ->where('vacancy_id', $application->vacancy_id)
            ->get()
            ->map(function ($req) use (
                $applicant,
                $application,
                $educationReq,
                $educations,
                $eligibilityReq,
                $eligibilities,
                $learningReq,
                $learnings,
                $workReq,
                $works,
            ) {
                $req->files = $this->fetchRequirementFiles(
                    $applicant->id,
                    $application->vacancy_id,
                    $req,
                    $application->type
                );

                $req->subItems = [];

                if ($educationReq && $req->requirement_id == $educationReq->id) {
                    $req->subItems = $educations;
                }

                if ($eligibilityReq && $req->requirement_id == $eligibilityReq->id) {
                    $req->subItems = $eligibilities;
                }

                if ($learningReq && $req->requirement_id == $learningReq->id) {
                    $req->subItems = $learnings;
                }

                if ($workReq && $req->requirement_id == $workReq->id) {
                    $req->subItems = $works;
                }

                return $req;
            });

        return $this->replaceRequirementSubItemsWithSubmittedApplicationData($application, $requirements);
    }

    private function replaceRequirementSubItemsWithSubmittedApplicationData($application, $requirements)
    {
        $conn = DB::connection('mysql');
        $normalizeText = function ($value) {
            $text = strtolower(trim((string) $value));
            return preg_replace('/\s+/', ' ', $text);
        };
        $normalizeDate = fn ($value) => trim(substr((string) ($value ?? ''), 0, 10));

        $educationRequirement = collect($requirements)->firstWhere('connected_to', 'Educational Background');
        $eligibilityRequirement = collect($requirements)->firstWhere('connected_to', 'Civil Service Eligibility');
        $learningRequirement = collect($requirements)->firstWhere('connected_to', 'Learning and Development');
        $workRequirement = collect($requirements)->firstWhere('connected_to', 'Work Experience');

        $educationItems = collect($educationRequirement->subItems ?? []);
        $eligibilityItems = collect($eligibilityRequirement->subItems ?? []);
        $learningItems = collect($learningRequirement->subItems ?? []);

        $workItems = collect($workRequirement->subItems ?? []);

        $submittedEducations = $conn->table('application_education')
            ->where('application_id', $application->id)
            ->whereNotIn('level', ['Elementary', 'Secondary'])
            ->orderByDesc('to_year')
            ->get()
            ->map(function ($item) use ($educationItems, $normalizeText) {
                $matchedEducation = $educationItems->first(function ($education) use ($item, $normalizeText) {
                    return $normalizeText($education->level ?? '') === $normalizeText($item->level ?? '')
                        && $normalizeText($education->school ?? '') === $normalizeText($item->school ?? '')
                        && $normalizeText($education->course ?? '') === $normalizeText($item->course ?? '')
                        && trim((string) ($education->year_graduated ?? $education->to_year ?? '')) === trim((string) ($item->year_graduated ?? $item->to_year ?? ''));
                });

                if (!$matchedEducation) {
                    $matchedEducation = $educationItems->first(function ($education) use ($item, $normalizeText) {
                        return $normalizeText($education->school ?? '') === $normalizeText($item->school ?? '')
                            && $normalizeText($education->course ?? '') === $normalizeText($item->course ?? '');
                    });
                }

                $item->files = collect($matchedEducation->files ?? [])->values();

                return $item;
            })
            ->values();

        $submittedEligibilities = $conn->table('application_eligibility')
            ->where('application_id', $application->id)
            ->orderByDesc('id')
            ->get()
            ->map(function ($item) use ($eligibilityItems, $normalizeText, $normalizeDate) {
                $matchedEligibility = $eligibilityItems->first(function ($eligibility) use ($item, $normalizeText, $normalizeDate) {
                    return $normalizeText($eligibility->eligibility ?? '') === $normalizeText($item->eligibility ?? '')
                        && $normalizeDate($eligibility->exam_date ?? '') === $normalizeDate($item->exam_date ?? '');
                });

                if (!$matchedEligibility) {
                    $matchedEligibility = $eligibilityItems->first(function ($eligibility) use ($item, $normalizeText) {
                        return $normalizeText($eligibility->eligibility ?? '') === $normalizeText($item->eligibility ?? '');
                    });
                }

                $item->files = collect($matchedEligibility->files ?? [])->values();

                return $item;
            })
            ->values();

        $submittedLearnings = $conn->table('application_learning')
            ->where('application_id', $application->id)
            ->orderByDesc('from_date')
            ->get()
            ->map(function ($item) use ($learningItems, $normalizeText, $normalizeDate) {
                $matchedLearning = $learningItems->first(function ($learning) use ($item, $normalizeText, $normalizeDate) {
                    return $normalizeText($learning->seminar_title ?? '') === $normalizeText($item->seminar_title ?? '')
                        && $normalizeDate($learning->from_date ?? '') === $normalizeDate($item->from_date ?? '');
                });

                if (!$matchedLearning) {
                    $matchedLearning = $learningItems->first(function ($learning) use ($item, $normalizeText) {
                        return $normalizeText($learning->seminar_title ?? '') === $normalizeText($item->seminar_title ?? '');
                    });
                }

                $item->files = collect($matchedLearning->files ?? [])->values();

                return $item;
            })
            ->values();

        $submittedWorks = $conn->table('application_work_experience')
            ->where('application_id', $application->id)
            ->orderByDesc('from_date')
            ->get()
            ->map(function ($item) use ($workItems) {
                $normalizeText = function ($value) {
                    $text = strtolower(trim((string) $value));
                    return preg_replace('/\s+/', ' ', $text);
                };
                $normalizeDate = fn ($value) => trim(substr((string) ($value ?? ''), 0, 10));
                $normalizeAmount = function ($value) {
                    if ($value === null || $value === '') {
                        return '';
                    }

                    return number_format((float) $value, 2, '.', '');
                };

                $agency = $normalizeText($item->agency ?? '');
                $position = $normalizeText($item->position ?? '');
                $fromDate = $normalizeDate($item->from_date ?? '');
                $toDate = $normalizeDate($item->to_date ?? '');
                $salary = $normalizeAmount($item->monthly_salary ?? '');

                $matchedWork = $workItems->first(function ($work) use ($agency, $position, $fromDate, $toDate, $salary, $normalizeText, $normalizeDate, $normalizeAmount) {
                    return $normalizeText($work->agency ?? '') === $agency
                        && $normalizeText($work->position ?? '') === $position
                        && $normalizeDate($work->from_date ?? '') === $fromDate
                        && $normalizeDate($work->to_date ?? '') === $toDate
                        && $normalizeAmount($work->monthly_salary ?? '') === $salary;
                });

                if (!$matchedWork) {
                    $matchedWork = $workItems->first(function ($work) use ($agency, $position, $fromDate, $salary, $normalizeText, $normalizeDate, $normalizeAmount) {
                        return $normalizeText($work->agency ?? '') === $agency
                            && $normalizeText($work->position ?? '') === $position
                            && $normalizeDate($work->from_date ?? '') === $fromDate
                            && $normalizeAmount($work->monthly_salary ?? '') === $salary;
                    });
                }

                if (!$matchedWork) {
                    $matchedWork = $workItems->first(function ($work) use ($agency, $position, $toDate, $salary, $normalizeText, $normalizeDate, $normalizeAmount) {
                        return $normalizeText($work->agency ?? '') === $agency
                            && $normalizeText($work->position ?? '') === $position
                            && $normalizeDate($work->to_date ?? '') === $toDate
                            && $normalizeAmount($work->monthly_salary ?? '') === $salary;
                    });
                }

                if (!$matchedWork) {
                    $matchedWork = $workItems->first(function ($work) use ($agency, $position, $normalizeText) {
                        return $normalizeText($work->agency ?? '') === $agency
                            && $normalizeText($work->position ?? '') === $position;
                    });
                }

                $item->files = collect($matchedWork->files ?? [])->values();

                return $item;
            })
            ->values();

        return collect($requirements)->map(function ($req) use (
            $submittedEducations,
            $submittedEligibilities,
            $submittedLearnings,
            $submittedWorks
        ) {
            if ($req->connected_to === 'Educational Background') {
                $req->subItems = $submittedEducations;
            }

            if ($req->connected_to === 'Civil Service Eligibility') {
                $req->subItems = $submittedEligibilities;
            }

            if ($req->connected_to === 'Learning and Development') {
                $req->subItems = $submittedLearnings;
            }

            if ($req->connected_to === 'Work Experience') {
                $req->subItems = $submittedWorks;
            }

            return $req;
        });
    }

    private function normalizeFilenamePart(?string $value): string
    {
        return strtoupper(
            preg_replace('/[^A-Za-z0-9_-]/', '_', $value ?? 'UNKNOWN')
        );
    }

    private function extractFilePaths($requirements): array
    {
        return collect($requirements)
            ->flatMap(function ($req) {
                $files = collect();

                // 1️⃣ Requirement-level files (usually "path")
                if (!empty($req->files)) {
                    $files = $files->merge(collect($req->files));
                }

                // 2️⃣ Sub-item files (usually "filepath")
                if (!empty($req->subItems)) {
                    $files = $files->merge(
                        collect($req->subItems)->flatMap(function ($subItem) {
                            return !empty($subItem->files)
                                ? collect($subItem->files)
                                : [];
                        })
                    );
                }

                return $files;
            })
            ->map(function ($file) {
                // Support both keys: filepath (old) and path (new)
                if (is_array($file)) {
                    return $file['filepath'] ?? $file['path'] ?? null;
                }

                // If it's an object
                return $file->filepath ?? $file->path ?? null;
            })
            ->filter(fn ($p) => !empty($p)) // remove null/empty
            ->unique()
            ->values()
            ->toArray();
    }

    public function downloadRequirements($id)
    {
        Gate::authorize('downloadRequirements', 'applicant-documents');

        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');
        
        $application = $conn->table('application')
        ->where('id', $id)
        ->first();

        if(!$application){
            abort(404, 'Application not found');
        }

        $applicant = $conn->table('application_applicant')
        ->where('application_id', $application->id)
        ->first();

        $vacancy = $conn2->table('vacancy')
        ->where('id', $application->vacancy_id)
        ->first();

        $lastName = $this->normalizeFilenamePart(strtoupper($applicant->last_name) ?? 'APPLICANT');
        $itemNo   = $this->normalizeFilenamePart($vacancy->item_no ?? 'ITEM');

        $zipFileName = sprintf(
            '%s_%s_%s.zip',
            $lastName,
            $itemNo,
            now()->format('mdYHis')
        );

        $requirements = $this->buildRequirementsData($application);

        $filePaths = $this->extractFilePaths($requirements);

        $zipPath = storage_path("app/temp/{$zipFileName}");

        if (!is_dir(dirname($zipPath))) {
            mkdir(dirname($zipPath), 0755, true);
        }

        $zip = new ZipArchive();

        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            abort(500, 'Unable to create ZIP file.');
        }

        foreach ($filePaths as $relativePath) {
            // Adjust disk if needed (public is most common)
            $disk = 'public';

            if (!Storage::disk($disk)->exists($relativePath)) {
                continue; // skip missing files safely
            }

            $absolutePath = Storage::disk($disk)->path($relativePath);

            // Clean filename inside ZIP
            $nameInZip = basename($relativePath);

            $zip->addFile($absolutePath, $nameInZip);
        }

        $zip->close();

        return response()
            ->download($zipPath)
            ->deleteFileAfterSend(true);
    }   

    public function getPds($id)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $allowedRoles = ['HRIS_HR', 'HRIS_RD', 'HRIS_ARD'];
        $userRoles = $user->roles->pluck('name')->toArray();
        if (!array_intersect($allowedRoles, $userRoles)) {
            return response()->json(['message' => 'Forbidden: Only HR roles can access'], 403);
        }

        try {
            $personalInformation = $this->getPersonalInformation($id)->getData(true);
            $familyBackground = $this->getFamilyBackground($id)->getData(true);
            $educationalBackground = $this->getEducationalBackground($id)->getData(true);
            $civilServiceEligibility = $this->getCivilServiceEligibility($id)->getData(true);
            $workExperience = $this->getWorkExperience($id)->getData(true);
            $voluntaryWork = $this->getVoluntaryWork($id)->getData(true);
            $learningAndDevelopment = $this->getLearningAndDevelopment($id)->getData(true);
            $otherInformation = $this->getOtherInformation($id)->getData(true);

            return response()->json([
                'personalInformation' => $personalInformation,
                'familyBackground' => $familyBackground,
                'educationalBackground' => $educationalBackground,
                'civilServiceEligibility' => $civilServiceEligibility,
                'workExperience' => $workExperience,
                'voluntaryWork' => $voluntaryWork,
                'learningAndDevelopment' => $learningAndDevelopment,
                'otherInformation' => $otherInformation,
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to fetch full PDS: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while fetching the PDS. Please try again.'
            ], 500);
        }
    }

    public function getRequirements($id)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $user = auth()->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $allowedRoles = ['HRIS_HR', 'HRIS_RD', 'HRIS_ARD'];
        $userRoles = $user->roles->pluck('name')->toArray();
        if (!array_intersect($allowedRoles, $userRoles)) {
            return response()->json(['message' => 'Forbidden: Only HR roles can access'], 403);
        }

        $application = $conn->table('application')
        ->where('id', $id)
        ->first();

        if (!$application) {
            return response()->json(['message' => 'Application not found'], 404);
        }

        $requirements = $this->buildRequirementsData($application);

        return response()->json($requirements);
    }

    public function getQualifications($id)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $allowedRoles = ['HRIS_HR', 'HRIS_RD', 'HRIS_ARD'];
        $userRoles = $user->roles->pluck('name')->toArray();
        if (!array_intersect($allowedRoles, $userRoles)) {
            return response()->json(['message' => 'Forbidden: Only HR roles can access'], 403);
        }

        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $application = $conn->table('application')
        ->where('id', $id)
        ->first();

        if (!$application) {
            return response()->json(['message' => 'Application not found'], 404);
        }

        $requirements = collect($this->buildRequirementsData($application));

        $educationRequirement = $requirements->firstWhere('connected_to', 'Educational Background');
        $eligibilityRequirement = $requirements->firstWhere('connected_to', 'Civil Service Eligibility');
        $learningRequirement = $requirements->firstWhere('connected_to', 'Learning and Development');
        $workRequirement = $requirements->firstWhere('connected_to', 'Work Experience');

        $educations = collect($educationRequirement->subItems ?? [])
            ->map(function ($item) {
                return [
                    'id' => $item->id ?? null,
                    'level' => $item->level ?? '',
                    'course' => $item->course ?? '',
                    'school' => $item->school ?? '',
                    'highest_attainment' => $item->highest_attainment ?? '',
                    'from_year' => $item->from_year ?? '',
                    'to_year' => $item->to_year ?? '',
                    'year_graduated' => $item->year_graduated ?? '',
                    'files' => collect($item->files ?? [])->values()->all(),
                ];
            })
            ->values();

        $eligibilities = collect($eligibilityRequirement->subItems ?? [])
            ->map(function ($item) {
                return [
                    'id' => $item->id ?? null,
                    'eligibility' => $item->eligibility ?? '',
                    'rating' => $item->rating ?? '',
                    'exam_date' => $item->exam_date ?? '',
                    'exam_place' => $item->exam_place ?? '',
                    'license_no' => $item->license_no ?? '',
                    'validity_date' => $item->validity_date ?? '',
                    'files' => collect($item->files ?? [])->values()->all(),
                ];
            })
            ->values();

        $learnings = collect($learningRequirement->subItems ?? [])
            ->map(function ($item) {
                return [
                    'id' => $item->id ?? null,
                    'title' => $item->seminar_title ?? $item->title ?? '',
                    'hours_no' => $item->hours ?? $item->hours_ ?? $item->hours_no ?? '',
                    'from_date' => $item->from_date ?? '',
                    'to_date' => $item->to_date ?? '',
                    'participation' => $item->participation ?? '',
                    'conducted_by' => $item->conducted_by ?? '',
                    'files' => collect($item->files ?? [])->values()->all(),
                ];
            })
            ->values();

        $workExperiences = collect($workRequirement->subItems ?? [])
            ->map(function ($item) {
                return [
                    'id' => $item->id ?? null,
                    'position_title' => $item->position ?? $item->position_title ?? '',
                    'company_name' => $item->agency ?? $item->company_name ?? '',
                    'monthly_salary' => $item->monthly_salary ?? '',
                    'appointment' => $item->appointment ?? '',
                    'from_date' => $item->from_date ?? '',
                    'to_date' => $item->to_date ?? '',
                    'is_present' => (bool) ($item->isPresent ?? $item->is_present ?? false),
                    'files' => collect($item->files ?? [])->values()->all(),
                ];
            })
            ->values();

        $offenseQuestions = $conn->table('application_question')
            ->where('application_id', $application->id)
            ->where(function ($query) {
                $query->where(function ($subQuery) {
                    $subQuery->where('item_no', '35')
                        ->whereIn('list', ['A', 'B']);
                })->orWhere(function ($subQuery) {
                    $subQuery->where('item_no', '36');
                });
            })
            ->get()
            ->map(function ($item) {
                $label = match (true) {
                    $item->item_no === '35' && $item->list === 'A' => 'Found Guilty with Administrative Offense',
                    $item->item_no === '35' && $item->list === 'B' => 'Criminally Charged Before Any Court',
                    $item->item_no === '36' => 'Convicted of Any Crime or Violation',
                    default => 'Offense Record',
                };

                return [
                    'id' => $item->id ?? null,
                    'item_no' => $item->item_no ?? '',
                    'list' => $item->list ?? '',
                    'label' => $label,
                    'answer' => strtolower($item->answer ?? 'no'),
                    'details' => $item->details ?? '',
                ];
            })
            ->values();

        $specialStatusQuestions = $conn->table('application_question')
            ->where('application_id', $application->id)
            ->where('item_no', '40')
            ->whereIn('list', ['A', 'B', 'C'])
            ->get()
            ->map(function ($item) {
                $label = match ($item->list) {
                    'A' => 'Member of Any Indigenous Group',
                    'B' => 'Person with Disability',
                    'C' => 'Solo Parent',
                    default => 'Special Status',
                };

                return [
                    'id' => $item->id ?? null,
                    'item_no' => $item->item_no ?? '',
                    'list' => $item->list ?? '',
                    'label' => $label,
                    'answer' => strtolower($item->answer ?? 'no'),
                    'details' => $item->details ?? '',
                ];
            })
            ->values();

        $requirementsSummary = $requirements->map(function ($requirement) {
            $requirementFiles = collect($requirement->files ?? []);
            $hasSubItems = collect($requirement->subItems ?? [])->isNotEmpty();
            $subItemFiles = collect($requirement->subItems ?? [])
                ->flatMap(function ($subItem) {
                    return collect($subItem->files ?? []);
                });

            $allFiles = ($hasSubItems ? $subItemFiles : $requirementFiles)
                ->filter(fn ($file) => !empty($file->filepath ?? $file->path ?? null))
                ->unique(function ($file) {
                    return ($file->filepath ?? $file->path ?? '') . '|' . ($file->filename ?? $file->name ?? '');
                })
                ->values();

            $isSubmitted = $allFiles->isNotEmpty();

            return [
                'id' => $requirement->id ?? null,
                'requirement' => $requirement->requirement ?? '',
                'connected_to' => $requirement->connected_to ?? null,
                'has_sub_items' => $hasSubItems,
                'is_submitted' => $isSubmitted,
                'files' => $allFiles->map(function ($file) {
                    return [
                        'id' => $file->id ?? null,
                        'filename' => $file->filename ?? $file->name ?? null,
                        'filepath' => $file->filepath ?? $file->path ?? null,
                        'filetype' => $file->filetype ?? $file->type ?? null,
                        'filesize' => $file->filesize ?? $file->size ?? null,
                    ];
                })->all(),
            ];
        })->values();

        return response()->json([
            'educations' => $educations,
            'eligibilities' => $eligibilities,
            'learnings' => $learnings,
            'workExperiences' => $workExperiences,
            'offenseQuestions' => $offenseQuestions,
            'specialStatusQuestions' => $specialStatusQuestions,
            'requirementsSummary' => [
                'is_complete' => $requirementsSummary->every(fn ($item) => $item['is_submitted']),
                'submitted_count' => $requirementsSummary->where('is_submitted', true)->count(),
                'total_count' => $requirementsSummary->count(),
                'items' => $requirementsSummary->all(),
                'missing_items' => $requirementsSummary
                    ->where('is_submitted', false)
                    ->pluck('requirement')
                    ->filter()
                    ->values()
                    ->all(),
            ],
        ]);
    }

    public function getPersonalInformation($id)
    {
        $conn = DB::connection('mysql');

        $applicant = $conn->table('application_applicant')
            ->where('application_id', $id)
            ->first();

        if(!$applicant) {
            return response()->json([
                'status' => 'error',
                'title' => 'Applicant Not Found',
                'message' => 'The applicant does not exist.'
            ], 404);
        }

        $basicInformation = (object) [
            'emp_id' => $applicant->emp_id ?? '',
            'type' => $applicant->emp_id ? 'Staff' : 'Applicant',
            'email_address' => $applicant->email_address ?? '',
            'last_name' => $applicant->last_name ?? '',
            'first_name' => $applicant->first_name ?? '',
            'middle_name' => $applicant->middle_name ?? '',
            'ext_name' => $applicant->ext_name ?? '',
            'birth_date' => $applicant->birth_date ?? '',
            'birth_place' => $applicant->birth_place ?? '',
            'gender' => $applicant->gender ?? '',
            'civil_status' => $applicant->civil_status ?? '',
            'height' => $applicant->height ?? 0,
            'weight' => $applicant->weight ?? 0,
            'blood_type' => $applicant->blood_type ?? '',
            'umid_no' => $applicant->umid_no ?? '',
            'pag_ibig_no' => $applicant->pag_ibig_no ?? '',
            'philhealth_no' => $applicant->philhealth_no ?? '',
            'philsys_no' => $applicant->philsys_no ?? '',
            'tin_no' => $applicant->tin_no ?? '',
            'agency_employee_no' => $applicant->agency_employee_no ?? '',
            'citizenship' => $applicant->citizenship ?? '',
            'citizenship_by' => $applicant->citizenship_by ?? '',
            'citizenship_country' => $applicant->citizenship_country ?? '',
            'isResidenceSameWithPermanentAddress' => (bool) ($applicant->isResidenceSameWithPermanentAddress ?? false),
            'permanent_house_no' => $applicant->permanent_house_no ?? '',
            'permanent_street' => $applicant->permanent_street ?? '',
            'permanent_subdivision' => $applicant->permanent_subdivision ?? '',
            'permanent_barangay' => $applicant->permanent_barangay ?? '',
            'permanent_barangay_name' => $applicant->permanent_barangay_name ?? '',
            'permanent_city' => $applicant->permanent_city ?? '',
            'permanent_city_name' => $applicant->permanent_city_name ?? '',
            'permanent_province' => $applicant->permanent_province ?? '',
            'permanent_province_name' => $applicant->permanent_province_name ?? '',
            'permanent_district' => $applicant->permanent_district ?? '',
            'permanent_district_name' => $applicant->permanent_district_name ?? '',
            'permanent_zip' => $applicant->permanent_zip ?? '',
            'residential_house_no' => $applicant->residential_house_no ?? '',
            'residential_street' => $applicant->residential_street ?? '',
            'residential_subdivision' => $applicant->residential_subdivision ?? '',
            'residential_barangay' => $applicant->residential_barangay ?? '',
            'residential_barangay_name' => $applicant->residential_barangay_name ?? '',
            'residential_city' => $applicant->residential_city ?? '',
            'residential_city_name' => $applicant->residential_city_name ?? '',
            'residential_province' => $applicant->residential_province ?? '',
            'residential_province_name' => $applicant->residential_province_name ?? '',
            'residential_district' => $applicant->residential_district ?? '',
            'residential_district_name' => $applicant->residential_district_name ?? '',
            'residential_zip' => $applicant->residential_zip ?? '',
            'telephone_no' => $applicant->telephone_no ?? '',
            'mobile_no' => $applicant->mobile_no ?? '',
        ];

        return response()->json($basicInformation);
    }

    public function getFamilyBackground($id)
    {
        $conn = DB::connection('mysql');

        // Fetch related family records
        $children = $conn->table('application_child')
            ->where('application_id', $id)
            ->get();

        $spouse = $conn->table('application_spouse')
            ->where('application_id', $id)
            ->first();

        $mother = $conn->table('application_mother')
            ->where('application_id', $id)
            ->first();

        $father = $conn->table('application_father')
            ->where('application_id', $id)
            ->first();

        // Build family background object
        $familyBackground = (object) [
            'isThereSpouse' => $spouse && $spouse->hasSpouse ? (bool) $spouse->hasSpouse : false,
            'spouse' => $spouse ? [
                'last_name' => $spouse->last_name ?? '',
                'first_name' => $spouse->first_name ?? '',
                'middle_name' => $spouse->middle_name ?? '',
                'ext_name' => $spouse->ext_name ?? '',
                'occupation' => $spouse->occupation ?? '',
                'employer' => $spouse->employer ?? '',
                'business_address' => $spouse->business_address ?? '',
                'telephone_no' => $spouse->telephone_no ?? '',
            ] : [],
            'father' => $father ? [
                'last_name' => $father->last_name ?? '',
                'first_name' => $father->first_name ?? '',
                'middle_name' => $father->middle_name ?? '',
                'ext_name' => $father->ext_name ?? '',
            ] : [],
            'mother' => $mother ? [
                'last_name' => $mother->last_name ?? '',
                'first_name' => $mother->first_name ?? '',
                'middle_name' => $mother->middle_name ?? '',
                'maiden_name' => $mother->maiden_name ?? '',
            ] : [],
            'children' => $children->map(function ($child) {
                return [
                    'last_name' => $child->last_name ?? '',
                    'first_name' => $child->first_name ?? '',
                    'middle_name' => $child->middle_name ?? '',
                    'ext_name' => $child->ext_name ?? '',
                    'birth_date' => $child->birth_date ?? '',
                ];
            })->toArray(),
        ];

        return response()->json($familyBackground);
    }

    private static function mapEducation($item)
    {
        return [
            'level' => $item->level ?? '',
            'course' => $item->course ?? '',
            'school' => $item->school ?? '',
            'highest_attainment' => $item->highest_attainment ?? '',
            'from_year' => $item->from_year ?? '',
            'from_date' => $item->from_date ?? '',
            'to_year' => $item->to_year ?? '',
            'to_date' => $item->to_date ?? '',
            'award' => $item->award ?? '',
            'year_graduated' => $item->year_graduated ?? '',
        ];
    }

    public function getEducationalBackground($id)
    {
        $conn = DB::connection('mysql');

        $educations = $conn->table('application_education')
            ->where('application_id', $id)
            ->get();

        // Default structure
        $educationalBackground = (object) [
            'elementary' => [],
            'secondary' => [],
            'vocational' => [],
            'college' => [],
            'graduate' => [],
        ];

        // Map level names to keys
        foreach ($educations as $edu) {
            $level = strtolower(trim($edu->level));

            if ($level === 'elementary') {
                $educationalBackground->elementary[] = self::mapEducation($edu);
            } elseif ($level === 'secondary') {
                $educationalBackground->secondary[] = self::mapEducation($edu);
            } elseif (in_array($level, ['vocational', 'vocational/trade course'])) {
                $educationalBackground->vocational[] = self::mapEducation($edu);
            } elseif ($level === 'college') {
                $educationalBackground->college[] = self::mapEducation($edu);
            } elseif (in_array($level, ['graduate', 'graduate studies'])) {
                $educationalBackground->graduate[] = self::mapEducation($edu);
            }
        }

        return response()->json($educationalBackground);
    }

    private static function mapEligibility($item)
    {
        return [
            'eligibility' => $item->eligibility ?? '',
            'rating' => $item->rating ?? '',
            'exam_date' => $item->exam_date ?? '',
            'exam_place' => $item->exam_place ?? '',
            'license_no' => $item->license_no ?? '',
            'validity_date' => $item->validity_date ?? '',
        ];
    }

    public function getCivilServiceEligibility($id)
    {
        $conn = DB::connection('mysql');

        $eligibilities = $conn->table('application_eligibility')
            ->where('application_id', $id)
            ->get();

        $civilServiceEligibilities = [];

        foreach ($eligibilities as $item) {
            $civilServiceEligibilities[] = self::mapEligibility($item);
        }

        return response()->json($civilServiceEligibilities);
    }

    private static function mapWorkExperience($item)
    {
        return [
            'agency' => $item->agency ?? '',
            'position' => $item->position ?? '',
            'appointment' => $item->appointment ?? '',
            'from_date' => $item->from_date ?? '',
            'to_date' => $item->to_date ?? '',
            'isGovtService' => $item->isGovtService ?? false,
            'isPresent' => $item->isPresent ?? false,
        ];
    }

    public function getWorkExperience($id)
    {
        $conn = DB::connection('mysql');

        $works = $conn->table('application_work_experience')
            ->where('application_id', $id)
            ->orderBy('from_date', 'desc')
            ->get();

        $workExperiences = [];

        foreach ($works as $item) {
            $workExperiences[] = self::mapWorkExperience($item);
        }

        return response()->json($workExperiences);
    }

    private static function mapVoluntaryWork($item)
    {
        return [
            'org_name' => $item->org_name ?? '',
            'from_date' => $item->from_date ?? '',
            'to_date' => $item->to_date ?? '',
            'hours' => $item->hours ?? '',
            'nature_of_work' => $item->nature_of_work ?? false,
            'isPresent' => $item->isPresent ?? false,
        ];
    }

    public function getVoluntaryWork($id)
    {
        $conn = DB::connection('mysql');

        $works = $conn->table('application_voluntary_work')
            ->where('application_id', $id)
            ->orderBy('from_date', 'desc')
            ->get();

        $voluntaryWorks = [];

        foreach ($works as $item) {
            $voluntaryWorks[] = self::mapVoluntaryWork($item);
        }

        return response()->json($voluntaryWorks);
    }

    private static function mapLearningAndDevelopment($item)
    {
        return [
            'seminar_title' => $item->seminar_title ?? '',
            'from_date' => $item->from_date ?? '',
            'to_date' => $item->to_date ?? '',
            'hours' => $item->hours ?? '',
            'participation' => $item->participation ?? '',
            'type' => $item->type ?? '',
            'conducted_by' => $item->conducted_by ?? '',
        ];
    }

    public function getLearningAndDevelopment($id)
    {
        $conn = DB::connection('mysql');

        $learnings = $conn->table('application_learning')
            ->where('application_id', $id)
            ->orderBy('from_date', 'desc')
            ->get();

        $learningAndDevelopments = [];

        foreach ($learnings as $item) {
            $learningAndDevelopments[] = self::mapLearningAndDevelopment($item);
        }

        return response()->json($learningAndDevelopments);
    }

    private static function mapOtherInformation($item)
    {
        return [
            'type' => $item->type ?? '',
            'description' => $item->description ?? '',
            'year' => $item->year ?? '',
        ];
    }

    private static function mapQuestion($item)
    {
        return [
            'item_no' => $item->item_no ?? '',
            'list' => $item->list ?? '',
            'answer' => $item->answer ?? '',
            'details' => $item->details ?? '',
        ];
    }

    private static function mapReference($item)
    {
        return [
            'name' => $item->name ?? '',
            'address' => $item->address ?? '',
            'contact_no' => $item->contact_no ?? '',
        ];
    }

    protected function getDefaultQuestions()
    {
        return [
            [
                'item_no' => '34',
                'list' => '',
                'question' => "Are you related by consanguinity or affinity to the appointing or recommending authority, or to the chief of bureau or office or to the person who has immediate supervision over you in the Office, Bureau or Department where you will be apppointed,",
                'isAnswerable' => false,
                'subQuestions' => [
                    [
                        'item_no' => '34',
                        'list' => 'A',
                        'question' => "within the third degree?",
                        'isAnswerable' => true,
                        'answer' => "no",
                        'question_details' => "If YES, give details",
                        'details' => ""
                    ],
                    [
                        'item_no' => '34',
                        'list' => 'B',
                        'question' => "within the fourth degree (for Local Government Unit - Career Employees)?",
                        'isAnswerable' => true,
                        'answer' => "no",
                        'question_details' => "If YES, give details",
                        'details' => ""
                    ],
                ]
            ],
            [
                'item_no' => '35',
                'list' => '',
                'question' => "",
                'isAnswerable' => false,
                'subQuestions' => [
                    [
                        'item_no' => '35',
                        'list' => 'A',
                        'question' => "Have you ever been found guilty of any administrative offense?",
                        'isAnswerable' => true,
                        'answer' => "no",
                        'question_details' => "If YES, give details",
                        'details' => ""
                    ],
                    [
                        'item_no' => '35',
                        'list' => 'B',
                        'question' => "Have you been criminally charged before any court?",
                        'isAnswerable' => true,
                        'answer' => "no",
                        'question_details' => "If YES, give the date of filing and the status of case/s",
                        'details' => ""
                    ],
                ]
            ],
            [
                'item_no' => '36',
                'list' => '',
                'question' => "Have you ever been convicted of any crime or violation of any law, decree, ordinance or regulation by any court or tribunal?",
                'isAnswerable' => true,
                'answer' => "no",
                'question_details' => "If YES, give details",
                'details' => ""
            ],
            [
                'item_no' => '37',
                'list' => '',
                'question' => "Have you ever been separated from the service in any of the following modes: resignation, retirement, dropped from the rolls, dismissal, termination, end of term, finished contract or phased out (abolition) in the public or private sector?",
                'isAnswerable' => true,
                'answer' => "no",
                'question_details' => "If YES, give details",
                'details' => ""
            ],
            [
                'item_no' => '38',
                'list' => '',
                'question' => "",
                'isAnswerable' => false,
                'subQuestions' => [
                    [
                        'item_no' => '38',
                        'list' => 'A',
                        'question' => "Have you ever been a candidate in a national or local election held within the last year (except Barangay election)?",
                        'isAnswerable' => true,
                        'answer' => "no",
                        'question_details' => "If YES, give details",
                        'details' => ""
                    ],
                    [
                        'item_no' => '38',
                        'list' => 'B',
                        'question' => "Have you resigned from the government service during the three (3)-month period before the last election to promote/actively campaign for a national or local candidate?",
                        'isAnswerable' => true,
                        'answer' => "no",
                        'question_details' => "If YES, give details (country)",
                        'details' => ""
                    ],
                ]
            ],
            [
                'item_no' => '39',
                'list' => '',
                'question' => "Have you acquired the status of an immigrant or permanent resident of another country?",
                'isAnswerable' => true,
                'answer' => "no",
                'question_details' => "If YES, give details",
                'details' => ""
            ],
            [
                'item_no' => '40',
                'list' => '',
                'question' => "Pursuant to: (a) Indigenous People's Act (RA 8371) (b) Magna Carta for Disabled Persons (RA 7277) and (c) Solo Parents Welfare Act of 2000 (RA 8972), please answer the following items:",
                'isAnswerable' => false,
                'subQuestions' => [
                    [
                        'item_no' => '40',
                        'list' => 'A',
                        'question' => "Are you a member of any indigenous group?",
                        'isAnswerable' => true,
                        'answer' => "no",
                        'question_details' => "If YES, please specify",
                        'details' => ""
                    ],
                    [
                        'item_no' => '40',
                        'list' => 'B',
                        'question' => "Are you a person with disability?",
                        'isAnswerable' => true,
                        'answer' => "no",
                        'question_details' => "If YES, please specify ID No.",
                        'details' => ""
                    ],
                    [
                        'item_no' => '40',
                        'list' => 'C',
                        'question' => "Are you a solo parent?",
                        'isAnswerable' => true,
                        'answer' => "no",
                        'question_details' => "If YES, please specify ID No.",
                        'details' => ""
                    ],
                ]
            ],
        ];
    }

    public function getOtherInformation($id)
    {
        $conn = DB::connection('mysql');

        $otherInfos = $conn->table('application_other_info')
            ->where('application_id', $id)
            ->get();

        $questions = $conn->table('application_question')
            ->where('application_id', $id)
            ->get();

        $references = $conn->table('application_reference')
            ->where('application_id', $id)
            ->get();

        $otherInformation = (object) [
            'skills' => [],
            'recognitions' => [],
            'memberships' => [],
            'questions' => [],
            'references' => [],
        ];

        // Map level names to keys
        foreach ($otherInfos as $item) {
            $type = strtolower(trim($item->type));

            if ($type === 'hobbies') {
                $otherInformation->skills[] = self::mapOtherInformation($item);
            } elseif ($type === 'recognition') {
                $otherInformation->recognitions[] = self::mapOtherInformation($item);
            } elseif ($type === 'membership') {
                $otherInformation->memberships[] = self::mapOtherInformation($item);
            }
        }

        $defaultQuestions = $this->getDefaultQuestions();

        $answered = [];
        foreach ($questions as $q) {
            $key = $q->item_no . ($q->list ? '-' . $q->list : '');
            $answered[$key] = [
                'answer' => strtolower($q->answer ?? 'no'),
                'details' => $q->details ?? '',
            ];
        }

        foreach ($defaultQuestions as $question) {
            // If has subQuestions
            if (!empty($question['subQuestions'])) {
                foreach ($question['subQuestions'] as &$subQ) {
                    $key = $subQ['item_no'] . ($subQ['list'] ? '-' . $subQ['list'] : '');
                    if (isset($answered[$key])) {
                        $subQ['answer'] = $answered[$key]['answer'];
                        $subQ['details'] = $answered[$key]['details'];
                    }
                }
            } else {
                // If top-level question is answerable
                $key = $question['item_no'];
                if (isset($answered[$key])) {
                    $question['answer'] = $answered[$key]['answer'];
                    $question['details'] = $answered[$key]['details'];
                }
            }

            $otherInformation->questions[] = $question;
        }

        foreach ($references as $item) {
            $otherInformation->references[] = self::mapReference($item);
        }

        return response()->json($otherInformation);
    }
}
