<?php

namespace App\Http\Controllers\JobPortal;

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
use Illuminate\Pagination\LengthAwarePaginator;
use App\Traits\FetchCivilServiceEligibilityFiles;
use App\Traits\FetchLearningAndDevelopmentFiles;
use App\Traits\FetchEducationalBackgroundFiles;
use App\Traits\FetchWorkExperienceFiles;
use App\Traits\FetchRequirementFiles;
use App\Traits\CopiesApplicationData;
use App\Notifications\NotifyApplicantOfApplicationSubmission;


class JobsController extends Controller
{
    use FetchCivilServiceEligibilityFiles;
    use FetchLearningAndDevelopmentFiles;
    use FetchEducationalBackgroundFiles;
    use FetchWorkExperienceFiles;
    use FetchRequirementFiles;
    use CopiesApplicationData;

    public function index(Request $request)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $divisions = $conn3->table('tbldivision')
            ->select('division_id', 'division_name')
            ->get()
            ->pluck('division_name', 'division_id');

        $publicationIds = $conn2->table('publication')
        ->where('is_public', 1)
        ->whereRaw("CONCAT(date_closed, ' 23:59:59') >= NOW()")
        ->pluck('id');

        $vacancyIds = $conn2->table('publication_vacancies')
        ->whereIn('publication_id', $publicationIds)
        ->distinct()
        ->pluck('vacancy_id');

        $vacancies = $conn2->table('vacancy as v')
            ->select([
                'v.id',
                'v.reference_no',
                'v.appointment_status',
                'v.item_no',
                'v.position',
                'v.position_description',
                'v.division',
                'v.sg',
                'v.step',
                'v.monthly_salary',
                'v.classification',
                'v.prescribed_eligibility',
                'v.prescribed_education',
                'v.prescribed_experience',
                'v.prescribed_training',
                'v.preferred_eligibility',
                'v.preferred_education',
                'v.preferred_experience',
                'v.preferred_training',
                'v.summary',
                'v.output',
                'v.examination',
                'v.responsibility',
                'v.status',
                'v.remarks',
                'p.id as publication_id',
                'p.date_published',
                'p.date_closed',
                'p.time_closed',
            ])
            ->leftJoin('publication_vacancies as pv', 'pv.vacancy_id', '=', 'v.id')
            ->leftJoin('publication as p', 'p.id', '=', 'pv.publication_id')
            ->whereIn('v.id', $vacancyIds)
            ->where('p.is_public', 1);

        if ($search = $request->input('search')) {
            $vacancies->where(function ($q) use ($search) {
                $q->where('v.position_description', 'LIKE', "%{$search}%")
                ->orWhere('v.position', 'LIKE', "%{$search}%")
                ->orWhere('v.item_no', 'LIKE', "%{$search}%");
            });
        }

        if ($filters = $request->input('filter')) {
            if (!empty($filters['division'])) {
                $vacancies->where('v.division', $filters['division']);
            }
            if (!empty($filters['sg'])) {
                $vacancies->where('v.sg', $filters['sg']);
            }
            if (!empty($filters['appointment_status'])) {
                $vacancies->where('v.appointment_status', $filters['appointment_status']);
            }
        }

        $vacancies = $vacancies->paginate(5)->withQueryString();

        $competencies = $conn2->table('vacancy_competencies as vc')
            ->leftJoin('competency as c', 'vc.competency_id', '=', 'c.comp_id')
            ->whereIn('vacancy_id', $vacancyIds)
            ->select(
                'vc.vacancy_id',
                'c.comp_id as value',
                DB::raw('CONCAT(c.competency, " (Level ", vc.level, ")") as label'),
                'c.competency',
                'vc.level',
                'c.comp_type'
            )
            ->get()
            ->groupBy('vacancy_id');

        $requirements = $conn2->table('vacancy_requirements')
            ->whereIn('vacancy_id', $vacancyIds)
            ->get()
            ->groupBy('vacancy_id');

        $applications = $conn->table('application as a')
        ->select([
            'a.id',
            'a.vacancy_id',
            'a.publication_id',
            'a.status',
            'a.date_submitted',
            's.status as latest_status',
            's.created_at as status_date'
        ])
        ->leftJoin('applicant as ap', 'a.applicant_id', '=', 'ap.id')
        ->leftJoin('application_status as s', function ($join) {
            $join->on('s.application_id', '=', 'a.id')
                 ->whereRaw('s.id = (
                    SELECT MAX(id) FROM application_status WHERE application_id = a.id
                 )');
        })
        ->where('a.user_id', auth()->user()->id)
        ->where('ap.type', auth()->user()->ipms_id ? 'Staff' : 'Applicant')
        ->get()
        ->groupBy('vacancy_id');

        $vacancies->transform(function ($vacancy) use ($divisions, $competencies, $applications, $requirements) {
            $vacancy->hashed_id = sha1($vacancy->id);
            $vacancy->division_name = $divisions->get($vacancy->division);

            $vacancyCompetencies = $competencies->get($vacancy->id, collect());

            $vacancy->requirements = $requirements->get($vacancy->id, collect());

            $vacancy->competencies = $vacancyCompetencies->groupBy('comp_type')->map(function ($items) {
                return $items->values();
            });

            $vacancy->application = $applications->get($vacancy->id)?->first();

            return $vacancy;
        });

        $latestApp = $conn->table('application as a')
            ->leftJoin('applicant as ap', 'application.applicant_id', '=', 'ap.id')
            ->where('a.user_id', auth()->user()->id)
            ->where('ap.type', auth()->user()->ipms_id ? 'Staff' : 'Applicant')
            ->where('a.status', 'Submitted')
            ->latest('a.date_submitted')
            ->first();
            
        return Inertia::render('JobPortal/index', [
            'data' => [
                'jobs' => $vacancies,
                'latest_application' => $latestApp,
                'filters' => $request->only(['search', 'filter']),
            ],
        ]);
    }

    public function store($hashedId, Request $request)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');

        $vacancy = $conn2->table('vacancy as v')
        ->select([
            'v.id',
            'p.id as publication_id',
            'p.date_closed'
        ])
        ->leftJoin('publication_vacancies as pv', 'pv.vacancy_id', '=', 'v.id')
        ->leftJoin('publication as p', 'p.id', '=', 'pv.publication_id')
        ->whereRaw("SHA1(v.id) = ?", [$hashedId])
        ->first();

        if (!$vacancy) {
            abort(404, 'Job not found');
        }

        $user = auth()->user();

        $existingApp = $conn->table('application')
            ->leftJoin('applicant', 'application.applicant_id', '=', 'applicant.id')
             ->when(is_null($user->ipms_id), function ($query) {
                return $query->where('applicant.type', 'Applicant');
            }, function ($query) {
                return $query->where('applicant.type', 'Staff');
            })
            ->where('vacancy_id', $vacancy->id)
            ->where('application.user_id', $user->id)
            ->first();

        if ($existingApp) {
            return redirect()->route('jobs.apply', $hashedId)
                ->with('status', 'info')
                ->with('message', 'You already have an application for this job.');
        }

        $vacancyRequirements = $conn2->table('vacancy_requirements')
            ->where('vacancy_id', $vacancy->id)
            ->get();

        try{
            $conn->beginTransaction();

            $applicant = $conn->table('applicant')
            ->when(is_null($user->ipms_id), function ($query) {
                return $query->where('type', 'Applicant');
            }, function ($query) {
                return $query->where('type', 'Staff');
            })
            ->where('user_id', $user->id)
            ->first();

            if (!$applicant) {
                $data = [
                    'user_id' => auth()->user()->id,
                    'type'    => is_null($user->ipms_id) ? 'Applicant' : 'Staff',
                ];

                $applicantId = $conn->table('applicant')->insertGetId($data);
            } else {
                $applicantId = $applicant->id;
            }

            $newAppId = $conn->table('application')->insertGetId([
                'publication_id' => $vacancy->publication_id,
                'vacancy_id'     => $vacancy->id,
                'user_id'        => auth()->user()->id,
                'applicant_id'   => $applicantId,
                'type'           => $request['type'] ?? 'manual',
                'date_created'   => now(),
                'status'         => 'Draft',
            ]);

            $conn->table('application_status')
            ->insert([
                'application_id' => $newAppId,
                'status' => 'Draft',
                'created_by' => auth()->user()->id,
                'created_at' => now()
            ]);

            $filesToCopy = collect();

            if($request['type'] === 'reuse') {

                $lastApplication = $conn->table('application')
                ->where('user_id', auth()->id())
                ->where('status', 'Submitted')
                ->where('id', '<>', $newAppId)
                ->orderByDesc('date_submitted')
                ->first();

                if ($lastApplication && $vacancyRequirements->count() > 0) {

                    // Get all previous requirements that match this applicant and last vacancy
                    $latestRequirements = $conn->table('application_requirement')
                    ->where('applicant_id', $applicantId)
                    ->where('vacancy_id', $lastApplication->vacancy_id)
                    ->whereIn('requirement_id', $vacancyRequirements->pluck('requirement_id'))
                    ->get();

                    if ($latestRequirements->isNotEmpty()) {
                        // Collect requirement data for insert (new vacancy)
                        $requirementsToInsert = $latestRequirements->map(function ($req) use ($newAppId, $vacancy, $applicantId) {
                            return [
                                'applicant_id'   => $applicantId,
                                'vacancy_id'     => $vacancy->id,
                                'requirement_id' => $req->requirement_id,
                                'requirement'    => $req->requirement,
                                'sub_requirement_id' => $req->sub_requirement_id,   
                                'created_by'     => auth()->id(),
                                'created_at'     => now(),
                            ];
                        });

                        $conn->table('application_requirement')->insert($requirementsToInsert->toArray());

                        // Fetch the newly inserted ones (latest IDs by created_at)
                        $newRequirements = $conn->table('application_requirement')
                            ->where('applicant_id', $applicantId)
                            ->where('vacancy_id', $vacancy->id)
                            ->orderByDesc('id')
                            ->take($requirementsToInsert->count())
                            ->get();

                        // Map old requirement_id → new id for easy reference
                        $idMap = $latestRequirements->pluck('requirement_id', 'id')->mapWithKeys(function ($requirement_id, $oldId) use ($newRequirements) {
                            $new = $newRequirements->firstWhere('requirement_id', $requirement_id);
                            return [$oldId => $new?->id];
                        });

                        // Fetch old files
                        $requirementIds = $latestRequirements->pluck('id');
                        $requirementFiles = $conn->table('file')
                        ->whereIn('itemId', $requirementIds)
                        ->where('model', 'like', 'Vacancy_' . $lastApplication->vacancy_id . '\_%')
                        ->get();

                        if ($requirementFiles->isNotEmpty()) {
                            // Prepare new files
                            $filesToInsert = $requirementFiles->map(function ($file) use ($vacancy, $idMap) {
                                $newModel = preg_replace(
                                    '/^Vacancy_(\d+)_/',
                                    'Vacancy_' . $vacancy->id . '_',
                                    $file->model
                                );

                                return [
                                    'name'        => $file->name,
                                    'model'       => $newModel,
                                    'itemId'      => $idMap[$file->itemId] ?? null,
                                    'hash'        => $file->hash,
                                    'size'        => $file->size,
                                    'type'        => $file->type,
                                    'mime'        => $file->mime,
                                    'is_main'     => $file->is_main,
                                    'date_upload' => now()->timestamp,
                                    'sort'        => $file->sort,
                                    'path'        => $file->path,
                                ];
                            })->filter(fn($f) => !is_null($f['itemId']));

                            if ($filesToInsert->isNotEmpty()) {
                                $conn->table('file')->insert($filesToInsert->toArray());
                            }
                        }
                    }
                }
            }

            $conn->commit();

            return redirect()->route('jobs.apply', $hashedId)
                ->with('status', 'success')
                ->with('message', 'Application created successfully.');

        } catch (\Exception $e) {
            $conn->rollBack();
            Log::error('Error on saving application: ' . $e->getMessage());

            return back()->with([
                'status'  => 'error',
                'title'   => 'Error',
                'message' => 'An error occurred while saving application.',
            ]);
        }
    }

    public function apply($hashedId)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $divisions = $conn3->table('tbldivision')
            ->select('division_id', 'division_name')
            ->get()
            ->pluck('division_name', 'division_id');

        $vacancy = $conn2->table('vacancy as v')
        ->select([
            'v.id as id',
            'v.*',
            'p.date_published',
            'p.date_closed',
            'p.time_closed',
        ])
        ->leftJoin('publication_vacancies as pv', 'pv.vacancy_id', '=', 'v.id')
        ->leftJoin('publication as p', 'p.id', '=', 'pv.publication_id')
        ->whereRaw("SHA1(v.id) = ?", [$hashedId])
        ->first();

        if (!$vacancy) {
            abort(404, 'Job not found');
        }

        // Deadline is due
        if (now()->toDateString() > $vacancy->date_closed) {
            abort(404, 'Job not found');
        }

        $user = auth()->user();

        $applicant = $conn->table('applicant')
        ->when(is_null($user->ipms_id), function ($query) {
            return $query->where('type', 'Applicant');
        }, function ($query) {
            return $query->where('type', 'Staff');
        })
        ->where('user_id', $user->id)
        ->first();

        if (!$applicant) {
            abort(404, 'Applicant not found');
        }

        $application = $conn->table('application as a')
            ->leftJoin('applicant as ap', 'a.applicant_id', '=', 'ap.id')
            ->leftJoin('application_status as s', function ($join) {
                $join->on('s.application_id', '=', 'a.id')
                    ->whereRaw('s.id = (
                        SELECT MAX(id) FROM application_status WHERE application_id = a.id
                    )');
            })
            ->where('a.vacancy_id', $vacancy->id)
            ->where('a.user_id', $user->id)
            ->when(is_null($user->ipms_id), function ($query) {
                return $query->where('ap.type', 'Applicant');
            }, function ($query) {
                return $query->where('ap.type', 'Staff');
            })
            ->select('a.*', 's.status as latest_status')
            ->first();

        if (!$application) {
            abort(404, 'Job not found');
        }

        if ($application && strtolower(trim($application->latest_status)) !== 'draft') {
            abort(404, 'Job not found');
        }
    
        $requirements = $conn2->table('vacancy_requirements')
        ->whereRaw("SHA1(vacancy_id) = ?", [$hashedId])
        ->get()
        ->groupBy('vacancy_id');

        $competencies = $conn2->table('vacancy_competencies as vc')
            ->leftJoin('competency as c', 'vc.competency_id', '=', 'c.comp_id')
            ->whereRaw("SHA1(vacancy_id) = ?", [$hashedId])
            ->select(
                'vc.vacancy_id',
                'c.comp_id as value',
                DB::raw('CONCAT(c.competency, " (Level ", vc.level, ")") as label'),
                'c.competency',
                'vc.level',
                'c.comp_type'
            )
            ->get();

        $vacancy->hashed_id = sha1($vacancy->id);
        $vacancy->requirements = $requirements->get($vacancy->id, collect());
        $vacancy->division_name = $divisions->get($vacancy->division);

        $vacancy->competencies = $competencies->groupBy('comp_type')->map(function ($items) {
            return $items->values();
        });

        $progress = $conn->table('applicant_pds')
            ->leftJoin('applicant', 'applicant.id', '=', 'applicant_pds.applicant_id')
            ->where('applicant.user_id', $user->id)
            ->when(is_null($user->ipms_id), function ($query) {
                return $query->where('applicant.type', 'Applicant');
            }, function ($query) {
                return $query->where('applicant.type', 'Staff');
            })
            ->count();

        return Inertia::render('JobPortal/apply', [
            'job' => $vacancy,
            'applicant' => $applicant,
            'progress' => ($progress / 8)*100
        ]);
    }

    public function submit($hashedId)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $vacancy = $conn2->table('vacancy as v')
        ->select([
            'v.id as id',
            'v.*',
            'p.date_published',
            'p.date_closed',
        ])
        ->leftJoin('publication_vacancies as pv', 'pv.vacancy_id', '=', 'v.id')
        ->leftJoin('publication as p', 'p.id', '=', 'pv.publication_id')
        ->whereRaw("SHA1(v.id) = ?", [$hashedId])
        ->first();

        if (!$vacancy) {
            abort(404, 'Job not found');
        }

        if (now()->toDateString() > $vacancy->date_closed) {
            abort(404, 'Job not found');
        }

        $user = auth()->user();

        $applicant = $conn->table('applicant')
        ->when(is_null($user->ipms_id), function ($query) {
            return $query->where('type', 'Applicant');
        }, function ($query) {
            return $query->where('type', 'Staff');
        })
        ->where('user_id', $user->id)
        ->first();

        if (!$applicant) {
            abort(404, 'Applicant not found');
        }

       $application = $conn->table('application as a')
        ->select('a.*')
        ->leftJoin('applicant as ap', 'a.applicant_id', '=', 'ap.id')
        ->where('vacancy_id', $vacancy->id)
        ->where('a.user_id', $user->id)
        ->when(is_null($user->ipms_id), function ($query) {
            return $query->where('ap.type', 'Applicant');
        }, function ($query) {
            return $query->where('ap.type', 'Staff');
        })
        ->first();

        if(!$application) {
            abort(404, 'Job not found');
        }

         try{
            $conn->beginTransaction();

            if ($application) {
                /* update application status as Submitted */
                $conn->table('application')
                    ->where('id', $application->id)
                    ->update([
                        'status' => 'Submitted',
                        'date_submitted' => now()
                    ]);

                /* insert new status as Application Received */
                $conn->table('application_status')
                    ->insert([
                        'application_id' => $application->id,
                        'status' => 'Application Received',
                        'created_by' => auth()->user()->id,
                        'created_at' => now()
                    ]);

                $copies = [
                    ['applicant', 'application_applicant', true],
                    ['applicant_child', 'application_child'],
                    ['applicant_education', 'application_education'],
                    ['applicant_eligibility', 'application_eligibility'],
                    ['applicant_father', 'application_father', true],
                    ['applicant_learning', 'application_learning'],
                    ['applicant_mother', 'application_mother', true],
                    ['applicant_other_info', 'application_other_info'],
                    ['applicant_question', 'application_question'],
                    ['applicant_reference', 'application_reference'],
                    ['applicant_spouse', 'application_spouse', true],
                    ['applicant_voluntary_work', 'application_voluntary_work'],
                    ['applicant_work_experience', 'application_work_experience'],
                ];

                foreach ($copies as $copy) {
                    [$source, $target, $single] = array_pad($copy, 3, null);

                    $this->copiesApplicationData($source, $target, $applicant->id, $application->id, $single);
                }
            }

            $conn->commit();

            try {
                // notify applicant
                app(\App\Http\Controllers\JobPortal\NotificationController::class)
                    ->submitApplication($application->id);

                // notify HR
                app(\App\Http\Controllers\JobPortal\NotificationController::class)
                    ->receiveApplication($application->id);

            } catch (\Throwable $notifyError) {
                \Log::error('Notification sending failed: ' . $notifyError->getMessage());
            }

            return redirect()->route('my-applications.index')
                ->with('status', 'success')
                ->with('title', 'Success!')
                ->with('message', 'You have successfully submitted your application');


        } catch (\Exception $e) {
            $conn->rollBack();

            Log::error('Error on submitting application: ' . $e->getMessage());

            return back()->with([
                'status'  => 'error',
                'title'   => 'Error',
                'message' => 'An error occurred while submitting application.',
            ]);
        }
    }

    public function getRequirements($hashedId)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $vacancy = $conn2->table('vacancy')
        ->whereRaw("SHA1(vacancy.id) = ?", [$hashedId])
        ->first();

        if (!$vacancy) {
            abort(404, 'Job not found');
        }

        $user = auth()->user();

        $applicant = $conn->table('applicant')
        ->when(is_null($user->ipms_id), function ($query) {
            return $query->where('type', 'Applicant');
        }, function ($query) {
            return $query->where('type', 'Staff');
        })
        ->where('user_id', $user->id)
        ->first();

        if (!$applicant) {
            abort(404, 'Applicant not found');
        }

        $application = $conn->table('application as a')
        ->leftJoin('applicant as ap', 'a.applicant_id', '=', 'ap.id')
        ->where('vacancy_id', $vacancy->id)
        ->where('a.user_id', $user->id)
        ->when(is_null($user->ipms_id), function ($query) {
            return $query->where('ap.type', 'Applicant');
        }, function ($query) {
            return $query->where('ap.type', 'Staff');
        })
        ->first();

        if(!$application) {
            abort(404, 'Job not found');
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

        $educations = $this->fetchEducationalBackgroundFiles($applicant, $vacancy->id, $request['type'] ?? 'manual');
        $eligibilities = $this->fetchCivilServiceEligibilityFiles($applicant, $vacancy->id, $request['type'] ?? 'manual');
        $learnings = $this->fetchLearningAndDevelopmentFiles($applicant, $vacancy->id, $request['type'] ?? 'manual');
        $works = $this->fetchWorkExperienceFiles($applicant, $vacancy->id, $request['type'] ?? 'manual');

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
        ->whereRaw("SHA1(vacancy_id) = ?", [$hashedId])
        ->get()
        ->map(function ($req) use (
            $applicant,
            $vacancy,
            $educationReq,
            $educations,
            $eligibilityReq,
            $eligibilities,
            $learningReq,
            $learnings,
            $workReq,
            $works,
        ) {
            $req->files = $this->fetchRequirementFiles($applicant->id, $vacancy->id, $req, $application->type ?? 'manual');

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

        return response()->json($requirements);
    }

    public function storeRequirement($hashedId, Request $request)
    {
        $conn = DB::connection('mysql');  
        $conn2 = DB::connection('mysql2'); 

        $request->validate([
            'newFiles'   => 'required|array|min:1',
            'newFiles.*' => 'required|file|mimes:pdf|max:5120',
        ], [
            'newFiles.required'      => 'A file must be uploaded.',
            'newFiles.array'         => 'Files must be an array.',
            'newFiles.min'           => 'You must upload at least one file.',
            'newFiles.*.required'    => 'A file is required.',
            'newFiles.*.file'        => 'Uploaded file must be valid.',
            'newFiles.*.mimes'       => 'File must be a PDF.',
            'newFiles.*.max'         => 'File may not be greater than 5 MB.',
        ]);

        try{
            $conn->beginTransaction();
            $conn2->beginTransaction();

            $userId     = auth()->user()->id;
            $applicantId = $request['applicant_id'];
            $vacancyId = $request['vacancy_id'];
            $requirementIdInput = $request['requirement_id'];
            $subRequirementIdInput = $request->input('sub_requirement_id');
            $requirementName    = $request['requirement'];
            $model    = $request['model'];

            $requirementIdInput = ($requirementIdInput === "null" || $requirementIdInput === "") ? null : $requirementIdInput;
            $subRequirementIdInput = ($subRequirementIdInput === "null" || $subRequirementIdInput === "") ? null : $subRequirementIdInput;

            $baseWhere = [
                'applicant_id'   => $applicantId,
                'requirement_id' => $requirementIdInput,
                'requirement'    => $requirementName,
            ];

            if ($subRequirementIdInput) {
                $baseWhere['sub_requirement_id'] = $subRequirementIdInput;
            }

            // ---------------------------
            // Applicant Requirement
            // ---------------------------
            $existingApplicantRequirement = $conn->table('applicant_requirement')
            ->where($baseWhere)
            ->first();

            if ($existingApplicantRequirement) {
                // delete old files
                $oldFiles = $conn->table('file')
                    ->where('model', $requirementName)
                    ->where('itemId', $existingApplicantRequirement->id)
                    ->get();

                foreach ($oldFiles as $oldFile) {
                    Storage::disk('public')->delete($oldFile->path);
                    $conn->table('file')->where('id', $oldFile->id)->delete();
                }

                $requirementId = $existingApplicantRequirement->id;

                $conn->table('applicant_requirement')
                    ->where('id', $requirementId)
                    ->update([
                        'updated_at' => now(),
                        'updated_by' => $userId,
                    ]);
            } else {
                $data = array_merge($baseWhere, [
                    'created_by' => $userId,
                    'created_at' => now(),
                ]);

                $requirementId = $conn->table('applicant_requirement')->insertGetId($data);
            }

            // ---------------------------
            // Application Requirement
            // ---------------------------
            $applicationWhere = array_merge($baseWhere, [
                'vacancy_id' => $vacancyId,
            ]);

            $existingApplicationRequirement = $conn->table('application_requirement')
            ->where($applicationWhere)
            ->first();

            if ($existingApplicationRequirement) {
                $oldFiles = $conn->table('file')
                    ->where('model', 'Vacancy_'.$vacancyId.'_'.$requirementName)
                    ->where('itemId', $existingApplicationRequirement->id)
                    ->get();

                foreach ($oldFiles as $oldFile) {
                    Storage::disk('public')->delete($oldFile->path);
                    $conn->table('file')->where('id', $oldFile->id)->delete();
                }

                $applicationRequirementId = $existingApplicationRequirement->id;

                $conn->table('application_requirement')
                    ->where('id', $applicationRequirementId)
                    ->update([
                        'updated_at' => now(),
                        'updated_by' => $userId,
                    ]);
            } else {
                $data = array_merge($applicationWhere, [
                    'created_by' => $userId,
                    'created_at' => now(),
                ]);

                $applicationRequirementId = $conn->table('application_requirement')->insertGetId($data);
            }

            // ---------------------------
            // File Upload
            // ---------------------------
            if ($request->hasFile('newFiles')) {
                $vacancy = $conn2->table('vacancy')->where('id', $vacancyId)->first();
                if (!$vacancy) {
                    abort(404, 'Job not found');
                }

                foreach ($request->file('newFiles') as $file) {
                    $filename = Str::random(20) . '_' . time() . '.' . $file->getClientOriginalExtension();

                    // Save to general folder
                    $generalFilePath = $file->storeAs(
                        'uploads/application/requirements/general/' . $requirementName,
                        $filename,
                        'public'
                    );

                    $conn->table('file')->insert([
                        'model'       => $requirementName,
                        'itemId'      => $requirementId,
                        'name'        => $file->getClientOriginalName(),
                        'path'        => $generalFilePath,
                        'size'        => $file->getSize(),
                        'mime'        => $file->getMimeType(),
                        'hash'        => $file->hashName(),
                        'type'        => $file->getClientOriginalExtension(),
                        'date_upload' => now()->timestamp,
                    ]);

                    // Save to application-specific folder
                    $applicationFilePath = $file->storeAs(
                        'uploads/application/requirements/' . $vacancy->reference_no . '/' . $requirementName,
                        $filename,
                        'public'
                    );

                    $conn->table('file')->insert([
                        'model'       => 'Vacancy_'.$vacancyId.'_'.$requirementName,
                        'itemId'      => $applicationRequirementId,
                        'name'        => $file->getClientOriginalName(),
                        'path'        => $applicationFilePath,
                        'size'        => $file->getSize(),
                        'mime'        => $file->getMimeType(),
                        'hash'        => $file->hashName(),
                        'type'        => $file->getClientOriginalExtension(),
                        'date_upload' => now()->timestamp,
                    ]);
                }
            }

            $conn->commit();
            $conn2->commit();

            return redirect()->back()->with([
                'status'  => 'success',
                'title'   => 'Success',
                'message' => 'File uploaded successfully!',
            ]);
        } catch (\Exception $e) {
            $conn->rollBack();
            $conn2->rollBack();
            Log::error('Error on attaching requirement: ' . $e->getMessage());

            return back()->with([
                'status'  => 'error',
                'title'   => 'Error',
                'message' => 'An error occurred while saving requirement.',
            ]);
        }
    }

    public function destroyRequirement($hashedId, $requirementId, $id)
    {
        $conn = DB::connection('mysql');  
        $conn2 = DB::connection('mysql2');  

        $vacancy = $conn2->table('vacancy')
        ->whereRaw("SHA1(id) = ?", [$hashedId])
        ->first();

        $file = $conn->table('file')->where('id', $id)->first();

        try{
            $conn->beginTransaction();

            if ($vacancy && $file) {

                $requirement = $conn2->table('vacancy_requirements')
                ->where('vacancy_id', $vacancy->id)
                ->where('requirement_id', $requirementId)
                ->first();

                if($requirement) {
                    $vacancyFile = $conn->table('file')
                    ->where('name', $file->name)
                    ->where('model', 'Vacancy_'.$vacancy->id.'_'.$requirement->requirement)
                    ->first();

                    $fileCount = $conn->table('file')
                    ->where('path', $file->path)
                    ->count();

                    if ($vacancyFile) {
                        $conn->table('application_requirement')
                            ->where('id', $vacancyFile->itemId)
                            ->delete();

                        if (!empty($vacancyFile->path) && $fileCount === 2) {
                            Storage::delete($vacancyFile->path);
                        }

                        $conn->table('file')
                        ->where('name', $file->name)
                        ->where('model', 'Vacancy_'.$vacancy->id.'_'.$requirement->requirement)
                        ->delete();
                    }

                    $conn->table('applicant_requirement')
                        ->where('id', $file->itemId)
                        ->delete();

                    
                }
            }

            $conn->commit();
        
        } catch (\Exception $e) {
            $conn->rollBack();
            Log::error('Error on deleting requirement: ' . $e->getMessage());

            return back()->with([
                'status'  => 'error',
                'title'   => 'Error',
                'message' => 'An error occurred while deleting requirement.',
            ]);
        }

        return back()->with('success', 'Attachment deleted successfully.');
    }
}
