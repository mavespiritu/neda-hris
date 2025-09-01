<?php

namespace App\Http\Controllers\Publications;

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

class PublicationController extends Controller
{

    public $emp_id;

    public function __construct()
    {
        $this->emp_id = Auth::check() ? Auth::user()->ipms_id : null; 
    }

    public function index(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $search = $request->input('search', '');
        $matchingEmployeeIDs = collect();

        if (!empty($search)) {
            $matchingEmployeeIDs = $conn3->table('tblemployee')
                ->where(function ($query) use ($search) {
                    $query->where(DB::raw("CONCAT(fname, ' ', lname)"), 'like', '%' . $search . '%');
                })
                ->pluck('emp_id');
        }

        $vacancyCounts = $conn2->table('publication_vacancies')
        ->select('publication_id', DB::raw('COUNT(*) as vacancy_count'))
        ->groupBy('publication_id');

        $latestStatus = $conn2->table('status_logs as vs1')
        ->select(
            'vs1.model_id as status_publication_id',
            'vs1.status as current_status',
            'vs1.acted_by as latest_acted_by',
            'vs1.date_acted as date_acted'
        )
        ->join(DB::raw('(
            SELECT model_id, MAX(id) as max_id 
            FROM status_logs 
            WHERE model = "Publication"
            GROUP BY model_id
        ) as vs2'), function ($join) {
            $join->on('vs1.model_id', '=', 'vs2.model_id')
                ->on('vs1.id', '=', 'vs2.max_id');
        })
        ->where('vs1.model', 'Publication');

        $publications = $conn2->table('publication')
            ->leftJoinSub($latestStatus, 'vs', function ($join) {
                $join->on('publication.id', '=', 'vs.status_publication_id');
            })
            ->leftJoinSub($vacancyCounts, 'vc', function ($join) {
                $join->on('publication.id', '=', 'vc.publication_id');
            })
            ->when($search, function ($query) use ($search, $matchingEmployeeIDs) {
                $query->where(function ($q) use ($search, $matchingEmployeeIDs) {
                    $q->where('reference_no', 'like', '%' . $search . '%')
                    ->orWhere('date_published', 'like', '%' . $search . '%')
                    ->orWhere('date_closed', 'like', '%' . $search . '%')
                    ->orWhere('time_closed', 'like', '%' . $search . '%');

                    if ($matchingEmployeeIDs->isNotEmpty()) {
                        $q->orWhereIn('publication.created_by', $matchingEmployeeIDs);
                        $q->orWhereIn('publication.updated_by', $matchingEmployeeIDs);
                        $q->orWhereIn('vs.latest_acted_by', $matchingEmployeeIDs);
                    }
                });
            })
            ->select(
                'publication.*', 
                'vs.current_status as status', 
                'vs.date_acted', 
                'vs.latest_acted_by',
                DB::raw('COALESCE(vc.vacancy_count, 0) as vacancy_count')
            )
            ->orderBy('publication.id', 'desc')
            ->paginate(20);

        $allIDs = $publications->pluck('created_by')
        ->merge($publications->pluck('updated_by'))
        ->merge($publications->pluck('latest_acted_by'))
        ->unique()
        ->values();

        $employees = $conn3->table('tblemployee')
        ->whereIn('emp_id', $allIDs)
        ->get()
        ->keyBy('emp_id')
        ->map(function ($employee) {
            return (object)[
                'name' => $employee->fname . ' ' . $employee->lname,
            ];
        });

        $publications->getCollection()->transform(function ($pub) use ($employees) {
            $pub->creator = $employees->get($pub->created_by)->name ?? null;
            $pub->updater = $employees->get($pub->updated_by)->name ?? null;
            $pub->actor = $employees->get($pub->latest_acted_by)->name ?? null;
            return $pub;
        });

        return Inertia::render('Publications/index', [
            'publications' => $publications,
        ]);
    }

    public function show($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $signatoryName = $conn2->table('settings')->where('title', 'Agency Head')->first();
        $signatoryPosition = $conn2->table('settings')->where('title', 'Agency Head Position')->first();
        $agencyAddress = $conn2->table('settings')->where('title', 'Agency Address')->first();

        $requirements = $conn2->table('recruitment_requirements')
        ->where('is_default', 1)
        ->pluck('requirement');

        $search = $request->input('search', '');
        $matchingEmployeeIDs = collect();

        $publication = $conn2->table('publication')->where('id', $id)->first();
        if (!$publication) {
            abort(404, 'Publication not found.');
        }

        if (!empty($search)) {
            $matchingEmployeeIDs = $conn3->table('tblemployee')
                ->where('work_status', 'active')
                ->where(function ($query) use ($search) {
                    $query->where(DB::raw("CONCAT(fname, ' ', lname)"), 'like', '%' . $search . '%');
                })
                ->pluck('emp_id');
        }

        $vacancyIDs = $conn2->table('publication_vacancies')
            ->where('publication_id', $publication->id)
            ->pluck('vacancy_id');

        if ($vacancyIDs->isEmpty()) {
            $page = LengthAwarePaginator::resolveCurrentPage();
            return Inertia::render('Publications/View', [
                'publication' => $publication,
                'vacancies' => new LengthAwarePaginator([], 0, 20, $page),
                'allVacancies' => [],
                'signatoryName' => $signatoryName ? $signatoryName->value : '',
                'signatoryPosition' => $signatoryPosition ? $signatoryPosition->value : '',
                'agencyAddress' => $agencyAddress ? $agencyAddress->value : '',
                'requirements' => $requirements
            ]);
        }

        $latestStatus = $conn2->table('status_logs as vs1')
            ->select(
                'vs1.model_id as status_vacancy_id',
                'vs1.status as current_status',
                'vs1.acted_by as latest_acted_by',
                'vs1.date_acted as date_acted'
            )
            ->join(DB::raw('(
                SELECT model_id, MAX(id) as max_id 
                FROM status_logs 
                WHERE model = "Vacancy"
                GROUP BY model_id
            ) as vs2'), function ($join) {
                $join->on('vs1.model_id', '=', 'vs2.model_id')
                    ->on('vs1.id', '=', 'vs2.max_id');
            })
            ->where('vs1.model', 'Vacancy');

        $vacanciesQuery = $conn2->table('vacancy')
            ->whereIn('vacancy.id', $vacancyIDs)
            ->leftJoinSub($latestStatus, 'vs', function ($join) {
                $join->on('vacancy.id', '=', 'vs.status_vacancy_id');
            })
            ->when($search, function ($query) use ($search, $matchingEmployeeIDs) {
                $query->where(function ($q) use ($search, $matchingEmployeeIDs) {
                    $q->where('item_no', 'like', '%' . $search . '%')
                    ->orWhere('division', 'like', '%' . $search . '%')
                    ->orWhere('position', 'like', '%' . $search . '%')
                    ->orWhere('position_description', 'like', '%' . $search . '%')
                    ->orWhere('sg', 'like', '%' . $search . '%')
                    ->orWhere('date_created', 'like', '%' . $search . '%')
                    ->orWhere('vs.current_status', 'like', '%' . $search . '%');

                    if ($matchingEmployeeIDs->isNotEmpty()) {
                        $q->orWhereIn('vacancy.created_by', $matchingEmployeeIDs);
                        $q->orWhereIn('vacancy.requested_by', $matchingEmployeeIDs);
                        $q->orWhereIn('vs.latest_acted_by', $matchingEmployeeIDs);
                    }
                });
            })
            ->select(
                'vacancy.*',
                'vs.current_status as status',
                'vs.date_acted',
                'vs.latest_acted_by'
            )
            ->orderBy('vacancy.id', 'desc');

        $paginatedVacancies = $vacanciesQuery->paginate(20);
        $allVacancies = $vacanciesQuery->get();

        $allIDs = $paginatedVacancies->pluck('created_by')
            ->merge($paginatedVacancies->pluck('updated_by'))
            ->merge($paginatedVacancies->pluck('latest_acted_by'))
            ->unique()
            ->values();

        $employees = $conn3->table('tblemployee')
            ->whereIn('emp_id', $allIDs)
            ->get()
            ->keyBy('emp_id')
            ->map(function ($employee) {
                return (object)[
                    'name' => $employee->fname . ' ' . $employee->lname,
                ];
            });

        $addMetaToVacancy = function ($vacancy) use ($conn2, $conn3, $employees) {
            $vacancy->creator = $employees->get($vacancy->created_by)->name ?? null;
            $vacancy->actor = $employees->get($vacancy->latest_acted_by)->name ?? null;

            // Attach competencies
            $vacancyCompetencies = $conn2->table('vacancy_competencies as vc')
                ->leftJoin('competency as c', 'c.comp_id', '=', 'vc.competency_id')
                ->select('vc.competency_id as id', 'c.competency', 'vc.level', 'vc.comp_type')
                ->where('vacancy_id', $vacancy->id)
                ->get()
                ->groupBy('comp_type');

            $vacancy->competencies = [
                'organizational' => $vacancyCompetencies->get('org', collect())->values(),
                'leadership'     => $vacancyCompetencies->get('mnt', collect())->values(),
                'functional'     => $vacancyCompetencies->get('func', collect())->values(),
            ];

            // Attach monthly salary
            $salary = $conn3->table('tblprl_salary_schedule')
                ->select('salary')
                ->where('grade', $vacancy->sg)
                ->where('step', $vacancy->step)
                ->orderByDesc('effectivity_date_start')
                ->first();

            $position = $conn3->table('tblposition')
                ->select('post_description')
                ->where('position_id', $vacancy->position)
                ->first();

            $vacancy->monthly_salary = $salary->salary ?? 0;
            $vacancy->positionTitle = $position->post_description ?? '';

            return $vacancy;
        };

        $paginatedVacancies->getCollection()->transform($addMetaToVacancy);
        $allVacancies = $allVacancies->map($addMetaToVacancy);

        

        return Inertia::render('Publications/View', [
            'publication' => $publication,
            'vacancies' => $paginatedVacancies,
            'allVacancies' => $allVacancies,
            'signatoryName' => $signatoryName ? $signatoryName->value : '',
            'signatoryPosition' => $signatoryPosition ? $signatoryPosition->value : '',
            'agencyAddress' => $agencyAddress ? $agencyAddress->value : '',
            'requirements' => $requirements
        ]);
    }

    public function store(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $validator = Validator::make($request->all(), [
            'date_published' => 'required|date',
            'date_closed' => 'required|date',
            'time_closed' => ['required', 'date_format:H:i'],
        ], [
            'date_published.required' => 'The posting date is required.',
            'date_closed.required' => 'The closing date is required.',
            'time_closed.required' => 'The closing time is required.',
            'time_closed.date_format' => 'The time must be in the format HH:MM AM|PM',
        ]);

        $validator->after(function ($validator) use ($request) {
            $publishedDate = Carbon::parse($request->date_published)->startOfDay();
            $closedDate = Carbon::parse($request->date_closed)->startOfDay();
    
            if ($closedDate->lt($publishedDate)) {
                $validator->errors()->add('date_closed', 'The closing date must be on or after the posting date.');
            }
        });

        $validator->validate();

        try{

            $year = Carbon::now()->year;

            $lastReferenceNo = $conn2->table('publication')
            ->whereYear('date_created', $year) 
            ->orderByDesc('id') 
            ->first();

            $nextReferenceNo = '01'; 

            if ($lastReferenceNo) {
                $lastRefNum = explode('-', $lastReferenceNo->reference_no)[0];
                $nextReferenceNo = str_pad((int)$lastRefNum + 1, 2, '0', STR_PAD_LEFT);
            }
    
            $referenceNo = $nextReferenceNo . '-' . $year;

            $publication = $conn2->table('publication')
            ->insertGetId([
                'reference_no' => $referenceNo,
                'date_published' => Carbon::parse($request->date_published)->format('Y-m-d'),
                'date_closed' => Carbon::parse($request->date_closed)->format('Y-m-d'),
                'time_closed' => Carbon::parse($request->time_closed)->format('H:i:s'),
                'created_by' => Auth::user()->ipms_id,
                'date_created' => Carbon::now()->format('Y-m-d H:i:s'),
            ]);

            $conn2->table('status_logs')
            ->insert([
                'model_id' => $publication,
                'model' => 'Publication',
                'status' => 'Draft',
                'acted_by' => Auth::user()->ipms_id,
                'date_acted' => Carbon::now()->format('Y-m-d H:i:s'),
            ]);

            return redirect()->route('publications.show', $publication)->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Request saved successfully.'
            ]);

        } catch (\Exception $e) {

            Log::error('Failed to save request: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving request. Please try again.'
            ]);
        }
    }

    public function update(Request $request, $id)
    {
        $conn2 = DB::connection('mysql2');

        // Validation
        $validator = Validator::make($request->all(), [
            'date_published' => 'required|date',
            'date_closed' => 'required|date',
            'time_closed' => ['required', 'date_format:H:i'],
        ], [
            'date_published.required' => 'The posting date is required.',
            'date_closed.required' => 'The closing date is required.',
            'time_closed.required' => 'The closing time is required.',
            'time_closed.date_format' => 'The time must be in the format HH:MM AM|PM',
        ]);

        $validator->after(function ($validator) use ($request) {
            $publishedDate = Carbon::parse($request->date_published)->startOfDay();
            $closedDate = Carbon::parse($request->date_closed)->startOfDay();

            if ($closedDate->lt($publishedDate)) {
                $validator->errors()->add('date_closed', 'The closing date must be on or after the posting date.');
            }
        });

        $validator->validate();

        try {
            $conn2->table('publication')
                ->where('id', $id)
                ->update([
                    'date_published' => Carbon::parse($request->date_published)->format('Y-m-d'),
                    'date_closed' => Carbon::parse($request->date_closed)->format('Y-m-d'),
                    'time_closed' => Carbon::parse($request->time_closed)->format('H:i:s'),
                    'updated_by' => Auth::user()->ipms_id,
                    'date_updated' => Carbon::now()->format('Y-m-d H:i:s'),
                ]);

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Request updated successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update request: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating the request. Please try again.'
            ]);
        }
    }

    public function destroy($id)
    {
        $conn2 = DB::connection('mysql2');

        try {
            $conn2->table('publication')
                ->where('id', $id)
                ->delete();

            $conn2->table('status_logs')
                ->where('model_id', $id)
                ->where('model', 'Publication')
                ->delete();

            return redirect()->route('publications.index')->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Request deleted successfully.'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to delete request: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the request. Please try again.'
            ]);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $ids = $request->input('ids');

        try {
            $conn2->table('publication')
                ->whereIn('id', $ids)
                ->delete();

            $conn2->table('status_logs')
                ->whereIn('model_id', $ids)
                ->where('model', 'Publication')
                ->delete();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Request(s) deleted successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete request(s): ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the request(s). Please try again.'
            ]);
        }
    }

    public function bulkApprove(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $ids = $request->input('ids');

        try {

            if(!empty($ids)){
                foreach($ids as $id){
                    $conn2->table('status_logs')
                    ->insert([
                        'model_id' => $id,
                        'model' => 'Publication',
                        'status' => 'Approved',
                        'acted_by' => Auth::user()->ipms_id,
                        'date_acted' => Carbon::now()->format('Y-m-d'),
                    ]);
                }
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Request(s) approved successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to approve request(s): ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while approving the request(s). Please try again.'
            ]);
        }
    }

    public function bulkDisapprove(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $ids = $request->input('ids');

        try {

            if(!empty($ids)){
                foreach($ids as $id){
                    $conn2->table('status_logs')
                    ->insert([
                        'model_id' => $id,
                        'model' => 'Publication',
                        'status' => 'Disapproved',
                        'acted_by' => Auth::user()->ipms_id,
                        'date_acted' => Carbon::now()->format('Y-m-d'),
                    ]);
                }
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Request(s) approved successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to approve request(s): ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while approving the request(s). Please try again.'
            ]);
        }
    }

    public function bulkSubmit(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $ids = $request->input('ids');

        try {

            if(!empty($ids)){
                foreach($ids as $id){
                    $conn2->table('status_logs')
                    ->insert([
                        'model_id' => $id,
                        'model' => 'Publication',
                        'status' => 'Submitted',
                        'acted_by' => Auth::user()->ipms_id,
                        'date_acted' => Carbon::now()->format('Y-m-d'),
                    ]);
                }
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Request for publications submitted successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to submit request for publications: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while submitting request for publications. Please try again.'
            ]);
        }
    }

    public function bulkRequestForChanges(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $ids = $request->input('ids');

        try {

            if(!empty($ids)){
                foreach($ids as $id){
                    $conn2->table('status_logs')
                    ->insert([
                        'model_id' => $id,
                        'model' => 'Publication',
                        'status' => 'Changes Requested',
                        'remarks' => $request->remarks,
                        'acted_by' => Auth::user()->ipms_id,
                        'date_acted' => Carbon::now()->format('Y-m-d'),
                    ]);
                }
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Request for changes on publications submitted successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to request changes for publications: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while requesting changes for publications. Please try again.'
            ]);
        }
    }

    public function bulkReadyForApproval(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $ids = $request->input('ids');

        try {

            if(!empty($ids)){
                foreach($ids as $id){
                    $conn2->table('status_logs')
                    ->insert([
                        'model_id' => $id,
                        'model' => 'Publication',
                        'status' => 'Ready for Approval',
                        'acted_by' => Auth::user()->ipms_id,
                        'date_acted' => Carbon::now()->format('Y-m-d'),
                    ]);
                }
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Request for publications ready for approval submitted successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to submit request for publications ready for approval: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while submitting request for publications ready for approval. Please try again.'
            ]);
        }
    }

    public function getVacancies($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $existingVacancies = $conn2->table('publication_vacancies')
            ->where('publication_id', $id)
            ->pluck('vacancy_id')
            ->toArray();

        $latestStatus = $conn2->table('status_logs as vs1')
        ->select(
            'vs1.model_id as status_vacancy_id',
            'vs1.status as current_status',
            'vs1.acted_by as latest_acted_by',
            'vs1.date_acted as date_acted'
        )
        ->join(DB::raw('(
            SELECT model_id, MAX(id) as max_id 
            FROM status_logs 
            WHERE model = "Vacancy"
            GROUP BY model_id
        ) as vs2'), function ($join) {
            $join->on('vs1.model_id', '=', 'vs2.model_id')
                ->on('vs1.id', '=', 'vs2.max_id');
        })
        ->where('vs1.model', 'Vacancy');

        $vacancies = $conn2->table('vacancy')
            ->leftJoinSub($latestStatus, 'vs', function ($join) {
                $join->on('vacancy.id', '=', 'vs.status_vacancy_id');
            })
            ->select(
                'vacancy.id as value',
                DB::raw("
                    CONCAT(
                        vacancy.division, ': ', vacancy.position_description,
                        CASE
                            WHEN vacancy.appointment_status = 'Permanent' THEN CONCAT(' (', vacancy.item_no, ')')
                            ELSE ''
                        END
                    ) as label
                ")
            )
            ->whereNotIn('vacancy.id', $existingVacancies);
        
        if($request->status){
            $vacancies = $vacancies->where('vs.current_status', $request->status);
        }
            $vacancies = $vacancies
            ->orderBy('vacancy.division', 'asc')
            ->orderBy('vacancy.position', 'asc')
            ->orderBy('vacancy.item_no', 'asc')
            ->get();

        return response()->json($vacancies); 
    }

    public function storeVacancies($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $validator = Validator::make($request->all(), [
            'vacancy_id' => 'required',
        ], [
            'vacancy_id.required' => 'The vacancy is required.',
        ]);

        $validator->validate();

        try{

            $conn2->table('publication_vacancies')
            ->insert([
                'publication_id' => $id,
                'vacancy_id' => $request->vacancy_id,
                'created_by' => Auth::user()->ipms_id,
                'date_created' => Carbon::now()->format('Y-m-d H:i:s'),
            ]);

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Vacancy included successfully.'
            ]);

        } catch (\Exception $e) {

            Log::error('Failed to include vacancy: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while including vacancy. Please try again.'
            ]);
        }
    }

    public function destroyVacancy($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');

        try {
            $conn2->table('publication_vacancies')
                ->where('publication_id', $id)
                ->where('vacancy_id', $request->id)
                ->delete();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Vacancy removed successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to remove vacancy: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while removing the vacancy. Please try again.'
            ]);
        }
    }

    public function bulkDestroyVacancies($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $ids = $request->input('ids');

        try {
            $conn2->table('publication_vacancies')
                ->where('publication_id', $id)
                ->whereIn('vacancy_id', $ids)
                ->delete();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Vacancies removed successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to remove vacancies: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while removing vacancies. Please try again.'
            ]);
        }
    }

    public function toggleVisibility($id)
    {
        $conn2 = DB::connection('mysql2');

        $publication = $conn2->table('publication')->where('id', $id)->first();

        if (!$publication) {
            return response()->json(['error' => 'Publication not found'], 404);
        }

        $newVisibility = !$publication->is_public;

        $conn2->table('publication')->where('id', $id)->update([
            'is_public' => $newVisibility,
            'updated_by' => Auth::user()->ipms_id,
            'date_updated' => now(),
        ]);

        return redirect()->back()->with([
            'status' => 'success',
            'title' => 'Success!',
            'message' => 'isibility toggled successfully.'
        ]);
    }
}
