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
use App\Notifications\Vacancies\NotifyStaffOfVacancyApproval;

class VacancyController extends Controller
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

        $sort      = $request->get('sort');
        $direction = strtolower($request->get('direction', 'asc')) === 'desc' ? 'desc' : 'asc';
        $search    = $request->input('search', '');

        $sortable = [
            'division' => DB::raw('division'),
            'appointment_status' => DB::raw('appointment_status'),       
            'position_description' => DB::raw('position_description'),             
            'sg' => DB::raw('sg'),             
            'monthly_salary' => DB::raw('monthly_salary'),            
        ];

        $searchable = [
            'reference_no',
            'creator',
            'division',
            'appointment_status',
            'position',
            'position_description',
            'sg',
            'monthly_salary',
        ];

        $filterable = [
            'division' => 'v.division',
            'appointment_status' => 'v.appointment_status',
            'sg' => 'v.sg',
        ];
        
        $vacanciesQuery = $conn2->table('vacancy as v')
        ->select([
            'v.*',
        ]);

        // filtering
        foreach ($filterable as $param => $column) {
            if ($request->filled($param)) {
                $vacanciesQuery->where($column, $request->input($param));
            }
        }

        // sorting
        if ($sort && isset($sortable[$sort]) && in_array(strtolower($direction), ['asc', 'desc'])) {
            $vacanciesQuery->orderBy($sortable[$sort], $direction);
        }

        $vacancies = $vacanciesQuery->orderBy('v.id', 'desc')->paginate(20);

        $vacancyIDs = $vacancies->pluck('id')->toArray();

        $creatorIDs = $vacancies->pluck('created_by')->unique()->values();

        $employees = $conn3->table('tblemployee as e')
        ->select([
            'e.emp_id',
            DB::raw("CONCAT(e.lname, ', ', e.fname, ' ', IF(e.mname IS NOT NULL AND e.mname != '', CONCAT(LEFT(e.mname, 1), '.'), '')) as name"),
        ])
        ->get()
        ->keyBy('emp_id');

        $histories = $conn2->table('submission_history')
            ->where('model', 'Vacancy')
            ->whereIn('model_id', $vacancyIDs)
            ->orderBy('date_acted', 'desc')
            ->get()
            ->groupBy('model_id');

        $vacancies->getCollection()->transform(function ($vacancy) use ($histories, $employees) {
            $vacancy->creator = $employees->get($vacancy->created_by)->name ?? null;

            $latestHistory = $histories->get($vacancy->id, collect())->first();

            $vacancy->creator = $employees->get($vacancy->created_by)->name ?? null;
            $vacancy->status = $latestHistory->status ?? null;
            $vacancy->acted_by = $latestHistory->acted_by ?? null;
            $vacancy->acted_by_name = $latestHistory ? $employees->get($latestHistory->acted_by)->name ?? null : null;
            $vacancy->date_acted = $latestHistory->date_acted ?? null;
            $vacancy->remarks = $latestHistory->remarks ?? null;

            return $vacancy;
        });

        if ($sort === 'creator') {
            $sorted = $vacancies->getCollection()->sortBy(
                fn($v) => $v->creator ?? '',
                SORT_REGULAR,
                $direction === 'desc'
            );
            $vacancies->setCollection($sorted->values());
        }

        if ($sort === 'status') {
            $sorted = $vacancies->getCollection()->sortBy(
                fn($v) => $v->status ?? '',
                SORT_REGULAR,
                $direction === 'desc'
            );
            $vacancies->setCollection($sorted->values());
        }

        if ($search) {
            $searchLower = strtolower($search);

            $vacancies->setCollection(
                $vacancies->getCollection()->filter(function ($vacancy) use ($searchable, $searchLower) {
                    foreach ($searchable as $field) {
                        if (str_contains(strtolower($vacancy->{$field} ?? ''), $searchLower)) {
                            return true;
                        }
                    }
                    return false;
                })->values()
            );

        }

        return Inertia::render('Vacancies/index', [
            'data' => [
                'vacancies' => $vacancies,
            ],
        ]);
    }

    public function show($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $search = $request->input('search', '');
        $competencyFilter = $request->input('competency');

        $matchingEmployeeIDs = collect();

        if (!empty($search)) {
            $matchingEmployeeIDs = $conn3->table('tblemployee')
                ->where(DB::raw("CONCAT(fname, ' ', lname)"), 'like', '%' . $search . '%')
                ->pluck('emp_id');
        }

        $vacancy = $conn2->table('vacancy')->where('id', $id)->first();
        if (!$vacancy) {
            abort(404, 'Vacancy not found.');
        }

        // Fetch competencies for the vacancy
        $competencies = $conn2->table('vacancy_competencies as vc')
            ->leftJoin('competency as c', 'vc.competency_id', '=', 'c.comp_id')
            ->where('vc.vacancy_id', $vacancy->id)
            ->select(
                'c.comp_id as value',
                DB::raw('CONCAT(c.competency, " (Level ", vc.level, ")") as label'),
                'c.competency',
                'vc.level',
                'c.comp_type'
            )
            ->get();

        // Base query for questions
        $questionsQuery = $conn2->table('vacancy_questions as vq')
            ->where('vq.vacancy_id', $id)
            ->when($competencyFilter, function ($q) use ($conn2, $competencyFilter) {
                $questionIds = $conn2->table('vacancy_question_competencies')
                    ->where('competency_id', $competencyFilter)
                    ->pluck('question_id');
                $q->whereIn('vq.id', $questionIds);
            })
            ->when($search, function ($query) use ($search, $matchingEmployeeIDs) {
                $query->where(function ($q) use ($search, $matchingEmployeeIDs) {
                    $q->where('vq.question', 'like', '%' . $search . '%');
                    if ($matchingEmployeeIDs->isNotEmpty()) {
                        $q->orWhereIn('vq.created_by', $matchingEmployeeIDs);
                    }
                });
            })
            ->select('vq.id', 'vq.question', 'vq.created_by', 'vq.date_created')
            ->orderByDesc('vq.id');

        // Paginate base questions
        $questions = $questionsQuery->paginate(20);

        $questionIds = $questions->pluck('id')->toArray();

        // Fetch all competencies related to paginated questions
        $competencyNames = $conn2->table('vacancy_question_competencies as vqc')
            ->leftJoin('competency as c', 'vqc.competency_id', '=', 'c.comp_id')
            ->whereIn('vqc.question_id', $questionIds)
            ->select('vqc.question_id', 'c.competency')
            ->get()
            ->groupBy('question_id')
            ->map(fn($items) => $items->pluck('competency')->filter()->unique()->sort()->implode(', '));

        // Fetch raw competency IDs
        $competencyIds = $conn2->table('vacancy_question_competencies')
            ->whereIn('question_id', $questionIds)
            ->select('question_id', 'competency_id')
            ->get()
            ->groupBy('question_id');

        // Fetch ratings
        $ratings = $conn2->table('vacancy_ratings')
            ->whereIn('question_id', $questionIds)
            ->select('question_id', 'score', 'title', 'description', 'element')
            ->orderBy('score')
            ->get()
            ->groupBy('question_id');

        // Fetch creator employee names
        $creatorIds = $questions->pluck('created_by')->filter()->unique();
        $employees = $conn3->table('tblemployee')
            ->whereIn('emp_id', $creatorIds)
            ->select('emp_id', 'fname', 'lname')
            ->get()
            ->keyBy('emp_id')
            ->map(fn($e) => $e->fname . ' ' . $e->lname);

        // Final transform of the question collection
        $questions->getCollection()->transform(function ($item) use ($ratings, $competencyIds, $competencyNames, $employees) {
            $item->ratings = optional($ratings->get($item->id))->values() ?? collect();
            $item->competencyIds = optional($competencyIds->get($item->id))->pluck('competency_id')->values() ?? collect();
            $item->competencies = $competencyNames->get($item->id) ?? '';
            $item->creator = $employees->get($item->created_by) ?? null;
            return $item;
        });

        return Inertia::render('Vacancies/ViewVacancy', [
            'vacancy' => $vacancy,
            'competencies' => $competencies,
            'questions' => $questions,
        ]);
    }

    public function create()
    {
        return inertia('Vacancies/CreateVacancy');
    }

    public function store(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $validator = Validator::make($request->all(), [
            'type' => 'required',
            'appointment_status' => 'required',
            'item_no' => 'required_if:appointment_status,Permanent',
            'position_description' => 'required_unless:appointment_status,Permanent',
            'sg' => 'required_unless:appointment_status,Permanent',
            'monthly_salary' => 'required_unless:appointment_status,Permanent',
            'division' => 'required',
            'reports_to' => 'required_if:appointment_status,Permanent',
            'positions_supervised' => 'required_if:appointment_status,Permanent',
            'classification' => 'required_if:appointment_status,Permanent',
            'prescribed_education' => 'required_if:appointment_status,Permanent',
            'prescribed_experience' => 'required_if:appointment_status,Permanent',
            'prescribed_training' => 'required_if:appointment_status,Permanent',
            'prescribed_eligibility' => 'required_if:appointment_status,Permanent',
            'preferred_education' => 'required',
            'preferred_experience' => 'required',
            'preferred_training' => 'required',
            'preferred_eligibility' => 'required',
            'preferred_skills' => 'required_unless:appointment_status,Permanent',
            'examination' => 'required_if:appointment_status,Permanent',
            'summary' => 'required',
            'output' => 'required',
            'responsibility' => 'required',
        ], [
            'type.required' => 'The type is required.',
            'appointment_status.required' => 'The status of appointment is required.',
            'item_no.required_if' => 'The plantilla item no. is required when appointment status is Permanent.',
            'position_description.required_unless' => 'The position is required unless appointment status is Permanent.',
            'sg.required_unless' => 'The salary grade is required unless appointment status is Permanent.',
            'monthly_salary.required_unless' => 'The monthly salary is required unless appointment status is Permanent.',
            'division.required' => 'The division is required.',
            'reports_to.required_if' => 'The reports to is required when appointment status is Permanent.',
            'positions_supervised.required_if' => 'The positions supervised is required when appointment status is Permanent.',
            'classifications.required_if' => 'The classifications is required when appointment status is Permanent.',
            'prescribed_education.required' => 'The prescribed education is required when appointment status is Permanent.',
            'prescribed_experience.required' => 'The prescribed experience is required when appointment status is Permanent.',
            'prescribed_training.required' => 'The prescribed training is required when appointment status is Permanent.',
            'prescribed_eligibility.required' => 'The prescribed eligibility is required when appointment status is Permanent.',
            'preferred_education.required' => 'The preferred education is required.',
            'preferred_experience.required' => 'The preferred experience is required.',
            'preferred_training.required' => 'The preferred training is required.',
            'preferred_eligibility.required' => 'The preferred eligibility is required.',
            'preferred_skills.required_unless' => 'The preferred skills is required unless appointment status is Permanent.',
            'examination.required' => 'The preferred examination is required when appointment status is Permanent.',
            'summary.required' => 'The job summary is required.',
            'output.required' => 'The job output is required.',
            'responsibility.required' => 'The duties and responsibilities is required.',
        ]);

        $validator->validate();

        try{
            
            $conn2->beginTransaction();

            $year = Carbon::now()->year;

            $lastReferenceNo = $conn2->table('vacancy')
            ->whereYear('date_created', $year) 
            ->orderByDesc('id') 
            ->first();

            $nextReferenceNo = '001'; 

            if ($lastReferenceNo) {
                $lastRefNum = explode('-', $lastReferenceNo->reference_no)[0];
                $nextReferenceNo = str_pad((int)$lastRefNum + 1, 3, '0', STR_PAD_LEFT);
            }
    
            $referenceNo = $year . '-' . $nextReferenceNo;

            $data = $request->all();

            $data = Arr::except($data, ['competencies']);
            
            $data['reference_no'] = $referenceNo;
            $data['status'] = 'Open';
            $data['step'] = 1;
            $data['created_by'] = Auth::user()->ipms_id;
            $data['date_created'] = now();
            $data['monthly_salary'] = (float) preg_replace('/[^0-9.]/', '', $data['monthly_salary']);

            $vacancy = $conn2->table('vacancy')
            ->insertGetId($data);

            if($request->competencies){
                foreach($request->competencies as $type => $competencies){
                    foreach($competencies as $competency){
                        $conn2->table('vacancy_competencies')
                        ->insert([
                            'vacancy_id' => $vacancy,
                            'competency_id' => $competency['id'], 
                            'level' => $competency['level'], 
                            'comp_type' => $competency['comp_type'], 
                        ]);
                    }
                }
            }

            $conn2->commit();

            return redirect()->route('vacancies.index')->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Vacancy saved successfully.'
            ]);

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to save vacancy: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving vacancy. Please try again.'
            ]);
        }
    }

    public function edit($id)
    {
        $conn2 = DB::connection('mysql2');
        $vacancy = $conn2->table('vacancy')->where('id', $id)->first();

        if (!$vacancy) {
            abort(404);
        }

        $vacancyCompetencies = $conn2->table('vacancy_competencies as vc')
        ->leftJoin('competency as c', 'c.comp_id', '=', 'vc.competency_id')
        ->select(
            'vc.competency_id as id',
            'c.competency',
            'vc.level',
            'vc.comp_type'
        )
        ->where('vacancy_id', $vacancy->id)
        ->get()
        ->groupBy('comp_type');

        $vacancy->competencies = [
            'organizational' => $vacancyCompetencies->get('org', collect())->values(),
            'leadership'     => $vacancyCompetencies->get('mnt', collect())->values(),
            'functional'     => $vacancyCompetencies->get('func', collect())->values(),
        ];

        return Inertia::render('Vacancies/EditVacancy', [
            'vacancy' => $vacancy
        ]);
    }

    public function update($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $validator = Validator::make($request->all(), [
            'type' => 'required',
            'appointment_status' => 'required',
            'item_no' => 'required_if:appointment_status,Permanent',
            'position_description' => 'required_unless:appointment_status,Permanent',
            'sg' => 'required_unless:appointment_status,Permanent',
            'monthly_salary' => 'required_unless:appointment_status,Permanent',
            'division' => 'required',
            'reports_to' => 'required_if:appointment_status,Permanent',
            'positions_supervised' => 'required_if:appointment_status,Permanent',
            'classification' => 'required_if:appointment_status,Permanent',
            'prescribed_education' => 'required_if:appointment_status,Permanent',
            'prescribed_experience' => 'required_if:appointment_status,Permanent',
            'prescribed_training' => 'required_if:appointment_status,Permanent',
            'prescribed_eligibility' => 'required_if:appointment_status,Permanent',
            'preferred_education' => 'required',
            'preferred_experience' => 'required',
            'preferred_training' => 'required',
            'preferred_eligibility' => 'required',
            'preferred_skills' => 'required_unless:appointment_status,Permanent',
            'examination' => 'required_if:appointment_status,Permanent',
            'summary' => 'required',
            'output' => 'required',
            'responsibility' => 'required',
        ], [
            'type.required' => 'The type is required.',
            'appointment_status.required' => 'The status of appointment is required.',
            'item_no.required_if' => 'The plantilla item no. is required when appointment status is Permanent.',
            'position_description.required_unless' => 'The position is required unless appointment status is Permanent.',
            'sg.required_unless' => 'The salary grade is required unless appointment status is Permanent.',
            'monthly_salary.required_unless' => 'The monthly salary is required unless appointment status is Permanent.',
            'division.required' => 'The division is required.',
            'reports_to.required_if' => 'The reports to is required when appointment status is Permanent.',
            'positions_supervised.required_if' => 'The positions supervised is required when appointment status is Permanent.',
            'classifications.required_if' => 'The classifications is required when appointment status is Permanent.',
            'prescribed_education.required' => 'The prescribed education is required when appointment status is Permanent.',
            'prescribed_experience.required' => 'The prescribed experience is required when appointment status is Permanent.',
            'prescribed_training.required' => 'The prescribed training is required when appointment status is Permanent.',
            'prescribed_eligibility.required' => 'The prescribed eligibility is required when appointment status is Permanent.',
            'preferred_education.required' => 'The preferred education is required.',
            'preferred_experience.required' => 'The preferred experience is required.',
            'preferred_training.required' => 'The preferred training is required.',
            'preferred_eligibility.required' => 'The preferred eligibility is required.',
            'preferred_skills.required_unless' => 'The preferred skills is required unless appointment status is Permanent.',
            'examination.required' => 'The preferred examination is required when appointment status is Permanent.',
            'summary.required' => 'The job summary is required.',
            'output.required' => 'The job output is required.',
            'responsibility.required' => 'The duties and responsibilities is required.',
        ]);

        $validator->validate();

        try {

            $conn2->beginTransaction();

            $data = $request->all();

            $data = Arr::except($data, ['competencies']);

            $data['step'] = $request->step ?? 1;
            $data['updated_by'] = Auth::user()->ipms_id;
            $data['date_updated'] = now();
            $data['monthly_salary'] = (float) preg_replace('/[^0-9.]/', '', $data['monthly_salary']);

            $conn2->table('vacancy')
            ->where('id', $id)
            ->update($data);

            $conn2->table('vacancy_competencies')->where('vacancy_id', $id)->delete();

            if ($request->competencies) {
                foreach ($request->competencies as $type => $competencies) {
                    foreach ($competencies as $competency) {
                        $conn2->table('vacancy_competencies')->insert([
                            'vacancy_id' => $id,
                            'competency_id' => $competency['id'],
                            'level' => $competency['level'],
                            'comp_type' => $competency['comp_type'],
                        ]);
                    }
                }
            }

            $conn2->commit();

            return redirect()->route('vacancies.index')->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Vacancy updated successfully.'
            ]);
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to update vacancy: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating the vacancy. Please try again.'
            ]);
        }
    }

    public function destroy($id)
    {
        $conn2 = DB::connection('mysql2');

        try {

            $conn2->beginTransaction();

            $conn2->table('vacancy')
                ->where('id', $id)
                ->delete();

            $conn2->table('submission_history')
                ->where('model_id', $id)
                ->where('model', 'Vacancy')
                ->delete();

            $conn2->commit();

            return redirect()->route('vacancies.index')->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Vacancy deleted successfully.'
            ]);
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to delete request: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the vacancy. Please try again.'
            ]);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $ids = $request->input('ids');

        try {

            $conn2->beginTransaction();

            $conn2->table('vacancy')
                ->whereIn('id', $ids)
                ->delete();

            $conn2->table('submission_history')
                ->whereIn('model_id', $ids)
                ->where('model', 'Vacancy')
                ->delete();

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Vacancies deleted successfully.'
            ]);
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to delete vacancies: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the vacancies. Please try again.'
            ]);
        }
    }

    public function submit($id)
    {

        $conn2 = DB::connection('mysql2');

        try {

            $conn2->beginTransaction();

            $vacancy = $conn2->table('vacancy')->where('id', $id)->first();

            if (!$vacancy) {
                abort(404, 'Vacancy not found');
            }

            $conn2->table('submission_history')->insert([
                'model' => 'Vacancy',
                'model_id' => $id,
                'status' => 'Submitted',
                'acted_by' => auth()->user()->ipms_id,
                'date_acted' => now(),
            ]);

            $conn2->commit();

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error submitting vacancy: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while submitting vacancy. Please try again.'
            ]);
        }
    }

    public function approve($id)
    {

        $conn2 = DB::connection('mysql2');

        try {

            $conn2->beginTransaction();

            $vacancy = $conn2->table('vacancy')->where('id', $id)->first();

            if (!$vacancy) {
                abort(404, 'Vacancy not found');
            }

            $conn2->table('submission_history')->insert([
                'model' => 'Vacancy',
                'model_id' => $id,
                'status' => 'Approved',
                'acted_by' => auth()->user()->ipms_id,
                'date_acted' => now(),
            ]);
            
            $conn2->commit();

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error approving vacancy: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while approving vacancy. Please try again.'
            ]);
        }
    }

    public function approveViaEmail($token)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');
        $conn4 = DB::connection('mysql4');

        try {

            $link = $conn4->table('email_links')->where('token', $token)->first();
            
            if (!$link) {
                abort(404, 'Invalid link.');
            }

            if (now()->greaterThan($link->expires_at)) {
                return Inertia::render('ThankYou', [
                    'message' => 'This link has expired.'
                ]);
            }

            if ($link->is_used) {
                return Inertia::render('ThankYou', [
                    'message' => 'This link has already been used.'
                ]);
            }
            
            $vacancy = $conn2->table('vacancy')->where('id', $link->model_id)->first();

            if (!$vacancy) {
                abort(404, 'Vacancy not found');
            }

            $user = User::find($link->user_id);

            if (!$user) {
                abort(404, 'User not found');
            }

            $conn2->table('submission_history')->insert([
                'model' => 'Vacancy',
                'model_id' => $vacancy->id,
                'status' => 'Approved',
                'acted_by' => $user->ipms_id,
                'date_acted' => now(),
            ]);

            $conn4->table('email_links')
            ->where('token', $token)
            ->update(['is_used' => true]);


            $staff = $conn3->table('tblemployee')
            ->where('emp_id', $vacancy->created_by)
            ->first();

            if (!$staff) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Staff record not found.'
                ]);
            }

            $submitter = User::where('ipms_id', $vacancy->created_by)->first();

            if ($submitter) {
                $payload = [
                    'vacancy_id' => $vacancy->id,
                    'approver_id' => $user->ipms_id,
                ];

                Notification::sendNow($submitter, new NotifyStaffOfVacancyApproval($payload));
            }

            // Audit log (optional)
            Log::info("Vacancy {$vacancy->id} approved via email by user {$user->email}");

            return Inertia::render('ThankYou', [
                'message' => 'You have successfully approved the vacancy.',
            ]);

        } catch (\Exception $e) {
            Log::error("Failed email approval for vacancy: " . $e->getMessage());
            
            return Inertia::render('ThankYou', [
                'message' => 'Something went wrong. Please contact the ICT Unit.',
            ]);
        }
    }

    public function disapprove($id, Request $request)
    {

        $conn2 = DB::connection('mysql2');

        $request->validate(
            [
                'remarks' => 'required|string|max:1000',
            ],
            [
                'remarks.required' => 'Remarks are required to disapprove an RTO.',
                'remarks.string'   => 'Remarks must be a valid text.',
                'remarks.max'      => 'Remarks cannot exceed 1000 characters.',
            ]
        );

        try {

            $conn2->beginTransaction();

            $vacancy = $conn2->table('vacancy')->where('id', $id)->first();

            if (!$vacancy) {
                abort(404, 'Vacancy not found');
            }

            $conn2->table('submission_history')->insert([
                'model' => 'Vacancy',
                'model_id' => $id,
                'status' => 'Disapproved',
                'acted_by' => auth()->user()->ipms_id,
                'date_acted' => now(),
                'remarks' => $request->remarks
            ]);

            $conn2->commit();

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error disapproving vacancy: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while disapproving vacancy. Please try again.'
            ]);
        }
    }

    public function return($id, Request $request)
    {

        $conn2 = DB::connection('mysql2');

        $request->validate(
            [
                'remarks' => 'required|string|max:1000',
            ],
            [
                'remarks.required' => 'Remarks are required to return an RTO.',
                'remarks.string'   => 'Remarks must be a valid text.',
                'remarks.max'      => 'Remarks cannot exceed 1000 characters.',
            ]
        );

        try {

            $conn2->beginTransaction();

            $vacancy = $conn2->table('vacancy')->where('id', $id)->first();

            if (!$vacancy) {
                abort(404, 'Vacancy not found');
            }

            $conn2->table('submission_history')->insert([
                'model' => 'Vacancy',
                'model_id' => $id,
                'status' => 'Needs Revision',
                'acted_by' => auth()->user()->ipms_id,
                'date_acted' => now(),
                'remarks' => $request->remarks
            ]);

            $conn2->commit();

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error returning vacancy: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while returning vacancy. Please try again.'
            ]);
        }
    }

    public function getPositions()
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $latestSalarySub = $conn3->table('tblprl_salary_schedule as s1')
            ->select('s1.grade', 's1.step', 's1.salary')
            ->whereRaw('s1.effectivity_date_start = (
                SELECT MAX(s2.effectivity_date_start)
                FROM tblprl_salary_schedule as s2
                WHERE s2.grade = s1.grade AND s2.step = s1.step
            )');

        $positions = $conn3->table('tblemp_position_item as epi')
            ->select(
                'item_no as value',
                DB::raw('concat(division_id, ": ", p.position_id, " (",item_no,")") as label'),
                'epi.grade',
                'division_id',
                'p.post_description as position_description',
                'p.position_id as position_id',
                's.salary'
            )
            ->leftJoin('tblposition as p', 'p.position_id', '=', 'epi.position_id')
            ->leftJoinSub($latestSalarySub, 's', function($join) {
                $join->on('s.grade', '=', 'epi.grade')
                    ->where('s.step', '=', 1);
            })
            ->where('epi.status', 1)
            ->orderBy('epi.division_id', 'asc')
            ->orderBy('p.position_id', 'asc')
            ->get();

        if (auth()->user()->can('HRIS_DC')) {
            $positions = $positions->where('epi.division_id', auth()->user()->division);
        }

        return response()->json($positions); 
    }

    public function getCompetencies(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $competencies = $conn2->table('competency')
        ->select(
            'comp_id as value',
            'competency as label',
            'comp_type'
        );

        if($request->comp_type){
            $competencies->where('comp_type', $request->comp_type);
        }

        $competencies = $competencies
        ->orderBy('comp_type', 'asc')
        ->orderBy('competency', 'asc')
        ->get();

        return response()->json($competencies); 
    }

    public function getCompetenciesPerPosition($id)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $competencies = $conn2->table('position_competency_indicator as pci')
        ->select(
            'c.comp_id as id',
            'c.competency as competency',
            DB::raw('MAX(ci.proficiency) as level'),
            'c.comp_type'
        )
        ->leftJoin('competency_indicator as ci', 'ci.id', '=', 'pci.indicator_id')
        ->leftJoin('competency as c', 'c.comp_id', '=', 'ci.competency_id')
        ->where('pci.position_id', $id)
        ->groupBy('c.comp_id', 'c.competency', 'c.comp_type')
        ->orderBy('c.comp_type', 'asc')
        ->orderBy('c.competency', 'asc')
        ->get();

        return response()->json($competencies); 
    }

    public function getQuestions(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $search = $request->input('search', '');

        // 1. Get all question + competency mappings
        $rawQuestions = $conn2->table('vacancy_questions as vq')
            ->leftJoin('vacancy_question_competencies as vqc', 'vqc.question_id', '=', 'vq.id')
            ->leftJoin('competency as c', 'c.comp_id', '=', 'vqc.competency_id')
            ->select(
                'vq.id',
                'vq.question',
                'vqc.competency_id',
                'c.competency'
            )
            ->when($search, fn($q) => $q->where('vq.question', 'like', "%{$search}%"))
            ->when($request->competency, fn($q) => $q->where('vqc.competency_id', $request->competency))
            ->get();

        // 2. Group by question text + sorted set of competency IDs
        $grouped = $rawQuestions
            ->groupBy(function ($item) use ($rawQuestions) {
                $questionText = trim($item->question);
                $questionId = $item->id;

                $allCompetencyIds = $rawQuestions
                    ->where('id', $questionId)
                    ->where('question', $questionText)
                    ->pluck('competency_id')
                    ->filter()
                    ->unique()
                    ->sort()
                    ->values()
                    ->implode('-');

                return $questionText . '::' . $allCompetencyIds;
            });

        // 3. Transform
        $final = collect();

        foreach ($grouped as $group) {
            $first = $group->first();

            $competencyIds = $group->pluck('competency_id')->filter()->unique()->sort()->values();
            $competencyNames = $group->pluck('competency')->filter()->unique()->sort()->values();

            $final->push((object)[
                'id' => $first->id,
                'question' => $first->question,
                'competencyIds' => $competencyIds,
                'competencies' => $competencyNames->implode(', '),
            ]);
        }

        // 4. Get all unique question IDs for ratings
        $questionIds = $final->pluck('id')->unique();

        $ratings = $conn2->table('vacancy_ratings')
            ->whereIn('question_id', $questionIds)
            ->select('question_id', 'score', 'title', 'description', 'element')
            ->orderBy('score')
            ->get()
            ->groupBy('question_id');

        $final = $final->map(function ($item) use ($ratings) {
            $item->ratings = $ratings->get($item->id)?->values() ?? collect();
            return $item;
        });

        // 5. Paginate manually
        $perPage = 20;
        $page = request()->input('page', 1);

        $paginated = new \Illuminate\Pagination\LengthAwarePaginator(
            $final->forPage($page, $perPage)->values(),
            $final->count(),
            $perPage,
            $page,
            ['path' => request()->url(), 'query' => request()->query()]
        );

        return response()->json($paginated);
    }

    public function storeQuestion($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $validator = Validator::make($request->all(), [
            'competencies' => 'required|array|min:1',
            'competencies.*' => [
                'required',
                'integer',
            ],
            'question' => 'required|string',
            'ratings.*.description' => 'required|string',
        ], [
            'competencies.required' => 'Please select at least one competency.',
            'competencies.array' => 'Competencies must be in array format.',
            'competencies.*.required' => 'Each selected competency is required.',

            'element.required' => 'The element is required.',

            'question.required' => 'The question field is required.',

            'ratings.*.description.required' => 'Each rating must have a description.',
            'ratings.*.description.string' => 'Descriptions must be text.',
        ]);

        $validator->validate();

        try{
            $question = $conn2->table('vacancy_questions')
            ->insertGetId([
                'vacancy_id' => $id,
                'question' => $request->question,
                'created_by' => Auth::user()->ipms_id,
                'date_created' => Carbon::now()->format('Y-m-d H:i:s'),
            ]);

            if($request->competencies){
                foreach($request->competencies as $competency){
                    $conn2->table('vacancy_question_competencies')
                    ->insert([
                        'question_id' => $question,
                        'competency_id' => $competency, 
                    ]);
                }
            }

            if($request->ratings){
                foreach($request->ratings as $rating){
                    $conn2->table('vacancy_ratings')
                    ->insert([
                        'question_id' => $question,
                        'element' => $rating['element'], 
                        'title' => $rating['title'], 
                        'description' => $rating['description'], 
                        'score' => $rating['score'], 
                    ]);
                }
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Question saved successfully.'
            ]);

        } catch (\Exception $e) {

            Log::error('Failed to save question: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving question. Please try again.'
            ]);
        }
    }

    public function updateQuestion($vacancyId, $questionId, Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $validator = Validator::make($request->all(), [
            'competencies' => 'required|array|min:1',
            'competencies.*' => ['required', 'integer'],
            'question' => 'required|string',
            'ratings.*.description' => 'required|string',
        ], [
            'competencies.required' => 'Please select at least one competency.',
            'competencies.array' => 'Competencies must be in array format.',
            'competencies.*.required' => 'Each selected competency is required.',

            'question.required' => 'The question field is required.',

            'ratings.*.description.required' => 'Each rating must have a description.',
            'ratings.*.description.string' => 'Descriptions must be text.',
        ]);

        $validator->validate();

        try {
            $conn2->table('vacancy_questions')
                ->where('id', $questionId)
                ->update([
                    'question' => $request->question,
                    'updated_by' => Auth::user()->ipms_id,
                    'date_updated' => Carbon::now()->format('Y-m-d H:i:s'),
                ]);

            $conn2->table('vacancy_question_competencies')
                ->where('question_id', $questionId)
                ->delete();

            foreach ($request->competencies as $competency) {
                $conn2->table('vacancy_question_competencies')->insert([
                    'question_id' => $questionId,
                    'competency_id' => $competency,
                ]);
            }

            $conn2->table('vacancy_ratings')
                ->where('question_id', $questionId)
                ->delete();

            if ($request->ratings) {
                foreach ($request->ratings as $rating) {
                    // Try to update first
                    $updated = $conn2->table('vacancy_ratings')
                        ->where('question_id', $questionId)
                        ->where('element', $rating['element'])
                        ->where('score', $rating['score'])
                        ->update([
                            'description' => $rating['description'],
                        ]);

                    // If no existing rating matched, insert it
                    if ($updated === 0) {
                        $conn2->table('vacancy_ratings')->insert([
                            'question_id' => $questionId,
                            'element' => $rating['element'],
                            'title' => $rating['title'],
                            'description' => $rating['description'],
                            'score' => $rating['score'],
                        ]);
                    }
                }
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Question updated successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update question: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating the question. Please try again.'
            ]);
        }
    }

    public function deleteQuestion($vacancyId, $questionId)
    {
        $conn2 = DB::connection('mysql2');

        try {
            $conn2->table('vacancy_ratings')
                ->where('question_id', $questionId)
                ->delete();

            $conn2->table('vacancy_question_competencies')
                ->where('question_id', $questionId)
                ->delete();

            $conn2->table('vacancy_questions')
                ->where('id', $questionId)
                ->where('vacancy_id', $vacancyId)
                ->delete();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Deleted!',
                'message' => 'Question deleted successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete question: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Oops!',
                'message' => 'Something went wrong while deleting the question.'
            ]);
        }
    }

    public function getVacancies()
    {
        $conn2 = DB::connection('mysql2');

        $vacancies = $conn2->table('vacancy')
            ->select(
                'vacancy.id as value',
                DB::raw("
                    CONCAT(
                        '[RF#: ',vacancy.reference_no,'] ',vacancy.division, ': ', vacancy.position_description,
                        CASE
                            WHEN vacancy.appointment_status = 'Permanent' THEN CONCAT(' (', vacancy.item_no, ')')
                            ELSE ''
                        END
                    ) as label
                ")
            )
            ->orderBy('vacancy.division', 'asc')
            ->orderBy('vacancy.position', 'asc')
            ->orderBy('vacancy.item_no', 'asc')
            ->get();

        return response()->json($vacancies);
    }

    public function getVacancyDetails($id)
    {
        $conn2 = DB::connection('mysql2');

        $vacancy = $conn2->table('vacancy')
            ->where('id', $id)
            ->first();

        $competencies = $conn2->table('vacancy_competencies as vc')
            ->leftJoin('competency as c', 'vc.competency_id', '=', 'c.comp_id')
            ->where('vc.vacancy_id', $id)
            ->select(
                'c.comp_id as id',
                'c.competency',
                'vc.level',
                'vc.comp_type'
            )
            ->orderBy('vc.comp_type', 'asc')
            ->orderBy('c.competency', 'asc')
            ->get();

        $vacancy->competencies = $competencies;

        return response()->json($vacancy);
    }
}
