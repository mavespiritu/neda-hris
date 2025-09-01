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

class VacancyController extends Controller
{
    public $emp_id;

    public function __construct()
    {
        $this->emp_id = Auth::check() ? Auth::user()->ipms_id : null; 
    }

    public function index(Request $request)
    {
        /* Gate::authorize('view-index', 
            'vacancies',
            [
                'allowed_roles' => ['RD', 'ARD', 'OIC-RD', 'OIC-ARD', 'HRIS_HR', 'HRIS_DC'],
                'required_permission' => 'HRIS_vacancies.view-vacancies',
            ]
        ); */

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
            ->orderBy('vacancy.id', 'desc')
            ->paginate(20);

        // Collect employee IDs for display
        $allIDs = $vacancies->pluck('created_by')
            ->merge($vacancies->pluck('updated_by'))
            ->merge($vacancies->pluck('latest_acted_by'))
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

        // Attach names
        $vacancies->getCollection()->transform(function ($pub) use ($employees) {
            $pub->creator = $employees->get($pub->created_by)->name ?? null;
            $pub->actor = $employees->get($pub->latest_acted_by)->name ?? null;
            return $pub;
        });

        return Inertia::render('Vacancies/index', [
            'vacancies' => $vacancies,
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
            $data = $request->all();

            $data = Arr::except($data, ['competencies']);
            
            $data['step'] = 1;
            $data['created_by'] = Auth::user()->ipms_id;
            $data['date_created'] = now();
            $data['monthly_salary'] = (float) preg_replace('/[^0-9.]/', '', $data['monthly_salary']);

            $vacancy = $conn2->table('vacancy')
            ->insertGetId($data);

            $conn2->table('status_logs')
            ->insert([
                'model_id' => $vacancy,
                'model' => 'Vacancy',
                'status' => 'Draft',
                'acted_by' => Auth::user()->ipms_id,
                'date_acted' => Carbon::now()->format('Y-m-d H:i:s'),
            ]);

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

            return redirect()->route('vacancies.index')->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Vacancy saved successfully.'
            ]);

        } catch (\Exception $e) {

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

            return redirect()->route('vacancies.index')->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Vacancy updated successfully.'
            ]);
        } catch (\Exception $e) {
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
            $conn2->table('vacancy')
                ->where('id', $id)
                ->delete();

            $conn2->table('status_logs')
                ->where('model_id', $id)
                ->where('model', 'Vacancy')
                ->delete();

            return redirect()->route('vacancies.index')->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Vacancy deleted successfully.'
            ]);
        } catch (\Exception $e) {
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
            $conn2->table('vacancy')
                ->whereIn('id', $ids)
                ->delete();

            $conn2->table('status_logs')
                ->whereIn('model_id', $ids)
                ->where('model', 'Vacancy')
                ->delete();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Vacancies deleted successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete vacancies: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the vacancies. Please try again.'
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
                        'model' => 'Vacancy',
                        'status' => 'Approved',
                        'acted_by' => Auth::user()->ipms_id,
                        'date_acted' => Carbon::now()->format('Y-m-d'),
                    ]);
                }
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Vacancies approved successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to approve vacancies: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while approving the vacancies. Please try again.'
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
                'message' => 'Vacancies approved successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to approve vacancies: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while approving the vacancies. Please try again.'
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
                        'model' => 'Vacancy',
                        'status' => 'Submitted',
                        'acted_by' => Auth::user()->ipms_id,
                        'date_acted' => Carbon::now()->format('Y-m-d'),
                    ]);
                }
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Vacancies submitted successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send vacancies for approval: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while submitting vacancies. Please try again.'
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
                        'model' => 'Vacancy',
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
                'message' => 'Request for changes on vacancies submitted successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to request changes for vacancies: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while requesting changes for vacancies. Please try again.'
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
                        'model' => 'Vacancy',
                        'status' => 'Ready for Approval',
                        'acted_by' => Auth::user()->ipms_id,
                        'date_acted' => Carbon::now()->format('Y-m-d'),
                    ]);
                }
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Vacancies ready for approval submitted successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to submit vacancies ready for approval: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while submitting vacancies ready for approval. Please try again.'
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
}
