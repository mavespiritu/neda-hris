<?php

namespace App\Http\Controllers\Competencies;

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
use App\Notifications\CompetenciesForReviewSubmitted;
use Illuminate\Support\Arr;

class CgaSubmissionController extends Controller
{
    public function index(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $user = Auth::user();
        $rolePriorities = config('roles.priorities');
        $userRoles = Auth::user()->roles->pluck('name')->toArray();
        $highestRole = collect($userRoles)
            ->mapWithKeys(fn($role) => [$role => $rolePriorities[$role] ?? 0])
            ->sortDesc()
            ->keys()
            ->first();

        $search = trim($request->input('search', ''));

        $positions = $conn3->table('tblemp_position_item as epi')
            ->join('tblposition as p', 'p.position_id', '=', 'epi.position_id')
            ->select('epi.item_no', 'p.post_description')
            ->get()
            ->pluck('post_description', 'item_no');

        $employeeQuery = $conn3->table('tblemployee as e')
            ->select([
                DB::raw('CAST(e.emp_id AS CHAR) as emp_id'),
                DB::raw('CONCAT(e.lname, ", ", e.fname, " ", e.mname) as name'),
            ])
            ->where('e.work_status', 'Active');

        switch ($highestRole) {
            case 'HRIS_RD':
                // RD sees all
                break;
            case 'HRIS_ARD':
                // ARD sees all
                break;
            case 'HRIS_HR':
                // HR sees all
                break;
            case 'HRIS_ADC':
            case 'HRIS_DC':
                $employeeQuery->where('e.division_id', auth()->user()->division);
                break;
        }

        // Execute employee query
        $employees = $employeeQuery->get()->pluck('name', 'emp_id');
        $empIds = $employees->keys(); // This will be used to limit submissions

        // Prepare filtered emp_id and item_no based on search
        $filteredEmpIDs = collect();
        $filteredItemNos = collect();

        if ($search !== '') {
            $filteredEmpIDs = $employees->filter(function ($name) use ($search) {
                return stripos($name, $search) !== false;
            })->keys();

            $filteredItemNos = $positions->filter(function ($post_description) use ($search) {
                return stripos($post_description, $search) !== false;
            })->keys();
        }

        // Prepare submission query and filter by employee list
        $submissions = $conn2->table('staff_competency_review as scr')
            ->select([
                'scr.id',
                'scr.emp_id',
                'scr.year',
                'scr.position_id',
                DB::raw("DATE_FORMAT(date_created, '%M %d, %Y %h:%i:%s %p') as date_submitted"),
                'scr.status',
                'scr.acted_by',
                'scr.endorsed_by',
                DB::raw("DATE_FORMAT(scr.date_acted, '%M %d, %Y %h:%i:%s %p') as date_acted"),
                DB::raw("DATE_FORMAT(scr.date_endorsed, '%M %d, %Y %h:%i:%s %p') as date_endorsed"),
            ])
            //->where('scr.emp_id', '<>', $user->ipms_id)
            ->whereIn('scr.emp_id', $empIds); // 🔒 Ensures only valid employees' submissions

        if ($search !== '') {
            $submissions->where(function ($query) use ($filteredEmpIDs, $filteredItemNos, $search) {
                if ($filteredEmpIDs->isNotEmpty()) {
                    $query->whereIn('scr.emp_id', $filteredEmpIDs);
                }

                if ($filteredItemNos->isNotEmpty()) {
                    $query->orWhereIn('scr.position_id', $filteredItemNos);
                }

                $query->orWhere(function ($subQuery) use ($search) {
                    $subQuery->where(function ($q) use ($search) {
                        $q->where('scr.status', 'like', "%{$search}%")
                            ->orWhere(function ($q2) use ($search) {
                                if (stripos('Submitted', $search) !== false) {
                                    $q2->whereNull('scr.status');
                                }
                            });
                    });
                });

                $query->orWhereRaw("DATE_FORMAT(scr.date_created, '%M %d, %Y') like ?", ["%{$search}%"]);
            });
        }

        $submissions = $submissions->orderBy('scr.date_created', 'desc')->paginate(20);

        // Enrich submission data with employee names and positions
        $submissions->getCollection()->transform(function ($submission) use ($positions, $employees) {
            $submission->position = $positions[$submission->position_id] ?? null;
            $submission->name = $employees[$submission->emp_id] ?? null;
            return $submission;
        });

        return Inertia::render('Competencies/ReviewCga/index', [
            'submissions' => $submissions,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function updateIndicator($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $user = Auth::user();

        $competency = $request->input('competency');
        $indicator = $request->input('indicator');

        $now = Carbon::now()->format('Y-m-d H:i:s');
    
        $history = $conn2->table('staff_competency_indicator_history')->where('id', $id)->first();
        $competencyHistory = $conn2->table('staff_competency_history')->where('id', $competency['id'])->first();

        try{
            $conn2->table('staff_competency_history')
                ->where('id', $competency['id'])
                ->update([
                    'percentage' => $competency['percentage'],
                ]);

            if(!$history)
            {
                $conn2->table('staff_competency_indicator_history')
                ->insert([
                    'emp_id' => $indicator['emp_id'],
                    'position_id' => $indicator['position_id'],
                    'indicator_id' => $indicator['indicator_id'],
                    'compliance' => $indicator['compliance'],
                    'created_by' => $indicator['emp_id'],
                    'date_created' => $competency['date_created'],
                    'updated_by' => $user->ipms_id,
                    'date_updated' => $now,
                    'remarks' => $indicator['remarks'] ?? null,
                ]);
            }else{
                $conn2->table('staff_competency_indicator_history')
                ->where('id', $id)
                ->update([
                    'compliance' => $indicator['compliance'] ?? 0,
                    'remarks' => $indicator['remarks'] ?? null,
                    'updated_by' => $user->ipms_id,
                    'date_updated' => $now,
                ]);
            }

            $conn2->table('staff_all_competency_history')
            ->updateOrInsert(
                [
                    'competency_id' => $competency['competency_id'],
                    'emp_id' => $competency['emp_id'],
                    'date_created' => $competency['date_created'],     
                ],
                [
                    'percentage' => $competency['percentage'],
                    'created_by' => $user->ipms_id
                ]
            );

            $conn2->table('staff_all_competency_indicator_history')
            ->updateOrInsert(
                [
                    'emp_id' => $indicator['emp_id'],
                    'indicator_id' => $indicator['indicator_id'],
                    'date_created' => $indicator['date_created'],     
                ],
                $data
            );

            $conn2->table('staff_competency_history')
            ->updateOrInsert(
                [
                    'emp_id' => $competency['emp_id'],
                    'position_id' => $competency['position_id'],
                    'competency_id' => $competency['competency_id'],
                    'proficiency' => $competency['proficiency'],
                    'date_created' => $competency['date_created'],
                ],
                [
                    'percentage' => $competency['percentage'],
                    'created_by' => $user->ipms_id
                ]
            );

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Indicator updated successfully!',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to update indicator: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating the indicator. Please try again.'
            ]);
        }
    }

    public function updateRemarks($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');
        $user = Auth::user();

        try{
            $indicator = $conn2->table('staff_competency_indicator_history')
            ->where('id', $id)
            ->update([
                'remarks' => $request->remarks,
                'updated_by' => $user->ipms_id,
                'date_updated' => Carbon::now()->format('Y-m-d H:i:s')
            ]);

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Remarks updated successfully!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to update remarks: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating the remarks. Please try again.'
            ]);
        }
    }

    public function getSubmissionHistory($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        // 1️⃣ Get submission history
        $submissions = $conn2->table('submission_history as sh')
            ->select([
                'sh.id',
                'sh.status',
                'sh.acted_by',
                DB::raw("DATE_FORMAT(sh.date_acted, '%M %d, %Y %h:%i:%s %p') as date_acted"),
            ])
            ->where('model', 'CGA')
            ->where('model_id', $id)
            ->orderBy('sh.id', 'desc')
            ->get();

        // If no submissions, return empty response early
        if ($submissions->isEmpty()) {
            return response()->json([]);
        }

        // 2️⃣ Get all employee IDs used
        $employeeIds = $submissions->pluck('acted_by')->unique()->filter();

        // 3️⃣ Fetch employees in one query
        $employees = $conn3->table('tblemployee')
            ->whereIn('emp_id', $employeeIds)
            ->select('emp_id', 'lname', 'fname', 'mname')
            ->get()
            ->keyBy('emp_id');

        // 4️⃣ Merge employee name into submission history
        $submissions = $submissions->map(function ($item) use ($employees) {
            $employee = $employees->get($item->acted_by);

            $item->name = $employee
                ? trim("{$employee->lname}, {$employee->fname} {$employee->mname}")
                : 'System';

            unset($item->acted_by); // remove if not needed in response

            return $item;
        });

        return response()->json($submissions);
    }

    public function takeAction($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $user = Auth::user();

        $submission = $conn2->table('staff_competency_review')->where('id', $id)->first();

        if (!$submission) {
            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'Submission not found.',
            ]);
        }

        DB::beginTransaction();

        try {
            $completeIndicators = $conn2->table('position_competency_indicator')
                ->where('position_id', $submission->position_id)
                ->get();

            // Update submission
            $conn2->table('staff_competency_review')->where('id', $id)->update([
                'status' => $request->status,
                'remarks' => $request->remarks,
                'acted_by' => $user->ipms_id,
                'date_acted' => now(),
                'endorsed_by' => $request->status === 'Endorsed' ? $user->ipms_id : null,
                'date_endorsed' => $request->status === 'Endorsed' ? now() : null,
            ]);

            // Insert submission history
            $conn2->table('submission_history')->insert([
                'model' => 'CGA',
                'model_id' => $id,
                'status' => $request->status,
                'remarks' => $request->remarks,
                'acted_by' => $user->ipms_id,
                'date_acted' => now(),
            ]);

            // When approved, update indicators
            if ($request->status === 'Approved') {
                $indicators = $conn2->table('staff_competency_indicator_history')
                    ->where('date_created', $submission->date_created)
                    ->where('emp_id', $submission->emp_id)
                    ->where('position_id', $submission->position_id)
                    ->get();

                $existingAllIndicators = $conn2->table('staff_all_indicator')
                    ->where('emp_id', $submission->emp_id)
                    ->pluck('indicator_id')
                    ->toArray();

                $existingCompetencyIndicators = $conn2->table('staff_competency_indicator')
                    ->where('emp_id', $submission->emp_id)
                    ->where('position_id', $submission->position_id)
                    ->pluck('indicator_id')
                    ->toArray();

                // Prepare maps for faster lookup
                $submittedIndicators = [];
                foreach ($indicators as $indicator) {
                    $submittedIndicators[$indicator->indicator_id] = is_numeric($indicator->compliance) ? (int)$indicator->compliance : 0;
                }

                $toInsertInAll = [];
                $toInsertInCompetency = [];
                $toUpdateInAll = [];
                $toUpdateInCompetency = [];

                // Ensure all required indicators for the position are saved
                foreach ($completeIndicators as $ci) {
                    $indicatorId = $ci->indicator_id;
                    $compliance = isset($submittedIndicators[$indicatorId]) ? $submittedIndicators[$indicatorId] : 0;

                    if (!in_array($indicatorId, $existingAllIndicators)) {
                        $toInsertInAll[] = [
                            'emp_id' => $submission->emp_id,
                            'indicator_id' => $indicatorId,
                            'compliance' => $compliance,
                        ];
                    } else {
                        $toUpdateInAll[$indicatorId] = $compliance;
                    }

                    if (!in_array($indicatorId, $existingCompetencyIndicators)) {
                        $toInsertInCompetency[] = [
                            'emp_id' => $submission->emp_id,
                            'position_id' => $submission->position_id,
                            'indicator_id' => $indicatorId,
                            'compliance' => $compliance,
                        ];
                    } else {
                        $toUpdateInCompetency[$indicatorId] = $compliance;
                    }
                }

                if (!empty($toInsertInAll)) {
                    $conn2->table('staff_all_indicator')->insert($toInsertInAll);
                }

                if (!empty($toInsertInCompetency)) {
                    $conn2->table('staff_competency_indicator')->insert($toInsertInCompetency);
                }

                if (!empty($toUpdateInAll)) {
                    $cases = '';
                    foreach ($toUpdateInAll as $id => $compliance) {
                        $cases .= "WHEN {$id} THEN {$compliance} ";
                    }
                    $ids = implode(',', array_keys($toUpdateInAll));
                    $conn2->statement("
                        UPDATE staff_all_indicator
                        SET compliance = CASE indicator_id
                            {$cases}
                        END
                        WHERE emp_id = ? AND indicator_id IN ({$ids})
                    ", [$submission->emp_id]);
                }

                if (!empty($toUpdateInCompetency)) {
                    $cases = '';
                    foreach ($toUpdateInCompetency as $id => $compliance) {
                        $cases .= "WHEN {$id} THEN {$compliance} ";
                    }
                    $ids = implode(',', array_keys($toUpdateInCompetency));
                    $conn2->statement("
                        UPDATE staff_competency_indicator
                        SET compliance = CASE indicator_id
                            {$cases}
                        END
                        WHERE emp_id = ? AND position_id = ? AND indicator_id IN ({$ids})
                    ", [$submission->emp_id, $submission->position_id]);
                }
            }

            DB::commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Submission status updated successfully!',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to update submission status: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating the status. Please try again.',
            ]);
        }
    }

    public function getSubmissionSummary()
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $currentYear = now()->year;
        $years = range($currentYear, $currentYear - 4);

        /**
         * 🔹 1. Load positions
         */
        $positions = $conn3->table('tblemp_position_item as epi')
            ->join('tblposition as p', 'p.position_id', '=', 'epi.position_id')
            ->select('epi.item_no', 'p.post_description')
            ->get()
            ->pluck('post_description', 'item_no');

        /**
         * 🔹 2. Latest submission ID per emp per year
         */
        $latestPerEmpYear = $conn2->table('staff_competency_review')
            ->select(
                'emp_id',
                'year',
                DB::raw('MAX(id) as latest_id')
            )
            ->whereIn('year', $years)
            ->groupBy('emp_id', 'year');

        /**
         * 🔹 3. Subquery: competency averages per submission
         * (total percentage / number of competencies)
         */
        $competencyAverages = $conn2->table('staff_competency_history as sch')
            ->select([
                'sch.emp_id',
                'sch.position_id',
                'sch.date_created',
                DB::raw('AVG(sch.percentage) as avg_percentage'),
                DB::raw('COUNT(sch.competency_id) as competency_count'),
            ])
            ->groupBy(
                'sch.emp_id',
                'sch.position_id',
                'sch.date_created'
            );

        /**
         * 🔹 4. Get latest submissions with competency average
         */
        $submissions = $conn2->table('staff_competency_review as scr')
            ->joinSub($latestPerEmpYear, 'latest', function ($join) {
                $join->on('scr.id', '=', 'latest.latest_id');
            })
            ->leftJoinSub($competencyAverages, 'ca', function ($join) {
                $join->on('ca.emp_id', '=', 'scr.emp_id')
                    ->on('ca.position_id', '=', 'scr.position_id')
                    ->on('ca.date_created', '=', 'scr.date_created');
            })
            ->select([
                'scr.id',
                'scr.emp_id',
                'scr.year',
                'scr.position_id',
                DB::raw("DATE_FORMAT(scr.date_created, '%M %d, %Y %h:%i:%s %p') as date_submitted"),
                'scr.status',
                'scr.acted_by',
                'scr.endorsed_by',
                DB::raw("DATE_FORMAT(scr.date_acted, '%M %d, %Y %h:%i:%s %p') as date_acted"),
                DB::raw("DATE_FORMAT(scr.date_endorsed, '%M %d, %Y %h:%i:%s %p') as date_endorsed"),
                'scr.date_created',

                // 👇 competency data
                'ca.avg_percentage',
                'ca.competency_count',
            ])
            ->get();

        /**
         * 🔹 5. Latest status per submission
         */
        $latestHistories = $conn2->table('submission_history as sh1')
            ->select('sh1.id', 'sh1.model_id', 'sh1.status')
            ->where('sh1.model', 'CGA')
            ->whereIn('sh1.model_id', $submissions->pluck('id'))
            ->whereRaw('sh1.id = (
                SELECT MAX(sh2.id)
                FROM submission_history sh2
                WHERE sh2.model = sh1.model
                AND sh2.model_id = sh1.model_id
            )')
            ->get()
            ->keyBy('model_id');

        /**
         * 🔹 6. Employee names
         */
        $employeesData = $conn3->table('tblemployee as e')
            ->select([
                DB::raw('CAST(e.emp_id AS CHAR) as emp_id'),
                DB::raw('CONCAT(e.lname, ", ", e.fname, " ", e.mname) as name'),
            ])
            ->where('e.work_status', 'Active')
            ->where('e.emp_type_id', 'Permanent')
            ->get()
            ->pluck('name', 'emp_id');

        /**
         * 🔹 7. Attach derived data
         */
        $submissions->transform(function ($submission) use ($latestHistories, $positions, $employeesData) {
            $submission->latest_status = $latestHistories[$submission->id]->status
                ?? $submission->status
                ?? null;

            $submission->position = $positions[$submission->position_id] ?? null;
            $submission->name = $employeesData[$submission->emp_id] ?? null;

            $submission->avg_percentage = $submission->avg_percentage !== null
                ? round($submission->avg_percentage, 2)
                : null;

            return $submission;
        });

        /**
         * 🔹 8. Index submissions by emp_id-year
         */
        $submissionsByEmpYear = $submissions->groupBy(function ($s) {
            return $s->emp_id . '-' . $s->year;
        });

        /**
         * 🔹 9. Role restriction
         */
        $rolePriorities = config('roles.priorities');
        $highestRole = collect(Auth::user()->roles->pluck('name'))
            ->mapWithKeys(fn ($role) => [$role => $rolePriorities[$role] ?? 0])
            ->sortDesc()
            ->keys()
            ->first();

        $employees = $conn3->table('tblemployee as e')
            ->select(
                'e.emp_id',
                DB::raw("CONCAT(e.lname, ', ', e.fname, ' ',
                    IF(e.mname IS NOT NULL AND e.mname != '', CONCAT(LEFT(e.mname,1),'. '), '')
                ) as name"),
                'e.division_id as division'
            )
            ->where('e.work_status', 'active')
            ->where('e.emp_type_id', 'Permanent')
            ->orderBy('division')
            ->orderBy('name');

        switch ($highestRole) {
            case 'HRIS_ADC':
            case 'HRIS_DC':
                $employees->where('division_id', Auth::user()->division);
                break;
        }

        $employees = $employees->get();

        /**
         * 🔹 10. Attach submissions per year per employee
         */
        $employees->transform(function ($emp) use ($submissionsByEmpYear, $years) {
            $emp->submissions = collect($years)->mapWithKeys(function ($year) use ($submissionsByEmpYear, $emp) {
                $key = $emp->emp_id . '-' . $year;
                $submission = $submissionsByEmpYear->get($key)?->first();

                return [
                    $year => $submission ? [
                        'id' => $submission->id,
                        'emp_id' => $submission->emp_id,
                        'status' => $submission->latest_status,
                        'date_created' => $submission->date_created,
                        'date_submitted' => $submission->date_submitted,
                        'position' => $submission->position,
                        'position_id' => $submission->position_id,
                        'name' => $submission->name,
                        'year' => $submission->year,
                        'acted_by' => $submission->acted_by,
                        'endorsed_by' => $submission->endorsed_by,
                        'date_acted' => $submission->date_acted,
                        'date_endorsed' => $submission->date_endorsed,

                        // 👇 competency output
                        'avg_percentage' => $submission->avg_percentage,
                        'competency_count' => $submission->competency_count,
                    ] : null,
                ];
            });

            return $emp;
        });

        return response()->json([
            'employees' => $employees,
            'years' => $years,
        ]);
    }
}