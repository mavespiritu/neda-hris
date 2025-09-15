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

class CgaController extends Controller
{
    public function index(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $empId = $request->emp_id ?? auth()->user()->ipms_id;
        $today = now()->toDateString();

        // Get latest designation (from mysql2)
        $latestDesignation = $conn2->table('career_path as c')
            ->select('c.position_id as item_no')
            ->where('type', 'Designation')
            ->where('emp_id', $empId)
            ->whereDate('start_date', '<=', $today)
            ->where(function ($query) use ($today) {
                $query->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', $today);
            })
            ->orderByDesc('start_date')
            ->first();

        // Build subquery for latest assignments (from mysql3)
        $latestAssignments = $conn3->table('tblemp_emp_item as eei')
            ->select('eei.emp_id', 'eei.item_no')
            ->join(DB::raw('
                (
                    SELECT emp_id, MAX(from_date) as max_from_date
                    FROM tblemp_emp_item
                    WHERE to_date IS NULL OR CAST(to_date AS CHAR) = "0000-00-00" 
                    GROUP BY emp_id
                ) as latest
            '), function ($join) {
                $join->on('eei.emp_id', '=', 'latest.emp_id')
                    ->on('eei.from_date', '=', 'latest.max_from_date');
            })
            ->where(function ($query) {
                $query->whereNull('eei.to_date')
                    ->orWhereRaw("CAST(eei.to_date AS CHAR) = '0000-00-00'");
            });

        // Get designation details (if found)
        $designation = null;
        if ($latestDesignation) {
            $designation = $conn3->table('tblemp_emp_item as eei')
                ->select([
                    'epi.position_id',
                    'epi.item_no',
                    'epi.grade',
                    'epi.step',
                    'p.post_description as position'
                ])
                ->leftJoin('tblemp_position_item as epi', 'eei.item_no', '=', 'epi.item_no')
                ->leftJoin('tblposition as p', 'p.position_id', '=', 'epi.position_id')
                ->where(function ($query) {
                    $query->whereNull('eei.to_date')
                        ->orWhereRaw("CAST(eei.to_date AS CHAR) = '0000-00-00'");
                })
                ->where('eei.item_no', $latestDesignation->item_no)
                ->orderByDesc('eei.from_date')
                ->first();
        }

        // Get employee info + join latest assignment
        $employee = $conn3->table('tblemployee as e')
            ->select([
                'e.emp_id as value',
                DB::raw('concat(e.lname,", ",e.fname," ",e.mname) as label'),
                'epi.position_id',
                'p.post_description as position',
                'epi.item_no',
                'epi.grade',
                'epi.step',
                'e.division_id',
            ])
            ->leftJoinSub($latestAssignments, 'latest_eei', function ($join) {
                $join->on('e.emp_id', '=', 'latest_eei.emp_id');
            })
            ->leftJoin('tblemp_position_item as epi', 'latest_eei.item_no', '=', 'epi.item_no')
            ->leftJoin('tblposition as p', 'p.position_id', '=', 'epi.position_id')
            ->where('e.emp_id', $empId)
            ->first();

        if ($employee) {
            $employee->designation = $designation;
        }

        return Inertia::render('Competencies/MyCga/index', [
            'employee' => $employee,
        ]);
    }

    public function getCompetencies($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $filters = $request->query('filters', []);
        $empId = $id ?? auth()->user()->ipms_id;
        $positionId = $filters['item_no'] ?? null;
        $mode = $filters['mode'] ?? null;

        // -- 1. Handle SUBMITTED MODES --
        if (in_array($mode, ['edit-submitted', 'add-submitted']) && isset($filters['review_id'])) {
            $submission = $conn2->table('staff_competency_review')
                ->where('id', $filters['review_id'])
                ->first();

            $competencies = $conn2->table('staff_competency_history as sch')
                ->select([
                    'c.comp_id as id',
                    'c.competency',
                    'c.description',
                    DB::raw("CASE 
                                WHEN c.comp_type = 'org' THEN 'Organizational'
                                WHEN c.comp_type = 'mnt' THEN 'Managerial'
                                ELSE 'Technical/Functional'
                            END as type"),
                    'sch.percentage',
                    'sch.proficiency'
                ])
                ->leftJoin('competency as c', 'c.comp_id', '=', 'sch.competency_id')
                ->where('sch.emp_id', $submission->emp_id)
                ->where('sch.position_id', $submission->position_id)
                ->where('sch.date_created', $submission->date_created)
                ->get();

            return response()->json(
                $competencies->map(fn($item) => [
                    'value' => $item->id,
                    'label' => "{$item->competency} ({$item->percentage}%)",
                    'description' => $item->description,
                    'type' => $item->type,
                    'proficiency' => $item->proficiency,
                    'percentage' => $item->percentage,
                ])->values()
            );
        }

        // -- 2. Default QUERY (add/edit or no mode) --
        $query = $conn2->table('competency_indicator as ci')
            ->select([
                'c.comp_id as id',
                'c.competency',
                'c.description',
                DB::raw('MAX(ci.proficiency) as proficiency'),
                DB::raw("CASE 
                            WHEN c.comp_type = 'org' THEN 'Organizational'
                            WHEN c.comp_type = 'mnt' THEN 'Managerial'
                            ELSE 'Technical/Functional'
                        END as type"),
            ])
            ->leftJoin('competency as c', 'c.comp_id', '=', 'ci.competency_id');

        if ($positionId) {
            $query->leftJoin('position_competency_indicator as pci', 'pci.indicator_id', '=', 'ci.id')
                ->where('pci.position_id', $positionId)
                ->groupBy('c.comp_id', 'c.competency', 'c.comp_type', 'pci.position_id', 'c.description');
        } else {
            $query->groupBy('c.comp_id', 'c.competency', 'c.comp_type', 'c.description');
        }

        // -- 3. Add % calculation --
        $percentageSql = $positionId 
            ? "ROUND(
                    (
                        SELECT COUNT(DISTINCT latest_sai.indicator_id)
                        FROM (
                            SELECT indicator_id, MAX(id) as latest_id
                            FROM staff_all_indicator
                            WHERE emp_id = '".$empId."'
                            GROUP BY indicator_id
                        ) as latest_ids
                        JOIN staff_all_indicator as latest_sai ON latest_sai.id = latest_ids.latest_id
                        LEFT JOIN competency_indicator as ci ON ci.id = latest_sai.indicator_id
                        WHERE latest_sai.compliance = 1
                        AND ci.competency_id = c.comp_id
                        AND ci.proficiency IN (
                            SELECT DISTINCT ci3.proficiency
                            FROM position_competency_indicator as pci3
                            LEFT JOIN competency_indicator as ci3 ON ci3.id = pci3.indicator_id
                            WHERE ci3.competency_id = c.comp_id
                            AND pci3.position_id = '".$positionId."'
                        )
                    ) / NULLIF( 
                        (
                            SELECT COUNT(*)
                            FROM position_competency_indicator as pci2
                            LEFT JOIN competency_indicator as ci2 ON ci2.id = pci2.indicator_id
                            WHERE ci2.competency_id = c.comp_id
                            AND pci2.position_id = '".$positionId."'
                        ), 0
                    ) * 100, 2
                ) AS percentage"
            : "ROUND(
                    (
                        SELECT COUNT(DISTINCT latest_sai.indicator_id)
                        FROM (
                            SELECT indicator_id, MAX(id) as latest_id
                            FROM staff_all_indicator
                            WHERE emp_id = '".$empId."'
                            GROUP BY indicator_id
                        ) as latest_ids
                        JOIN staff_all_indicator as latest_sai ON latest_sai.id = latest_ids.latest_id
                        LEFT JOIN competency_indicator as ci ON ci.id = latest_sai.indicator_id
                        WHERE latest_sai.compliance = 1
                        AND ci.competency_id = c.comp_id
                    ) / NULLIF(
                        (
                            SELECT COUNT(*)
                            FROM competency_indicator as ci2
                            WHERE ci2.competency_id = c.comp_id
                        ), 0
                    ) * 100, 2
                ) AS percentage";

        $query->addSelect(DB::raw($percentageSql))
            ->orderBy('type', 'asc')
            ->orderBy('c.competency', 'asc');

        $competencies = $query->get();

        // -- 4. Filter gap only if mode is add/edit --
        $filtered = in_array($mode, ['add', 'edit'])
            ? $competencies->filter(fn($item) => $item->percentage < 100)
            : $competencies;

        // -- 5. Return grouped result if grouped --
        if (isset($filters['grouped']) && $filters['grouped']) {
            $grouped = $filtered->groupBy('type')->map(function ($group) {
                return $group->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'value' => $item->id,
                        'competency' => $item->competency,
                        'label' => "{$item->competency} ({$item->percentage}%)",
                        'description' => $item->description,
                        'type' => $item->type,
                        'proficiency' => $item->proficiency,
                        'percentage' => $item->percentage,
                    ];
                })->values();
            });

            return response()->json($grouped);
        }

        // -- 6. Otherwise: flat array
        return response()->json(
            $filtered->map(fn($item) => [
                'id' => $item->id,
                'value' => $item->id,
                'competency' => $item->competency,
                'label' => "{$item->competency} ({$item->percentage}%)",
                'description' => $item->description,
                'type' => $item->type,
                'proficiency' => $item->proficiency,
                'percentage' => $item->percentage,
            ])->values()
        );
    }

    public function getCompetencyIndicators($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $filters = $request->query('filters', []);
        $empId = $id ?? auth()->user()->ipms_id;
        $positionId = $filters['item_no'] ?? null;

        $indicatorIDs = $conn2->table('competency_indicator')
            ->where('competency_id', $filters['competency_id'])
            ->where('proficiency', '<=', $filters['proficiency'])
            ->pluck('id');

        if ($indicatorIDs->isEmpty()) {
            return response()->json([]);
        }

        $existingAllIndicatorIDs = $conn2->table('staff_all_indicator')
        ->where('emp_id', $empId)
        ->whereIn('indicator_id', $indicatorIDs)
        ->pluck('indicator_id');

        $newAllIndicatorIDs = $indicatorIDs->diff($existingAllIndicatorIDs);

        if ($newAllIndicatorIDs->isNotEmpty()) {
            $insertData = $newAllIndicatorIDs->map(function ($indicatorId) use ($empId) {
                return [
                    'emp_id' => $empId,
                    'indicator_id' => $indicatorId,
                    'compliance' => 0,
                ];
            })->toArray();

            $conn2->table('staff_all_indicator')->insert($insertData);
        }

        $existingPositionIndicatorIDs = $conn2->table('staff_competency_indicator')
        ->where('emp_id', $empId)
        ->where('position_id', $positionId)
        ->whereIn('indicator_id', $indicatorIDs)
        ->pluck('indicator_id');

        $newPositionIndicatorIDs = $indicatorIDs->diff($existingPositionIndicatorIDs);

        if ($newPositionIndicatorIDs->isNotEmpty()) {
            $insertData = $newPositionIndicatorIDs->map(function ($indicatorId) use ($empId, $positionId) {
                return [
                    'emp_id' => $empId,
                    'position_id' => $positionId,
                    'indicator_id' => $indicatorId,
                    'compliance' => 0,
                ];
            })->toArray();

            $conn2->table('staff_competency_indicator')->insert($insertData);
        }

        $indicators = $conn2->table('staff_all_indicator as sai')
        ->joinSub(
            $conn2->table('staff_all_indicator')
                ->select('emp_id', 'indicator_id', DB::raw('MAX(id) as latest_id'))
                ->where('emp_id', $empId)
                ->whereIn('indicator_id', $indicatorIDs)
                ->groupBy('emp_id', 'indicator_id'),
            'latest',
            function ($join) {
                $join->on('sai.emp_id', '=', 'latest.emp_id')
                    ->on('sai.indicator_id', '=', 'latest.indicator_id')
                    ->on('sai.id', '=', 'latest.latest_id');
            }
        )
        ->leftJoin('competency_indicator as ci', 'ci.id', '=', 'sai.indicator_id')
        ->leftJoinSub(
            $conn2->table('staff_competency_indicator_evidence')
                ->select('indicator_id', 'emp_id', DB::raw('COUNT(*) as evidence_count'))
                ->groupBy('indicator_id', 'emp_id'),
            'evidence_counts',
            function ($join) use ($empId) {
                $join->on('evidence_counts.indicator_id', '=', 'sai.indicator_id')
                    ->on('evidence_counts.emp_id', '=', 'sai.emp_id');
            }
        )
        ->select(
            'sai.id',
            'sai.emp_id',
            'sai.indicator_id',
            'sai.compliance',
            'ci.indicator',
            'ci.proficiency',
            DB::raw('COALESCE(evidence_counts.evidence_count, 0) as evidence_count')
        )
        ->orderBy('proficiency', 'desc')
        ->orderBy('indicator', 'asc')
        ->get()
        ->groupBy('proficiency');

        return response()->json($indicators);
    }

    public function updateCompetencyIndicator($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try{

            $conn2->table('staff_all_indicator')
            ->where('id', $id)
            ->update([
                'compliance' => $request->compliance ? 1 : 0
            ]);

            $conn2->table('staff_competency_indicator')
            ->where('emp_id', $request->emp_id)
            ->where('position_id', $request->position_id)
            ->where('indicator_id', $request->indicator_id)
            ->update([
                'compliance' => $request->compliance ? 1 : 0
            ]);

            return response()->json([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Indicator updated successfully.'
            ]);
        } catch (\Exception $e) {

            Log::error('Failed to update indicator: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating indicator. Please try again.'
            ]);
        }
    }

    public function getIndicatorEvidences($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $search = $request->input('search', '');

        $filters = $request->query('filters', []);
        $filters = Arr::except($request->query('filters', []), ['position_id']);

        $evidenceTypes = $request->query('selectedEvidenceTypes', []);

        $evidences = $conn2->table('staff_competency_indicator_evidence');

        collect($filters)->each(fn($v, $k) => !empty($v) && $evidences->where("$k", $v));

        if (!empty($evidenceTypes)) {
            $evidences->whereIn('reference', $evidenceTypes);
        }

        if (!empty($search)) {
            $evidences->where(function ($query) use ($search) {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $evidences = $evidences->paginate(20);

        $evidenceIds = collect($evidences->items())->pluck('id');

        $files = $conn2->table('evidence_files')
        ->whereIn('evidence_id', $evidenceIds)
        ->get()
        ->groupBy('evidence_id');

        $evidences->getCollection()->transform(function ($evidence) use ($files) {
            $evidence->files = $files->get($evidence->id, collect());
            return $evidence;
        });

        return response()->json($evidences);
    }

    public function getEvidence($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $filters = $request->query('filters', []);

        if (!isset($filters['evidence_id'])) {
            return response()->json([
                'error' => 'There is an error in fetching evidence'
            ], 400);
        }

        $evidence = $conn2->table('staff_competency_indicator_evidence')
        ->where('id', $filters['evidence_id'])
        ->first();

        if(!$evidence){
            return response()->json([
                'error' => 'Failed to add evidence. Please try again.'
            ]);
        }

        $files = $conn2->table('evidence_files')
        ->where('evidence_id', $filters['evidence_id'])
        ->get();

        switch ($evidence->reference) {
            case 'Training':

                $query = $conn2->table('evidence_training')
                    ->where('emp_id', $id)
                    ->where('evidence_id', $filters['evidence_id'])
                    ->first();

                break;
            case 'Award':
                
                $query = $conn2->table('evidence_award')
                    ->where('emp_id', $id)
                    ->where('evidence_id', $filters['evidence_id'])
                    ->first();

                break;
            case 'Performance':
                
                $query = $conn2->table('evidence_performance')
                    ->where('emp_id', $id)
                    ->where('evidence_id', $filters['evidence_id'])
                    ->first();

                break;
            case 'Others':
                
                $query = $evidence;
                break;
        }

        if ($query) {
            $query->files = $files;
        }

        return response()->json([
            'evidence' => $query
        ]);
    }

    public function destroyEvidence($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try {
            $evidence = $conn2->table('staff_competency_indicator_evidence')
            ->where('id', $id)
            ->first();

            if (!$evidence) {
                return redirect()->back()->with([
                    'error' => 'There is an error in fetching evidence'
                ], 400);
            }

            switch ($evidence->reference) {
                case 'Training':
                    $conn2->table('evidence_training')
                    ->where('evidence_id', $evidence->id)
                    ->delete();
                    break;

                case 'Award':
                    $conn2->table('evidence_award')
                    ->where('evidence_id', $evidence->id)
                    ->delete();
                    break;

                case 'Performance':
                    $conn2->table('evidence_performance')
                    ->where('evidence_id', $evidence->id)
                    ->delete();
                    break;
            }

            $files = $conn2->table('evidence_files')
                ->where('evidence_id', $evidence->id)
                ->get();

            foreach ($files as $file) {
                
                Storage::delete($file->path);
                $conn2->table('evidence_files')->where('id', $file->id)->delete();
            }

            $conn2->table('staff_competency_indicator_evidence')
            ->where('id', $id)
            ->delete();

            return redirect()->back()->with('message', 'Evidence deleted successfully.');

        } catch (\Exception $e) {

            Log::error('Failed to delete request(s): ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the evidence. Please try again.'
            ]);
        }
    }

    public function destroyEvidences(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $ids = $request->input('ids');

        try {
            if (empty($ids) || !is_array($ids)) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Invalid Request',
                    'message' => 'No evidences selected for deletion.'
                ]);
            }

            $conn2->transaction(function () use ($conn2, $ids) {

                $evidences = $conn2->table('staff_competency_indicator_evidence')
                ->whereIn('id', $ids)
                ->get();

                $trainingIds = [];
                $awardIds = [];
                $performanceIds = [];
                $fileEvidenceIds = [];

                foreach ($evidences as $evidence) {
                    $fileEvidenceIds[] = $evidence->id;
                    switch ($evidence->reference) {
                        case 'Training':
                            $trainingIds[] = $evidence->id;
                            break;
                        case 'Award':
                            $awardIds[] = $evidence->id;
                            break;
                        case 'Performance':
                            $performanceIds[] = $evidence->id;
                            break;
                    }
                }

                if (!empty($trainingIds)) {
                    $conn2->table('evidence_training')
                        ->whereIn('evidence_id', $trainingIds)
                        ->delete();
                }
                if (!empty($awardIds)) {
                    $conn2->table('evidence_award')
                        ->whereIn('evidence_id', $awardIds)
                        ->delete();
                }
                if (!empty($performanceIds)) {
                    $conn2->table('evidence_performance')
                        ->whereIn('evidence_id', $performanceIds)
                        ->delete();
                }

                $files = $conn2->table('evidence_files')
                ->whereIn('evidence_id', $fileEvidenceIds)
                ->get();

                foreach ($files as $file) {
                    Storage::delete($file->path);
                }

                if (!empty($fileEvidenceIds)) {
                    $conn2->table('evidence_files')
                        ->whereIn('evidence_id', $fileEvidenceIds)
                        ->delete();
                }

                $conn2->table('staff_competency_indicator_evidence')
                ->whereIn('id', $ids)
                ->delete();

            });

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Evidences deleted successfully.'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to delete evidences: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the evidences. Please try again.'
            ]);
        }
    }

    public function getTrainings($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $filters = $request->query('filters', []);

        $trainings = $conn3->table('tblemp_training_program')
            ->select([
                DB::raw('concat(seminar_title,"__",from_date) as value'),
                DB::raw('IF(from_date <> to_date, concat(seminar_title," (",from_date," to ",to_date,")"), concat(seminar_title," (",from_date,")")) as label'),
            ])
            ->where('emp_id', $id)
            ->where('approval', 'yes');

        collect($filters)->each(fn($v, $k) => !empty($v) && $trainings->where("$k", $v));

        $trainings = $trainings
            ->orderBy('seminar_title', 'asc')
            ->get();

         return response()->json($trainings);
    }

    public function storeTraining($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $request->validate([
            'training_id' => 'required',
            'description' => 'required|string',
            'newFiles.*' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
        ],[
            'training_id.required' => 'The training field is required.',

            'description.required' => 'The details field is required.',
            'description.string' => 'The details field must be an acceptable text.',

            'newFiles.array' => 'Files must be an array.',
            'newFiles.max' => 'You can upload a maximum of 5 files.',
            'newFiles.*.file' => 'Each uploaded file must be valid.',
            'newFiles.*.mimes' => 'Each file must be a JPEG, JPG, PNG, or PDF.',
            'newFiles.*.max' => 'Each file may not be greater than 5 MB.',
        ]);

        try{

            $isUpdate = $request->isEdit;
            $empId = $isUpdate ? null : $id;
            $evidenceId = $isUpdate ? $id : null;

            $trainingID = explode('__', $request->training_id);

            if ($isUpdate) {
                $selectedEvidence = $conn2->table('staff_competency_indicator_evidence')
                    ->where('id', $evidenceId)
                    ->first();

                if (!$selectedEvidence) {
                    return response()->json([
                        'status' => 'error',
                        'title' => 'Uh oh!',
                        'message' => 'The evidence could not be found.'
                    ]);
                }

                $empId = $selectedEvidence->emp_id;
            }

            $training = $conn3->table('tblemp_training_program')->where([
                'emp_id' => $empId,
                'seminar_title' => $trainingID[0],
                'from_date' => $trainingID[1],
                'approval' => 'yes'
            ])
            ->first();

            if(!$training){
                return response()->json([
                    'status' => 'error',
                    'title' => 'Uh oh! Something went wrong.',
                    'message' => 'The training could not be found.'
                ]);
            }

            if ($isUpdate) {
                $conn2->table('staff_competency_indicator_evidence')
                ->where('id', $id)
                ->update([
                    'title' => 'Attendance to '.$training->seminar_title,
                    'description' => $request->description,
                    'start_date' => $training->from_date,
                    'end_date' => $training->to_date,
                ]);

                $trainingEvidence = $conn2->table('evidence_training')
                ->where('evidence_id', $evidenceId)
                ->first();

                if ($trainingEvidence) {
                    $conn2->table('evidence_training')
                        ->where('evidence_id', $evidenceId)
                        ->update([
                            'seminar_title' => $training->seminar_title,
                            'from_date' => $training->from_date,
                        ]);
                } else {
                    $conn2->table('evidence_training')->insert([
                        'evidence_id' => $evidenceId,
                        'emp_id' => $empId,
                        'seminar_title' => $training->seminar_title,
                        'from_date' => $training->from_date,
                    ]);
                }

                if ($request->has('removedFiles')) {

                    $removedFiles = $request->removedFiles;
                    
                    if (is_string($removedFiles)) {
                        $removedFiles = json_decode($removedFiles, true);
                    }

                    foreach ($removedFiles as $fileId) {
                        $file = $conn2->table('evidence_files')
                        ->where('id', $fileId)
                        ->first();

                        Storage::delete($file->path);

                        $conn2->table('evidence_files')->where('id', $fileId)->delete();
                    }
                }
            }else{
                $evidenceId = $conn2->table('staff_competency_indicator_evidence')
                ->insertGetId([
                    'emp_id' => $empId,
                    'indicator_id' => $request->indicator_id,
                    'title' => 'Attendance to '.$training->seminar_title,
                    'description' => $request->description,
                    'start_date' => $training->from_date,
                    'end_date' => $training->to_date,
                    'reference' => 'Training',
                ]);

                $conn2->table('evidence_training')->insert([
                    'evidence_id' => $evidenceId,
                    'emp_id' => $empId,
                    'seminar_title' => $training->seminar_title,
                    'from_date' => $training->from_date,
                ]);
            }

            if ($request->hasFile('newFiles')) {
                foreach ($request->file('newFiles') as $file) {
                    $filename = Str::random(20) . '_' . time() . '.' . $file->getClientOriginalExtension();
                    $filePath = $file->storeAs('uploads/evidence', $filename, 'public');

                    $conn2->table('evidence_files')->insert([
                        'evidence_id' => $evidenceId,
                        'filename' => $file->getClientOriginalName(),
                        'path' => $filePath,
                        'size' => $file->getSize(),
                        'mime' => $file->getMimeType(),
                        'hash' => $file->hashName(),
                        'type' => $file->getClientOriginalExtension()
                    ]);
                }
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Evidence saved successfully.'
            ]);

        }catch (\Exception $e) {

            Log::error('Failed to save evidence: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving evidence. Please try again.'
            ]);
        }

    }

    public function getAwards($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $filters = $request->query('filters', []);

        $awards = $conn3->table('tblemp_other_info')
            ->select([
                'description as value',
                'description as label',
            ])
            ->where('emp_id', $id)
            ->where('type', 'recognition')
            ->where('approval', 'yes');

        collect($filters)->each(fn($v, $k) => !empty($v) && $awards->where("$k", $v));

        $awards = $awards
            ->orderBy('description', 'asc')
            ->get();

         return response()->json($awards);
    }

    public function storeAward($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $request->validate([
            'award_id' => 'required',
            'description' => 'required|string',
            'newFiles.*' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
        ],[
            'award_id.required' => 'The award/recognition field is required.',

            'description.required' => 'The details field is required.',
            'description.string' => 'The details field must be an acceptable text.',

            'newFiles.array' => 'Files must be an array.',
            'newFiles.max' => 'You can upload a maximum of 5 files.',
            'newFiles.*.file' => 'Each uploaded file must be valid.',
            'newFiles.*.mimes' => 'Each file must be a JPEG, JPG, PNG, or PDF.',
            'newFiles.*.max' => 'Each file may not be greater than 5 MB.',
        ]);

        try{

            $isUpdate = $request->isEdit;
            $empId = $isUpdate ? null : $id;
            $evidenceId = $isUpdate ? $id : null;

            if ($isUpdate) {
                $selectedEvidence = $conn2->table('staff_competency_indicator_evidence')
                    ->where('id', $evidenceId)
                    ->first();

                if (!$selectedEvidence) {
                    return response()->json([
                        'status' => 'error',
                        'title' => 'Uh oh!',
                        'message' => 'The evidence could not be found.'
                    ]);
                }

                $empId = $selectedEvidence->emp_id;
            }

            $award = $conn3->table('tblemp_other_info')->where([
                'emp_id' => $empId,
                'type' => 'recognition',
                'description' => $request->award_id,
                'approval' => 'yes'
            ])
            ->first();

            if(!$award){
                return response()->json([
                    'status' => 'error',
                    'title' => 'Uh oh! Something went wrong.',
                    'message' => 'The award could not be found.'
                ]);
            }

            if ($isUpdate) {
                $conn2->table('staff_competency_indicator_evidence')
                ->where('id', $id)
                ->update([
                    'title' => 'Awarded with '.$award->description,
                    'description' => $request->input('description'),
                    'start_date' => $award->year.'-01-01',
                    'end_date' => $award->year.'-12-31',
                ]);

                $awardEvidence = $conn2->table('evidence_award')
                ->where('evidence_id', $evidenceId)
                ->first();

                if ($awardEvidence) {
                    $conn2->table('evidence_award')
                        ->where('evidence_id', $evidenceId)
                        ->update([
                            'description' => $award->description,
                        ]);
                } else {
                    $conn2->table('evidence_award')->insert([
                        'evidence_id' => $evidenceId,
                        'emp_id' => $empId,
                        'type' => 'recognition',
                        'description' => $award->description,
                    ]);
                }

                if ($request->has('removedFiles')) {

                    $removedFiles = $request->removedFiles;
                    
                    if (is_string($removedFiles)) {
                        $removedFiles = json_decode($removedFiles, true);
                    }

                    foreach ($removedFiles as $fileId) {
                        $file = $conn2->table('evidence_files')
                        ->where('id', $fileId)
                        ->first();

                        Storage::delete($file->path);

                        $conn2->table('evidence_files')->where('id', $fileId)->delete();
                    }
                }
            }else{
                $evidenceId = $conn2->table('staff_competency_indicator_evidence')
                ->insertGetId([
                    'emp_id' => $empId,
                    'indicator_id' => $request->indicator_id,
                    'title' => 'Awarded with '.$award->description,
                    'description' => $request->input('description'),
                    'start_date' => $award->year.'-01-01',
                    'end_date' => $award->year.'-12-31',
                    'reference' => 'Award',
                ]);

                $conn2->table('evidence_award')->insert([
                    'evidence_id' => $evidenceId,
                    'emp_id' => $empId,
                    'type' => 'recognition',
                    'description' => $award->description,
                ]);
            }

            if ($request->hasFile('newFiles')) {
                foreach ($request->file('newFiles') as $file) {
                    $filename = Str::random(20) . '_' . time() . '.' . $file->getClientOriginalExtension();
                    $filePath = $file->storeAs('uploads/evidence', $filename, 'public');

                    $conn2->table('evidence_files')->insert([
                        'evidence_id' => $evidenceId,
                        'filename' => $file->getClientOriginalName(),
                        'path' => $filePath,
                        'size' => $file->getSize(),
                        'mime' => $file->getMimeType(),
                        'hash' => $file->hashName(),
                        'type' => $file->getClientOriginalExtension()
                    ]);
                }
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Evidence saved successfully.'
            ]);

        }catch (\Exception $e) {

            Log::error('Failed to save evidence: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving evidence. Please try again.'
            ]);
        }

    }

    public function getPerformances($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $filters = $request->query('filters', []);

        $performances = $conn3->table('tblemp_ipcr')
            ->select([
                'id as value',
                DB::raw('concat("IPCR for ", IF(semester = 1, "1st", "2nd") ," Semester ", year) as label'),
            ])
            ->where('emp_id', $id)
            ->whereNotNull('verified_by');

        collect($filters)->each(fn($v, $k) => !empty($v) && $performances->where("$k", $v));

        $performances = $performances
            ->orderBy('year', 'desc')
            ->orderBy('semester', 'desc')
            ->get();

         return response()->json($performances);
    }

    public function storePerformance($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $request->validate([
            'ipcr_id' => 'required',
            'description' => 'required|string',
            'newFiles.*' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
        ],[
            'ipcr_id.required' => 'The performance field is required.',

            'description.required' => 'The details field is required.',
            'description.string' => 'The details field must be an acceptable text.',

            'newFiles.array' => 'Files must be an array.',
            'newFiles.max' => 'You can upload a maximum of 5 files.',
            'newFiles.*.file' => 'Each uploaded file must be valid.',
            'newFiles.*.mimes' => 'Each file must be a JPEG, JPG, PNG, or PDF.',
            'newFiles.*.max' => 'Each file may not be greater than 5 MB.',
        ]);

        try{

            $isUpdate = $request->isEdit;
            $empId = $isUpdate ? null : $id;
            $evidenceId = $isUpdate ? $id : null;

            if ($isUpdate) {
                $selectedEvidence = $conn2->table('staff_competency_indicator_evidence')
                    ->where('id', $evidenceId)
                    ->first();

                if (!$selectedEvidence) {
                    return response()->json([
                        'status' => 'error',
                        'title' => 'Uh oh!',
                        'message' => 'The evidence could not be found.'
                    ]);
                }

                $empId = $selectedEvidence->emp_id;
            }

            $performance = $conn3->table('tblemp_ipcr')->where([
                'id' => $request->input('ipcr_id'),
            ])
            ->first();

            if(!$performance){
                return response()->json([
                    'status' => 'error',
                    'title' => 'Uh oh! Something went wrong.',
                    'message' => 'The performance could not be found.'
                ]);
            }

            if ($isUpdate) {
                $conn2->table('staff_competency_indicator_evidence')
                ->where('id', $id)
                ->update([
                    'title' => 'IPCR for '.($performance->semester == 1 ? '1st' : '2nd')." Semester ".$performance->year,
                    'description' => $request->input('description'),
                    'start_date' => $performance->semester == 1 ? $performance->year.'-01-01' : $performance->year.'-07-01',
                    'end_date' => $performance->semester == 1 ? $performance->year.'-06-30' : $performance->year.'-12-31',
                ]);

                $performanceEvidence = $conn2->table('evidence_performance')
                ->where('evidence_id', $evidenceId)
                ->first();

                if ($performanceEvidence) {
                    $conn2->table('evidence_performance')
                        ->where('evidence_id', $evidenceId)
                        ->update([
                            'ipcr_id' => $performance->id,
                        ]);
                } else {
                    $conn2->table('evidence_performance')->insert([
                        'evidence_id' => $evidenceId,
                        'emp_id' => $empId,
                        'ipcr_id' => $performance->id,
                    ]);
                }

                if ($request->has('removedFiles')) {

                    $removedFiles = $request->removedFiles;
                    
                    if (is_string($removedFiles)) {
                        $removedFiles = json_decode($removedFiles, true);
                    }

                    foreach ($removedFiles as $fileId) {
                        $file = $conn2->table('evidence_files')
                        ->where('id', $fileId)
                        ->first();

                        Storage::delete($file->path);

                        $conn2->table('evidence_files')->where('id', $fileId)->delete();
                    }
                }
            }else{
                $evidenceId = $conn2->table('staff_competency_indicator_evidence')
                ->insertGetId([
                    'emp_id' => $empId,
                    'indicator_id' => $request->indicator_id,
                    'title' => 'IPCR for '.($performance->semester == 1 ? '1st' : '2nd')." Semester ".$performance->year,
                    'description' => $request->input('description'),
                    'start_date' => $performance->semester == 1 ? $performance->year.'-01-01' : $performance->year.'-07-01',
                    'end_date' => $performance->semester == 1 ? $performance->year.'-06-30' : $performance->year.'-12-31',
                    'reference' => 'Performance',
                ]);

                $conn2->table('evidence_performance')->insert([
                    'evidence_id' => $evidenceId,
                    'emp_id' => $empId,
                    'ipcr_id' => $performance->id,
                ]);
            }

            if ($request->hasFile('newFiles')) {
                foreach ($request->file('newFiles') as $file) {
                    $filename = Str::random(20) . '_' . time() . '.' . $file->getClientOriginalExtension();
                    $filePath = $file->storeAs('uploads/evidence', $filename, 'public');

                    $conn2->table('evidence_files')->insert([
                        'evidence_id' => $evidenceId,
                        'filename' => $file->getClientOriginalName(),
                        'path' => $filePath,
                        'size' => $file->getSize(),
                        'mime' => $file->getMimeType(),
                        'hash' => $file->hashName(),
                        'type' => $file->getClientOriginalExtension()
                    ]);
                }
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Evidence saved successfully.'
            ]);

        }catch (\Exception $e) {

            Log::error('Failed to save evidence: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving evidence. Please try again.'
            ]);
        }

    }

    public function storeOthers($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $request->validate([
            'title' => 'required|string|max:100',
            'description' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'after_or_equal:start_date',
            'newFiles.*' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
        ],[
            'title.required' => 'The title field is required.',
            'title.string' => 'The title must be a string.',
            'title.max' => 'The title may not be greater than 100 characters.',

            'description.required' => 'The details field is required.',
            'description.string' => 'The details field must be an acceptable text.',

            'start_date.required' => 'The start date field is required.',
            'start_date.date' => 'The start date must be a valid date.',
            
            'end_date.after_or_equal' => 'The end date must be a date after or equal to the start date.',

            'newFiles.array' => 'Files must be an array.',
            'newFiles.max' => 'You can upload a maximum of 5 files.',
            'newFiles.*.file' => 'Each uploaded file must be valid.',
            'newFiles.*.mimes' => 'Each file must be a JPEG, JPG, PNG, or PDF.',
            'newFiles.*.max' => 'Each file may not be greater than 5 MB.',
        ]);

        try{

            $isUpdate = $request->isEdit;
            $empId = $isUpdate ? null : $id;
            $evidenceId = $isUpdate ? $id : null;

            if ($isUpdate) {
                $selectedEvidence = $conn2->table('staff_competency_indicator_evidence')
                    ->where('id', $evidenceId)
                    ->first();

                if (!$selectedEvidence) {
                    return response()->json([
                        'status' => 'error',
                        'title' => 'Uh oh!',
                        'message' => 'The evidence could not be found.'
                    ]);
                }

                $empId = $selectedEvidence->emp_id;

                $conn2->table('staff_competency_indicator_evidence')
                ->where('id', $id)
                ->update([
                    'title' => $request->title,
                    'description' => $request->description,
                    'start_date' => Carbon::parse($request->start_date)->startOfDay()->format('Y-m-d'),
                    'end_date' => Carbon::parse($request->end_date)->endOfDay()->format('Y-m-d'),
                ]);

                if ($request->has('removedFiles')) {

                    $removedFiles = $request->removedFiles;
                    
                    if (is_string($removedFiles)) {
                        $removedFiles = json_decode($removedFiles, true);
                    }

                    foreach ($removedFiles as $fileId) {
                        $file = $conn2->table('evidence_files')
                        ->where('id', $fileId)
                        ->first();

                        Storage::delete($file->path);

                        $conn2->table('evidence_files')->where('id', $fileId)->delete();
                    }
                }
            }else{
                $evidenceId = $conn2->table('staff_competency_indicator_evidence')
                ->insertGetId([
                    'emp_id' => $empId,
                    'indicator_id' => $request->indicator_id,
                    'title' => $request->title,
                    'description' => $request->description,
                    'start_date' => Carbon::parse($request->start_date)->startOfDay()->format('Y-m-d'),
                    'end_date' => Carbon::parse($request->end_date)->endOfDay()->format('Y-m-d'),
                    'reference' => 'Others'
                ]);
            }

            if ($request->hasFile('newFiles')) {
                foreach ($request->file('newFiles') as $file) {
                    $filename = Str::random(20) . '_' . time() . '.' . $file->getClientOriginalExtension();
                    $filePath = $file->storeAs('uploads/evidence', $filename, 'public');

                    $conn2->table('evidence_files')->insert([
                        'evidence_id' => $evidenceId,
                        'filename' => $file->getClientOriginalName(),
                        'path' => $filePath,
                        'size' => $file->getSize(),
                        'mime' => $file->getMimeType(),
                        'hash' => $file->hashName(),
                        'type' => $file->getClientOriginalExtension()
                    ]);
                }
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Evidence saved successfully.'
            ]);

        }catch (\Exception $e) {

            Log::error('Failed to save evidence: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving evidence. Please try again.'
            ]);
        }

    }

    public function getDesignations($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $careerPaths = $conn2->table('career_path')
            ->where('emp_id', $id)
            ->where('type', 'Designation')
            ->get(['id', 'position_id', 'start_date', 'end_date']);

        if ($careerPaths->isEmpty()) {
            return response()->json([]);
        }

        $positionIds = $careerPaths->pluck('position_id')->unique()->toArray();

        $positions = $conn3->table('tblemp_position_item as epi')
            ->select(
                'epi.item_no',
                'epi.division_id',
                'p.post_description'
            )
            ->leftJoin('tblposition as p', 'p.position_id', '=', 'epi.position_id')
            ->whereIn('epi.item_no', $positionIds)
            ->get()
            ->keyBy('item_no');

        $results = $careerPaths->map(function ($cp) use ($positions, $id) {
            $position = $positions[$cp->position_id] ?? null;

            $start = $cp->start_date 
                ? date('M Y', strtotime($cp->start_date))
                : '';
            $end = $cp->end_date 
                ? date('M Y', strtotime($cp->end_date))
                : 'Present';
            $dateRange = $start ? " ($start - $end)" : '';

            $label = $position
                ? "{$position->division_id}: {$position->post_description} ({$position->item_no})$dateRange"
                : "Unknown Position{$dateRange}";

            return [
                'value' => $cp->id, 
                'label' => $label,
                'item_no' => $position->item_no,
                'division_id' => $position->division_id,
                'position' => $position->post_description,
                'emp_id' => $id,
                'date' => $dateRange,
            ];
        });

        return response()->json($results);
    }

    public function getCareerPaths($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $careers = $conn2->table('career_path')
            ->where('emp_id', $id)
            ->where('type', 'CareerPath')
            ->pluck('position_id'); 

        $positions = $conn3->table('tblemp_position_item as epi')
            ->select(
                'epi.item_no',
                'epi.division_id',
                'epi.grade',
                'p.post_description as position',
                DB::raw('concat(epi.division_id, ": ", p.post_description, " (", epi.item_no,")") as label')
            )
            ->leftJoin('tblposition as p', 'p.position_id', '=', 'epi.position_id')
            ->whereIn('epi.item_no', $careers)
            ->orderBy('epi.division_id', 'asc')
            ->orderBy('p.position_id', 'asc')
            ->get();

        $results = $positions->map(function($position) use ($id) {
            return [
                'value' => $position->item_no,
                'label' => $position->label,
                'item_no' => $position->item_no,
                'division_id' => $position->division_id,
                'position' => $position->position,
                'emp_id' => $id
            ];
        });

        return response()->json($results);
    }

    public function getCareerPathOptions($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $paths = $conn2->table('career_path')
            ->where('emp_id', $id)
            ->pluck('position_id'); 

        $currentPosition = $conn3->table('tblemp_emp_item as eei')
            ->select(['epi.*'])
            ->leftJoin('tblemp_position_item as epi', 'eei.item_no', '=', 'epi.item_no')
            ->where('eei.emp_id', $id)
            ->whereNull('eei.to_date')
            ->orderBy('eei.from_date', 'desc')
            ->first();

        $positions = $conn3->table('tblemp_position_item as epi')
            ->select(
                'epi.item_no',
                'epi.division_id',
                'epi.grade',
                'p.post_description as position',
                DB::raw('concat(epi.division_id, ": ", p.post_description, " (", epi.item_no,")") as label')
            )
            ->leftJoin('tblposition as p', 'p.position_id', '=', 'epi.position_id')
            ->whereNotIn('epi.item_no', $paths)
            ->where('epi.item_no', '<>', $currentPosition->item_no)
            ->where('epi.grade', '>', $currentPosition->grade)
            ->where('epi.status', 1)
            ->orderBy('epi.division_id', 'asc')
            ->orderBy('p.position_id', 'asc')
            ->get();

        $results = $positions->map(function($position) use ($id) {
            return [
                'value' => $position->item_no,
                'label' => $position->label,
                'item_no' => $position->item_no,
                'division_id' => $position->division_id,
                'position' => $position->position,
                'emp_id' => $id
            ];
        });

        return response()->json($results);
    }

    public function storeCareerPath($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $request->validate([
            'position_id' => 'required',
        ],[
            'position_id.required' => 'The position field is required.',
        ]);

        $career = $conn2->table('career_path')
            ->insert([
                'emp_id' => $id,
                'position_id' => $request->position_id,
                'type' => 'CareerPath',
            ]); 

        return redirect()->back()->with('message', 'Career path added successfully.');
    }

    public function destroyCareerPath($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $career = $conn2->table('career_path')
        ->where('emp_id', $id)
        ->where('position_id', $request->position_id)
        ->where('type', 'CareerPath')
        ->delete();

        $indicators = $conn2->table('staff_competency_indicator')
        ->where('emp_id', $id)
        ->where('position_id', $request->position_id)
        ->delete();

        return response()->json(['message' => 'Career path deleted successfully.']);
    }

    public function getProposedTrainings($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $search = $request->input('search', '');
        $filters = $request->query('filters', []);

        $trainings = $conn2->table('staff_competency_training as sct')
            ->select(
                'sct.*',
                'c.competency',
                'sch.percentage',
                DB::raw("IF(sct.training_id IS NULL, sct.training_title, t.training_title) as title"),
                'scr.date_created',
                'scr.status',
                'sct.position_id'
            )
            ->leftJoin('competency as c', 'c.comp_id', '=', 'sct.competency_id')
            ->leftJoin('training as t', 't.id', '=', 'sct.training_id')
            ->leftJoin('staff_training_review as str', 'str.training_id', '=', 'sct.id')
            ->leftJoin('staff_competency_review as scr', 'scr.id', '=', 'str.review_id')
            ->leftJoin('staff_competency_history as sch', function($join) {
                $join->on('sch.date_created', '=', 'scr.date_created')
                    ->on('sch.competency_id', '=', 'sct.competency_id');
            });

        if (array_key_exists('competency_id', $filters) || $request->has('competency_id')) {
            $trainings = $trainings->where('c.comp_id', $filters['competency_id'] ?? $request->input('competency_id'));
        }

        if (array_key_exists('review_id', $filters) || $request->has('review_id')) {
            $trainings = $trainings->where('str.review_id', $filters['review_id'] ?? $request->input('review_id'));
        }

        if (!empty($search)) {
            $trainings->where(function ($query) use ($search) {
                $query->where('sct.training_title', 'like', "%{$search}%")
                    ->orWhere('t.training_title', 'like', "%{$search}%");
            });
        }

        $trainings = $trainings
            ->where('sct.emp_id', $id)
            ->orderBy('sct.id', 'desc');

        $trainings = $trainings->paginate(20);

        $positions = $conn3->table('tblemp_position_item as epi')
            ->join('tblposition as p', 'p.position_id', '=', 'epi.position_id')
            ->select('epi.item_no', 'p.post_description')
            ->get()
            ->pluck('post_description', 'item_no'); 

        $trainings->getCollection()->transform(function ($training) use ($positions) {
            $training->position = $positions[$training->position_id] ?? null;
            return $training;
        });

        return response()->json($trainings);
    }

    public function storeProposedTraining(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $validator = Validator::make($request->all(), [
            'competency_id'   => 'required|integer',
            'training_id'     => 'nullable|integer|required_without:training_title',
            'training_title'  => 'nullable|string|required_without:training_id',
            'no_of_hours'     => 'required|integer|min:1',
            'cost'            => 'required|numeric|min:0',
            'modality'        => 'required|string|max:255',
        ], [
            'competency_id.required'     => 'Competency is required.',
            'training_id.required_without' => 'Please select a training or enter a training title manually.',
            'training_title.required_without' => 'The training title is required when a predefined training is not selected.',
            'no_of_hours.required'       => 'Number of hours is required.',
            'no_of_hours.integer'        => 'Number of hours must be an integer.',
            'cost.required'              => 'Cost is required.',
            'cost.numeric'               => 'Cost must be a valid number.',
            'modality.required'          => 'Modality is required.',
        ]);

        $validator->validate();

        $trainingId = $conn2->table('staff_competency_training')->insertGetId([
            'emp_id' => $request->emp_id,
            'position_id' => $request->position_id,
            'competency_id' => $request->competency_id,
            'training_id' => $request->training_id,
            'training_title' => $request->training_title,
            'no_of_hours' => $request->no_of_hours,
            'cost' => $request->cost,
            'modality' => $request->modality,
        ]);

        if($request->review_id){
            $review = $conn2->table('staff_competency_review')
                ->where('id', $request->review_id)
                ->first();

            $conn2->table('staff_training_review')->insert([
                'review_id' => $review->id,
                'training_id' => $trainingId,
            ]);
        }

        return redirect()->back()->with([
            'status' => 'success',
            'title' => 'Success!',
            'message' => 'Proposed training added successfully!'
        ]);
    }

    public function updateProposedTraining($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $validator = Validator::make($request->all(), [
            'competency_id'   => 'required|integer',
            'training_id'     => 'nullable|integer|required_without:training_title',
            'training_title'  => 'nullable|string|required_without:training_id',
            'no_of_hours'     => 'required|integer|min:1',
            'cost'            => 'required|numeric|min:0',
            'modality'        => 'required|string|max:255',
        ], [
            'competency_id.required'     => 'Competency is required.',
            'training_id.required_without' => 'Please select a training or enter a training title manually.',
            'training_title.required_without' => 'The training title is required when a predefined training is not selected.',
            'no_of_hours.required'       => 'Number of hours is required.',
            'no_of_hours.integer'        => 'Number of hours must be an integer.',
            'cost.required'              => 'Cost is required.',
            'cost.numeric'               => 'Cost must be a valid number.',
            'modality.required'          => 'Modality is required.',
        ]);

        $validator->validate();

        $conn2->table('staff_competency_training')
            ->where('id', $id)
            ->update([
                'competency_id' => $request->competency_id,
                'training_id' => $request->training_id,
                'training_title' => $request->training_title,
                'no_of_hours' => $request->no_of_hours,
                'cost' => $request->cost,
                'modality' => $request->modality,
            ]);

        return redirect()->back()->with([
            'status' => 'success',
            'title' => 'Success!',
            'message' => 'Proposed training updated successfully!'
        ]);
    }

    public function destroyProposedTraining($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try {
            $conn2->table('staff_competency_training')
            ->where('id', $id)
            ->delete();

            return redirect()->back()->with('message', 'Proposed training deleted successfully.');

        } catch (\Exception $e) {

            Log::error('Failed to delete proposed training: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the proposed training. Please try again.'
            ]);
        }
    }

    public function destroyProposedTrainings(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $ids = $request->input('ids');

        try {
            if (empty($ids) || !is_array($ids)) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Invalid Request',
                    'message' => 'No proposed trainings selected for deletion.'
                ]);
            }

            $conn2->transaction(function () use ($conn2, $ids) {

                $trainings = $conn2->table('staff_competency_training')
                ->whereIn('id', $ids)
                ->delete();

            });

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Proposed trainings deleted successfully.'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to delete proposed trainings: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the proposed trainings. Please try again.'
            ]);
        }
    }

    public function getSubmissions($id)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $submissions = $conn2->table('staff_competency_review as scr')
            ->select(
                'scr.id',
                'scr.year',
                DB::raw("DATE_FORMAT(date_created, '%M %d, %Y %h:%i:%s %p') as dateCreated"),
                'scr.emp_id',
                'scr.position_id',
                'scr.date_created',
                'scr.status',
            )
            ->where('scr.emp_id', $id)
            ->orderBy('scr.date_created', 'desc')
            ->paginate(20);

        $positions = $conn3->table('tblemp_position_item as epi')
            ->join('tblposition as p', 'p.position_id', '=', 'epi.position_id')
            ->select('epi.item_no', 'p.post_description')
            ->get()
            ->pluck('post_description', 'item_no'); 

        $submissions->getCollection()->transform(function ($submission) use ($positions) {
            $submission->position = $positions[$submission->position_id] ?? null;
            return $submission;
        });

        return response()->json($submissions);
    }

    public function getSubmittedCompetencies($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $competency = $conn2->table('staff_competency_review')
            ->where('id', $id)
            ->first();

        $competencies = $conn2->table('staff_competency_history as sch')
        ->select([
            'sch.*',
            'c.comp_id as competency_id',
            'c.competency',
            DB::raw("CASE 
                WHEN c.comp_type = 'org' THEN 'Organizational'
                WHEN c.comp_type = 'mnt' THEN 'Managerial'
                ELSE 'Technical/Functional'
            END as type"),
            DB::raw("(
                SELECT
                    CASE
                        WHEN prev_sch.percentage != sch.percentage THEN true
                        ELSE false
                    END
                FROM staff_competency_history AS prev_sch
                INNER JOIN staff_competency_review AS prev_scr
                    ON prev_sch.emp_id = prev_scr.emp_id
                    AND prev_sch.date_created = prev_scr.date_created
                WHERE prev_sch.emp_id = sch.emp_id
                AND prev_sch.competency_id = sch.competency_id
                AND prev_scr.status = 'Approved'
                AND prev_scr.date_created < sch.date_created
                ORDER BY prev_scr.date_created DESC
                LIMIT 1
            ) IS NULL OR (
                SELECT
                    CASE
                        WHEN prev_sch.percentage != sch.percentage THEN true
                        ELSE false
                    END
                FROM staff_competency_history AS prev_sch
                INNER JOIN staff_competency_review AS prev_scr
                    ON prev_sch.emp_id = prev_scr.emp_id
                    AND prev_sch.date_created = prev_scr.date_created
                WHERE prev_sch.emp_id = sch.emp_id
                AND prev_sch.competency_id = sch.competency_id
                AND prev_scr.status = 'Approved'
                AND prev_scr.date_created < sch.date_created
                ORDER BY prev_scr.date_created DESC
                LIMIT 1
            ) = true AS isUpdated"),
        ])
        ->leftJoin('competency as c', 'c.comp_id', '=', 'sch.competency_id')
        ->where('sch.emp_id', $competency->emp_id)
        ->where('sch.date_created', $competency->date_created)
        ->orderBy('type', 'asc')
        ->orderBy('c.competency', 'asc')
        ->get()
        ->groupBy('type');

        return response()->json($competencies);
    }

    public function getSubmittedCompetencyIndicators($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $competency = $competencies = $conn2->table('staff_competency_history as sch')
            ->where('sch.id', $id)
            ->first();

        $submittedIndicators = $conn2->table('staff_competency_indicator_history as scih')
        ->select([
            'scih.id',
            'scih.emp_id',
            'scih.position_id',
            'ci.id as indicator_id',
            'ci.indicator',
            'scih.compliance',
            'ci.proficiency',
            'ci.competency_id',
            DB::raw("1 as is_existing"),
            DB::raw("(
                SELECT CASE 
                    WHEN prev_scih.compliance != scih.compliance THEN true 
                    ELSE false 
                END
                FROM staff_competency_indicator_history AS prev_scih
                INNER JOIN staff_competency_review AS prev_scr
                    ON prev_scih.emp_id = prev_scr.emp_id
                    AND prev_scih.date_created = prev_scr.date_created
                WHERE prev_scih.emp_id = scih.emp_id
                AND prev_scih.indicator_id = scih.indicator_id
                AND prev_scih.position_id = scih.position_id
                AND prev_scr.status = 'Approved'
                AND prev_scr.date_created < scih.date_created
                ORDER BY prev_scr.date_created DESC
                LIMIT 1
            ) IS NULL OR (
                SELECT CASE 
                    WHEN prev_scih.compliance != scih.compliance THEN true 
                    ELSE false 
                END
                FROM staff_competency_indicator_history AS prev_scih
                INNER JOIN staff_competency_review AS prev_scr
                    ON prev_scih.emp_id = prev_scr.emp_id
                    AND prev_scih.date_created = prev_scr.date_created
                WHERE prev_scih.emp_id = scih.emp_id
                AND prev_scih.indicator_id = scih.indicator_id
                AND prev_scih.position_id = scih.position_id
                AND prev_scr.status = 'Approved'
                AND prev_scr.date_created < scih.date_created
                ORDER BY prev_scr.date_created DESC
                LIMIT 1
            ) = true AS isUpdated"),
            DB::raw("DATE_FORMAT(scih.date_created, '%M %d, %Y %h:%i:%s %p') as dateCreated"),
            'scih.date_created',
            DB::raw("(
                SELECT COUNT(*) 
                FROM staff_competency_indicator_evidence 
                WHERE indicator_id = scih.indicator_id AND emp_id = scih.emp_id
            ) as evidence_count"),
            'scih.remarks'
        ])
        ->leftJoin('competency_indicator as ci', 'ci.id', '=', 'scih.indicator_id')
        ->leftJoin('competency as c', 'c.comp_id', '=', 'ci.competency_id')
        ->where('c.comp_id', $competency->competency_id)
        ->where('ci.proficiency', '<=', $competency->proficiency)
        ->where('scih.emp_id', $competency->emp_id)
        ->where('scih.position_id', $competency->position_id)
        ->where('scih.date_created', $competency->date_created);

        $missingIndicators = $conn2->table('competency_indicator as ci')
        ->select([
            DB::raw("NULL as id"),
            DB::raw("'" . $competency->emp_id . "' as emp_id"),
            DB::raw("'" . $competency->position_id . "' as position_id"),
            'ci.id as indicator_id',
            'ci.indicator',
            DB::raw("0 as compliance"),
            'ci.proficiency',
            'ci.competency_id',
            DB::raw("0 as is_existing"),
            DB::raw("1 as isUpdated"),
            DB::raw("NULL as dateCreated"),
            DB::raw("NULL as date_created"),
            DB::raw("0 as evidence_count"),
            DB::raw("NULL as remarks")
        ])
        ->where('ci.competency_id', $competency->competency_id)
        ->where('ci.proficiency', '<=', $competency->proficiency)
        ->whereNotIn('ci.id', function ($q) use ($conn2, $competency) {
            $q->select('indicator_id')
                ->from('staff_competency_indicator_history')
                ->where('emp_id', $competency->emp_id)
                ->where('position_id', $competency->position_id)
                ->where('date_created', $competency->date_created);
        });

        $indicators = $submittedIndicators
        ->unionAll($missingIndicators)
        ->orderBy('proficiency', 'desc')
        ->orderBy('indicator', 'asc')
        ->get()
        ->groupBy('proficiency');

        return response()->json($indicators);
    }
    
    public function destroySubmission($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try {

            $history = $conn2->table('staff_competency_review')
            ->where('id', $id)
            ->first();

            if (!$history) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Invalid Request',
                    'message' => 'No submission selected for deletion.'
                ]);
            }

            $conn2->table('staff_training_review')
            ->where('review_id', $history->id)
            ->delete();

            $conn2->table('staff_competency_history')
            ->where('date_created', $history->date_created)
            ->where('emp_id', $history->emp_id)
            ->delete();

            $conn2->table('staff_all_competency_history')
            ->where('date_created', $history->date_created)
            ->where('emp_id', $history->emp_id)
            ->delete();

            $conn2->table('staff_all_competency_indicator_history')
            ->where('date_created', $history->date_created)
            ->where('emp_id', $history->emp_id)
            ->delete();

            $conn2->table('staff_competency_indicator_history')
            ->where('date_created', $history->date_created)
            ->where('emp_id', $history->emp_id)
            ->delete();

            $conn2->table('staff_competency_review')
            ->where('id', $id)
            ->delete();

            return redirect()->back()->with('message', 'Submission deleted successfully.');

        } catch (\Exception $e) {

            Log::error('Failed to delete submission: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the submission. Please try again.'
            ]);
        }
    }

    public function destroySubmissions(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $ids = $request->input('ids');

        if (empty($ids) || !is_array($ids)) {
            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Invalid Request',
                'message' => 'No submissions selected for deletion.'
            ]);
        }

        try {
            $conn2->transaction(function () use ($conn2, $ids) {
                $histories = $conn2->table('staff_competency_review')
                    ->whereIn('id', $ids)
                    ->get();

                foreach ($histories as $history) {

                    $conn2->table('staff_training_review')
                        ->where('review_id', $history->id)
                        ->delete();

                    $conn2->table('staff_competency_history')
                        ->where('date_created', $history->date_created)
                        ->where('emp_id', $history->emp_id)
                        ->delete();

                    $conn2->table('staff_all_competency_history')
                        ->where('date_created', $history->date_created)
                        ->where('emp_id', $history->emp_id)
                        ->delete();

                    $conn2->table('staff_all_competency_indicator_history')
                        ->where('date_created', $history->date_created)
                        ->where('emp_id', $history->emp_id)
                        ->delete();

                    $conn2->table('staff_competency_indicator_history')
                        ->where('date_created', $history->date_created)
                        ->where('emp_id', $history->emp_id)
                        ->delete();

                    $conn2->table('staff_competency_review')
                        ->where('id', $history->id)
                        ->delete();
                }
            });

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Submissions deleted successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete submissions: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the submissions. Please try again.'
            ]);
        }
    }

    public function getSubmissionWindow()
    {
        $conn2 = DB::connection('mysql2');

        $window = $conn2->table('settings')
            ->where('title', 'CGA Enable Updating Dates')
            ->first();

        $isAllowed = false;

        if ($window && $window->value) {
            [$start, $end] = explode(' - ', $window->value);

            $today = now()->toDateString();

            $isAllowed = $today >= $start && $today <= $end;
        }

        return response()->json([
            'is_allowed' => $isAllowed,
            'start_date' => $start ?? null,
            'end_date' => $end ?? null,
        ]);
    }

    public function getGapAnalysis($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $filters = $request->query('filters', []);
        $empId = $id ?? auth()->user()->ipms_id;
        $positionId = $filters['item_no'] ?? null;

        if (!$positionId) {
            return response()->json(['error' => 'Missing position ID'], 422);
        }

        $query = $conn2->table('competency_indicator as ci')
            ->select([
                'c.comp_id as id',
                'c.competency',
                'c.description',
                DB::raw('MAX(ci.proficiency) as proficiency'),
                DB::raw("CASE 
                            WHEN c.comp_type = 'org' THEN 'Organizational'
                            WHEN c.comp_type = 'mnt' THEN 'Managerial'
                            ELSE 'Technical/Functional'
                        END as type"),
            ])
            ->leftJoin('competency as c', 'c.comp_id', '=', 'ci.competency_id')
            ->leftJoin('position_competency_indicator as pci', 'pci.indicator_id', '=', 'ci.id')
            ->where('pci.position_id', $positionId)
            ->groupBy('c.comp_id', 'c.competency', 'c.comp_type', 'pci.position_id', 'c.description');

        $percentageSql = "ROUND(
            (
                SELECT COUNT(DISTINCT latest_sai.indicator_id)
                FROM (
                    SELECT indicator_id, MAX(id) as latest_id
                    FROM staff_all_indicator
                    WHERE emp_id = '".$empId."'
                    GROUP BY indicator_id
                ) as latest_ids
                JOIN staff_all_indicator as latest_sai ON latest_sai.id = latest_ids.latest_id
                LEFT JOIN competency_indicator as ci ON ci.id = latest_sai.indicator_id
                WHERE latest_sai.compliance = 1
                AND ci.competency_id = c.comp_id
                AND ci.proficiency IN (
                    SELECT DISTINCT ci3.proficiency
                    FROM position_competency_indicator as pci3
                    LEFT JOIN competency_indicator as ci3 ON ci3.id = pci3.indicator_id
                    WHERE ci3.competency_id = c.comp_id
                    AND pci3.position_id = '".$positionId."'
                )
            ) / NULLIF( 
                (
                    SELECT COUNT(*)
                    FROM position_competency_indicator as pci2
                    LEFT JOIN competency_indicator as ci2 ON ci2.id = pci2.indicator_id
                    WHERE ci2.competency_id = c.comp_id
                    AND pci2.position_id = '".$positionId."'
                ), 0
            ) * 100, 2
        ) AS percentage";

        $query->addSelect(DB::raw($percentageSql))
            ->orderBy('type')
            ->orderBy('c.competency');

        $competencies = $query->get();

        $trainings = $conn2->table('staff_competency_training as sct')
            ->select(
                'sct.*',
                DB::raw("IF(sct.training_id IS NULL, sct.training_title, t.training_title) as title"),
            )
            ->leftJoin('competency as c', 'c.comp_id', '=', 'sct.competency_id')
            ->leftJoin('training as t', 't.id', '=', 'sct.training_id')
            ->leftJoin('staff_training_review as str', 'str.training_id', '=', 'sct.id')
            ->leftJoin('staff_competency_review as scr', 'scr.id', '=', 'str.review_id')
            ->leftJoin('staff_competency_history as sch', function($join) {
                $join->on('sch.date_created', '=', 'scr.date_created')
                    ->on('sch.competency_id', '=', 'sct.competency_id');
            })
            ->where('sct.emp_id', $empId)
            ->where('sct.position_id', $positionId)
            ->whereNull('scr.id')
            ->get();

        $trainingMap = $trainings->groupBy('competency_id');

        $competenciesWithTrainings = $competencies->map(function ($item) use ($trainingMap) {
            return [
                'id' => $item->id,
                'value' => $item->id,
                'competency' => $item->competency,
                'label' => "{$item->competency} ({$item->percentage}%)",
                'description' => $item->description,
                'type' => $item->type,
                'proficiency' => $item->proficiency,
                'percentage' => $item->percentage,
                'trainings' => $trainingMap->get($item->id, collect())->values()
            ];
        })->groupBy('type');

        return response()->json($competenciesWithTrainings);
    }

    public function storeGapAnalysis(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $empId = $request->emp_id;
        $positionId = $request->position_id;
        $dateCreated = Carbon::now()->format('Y-m-d H:i:s');
        $createdBy = Auth::user()->ipms_id;

        try {

            $reviewId = $conn2->table('staff_competency_review')->insertGetId([
                'year' => $request->year,
                'date_created' => $dateCreated,
                'emp_id' => $empId,
                'position_id' => $positionId
            ]);

            $allCompetencyFields = [
                DB::raw("'$empId' as emp_id"),
                'c.comp_id as competency_id',
                DB::raw("'$createdBy' as created_by"),
                DB::raw("'$dateCreated' as date_created"),
            ];

            $allCompetencies = $conn2->table('competency_indicator as ci')
                ->select($allCompetencyFields)
                ->leftJoin('competency as c', 'c.comp_id', '=', 'ci.competency_id')
                ->groupBy('c.comp_id', 'c.competency', 'ci.competency_id');

            $allCompetenciesPercentageSql = "ROUND(
                (
                    SELECT COUNT(DISTINCT latest_sai.indicator_id)
                    FROM (
                        SELECT indicator_id, MAX(id) as latest_id
                        FROM staff_all_indicator
                        WHERE emp_id = '".$empId."'
                        GROUP BY indicator_id
                    ) as latest_ids
                    JOIN staff_all_indicator as latest_sai ON latest_sai.id = latest_ids.latest_id
                    LEFT JOIN competency_indicator as ci ON ci.id = latest_sai.indicator_id
                    WHERE latest_sai.compliance = 1
                    AND ci.competency_id = c.comp_id
                ) / NULLIF( 
                    (
                        SELECT COUNT(*)
                        FROM competency_indicator as ci2
                        WHERE ci2.competency_id = c.comp_id
                    ), 0
                ) * 100, 2
                ) AS percentage";

            $allCompetencies->addSelect(DB::raw($allCompetenciesPercentageSql))
                ->orderBy('c.competency');

            $allCompetencies = $allCompetencies->get();

            if (!$allCompetencies->isEmpty()) {
                $conn2->table('staff_all_competency_history')->insert(
                    $allCompetencies->map(function ($item) {
                        return (array) $item; 
                    })->toArray()
                );
            }

            $allIndicatorIDs = $conn2->table('competency_indicator')
                ->get()
                ->pluck('id');

            $allCompetencyIndicatorFields = [
                DB::raw("'$empId' as emp_id"),
                'sai.indicator_id',
                'sai.compliance',
                DB::raw("'$createdBy' as created_by"),
                DB::raw("'$dateCreated' as date_created"),
            ];

            $allIndicators = $conn2->table('staff_all_indicator as sai')
                ->select($allCompetencyIndicatorFields)
                ->join(
                    DB::raw("(SELECT MAX(id) as latest_id FROM staff_all_indicator WHERE emp_id = '".$empId."' GROUP BY indicator_id) as latest"),
                    'sai.id', '=', 'latest.latest_id'
                )
                ->where('sai.emp_id', $empId)
                ->whereIn('sai.indicator_id', $allIndicatorIDs)
                ->get();

            if (!$allIndicators->isEmpty()) {
                $conn2->table('staff_all_competency_indicator_history')->insert(
                    $allIndicators->map(function ($item) {
                        return (array) $item; 
                    })->toArray()
                );
            }

            $positionCompetencyFields = [
                DB::raw("'$empId' as emp_id"),
                DB::raw("'$positionId' as position_id"),
                'c.comp_id as competency_id',
                DB::raw('MAX(ci.proficiency) as proficiency'),
                DB::raw("'$createdBy' as created_by"),
                DB::raw("'$dateCreated' as date_created"),
            ];

            $positionCompetencies = $conn2->table('competency_indicator as ci')
                ->select($positionCompetencyFields)
                ->leftJoin('competency as c', 'c.comp_id', '=', 'ci.competency_id')
                ->leftJoin('position_competency_indicator as pci', 'pci.indicator_id', '=', 'ci.id')
                ->where('pci.position_id', $positionId)
                ->groupBy('c.comp_id', 'c.competency', 'pci.position_id');

            $positionCompetenciesPercentageSql = "ROUND(
                (
                    SELECT COUNT(DISTINCT latest_sai.indicator_id)
                    FROM (
                        SELECT indicator_id, MAX(id) as latest_id
                        FROM staff_all_indicator
                        WHERE emp_id = '".$empId."'
                        GROUP BY indicator_id
                    ) as latest_ids
                    JOIN staff_all_indicator as latest_sai ON latest_sai.id = latest_ids.latest_id
                    LEFT JOIN competency_indicator as ci ON ci.id = latest_sai.indicator_id
                    WHERE latest_sai.compliance = 1
                    AND ci.competency_id = c.comp_id
                    AND ci.proficiency IN (
                        SELECT DISTINCT ci3.proficiency
                        FROM position_competency_indicator as pci3
                        LEFT JOIN competency_indicator as ci3 ON ci3.id = pci3.indicator_id
                        WHERE ci3.competency_id = c.comp_id
                        AND pci3.position_id = '".$positionId."'
                    )
                ) / NULLIF( 
                    (
                        SELECT COUNT(*)
                        FROM position_competency_indicator as pci2
                        LEFT JOIN competency_indicator as ci2 ON ci2.id = pci2.indicator_id
                        WHERE ci2.competency_id = c.comp_id
                        AND pci2.position_id = '".$positionId."'
                    ), 0
                ) * 100, 2
            ) AS percentage";

            $positionCompetencies->addSelect(DB::raw($positionCompetenciesPercentageSql))
                ->orderBy('c.competency');

            $positionCompetencies = $positionCompetencies->get();

            if (!$positionCompetencies->isEmpty()) {
                $conn2->table('staff_competency_history')->insert(
                    $positionCompetencies->map(function ($item) {
                        return (array) $item; 
                    })->toArray()
                );
            }

            $positionIndicatorIDs = $conn2->table('position_competency_indicator')
                ->where('position_id', $positionId)
                ->get()
                ->pluck('indicator_id');

            $positionCompetencyIndicatorFields = [
                DB::raw("'$empId' as emp_id"),
                DB::raw("'$positionId' as position_id"),
                'sai.indicator_id',
                'sai.compliance',
                DB::raw("'$createdBy' as created_by"),
                DB::raw("'$dateCreated' as date_created"),
            ];

            $positionIndicators = $conn2->table('staff_all_indicator as sai')
                ->select($positionCompetencyIndicatorFields)
                ->join(
                    DB::raw("(SELECT MAX(id) as latest_id FROM staff_all_indicator WHERE emp_id = '".$empId."' GROUP BY indicator_id) as latest"),
                    'sai.id', '=', 'latest.latest_id'
                )
                ->where('sai.emp_id', $empId)
                ->whereIn('sai.indicator_id', $positionIndicatorIDs)
                ->get();
        
            if (!$positionIndicators->isEmpty()) {
                $conn2->table('staff_competency_indicator_history')->insert(
                    $positionIndicators->map(function ($item) {
                        return (array) $item; 
                    })->toArray()
                );
            }

            $proposedTrainings = $conn2->table('staff_competency_training as sct')
            ->select([
                'sct.id as id',
            ])
            ->leftJoin('competency', 'competency.comp_id', '=', 'sct.competency_id')
            ->leftJoin('training', 'training.id', '=', 'sct.training_id')
            ->leftJoin('staff_training_review as str', 'str.training_id', '=', 'sct.id')
            ->leftJoin('staff_competency_review as scr', 'scr.id', '=', 'str.review_id')
            ->where('sct.emp_id', $empId)
            ->where('sct.position_id', $positionId)
            ->whereNull('scr.id')
            ->get()
            ->pluck('id');

            if (!empty($proposedTrainings)) {
                $proposedTrainings = $proposedTrainings->map(fn($id) => ['training_id' => $id, 'review_id' => $reviewId])->toArray();
            
                $conn2->table('staff_training_review')->insert($proposedTrainings);
            }

            $conn2->table('submission_history')->insert([
                'model' => 'CGA',
                'model_id' => $reviewId,
                'status' => 'Submitted',
                'acted_by' => $empId,
            ]);

            return redirect()->back()->with('message', 'Gap analysis submitted successfully.');

        } catch (\Exception $e) {

            Log::error('Failed to store gap analysis: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while storing the gap analysis. Please try again.'
            ]);
        }
    }

    public function getLibraries()
    {
        return Inertia::render('Competencies/Libraries/index');
    }
}