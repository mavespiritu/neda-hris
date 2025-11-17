<?php

namespace App\Http\Controllers\Applications;

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
use App\Traits\CopiesApplicationData;

class ApplicationsController extends Controller
{

    use FetchCivilServiceEligibilityFiles;
    use FetchLearningAndDevelopmentFiles;
    use FetchEducationalBackgroundFiles;
    use FetchWorkExperienceFiles;
    use FetchRequirementFiles;
    use CopiesApplicationData;

    public function index(Request $request)
    {
        $conn  = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $sort       = $request->get('sort');
        $direction  = strtolower($request->get('direction', 'asc')) === 'desc' ? 'desc' : 'asc';
        $search     = trim($request->input('search', ''));

        $sortable = [
            'name' => DB::raw("CONCAT(
                aa.last_name,
                IF(aa.ext_name IS NOT NULL AND aa.ext_name != '', CONCAT(' ', aa.ext_name), ''),
                ', ',
                aa.first_name,
                ' ',
                IFNULL(CONCAT(LEFT(aa.middle_name, 1), '.'), '')
            )"),
            'date_submitted' => DB::raw('a.date_submitted'),
        ];

        $filterable = [
            'division' => 'vacancy.division',               // handled after data attach
            'appointment_status' => 'vacancy.appointment_status',
        ];

        // Base query from main DB
        $applicationsQuery = $conn->table('application_applicant as aa')
            ->select([
                'a.*',
                DB::raw('DATE(a.date_submitted) as date_submitted'),
                DB::raw("CONCAT(
                    aa.last_name,
                    IF(aa.ext_name IS NOT NULL AND aa.ext_name != '', CONCAT(' ', aa.ext_name), ''),
                    ', ',
                    aa.first_name,
                    ' ',
                    IFNULL(CONCAT(LEFT(aa.middle_name, 1), '.'), '')
                ) AS name"),
                 'aa.email_address',
            ])
            ->leftJoin('application as a', 'a.id', '=', 'aa.application_id')
            ->where('a.status', 'Submitted');

        // 🔽 Sorting (only for fields available in the main query)
        if ($sort && isset($sortable[$sort])) {
            $applicationsQuery->orderBy($sortable[$sort], $direction);
        } else {
            $applicationsQuery->orderByDesc('a.date_submitted');
        }

        // Paginate base data
        $applications = $applicationsQuery->paginate(20)->appends($request->all());

        // 🔗 Get related data from other DBs
        $vacancyIds = $applications->pluck('vacancy_id')->filter()->unique();
        $publicationIds = $applications->pluck('publication_id')->filter()->unique();

        $vacancies = $conn2->table('vacancy')
            ->whereIn('id', $vacancyIds)
            ->get(['id', 'item_no', 'position_description', 'division', 'monthly_salary', 'appointment_status']);

        $publications = $conn2->table('publication')
            ->whereIn('id', $publicationIds)
            ->get(['id', 'reference_no', 'date_published', 'date_closed']);

        $vacanciesById = $vacancies->keyBy('id');
        $publicationsById = $publications->keyBy('id');

        // Attach related records
        $applications->getCollection()->transform(function ($application) use ($vacanciesById, $publicationsById) {
            $application->vacancy = $vacanciesById->get($application->vacancy_id);
            $application->publication = $publicationsById->get($application->publication_id);
            return $application;
        });

        // ✅ SEARCH + FILTER after attaching related data
        if (!empty($search) || $request->filled('division') || $request->filled('appointment_status')) {

            $applications->setCollection(
                $applications->getCollection()->filter(function ($application) use ($search, $request) {

                    $matchSearch = true;
                    $matchFilter = true;

                    // 🔍 Search check
                    if (!empty($search)) {
                        $searchLower = strtolower($search);
                        $matchSearch = (
                            str_contains(strtolower($application->name ?? ''), $searchLower) ||
                            str_contains(strtolower($application->vacancy->position_description ?? ''), $searchLower) ||
                            str_contains(strtolower($application->publication->reference_no ?? ''), $searchLower) ||
                            str_contains(strtolower($application->date_submitted ?? ''), $searchLower)
                        );
                    }

                    // 🧩 Filter check (from separate DB data)
                    if ($request->filled('division')) {
                        $matchFilter = $matchFilter && (
                            ($application->vacancy->division ?? null) === $request->input('division')
                        );
                    }

                    if ($request->filled('appointment_status')) {
                        $matchFilter = $matchFilter && (
                            ($application->vacancy->appointment_status ?? null) === $request->input('appointment_status')
                        );
                    }

                    return $matchSearch && $matchFilter;
                })->values()
            );
        }

        return Inertia::render('Applications/index', [
            'data' => [
                'applications' => $applications,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');

        $request->validate([
            'applicant_id' => 'required',
            'vacancy_id' => 'required',
            'date_submitted' => 'required',
        ],[
            'applicant_id.required' => 'The applicant field is required.',
            'vacancy_id.required' => 'The vacancy field is required.',
            'date_submitted.required' => 'The date submitted field is required.',
        ]);

        $publication = $conn2->table('publication_vacancies as pv')
        ->where('pv.vacancy_id', $request->input('vacancy_id'))
        ->first();

        $data = [
            'publication_id' => $publication ? $publication->publication_id : null,
            'applicant_id' => $request->input('applicant_id'),
            'vacancy_id' => $request->input('vacancy_id'),
            'date_created' => Carbon::now(),
            'type' => 'Manual',
            'date_submitted' => $request->input('date_submitted'),
            'status' => 'Submitted',
        ];

        try {
            $conn->beginTransaction();

            $applicationId = $conn->table('application')->insertGetId($data);

            $conn->table('application_status')
            ->insert([
                'application_id' => $applicationId,
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

                $this->copiesApplicationData($source, $target, $request->input('applicant_id'), $applicationId, $single);
            }

            $conn->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Application created successfully.'
            ]);

        } catch (Exception $e) {
            $conn->rollBack();
            Log::error('Error creating application: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while creating application. Please try again.'
            ]);
        }
    }

    public function update(Request $request, $id)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');

        $request->validate([
            'applicant_id' => 'required',
            'vacancy_id' => 'required',
            'date_submitted' => 'required',
        ],[
            'applicant_id.required' => 'The applicant field is required.',
            'vacancy_id.required' => 'The vacancy field is required.',
            'date_submitted.required' => 'The date submitted field is required.',
        ]);

        $publication = $conn2->table('publication_vacancies as pv')
        ->where('pv.vacancy_id', $request->input('vacancy_id'))
        ->first();

        $data = [
            'publication_id' => $publication ? $publication->publication_id : null,
            'applicant_id' => $request->input('applicant_id'),
            'vacancy_id' => $request->input('vacancy_id'),
            'date_submitted' => $request->input('date_submitted'),
        ];

        try {
            $conn->beginTransaction();

            $conn->table('application')->where('id', $id)->update($data);

            $conn->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Application updated successfully.'
            ]);

        } catch (\Exception $e) {
            $conn->rollBack();
            Log::error('Error updating application: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating application. Please try again.'
            ]);
        }
    }

    public function destroy($id)
    {
        $conn = DB::connection('mysql');

        try {

            $conn->beginTransaction();

            $conn->table('application')
                ->where('id', $id)
                ->delete();

            $conn->commit();

            return redirect()->route('applications.index')->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Application deleted successfully.'
            ]);
        } catch (\Exception $e) {
            $conn->rollBack();
            Log::error('Failed to delete application: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the application. Please try again.'
            ]);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $conn = DB::connection('mysql');

        $ids = $request->input('ids');

        try {

            $conn->beginTransaction();

            $conn->table('application')
                ->whereIn('id', $ids)
                ->delete();

            $conn->commit();

            return redirect()->route('application.index')->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Applications deleted successfully.'
            ]);
        } catch (\Exception $e) {
            $conn->rollBack();
            Log::error('Failed to delete applications: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the applications. Please try again.'
            ]);
        }
    }

    public function searchApplicant(Request $request)
    {
        $conn = DB::connection('mysql');
        $term = trim($request->input('search', ''));

        if (strlen($term) < 3) {
            return response()->json([]);
        }

        $results = $conn->table('applicant')
            ->select([
                'id',
                DB::raw("CONCAT(last_name, ', ', first_name, ' ', IFNULL(CONCAT(LEFT(middle_name, 1), '.'), '')) AS name"),
                'email_address',
                'mobile_no',
                'birth_date',
                'residential_house_no',
                'residential_street',
                'residential_barangay',
                'residential_city',
                'residential_province',
                'residential_zip'
            ])
            ->where(function ($query) use ($term) {
                $query->where('first_name', 'LIKE', "%{$term}%")
                    ->orWhere('last_name', 'LIKE', "%{$term}%")
                    ->orWhere('middle_name', 'LIKE', "%{$term}%")
                    ->orWhere('email_address', 'LIKE', "%{$term}%");
            })
            ->limit(20)
            ->get();

        // Transform to the format expected by the React component
        $formatted = $results->map(function ($item) {
            return [
                'value' => $item->id,
                'label' => "{$item->name} ({$item->email_address})",
                'email_address' => $item->email_address,
                'mobile_no' => $item->mobile_no,
                'birth_date' => $item->birth_date,
                'residential_house_no' => $item->residential_house_no,
                'residential_street' => $item->residential_street,
                'residential_barangay' => $item->residential_barangay,
                'residential_city' => $item->residential_city,
                'residential_province' => $item->residential_province,
                'residential_zip' => $item->residential_zip,
            ];
        });

        return response()->json($formatted);
    }

    public function searchVacancy(Request $request)
    {
        $conn = DB::connection('mysql2');
        $term = trim($request->input('search', ''));

        if (strlen($term) < 3) {
            return response()->json([]);
        }

        $results = $conn->table('publication_vacancies as pv')
            ->select([
                'v.id as id',
                DB::raw("CONCAT(p.reference_no, ': ', v.position_description, ' ', IFNULL(CONCAT('(', v.item_no, ')'), '')) AS position"),
                'p.reference_no',
                'v.position_description',
                'v.item_no',
                'p.date_published',
                'p.date_closed',
            ])
            ->leftJoin('publication as p', 'p.id', '=', 'pv.publication_id')
            ->leftJoin('vacancy as v', 'v.id', '=', 'pv.vacancy_id')
            ->where(function ($query) use ($term) {
                $query->where('v.position_description', 'LIKE', "%{$term}%")
                    ->orWhere('v.item_no', 'LIKE', "%{$term}%")
                    ->orWhere('p.reference_no', 'LIKE', "%{$term}%");
            })
            ->limit(20)
            ->get();

        // Transform for the frontend SearchableComboBox
        $formatted = $results->map(function ($item) {
            return [
                'value' => $item->id,
                'label' => $item->position, // e.g., "REF123: Teacher I (101)"
                'publish_no' => $item->reference_no,
                'position' => $item->position_description,
                'item_no' => $item->item_no,
                'date_published' => $item->date_published,
                'date_closed' => $item->date_closed,
            ];
        });

        return response()->json($formatted);
    }

    public function getRequirements($applicantId, $vacancyId)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $applicant = $conn->table('applicant')
        ->where('id', $applicantId)
        ->first();

        if (!$applicant) {
            return response()->json(['message' => 'Applicant not found'], 404);
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

        $educations = $this->fetchEducationalBackgroundFiles($applicant, $vacancyId, $applicant->type);
        $eligibilities = $this->fetchCivilServiceEligibilityFiles($applicant, $vacancyId, $applicant->type);
        $learnings = $this->fetchLearningAndDevelopmentFiles($applicant, $vacancyId, $applicant->type);
        $works = $this->fetchWorkExperienceFiles($applicant, $vacancyId, $applicant->type);

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
        ->where('vacancy_id', $vacancyId)
        ->get()
        ->map(function ($req) use (
            $applicant,
            $vacancyId,
            $educationReq,
            $educations,
            $eligibilityReq,
            $eligibilities,
            $learningReq,
            $learnings,
            $workReq,
            $works,
        ) {
            $req->files = $this->fetchRequirementFiles($applicant->id, $vacancyId, $req, $applicant->type);

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
}
