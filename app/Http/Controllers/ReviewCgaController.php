<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use App\Notifications\CompetenciesForReviewApproved;
use App\Models\User;

class ReviewCgaController extends Controller
{
    public function index()
    {
        return inertia('ReviewCga/index');
    }

    public function showCompetencies(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');
        
        $competencies = $conn2->table('competency')
            ->select([
                'comp_id as value',
                'competency as label',
            ])
            ->orderBy('competency', 'asc')
            ->get();

        return response()->json($competencies);
    }

    public function showCompetenciesForReview(Request $request)
    {
        $queryParams = $request->query->all();

        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $user = Auth::user();
        $isHRRole = $user->hasRole('HRIS_HR');
        $isDCRole = $user->hasRole('HRIS_DC');
        $employeeIDs = collect();

        if (!$isHRRole && $isDCRole) {
            $employee = $conn3->table('tblemployee')
                ->where('emp_id', $user->ipms_id)
                ->first();
    
            if ($employee) {
                $employeeIDs = $conn3->table('tblemployee')
                    ->where('division_id', $employee->division_id)
                    ->pluck('emp_id');
            }
        }

        $competencies = $conn2->table('staff_competency_review as scr')
            ->select([
                'scr.id',
                'scr.emp_id',
                DB::raw("DATE_FORMAT(date_created, '%M %d, %Y %h:%i:%s %p') as date_submitted"),
                'scr.status',
                'scr.acted_by',
                DB::raw("DATE_FORMAT(scr.date_acted, '%M %d, %Y %h:%i:%s %p') as date_acted"),
            ])
            ->where('scr.emp_id', '<>', $user->ipms_id);
        
        if (!$isHRRole && $isDCRole && $employeeIDs->isNotEmpty()) {
            $competencies->whereIn('scr.emp_id', $employeeIDs);
        }

        if ($queryParams['filters']['status']) {
            if ($queryParams['filters']['status'] === 'pending') {
                $competencies->whereNull('scr.status')
                    ->whereIn('scr.id', function ($query) {
                        $query->selectRaw('MAX(id)')
                            ->from('staff_competency_review')
                            ->groupBy('emp_id');
                    });
            } elseif ($queryParams['filters']['status'] === 'approved') {
                $competencies->where('scr.status', 'Approved');
            }
        }

        $competencies = $competencies
            ->orderBy('date_created', 'desc')
            ->paginate(20);

        $staffIDs = $competencies->pluck('emp_id')->unique();
        $approverIDs = $competencies->pluck('acted_by')->unique();

        $employees = $conn3->table('tblemployee')
            ->whereIn('emp_id', $staffIDs->merge($approverIDs))
            ->get()
            ->keyBy('emp_id')
            ->map(function ($employee) {
                return (object) [
                    'staff' => $employee->lname . ', ' . $employee->fname . ' ' . $employee->mname
                ];
            });
            
        $competencies->transform(function ($competency) use ($employees) {
            $competency->staff = $employees->get($competency->emp_id)->staff ?? null;
            $competency->approver = $employees->get($competency->acted_by)->staff ?? null;
            return $competency;
        });

        return response()->json($competencies);
    }

    public function showCompetenciesForReviewCount(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $user = Auth::user();
        $isHRRole = $user->hasRole('HRIS_HR');
        $isDCRole = $user->hasRole('HRIS_DC');
        $employeeIDs = collect();

        if (!$isHRRole && $isDCRole) {
            $employee = $conn3->table('tblemployee')
                ->where('emp_id', $user->ipms_id)
                ->first();
    
            if ($employee) {
                $employeeIDs = $conn3->table('tblemployee')
                    ->where('division_id', $employee->division_id)
                    ->pluck('emp_id');
            }
        }

        $competencies = $conn2->table('staff_competency_review as scr')
            ->select([
                DB::raw('COALESCE(scr.status, "Pending") as status'),
                DB::raw('COUNT(scr.id) as count') 
            ])
            ->where('scr.emp_id', '<>', $user->ipms_id);
        
        if (!$isHRRole && $isDCRole && $employeeIDs->isNotEmpty()) {
            $competencies->whereIn('scr.emp_id', $employeeIDs);
        }

        $competencies = $competencies
            ->groupBy(DB::raw('COALESCE(scr.status, "Pending")'))
            ->get();

        return response()->json($competencies);
    }

    public function showCompetencyForReview($id, Request $request)
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
                DB::raw("COALESCE((
                    SELECT CASE
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
                ), false) AS isUpdated"),
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

    public function showIndicatorsForReview($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $competency = $conn2->table('staff_competency_history')
            ->where('id', $id)
            ->first();

        $indicators = $conn2->table('staff_competency_indicator_history as scih')
        ->select([
            'scih.*',
            'ci.indicator',
            'ci.proficiency',
            'ci.competency_id',
            DB::raw("COALESCE((
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
            ), false) AS isUpdated"),
        ])
        ->leftJoin('competency_indicator as ci', 'ci.id', '=', 'scih.indicator_id')
        ->leftJoin('competency as c', 'c.comp_id', '=', 'ci.competency_id')
        ->where('c.comp_id', $competency->competency_id)
        ->where('ci.proficiency', '<=', $competency->proficiency)
        ->where('scih.emp_id', $competency->emp_id)
        ->where('scih.position_id', $competency->position_id)
        ->where('scih.date_created', $competency->date_created)
        ->orderBy('ci.proficiency', 'desc')
        ->orderBy('ci.indicator', 'asc')
        ->get();

        return response()->json($indicators);
    }

    public function updateIndicatorsForReview($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $user = Auth::user();

        $conn2->table('staff_competency_indicator_history')
            ->where('id', $id)
            ->update([
                'compliance' => $request->compliance,
                'updated_by' => $user->ipms_id,
                'date_updated' => Carbon::now()->format('Y-m-d H:i:s')
            ]);

        $staffCompetencyIndicatorHistory = $conn2->table('staff_competency_indicator_history')
            ->where('id', $id)
            ->first();

        $conn2->table('staff_all_competency_history')
            ->updateOrInsert(
                [
                    'competency_id' => $request->competency_id,
                    'emp_id' => $request->emp_id,
                    'date_created' => $request->date_created,     
                ],
                [
                    'percentage' => $request->percentage,
                    'created_by' => $user->ipms_id
                ]
            );

        $conn2->table('staff_all_competency_indicator_history')
            ->updateOrInsert(
                [
                    'emp_id' => $request->emp_id,
                    'indicator_id' => $staffCompetencyIndicatorHistory->indicator_id,
                    'date_created' => $request->date_created,     
                ],
                [
                    'compliance' => $request->compliance,
                    'updated_by' => $user->ipms_id,
                    'date_updated' => Carbon::now()->format('Y-m-d H:i:s')
                ]
            );

        $conn2->table('staff_competency_history')
            ->updateOrInsert(
                [
                    'emp_id' => $request->emp_id,
                    'position_id' => $request->position_id,
                    'competency_id' => $request->competency_id,
                    'proficiency' => $request->proficiency,
                    'date_created' => $request->date_created,
                ],
                [
                    'percentage' => $request->percentage,
                    'created_by' => $user->ipms_id,
                ]
            );
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

    public function approveCompetency($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $user = Auth::user();

        try{
            $conn2->table('staff_competency_review')
            ->where('id', $id)
            ->update([
                'status' => 'Approved',
                'acted_by' => $user->ipms_id,
                'date_acted' => Carbon::now()->format('Y-m-d H:i:s')
            ]);

            $competency = $conn2->table('staff_competency_review')
                ->where('id', $id)
                ->first();

            $changedIndicators = $conn2->table('staff_competency_indicator_history')
                ->where('date_created', $competency->date_created)
                ->where('emp_id', $competency->emp_id)
                ->where('position_id', $competency->position_id)
                ->whereNotNull('updated_by')
                ->get();

            if($changedIndicators){
                foreach($changedIndicators as $indicator){
        
                    $conn2->table('staff_all_indicator')
                    ->updateOrInsert(
                        [
                            'emp_id' => $indicator->emp_id,
                            'indicator_id' => $indicator->indicator_id,
                        ],
                        [
                            'compliance' => $indicator->compliance
                        ]
                    );

                    $conn2->table('staff_competency_indicator')
                    ->updateOrInsert(
                        [
                            'emp_id' => $indicator->emp_id,
                            'position_id' => $indicator->position_id,
                            'indicator_id' => $indicator->indicator_id,
                        ],
                        [
                            'compliance' => $indicator->compliance
                        ]
                    );
                }
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Competency approved successfully!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to approve competency: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while approving the competency. Please try again.'
            ]);
        }
    }

    public function showEvidences(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $user = Auth::user();
        $employee = $conn3->table('tblemployee')
            ->where('emp_id', $user->ipms_id)
            ->first();

        $query = $conn2->table('staff_competency_indicator_evidence as evidence')
            ->select([
                'evidence.*',
                'indicator.indicator',
                'competency.competency',
                'indicator.proficiency'
            ])
            ->leftJoin('competency_indicator as indicator', 'indicator.id', '=', 'evidence.indicator_id')
            ->leftJoin('competency', 'competency.comp_id', '=', 'indicator.competency_id');

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function($query) use ($search) {
                $query->where('evidence.title', 'LIKE', "%$search%")
                    ->orWhere('evidence.description', 'LIKE', "%$search%");
            });
        }

        if ($request->has('emp_id')) {
      
            $query->where('evidence.emp_id', $request->emp_id);
        }

        if ($request->has('competency')) {
            $query->where('competency.comp_id', $request->competency);
        }

        if ($request->has('selectedTypes')) {
            
            $selectedTypes = explode(",", $request->input('selectedTypes'));
            $selectedTypes = array_map('trim', $selectedTypes);

            $query->whereIn('evidence.reference', $selectedTypes);
        }

        if ($request->has('status')) {
            switch ($request->status) {
                case 'pending':
    
                    $query->whereNull('evidence.hr_confirmation')
                          ->whereNull('evidence.dc_confirmation')
                          ->whereNull('evidence.disapproved');
    
                    break;
                case 'hrConfirmed':
                    
                    $query->whereNotNull('evidence.hr_confirmation')
                          ->whereNull('evidence.disapproved');
    
                    break;
                case 'dcConfirmed':
                    
                    $query->whereNotNull('evidence.dc_confirmation')
                          ->whereNull('evidence.disapproved');
    
                    break;
                
                case 'disapproved':
                    
                    $query->whereNotNull('evidence.disapproved');
    
                    break;
            }
        }

        $employeeIDs = $conn3->table('tblemployee')
            ->where('division_id', $employee->division_id)
            ->get()
            ->pluck('emp_id');

        if (!$user->hasRole('HRIS_HR')) {
            if ($user->hasRole('HRIS_DC')) {
                $query->whereIn('evidence.emp_id', $employeeIDs);
            }
        }

        $allEvidences = $query->get();
        $allEvidencesCount = $query->count();
        $evidences = $query->orderBy('evidence.id', 'desc')->paginate(20);

        $evidenceStatusCounts = $conn2->table('staff_competency_indicator_evidence')
        ->select(
            DB::raw('SUM(CASE WHEN disapproved = 1 THEN 1 ELSE 0 END) as disapproved'),
            DB::raw('SUM(CASE WHEN hr_confirmation IS NULL AND dc_confirmation IS NULL AND disapproved IS NULL THEN 1 ELSE 0 END) as pending'),
            DB::raw('SUM(CASE WHEN hr_confirmation IS NOT NULL AND dc_confirmation IS NULL AND disapproved IS NULL THEN 1 ELSE 0 END) as hrConfirmed'),
            DB::raw('SUM(CASE WHEN hr_confirmation IS NULL AND dc_confirmation IS NOT NULL AND disapproved IS NULL THEN 1 ELSE 0 END) as dcConfirmed')
        )
        ->whereIn('id', $allEvidences->pluck('id'))
        ->first();

        $evidenceTypeCounts = $conn2->table('staff_competency_indicator_evidence')
        ->select(
            DB::raw('
                SUM(CASE WHEN reference = "Training" THEN 1 ELSE 0 END) as training,
                SUM(CASE WHEN reference = "Award" THEN 1 ELSE 0 END) as award,
                SUM(CASE WHEN reference = "Performance" THEN 1 ELSE 0 END) as performance,
                SUM(CASE WHEN reference = "Others" THEN 1 ELSE 0 END) as others
            ')
        )
        ->whereIn('id', $allEvidences->pluck('id'))
        ->first();

        $files = $conn2->table('evidence_files')
        ->whereIn('evidence_id', $evidences->pluck('id'))
        ->get();

        $filesGrouped = [];
        foreach ($files as $file) {
            $filesGrouped[$file->evidence_id][] = [
                'file_path' => $file->path,
                'file_name' => $file->filename,
            ];
        }

        return response()->json([
            'evidences' => $evidences,
            'files' => $filesGrouped,
            'evidenceStatusCounts' => [
                'all' => $allEvidencesCount,
                'pending' => $evidenceStatusCounts->pending,
                'hrConfirmed' => $evidenceStatusCounts->hrConfirmed,
                'dcConfirmed' => $evidenceStatusCounts->dcConfirmed,
                'disapproved' => $evidenceStatusCounts->disapproved
            ],
            'evidenceTypeCounts' => $evidenceTypeCounts,
        ]);
    }

    public function approveEvidence($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $user = Auth::user();

        $data = [];

        $data['remarks'] = $request->remarks;
        $data['disapproved'] = null;
        $data['disapproved_date'] = null;
        $data['disapproved_by'] = null;
        $data['disapproved_remarks'] = null;
        $data['ipms_id'] = Auth::user()->ipms_id;
        $data['current_time'] = Carbon::now()->format('Y-m-d H:i:s');

        if ($user->hasRole('HRIS_HR')) {
            $data['hr_confirmation'] = 1;
            $data['hr_confirmed_by'] = $data['ipms_id'];
            $data['hr_date'] = $data['current_time'];
            $data['hr_remarks'] = $data['remarks'];
        }

        if ($user->hasRole('HRIS_DC')) {
            $data['dc_confirmation'] = 1;
            $data['dc_confirmed_by'] = $data['ipms_id'];
            $data['dc_date'] = $data['current_time'];
            $data['dc_remarks'] = $data['remarks'];
        }

        $query = $conn2->table('staff_competency_indicator_evidence')
            ->where('id', $id)
            ->update($data);

        return redirect()->back()->with('message', 'Evidences has been approved');
    }

    public function disapproveEvidence($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $user = Auth::user();

        $request->validate([
            'disapproved_remarks' => 'required',
        ],[
            'disapproved_remarks.required' => 'The remarks field is required.',
        ]);

        if($user->hasAnyRole(['HRIS_HR', 'HRIS_DC']))
        {
            $query = $conn2->table('staff_competency_indicator_evidence')
            ->where('id', $id)
            ->update([
                'disapproved_date' => Carbon::now()->format('Y-m-d H:i:s'),
                'disapproved' => 1,
                'disapproved_by' => Auth::user()->ipms_id,
                'disapproved_remarks' => $request->disapproved_remarks,
                'hr_confirmation' => null,
                'hr_confirmed_by' => null,
                'hr_date' => null,
                'hr_remarks' => null,
                'dc_confirmation' => null,
                'dc_confirmed_by' => null,
                'dc_date' => null,
                'dc_remarks' => null,
            ]);
        }

        return redirect()->back()->with('message', 'Evidences has been disapproved');
    }
}
