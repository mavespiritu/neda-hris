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
        $hasDCRole = $user->hasRole('HRIS_DC');
        $hasADCRole = $user->hasRole('HRIS_ADC');

        $search = trim($request->input('search', ''));

        // Get positions list
        $positions = $conn3->table('tblemp_position_item as epi')
            ->join('tblposition as p', 'p.position_id', '=', 'epi.position_id')
            ->select('epi.item_no', 'p.post_description')
            ->get()
            ->pluck('post_description', 'item_no');

        // Prepare employee query
        $employeeQuery = $conn3->table('tblemployee as e')
            ->select([
                DB::raw('CAST(e.emp_id AS CHAR) as emp_id'),
                DB::raw('CONCAT(e.lname, ", ", e.fname, " ", e.mname) as name'),
            ])
            ->where('e.work_status', 'Active');

        if ($hasDCRole || $hasADCRole) {
            $userInfo = $conn3->table('tblemployee')
                ->where('emp_id', $user->ipms_id)
                ->first();

            if ($userInfo) {
                $employeeQuery->where('e.division_id', $userInfo->division_id);
            }
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

        $submissions = $conn2->table('submission_history as sh')
        ->select([
            'sh.id',
            'sh.status',
            DB::raw("DATE_FORMAT(sh.date_acted, '%M %d, %Y %h:%i:%s %p') as date_acted"),
            DB::raw("CONCAT(e.lname, ', ', e.fname, ' ', e.mname) as name"),
        ])
        ->leftJoin($conn3->raw('tblemployee as e'), 'sh.acted_by', '=', 'e.emp_id')
        ->where('model', 'CGA')
        ->where('model_id', $id)
        ->orderBy('sh.id', 'desc')
        ->get();

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

}