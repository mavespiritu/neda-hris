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

class ReviewCgaController extends Controller
{
    public function index()
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');


        return inertia('ReviewCga/index', [
       
        ]);
    }

    public function showEvidences(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $query = $conn2->table('staff_competency_indicator_evidence as evidence')
            ->select([
                'evidence.*',
                'indicator.indicator',
                'competency.competency',
                'indicator.proficiency'
            ])
            ->leftJoin('competency_indicator as indicator', 'indicator.id', '=', 'evidence.indicator_id')
            ->leftJoin('competency', 'competency.comp_id', '=', 'indicator.competency_id');

        if ($request->search !== null) {
            $search = $request->input('search');
            $query->where(function($query) use ($search) {
                $query->where('evidence.title', 'LIKE', "%$search%")
                    ->orWhere('evidence.description', 'LIKE', "%$search%");
            });
        }

        if ($request->emp_id !== null && $request->emp_id !== 'null') {
      
            $query->where('evidence.emp_id', $request->emp_id);
        }

        if ($request->competency !== null && $request->competency !== 'null') {
            $query->where('competency.comp_id', $request->competency);
        }

        if ($request->has('selectedTypes')) {
            
            $selectedTypes = explode(",", $request->input('selectedTypes'));
            $selectedTypes = array_map('trim', $selectedTypes);

            $query->whereIn('evidence.reference', $selectedTypes);
        }

        if ($request->status !== null && $request->status !== 'null') {
            switch ($request->status) {
                case 'pending':
    
                    $query->whereNull('evidence.hr_confirmation')
                          ->whereNull('evidence.dc_confirmation');
    
                    break;
                case 'hrConfirmed':
                    
                    $query->whereNotNull('evidence.hr_confirmation');
    
                    break;
                case 'dcConfirmed':
                    
                    $query->whereNotNull('evidence.dc_confirmation');
    
                    break;
                
                case 'disapproved':
                    
                    $query->whereNotNull('evidence.disapproved');
    
                    break;
            }
        }

        $allEvidences = $query->get();
        $allEvidencesCount = $query->count();
        $evidences = $query->orderBy('evidence.id', 'desc')->paginate(20);

        $evidenceStatusCounts = $conn2->table('staff_competency_indicator_evidence')
        ->select(
            DB::raw('SUM(CASE WHEN disapproved = 1 THEN 1 ELSE 0 END) as disapproved'),
            DB::raw('SUM(CASE WHEN hr_confirmation IS NULL AND dc_confirmation IS NULL THEN 1 ELSE 0 END) as pending'),
            DB::raw('SUM(CASE WHEN hr_confirmation IS NOT NULL AND dc_confirmation IS NULL THEN 1 ELSE 0 END) as hrConfirmed'),
            DB::raw('SUM(CASE WHEN hr_confirmation IS NOT NULL AND dc_confirmation IS NOT NULL THEN 1 ELSE 0 END) as dcConfirmed')
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

    public function approveEvidence($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $roles = Auth::user()->getRoleNames();

        $data = [];

        if ($roles->contains('HRIS_HR')) {
            $data['hr_confirmation'] = 1;
            $data['hr_confirmed_by'] = Auth::user()->ipms_id;
            $data['hr_date'] = Carbon::now()->format('Y-m-d H:i:s');
            $data['hr_remarks'] = $request->remarks;
        }

        if ($roles->contains('HRIS_DC')) {
            $data['dc_confirmation'] = 1;
            $data['dc_confirmed_by'] = Auth::user()->ipms_id;
            $data['dc_date'] = Carbon::now()->format('Y-m-d H:i:s');
            $data['dc_remarks'] = $request->remarks;
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

        $request->validate([
            'disapproved_remarks' => 'required',
        ],[
            'disapproved_remarks.required' => 'The remarks field is required.',
        ]);

        $query = $conn2->table('staff_competency_indicator_evidence')
            ->where('id', $id)
            ->update([
                'disapproved_date' => Carbon::now()->format('Y-m-d H:i:s'),
                'disapproved' => 1,
                'disapproved_by' => Auth::user()->ipms_id,
                'disapproved_remarks' => $request->disapproved_remarks
            ]);

        return redirect()->back()->with('message', 'Evidences has been disapproved');
    }
}
