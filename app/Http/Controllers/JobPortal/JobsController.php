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


class JobsController extends Controller
{
    use FetchCivilServiceEligibilityFiles;
    use FetchLearningAndDevelopmentFiles;
    use FetchEducationalBackgroundFiles;
    use FetchWorkExperienceFiles;
    use FetchRequirementFiles;

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
        ->whereRaw("CONCAT(date_closed, ' ', time_closed) >= NOW()")
        ->pluck('id');

        $vacancyIds = $conn2->table('publication_vacancies')
        ->whereIn('publication_id', $publicationIds)
        ->distinct()
        ->pluck('vacancy_id');

        $vacancies = $conn2->table('vacancy as v')
            ->select([
                'v.id as id',
                'v.*',
                'p.date_published',
                'p.date_closed',
                'p.time_closed',
            ])
            ->leftJoin('publication_vacancies as pv', 'pv.vacancy_id', '=', 'v.id')
            ->leftJoin('publication as p', 'p.id', '=', 'pv.publication_id')
            ->whereIn('v.id', $vacancyIds)
            ->paginate(20);

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

        $vacancies->transform(function ($vacancy) use ($divisions, $competencies) {
            $vacancy->hashed_id = sha1($vacancy->id);
            $vacancy->division_name = $divisions->get($vacancy->division);

            $vacancyCompetencies = $competencies->get($vacancy->id, collect());

            $vacancy->competencies = $vacancyCompetencies->groupBy('comp_type')->map(function ($items) {
                return $items->values();
            });

            return $vacancy;
        });

        $latestApp = $conn->table('application')
            ->where('user_id', auth()->user()->id)
            ->where('status', 'Submitted')
            ->latest('date_submitted')
            ->first();

        return Inertia::render('JobPortal/index', [
            'data' => [
                'jobs' => $vacancies,
                'latest_application' => $latestApp,
            ],
        ]);
    }

    public function store($hashedId, Request $request)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');

        try{
            $conn->beginTransaction();

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

            $existingApp = $conn->table('application')
                ->where('vacancy_id', $vacancy->id)
                ->where('user_id', auth()->id())
                ->first();

            if ($existingApp) {
                return redirect()->route('jobs.apply', $hashedId)
                    ->with('status', 'info')
                    ->with('message', 'You already have an application for this job.');
            }

            $latestApp = $conn->table('application')
                ->where('user_id', auth()->user()->id)
                ->where('status', 'Submitted')
                ->latest('date_submitted')
                ->first();

            $newAppId = $conn->table('application')->insertGetId([
                'publication_id' => $vacancy->publication_id,
                'vacancy_id'     => $vacancy->id,
                'user_id'        => auth()->id(),
                'type'           => $request['type'] ?? 'manual',
                'date_submitted' => now(),
                'status'         => 'Draft',
            ]);

            if($request->has('type') && $request['type'] === 'reuse' && $latestApp){

                $copySingle = function ($table) use ($conn, $latestApp, $newAppId) {
                    $record = $conn->table($table)->where('application_id', $latestApp->id)->first();
                    if ($record) {
                        $data = (array) $record;
                        unset($data['id']);
                        $data['application_id'] = $newAppId;
                        $conn->table($table)->insert($data);
                    }
                };

                $copyMultiple = function ($table) use ($conn, $latestApp, $newAppId) {
                    $records = $conn->table($table)->where('application_id', $latestApp->id)->get();
                    if ($records->isNotEmpty()) {
                        $data = $records->map(function ($record) use ($newAppId) {
                            $row = (array) $record;
                            unset($row['id']);
                            $row['application_id'] = $newAppId;
                            return $row;
                        })->toArray();
                        $conn->table($table)->insert($data);
                    }
                };

                foreach ([
                    'application_applicant', 
                    'application_father', 
                    'application_mother', 
                    'application_spouse'
                ] as $table) {
                    $copySingle($table);
                }

                foreach ([
                    'application_child', 
                    'application_education', 
                    'application_eligibility', 
                    'application_learning', 
                    'application_other_info', 
                    'application_question', 
                    'application_reference', 
                    'application_voluntary_work', 
                    'application_work_experience', 
                ] as $table) {
                    $copyMultiple($table);
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

        $applicant = $conn->table('applicant')
        ->where('user_id', auth()->user()->id)
        ->first();

        if (!$applicant) {
            $conn->table('applicant')->insert([
                'user_id' => auth()->user()->id,
            ]);
        }

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

        $application = $conn->table('application')
        ->where('vacancy_id', $vacancy->id)
        ->where('user_id', $applicant->user_id)
        ->first();

        if(!$application) {
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
            ->where('applicant.user_id', auth()->user()->id)
            ->where('type', auth()->user()->ipms_id ? 'Staff' : 'Applicant')
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

        $applicant = $conn->table('applicant')
        ->where('user_id', auth()->user()->id)
        ->first();

        if (!$applicant) {
            abort(404, 'Applicant not found');
        }

        $application = $conn->table('application')
        ->where('vacancy_id', $vacancy->id)
        ->where('user_id', $applicant->user_id)
        ->first();

        if(!$application) {
            abort(404, 'Job not found');
        }

         try{
            $conn->beginTransaction();
            $conn2->beginTransaction();

            $application = $conn->table('application')
            ->where('vacancy_id', $vacancy->id)
            ->where('user_id', $applicant->user_id)
            ->update([
                'status' => 'Submitted',
                'date_submitted' => now()
            ]);

            $conn->commit();
            $conn2->commit();
            return redirect()->back()->with([
                'status'  => 'success',
                'title'   => 'Success',
                'message' => 'You have successfully submitted your application',
            ]);
        } catch (\Exception $e) {
            $conn->rollBack();
            $conn2->rollBack();
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
        $applicant = $conn->table('applicant')->where('user_id', $user->id)->first();

        if (!$applicant) {
            abort(404, 'Applicant not found');
        }

        $application = $conn->table('application')
        ->where('vacancy_id', $vacancy->id)
        ->where('user_id', $applicant->user_id)
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

        $educations = $this->fetchEducationalBackgroundFiles($applicant, $vacancy->id, $application->type ?? 'manual');
        $eligibilities = $this->fetchCivilServiceEligibilityFiles($applicant, $vacancy->id, $application->type ?? 'manual');
        $learnings = $this->fetchLearningAndDevelopmentFiles($applicant, $vacancy->id, $application->type ?? 'manual');
        $works = $this->fetchWorkExperienceFiles($applicant, $vacancy->id, $application->type ?? 'manual');

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

                    if ($vacancyFile) {
                        $conn->table('application_requirement')
                            ->where('id', $vacancyFile->itemId)
                            ->delete();

                        if (!empty($vacancyFile->path)) {
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
