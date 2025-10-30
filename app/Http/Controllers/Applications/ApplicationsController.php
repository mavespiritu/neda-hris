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

class ApplicationsController extends Controller
{
    public function index(Request $request)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $sort      = $request->get('sort');
        $direction = strtolower($request->get('direction', 'asc')) === 'desc' ? 'desc' : 'asc';
        $search    = $request->input('search', '');

        $sortable = [
            'name' => DB::raw("CONCAT(
                aa.last_name,
                IF(aa.ext_name IS NOT NULL AND aa.ext_name != '', CONCAT(' ', aa.ext_name), ''),
                ', ',
                aa.first_name,
                ' ',
                IFNULL(CONCAT(LEFT(aa.middle_name, 1), '.'), '')
            )"),
            'publication.reference_no' => DB::raw('publication.reference_no'),
            'vacancy.position_description' => DB::raw('vacancy.position_description'),
            'date_submitted' => DB::raw('a.date_submitted'),
        ];

        $searchable = [
            'name',
            'publication.reference_no',
            'vacancy.position_description',
            'date_submitted',
        ];

        $filterable = [
            'division' => 'vacancy.division',
            'appointment_status' => 'vacancy.appointment_status',
        ];
        
        $applicationsQuery = $conn->table('application_applicant as aa')
        ->select([
            'a.*',
            DB::raw("CONCAT(
                aa.last_name,
                IF(aa.ext_name IS NOT NULL AND aa.ext_name != '', CONCAT(' ', aa.ext_name), ''),
                ', ',
                aa.first_name,
                ' ',
                IFNULL(CONCAT(LEFT(aa.middle_name, 1), '.'), '')
            ) AS name"),
        ])
        ->leftJoin('application as a', 'a.id', '=', 'aa.application_id');

        // filtering
        foreach ($filterable as $param => $column) {
            if ($request->filled($param)) {
                $applicationsQuery->where($column, $request->input($param));
            }
        }

        // sorting
        if ($sort && isset($sortable[$sort]) && in_array(strtolower($direction), ['asc', 'desc'])) {
            $applicationsQuery->orderBy($sortable[$sort], $direction);
        }

        $applications = $applicationsQuery
                    ->where('a.status', 'Submitted')
                    ->orderByDesc('a.date_submitted')
                    ->paginate(20);

        if ($search) {
            $searchLower = strtolower($search);

            $applications->setCollection(
                $applications->getCollection()->filter(function ($application) use ($searchable, $searchLower) {
                    foreach ($searchable as $field) {
                        if (str_contains(strtolower($application->{$field} ?? ''), $searchLower)) {
                            return true;
                        }
                    }
                    return false;
                })->values()
            );
        }

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

        $applications->getCollection()->transform(function ($application) use ($vacanciesById, $publicationsById) {
            $application->vacancy = $vacanciesById->get($application->vacancy_id);
            $application->publication = $publicationsById->get($application->publication_id);

            return $application;
        });

        return Inertia::render('Applications/index', [
            'data' => [
                'applications' => $applications,
            ],
        ]);
    }

    public function create()
    {
        $applicant = [
            'id' => null,
            'emp_id' => '',
            'type' => 'Applicant',
            'email_address' => '',
            'last_name' => '',
            'first_name' => '',
            'middle_name' => '',
            'ext_name' => '',
            'birth_date' => "",
            'birth_place' => "",
            'gender' => "",
            'civil_status' => "",
            'height' => 0,
            'weight' => 0,
            'blood_type' => "",
            'gsis_no' => "",
            'pag_ibig_no' => "",
            'philhealth_no' => "",
            'sss_no' => "",
            'tin_no' => "",
            'agency_employee_no' => "",
            'citizenship' => "",
            'citizenship_by' => "",
            'citizenship_country' => "",
            'isResidenceSameWithPermanentAddress' => false,
            'permanent_house_no' => "",
            'permanent_street' => "",
            'permanent_subdivision' => "",
            'permanent_barangay' => "",
            'permanent_city' => "",
            'permanent_province' => "",
            'permanent_zip' => "",
            'residential_house_no' => "",
            'residential_street' => "",
            'residential_subdivision' => "",
            'residential_barangay' => "",
            'residential_city' => "",
            'residential_province' => "",
            'residential_zip' => "",
            'telephone_no' => "",
            'mobile_no' => "",
        ];

        return inertia('Applicants/Pds/PersonalInformation', [
            'applicant' => $applicant,
            'mode' => 'create'
        ]);
    }

    public function store(Request $request)
    {
        $conn = DB::connection('mysql');

        return $this->storePersonalInformation($request, $conn);

    }

    public function edit($id, Request $request)
    {
        $conn = DB::connection('mysql');

        $step = $request->input('step');
        
        switch($step){
            case 'personalInformation':
                return $this->editPersonalInformation($id);
            break;
            case 'familyBackground':
                return $this->editFamilyBackground($id);
            break;
            case 'educationalBackground':
                return $this->editEducationalBackground($id);
            break;
            case 'civilServiceEligibility':
                return $this->editCivilServiceEligibility($id);
            break;
            case 'workExperience':
                return $this->editWorkExperience($id);
            break;
            case 'voluntaryWork':
                return $this->editVoluntaryWork($id);
            break;
            case 'learningAndDevelopment':
                return $this->editLearningAndDevelopment($id);
            break;
            case 'otherInformation':
                return $this->editOtherInformation($id);
            break;
             default:
                return $this->editPersonalInformation($id);
        }
    }

    public function update($id, Request $request)
    {
        $conn = DB::connection('mysql');

        $step = $request->input('step');
        
        switch($step){
            case 'personalInformation':
                return $this->storePersonalInformation($request, $conn, $id);
            break;
            case 'familyBackground':
                return $this->storeFamilyBackground($request, $conn, $id);
            break;
            case 'educationalBackground':
                return $this->storeEducationalBackground($request, $conn, $id);
            break;
            case 'civilServiceEligibility':
                return $this->storeCivilServiceEligibilty($request, $conn, $id);
            break;
            case 'workExperience':
                return $this->storeWorkExperience($request, $conn, $id);
            break;
            case 'voluntaryWork':
                return $this->storeVoluntaryWork($request, $conn, $id);
            break;
            case 'learningAndDevelopment':
                return $this->storeLearningAndDevelopment($request, $conn, $id);
            break;
            case 'otherInformation':
                return $this->storeOtherInformation($request, $conn, $id);
            break;
             default:
                throw new \Exception("Invalid step: {$step}");
        }
    }

    public function destroy($id)
    {
        $conn = DB::connection('mysql');

        try {

            $conn->beginTransaction();

            $conn->table('applicant')
                ->where('id', $id)
                ->delete();

            $conn->commit();

            return redirect()->route('applicants.index')->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Applicant deleted successfully.'
            ]);
        } catch (\Exception $e) {
            $conn->rollBack();
            Log::error('Failed to delete applicant: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the applicant. Please try again.'
            ]);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $conn = DB::connection('mysql');

        $ids = $request->input('ids');

        try {

            $conn->beginTransaction();

            $conn->table('applicant')
                ->whereIn('id', $ids)
                ->delete();

            $conn->commit();

            return redirect()->route('applicants.index')->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Applicants deleted successfully.'
            ]);
        } catch (\Exception $e) {
            $conn->rollBack();
            Log::error('Failed to delete applicants: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the applicants. Please try again.'
            ]);
        }
    }
}
