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

class MyCgaController extends Controller
{
    public $emp_id;

    public function __construct()
    {
        $this->emp_id = Auth::check() ? Auth::user()->ipms_id : null; 
    }
    
    public function index()
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $position = $conn3->table('tblemp_emp_item as eei')
            ->select([
                'epi.*'
            ])
            ->leftJoin('tblemp_position_item as epi', 'eei.item_no', '=', 'epi.item_no')
            ->where('eei.emp_id', $this->emp_id)
            ->whereNull('eei.to_date')
            ->orderBy('eei.from_date', 'desc')
            ->first();

        return inertia('MyCga/index', [
            'emp_id' => $this->emp_id,
            'position_id' => $position->item_no
        ]);
    }

    /* public function showCompetencies($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $position_id = '';

        if($request->has('position_id')){

            $position_id = $request->position_id;

        }else{

            $position = $conn3->table('tblemp_emp_item as eei')
            ->select([
                'epi.*'
            ])
            ->leftJoin('tblemp_position_item as epi', 'eei.item_no', '=', 'epi.item_no')
            ->where('eei.emp_id', $id)
            ->whereNull('eei.to_date')
            ->orderBy('eei.from_date', 'desc')
            ->first();

            $position_id = $position->item_no;
        }

        if($request->has('all') && $request->all){

            $competencies = $conn2->table('competency_indicator as ci')
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
                    DB::raw("
                        ROUND(
                            (
                                SELECT COUNT(DISTINCT sai.indicator_id)
                                FROM staff_all_indicator as sai
                                LEFT JOIN competency_indicator as ci ON ci.id = sai.indicator_id
                                WHERE sai.emp_id = '".$id."'
                                AND sai.compliance = 1
                                AND ci.competency_id = c.comp_id
                            ) / NULLIF(
                                (
                                    SELECT COUNT(*)
                                    FROM competency_indicator as ci2
                                    WHERE ci2.competency_id = c.comp_id
                                ), 0
                            ) * 100, 2
                        ) AS percentage
                    ")
                ])
                ->leftJoin('competency as c', 'c.comp_id', '=', 'ci.competency_id')
                ->groupBy('c.comp_id', 'c.competency', 'c.comp_type')
                ->orderBy('type', 'asc')
                ->orderBy('c.competency', 'asc')
                ->get()
                ->groupBy('type');

        }else{

            $competencies = $conn2->table('position_competency_indicator as pci')
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
                DB::raw("
                    ROUND(
                        (
                            SELECT COUNT(DISTINCT sai.indicator_id)
                            FROM staff_all_indicator as sai
                            LEFT JOIN competency_indicator as ci ON ci.id = sai.indicator_id
                            WHERE sai.emp_id = '".$id."'
                            AND sai.compliance = 1
                            AND ci.competency_id = c.comp_id
                            AND ci.proficiency IN (
                                SELECT DISTINCT(ci3.proficiency)
                                FROM position_competency_indicator as pci3
                                LEFT JOIN competency_indicator as ci3 ON ci3.id = pci3.indicator_id
                                WHERE ci3.competency_id = c.comp_id 
                                AND pci3.position_id = pci.position_id
                            )
                        ) / NULLIF( 
                            (
                                SELECT COUNT(*)
                                FROM position_competency_indicator as pci2
                                LEFT JOIN competency_indicator as ci2 ON ci2.id = pci2.indicator_id
                                WHERE ci2.competency_id = c.comp_id 
                                AND pci2.position_id = pci.position_id
                            ), 0
                        ) * 100, 2
                    ) AS percentage
                ")
            ])
            ->leftJoin('competency_indicator as ci', 'ci.id', '=', 'pci.indicator_id')
            ->leftJoin('competency as c', 'c.comp_id', '=', 'ci.competency_id')
            ->where('pci.position_id', $position_id)
            ->groupBy('c.comp_id', 'c.competency', 'c.comp_type', 'pci.position_id')
            ->orderBy('type', 'asc')
            ->orderBy('c.competency', 'asc')
            ->get()
            ->groupBy('type');

        }
        
        return response()->json($competencies);
    } */

    public function showCompetencies($id, Request $request)
{
    $conn2 = DB::connection('mysql2');
    $conn3 = DB::connection('mysql3');

    $position_id = '';

    if ($request->has('position_id')) {
        $position_id = $request->position_id;
    } else {
        $position = $conn3->table('tblemp_emp_item as eei')
            ->select(['epi.*'])
            ->leftJoin('tblemp_position_item as epi', 'eei.item_no', '=', 'epi.item_no')
            ->where('eei.emp_id', $id)
            ->whereNull('eei.to_date')
            ->orderBy('eei.from_date', 'desc')
            ->first();

        $position_id = $position->item_no;
    }

    if ($request->has('all') && $request->all) {
        $competencies = $conn2->table('competency_indicator as ci')
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
                DB::raw("
                    ROUND(
                        (
                            SELECT COUNT(DISTINCT sai.indicator_id)
                            FROM staff_all_indicator as sai
                            LEFT JOIN competency_indicator as ci ON ci.id = sai.indicator_id
                            WHERE sai.emp_id = '" . $id . "'
                            AND sai.compliance = 1
                            AND ci.competency_id = c.comp_id
                        ) / NULLIF(
                            (
                                SELECT COUNT(*)
                                FROM competency_indicator as ci2
                                WHERE ci2.competency_id = c.comp_id
                            ), 0
                        ) * 100, 2
                    ) AS percentage
                ")
            ])
            ->leftJoin('competency as c', 'c.comp_id', '=', 'ci.competency_id')
            ->groupBy('c.comp_id', 'c.competency', 'c.description', 'c.comp_type') // Added c.description here
            ->orderBy('type', 'asc')
            ->orderBy('c.competency', 'asc')
            ->get()
            ->groupBy('type');

    } else {
        $competencies = $conn2->table('position_competency_indicator as pci')
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
                DB::raw("
                    ROUND(
                        (
                            SELECT COUNT(DISTINCT sai.indicator_id)
                            FROM staff_all_indicator as sai
                            LEFT JOIN competency_indicator as ci ON ci.id = sai.indicator_id
                            WHERE sai.emp_id = '" . $id . "'
                            AND sai.compliance = 1
                            AND ci.competency_id = c.comp_id
                            AND ci.proficiency IN (
                                SELECT DISTINCT(ci3.proficiency)
                                FROM position_competency_indicator as pci3
                                LEFT JOIN competency_indicator as ci3 ON ci3.id = pci3.indicator_id
                                WHERE ci3.competency_id = c.comp_id 
                                AND pci3.position_id = pci.position_id
                            )
                        ) / NULLIF( 
                            (
                                SELECT COUNT(*)
                                FROM position_competency_indicator as pci2
                                LEFT JOIN competency_indicator as ci2 ON ci2.id = pci2.indicator_id
                                WHERE ci2.competency_id = c.comp_id 
                                AND pci2.position_id = pci.position_id
                            ), 0
                        ) * 100, 2
                    ) AS percentage
                ")
            ])
            ->leftJoin('competency_indicator as ci', 'ci.id', '=', 'pci.indicator_id')
            ->leftJoin('competency as c', 'c.comp_id', '=', 'ci.competency_id')
            ->where('pci.position_id', $position_id)
            ->groupBy('c.comp_id', 'c.competency', 'c.description', 'c.comp_type', 'pci.position_id') // Added c.description here
            ->orderBy('type', 'asc')
            ->orderBy('c.competency', 'asc')
            ->get()
            ->groupBy('type');
    }

    return response()->json($competencies);
}


    public function showCompetency($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $position = $conn3->table('tblemp_emp_item as eei')
            ->select([
                'epi.*'
            ])
            ->leftJoin('tblemp_position_item as epi', 'eei.item_no', '=', 'epi.item_no')
            ->where('eei.emp_id', $this->emp_id)
            ->whereNull('eei.to_date')
            ->orderBy('eei.from_date', 'desc')
            ->first();

        $competency = $conn2->table('competency')
                ->where('comp_id', $id)
                ->first();
            
        $indicatorIDs = $conn2->table('competency_indicator')
                ->where('competency_id', $competency->comp_id)
                ->get()
                ->pluck('id');
            
        $indicators = $conn2->table('position_competency_indicator as pci')
            ->select([
                'c.comp_id as id',
                'c.competency',
                'pci.indicator_id',
                'ci.indicator',
                'ci.proficiency',
                DB::raw("CASE 
                            WHEN c.comp_type = 'org' THEN 'Organizational'
                            WHEN c.comp_type = 'mnt' THEN 'Managerial'
                            ELSE 'Technical/Functional'
                        END as type")
            ])
            ->leftJoin('competency_indicator as ci', 'ci.id', '=', 'pci.indicator_id')
            ->leftJoin('competency as c', 'c.comp_id', '=', 'ci.competency_id')
            ->where('pci.position_id', $position->item_no)
            ->where('c.comp_id', $competency->comp_id)
            ->whereIn('pci.indicator_id', $indicatorIDs)
            ->orderBy('ci.proficiency', 'desc')
            ->orderBy('type', 'asc')
            ->orderBy('c.competency', 'asc')
            ->orderBy('ci.indicator', 'asc')
            ->get()
            ->groupBy('proficiency');

        if($request->has('custom') && $request->custom){
            
            $indicators = $conn2->table('competency_indicator as ci')
                ->select([
                    'ci.id as indicator_id',
                    'c.competency',
                    'c.description',
                    'ci.indicator',
                    'ci.proficiency',
                    DB::raw("CASE 
                                WHEN c.comp_type = 'org' THEN 'Organizational'
                                WHEN c.comp_type = 'mnt' THEN 'Managerial'
                                ELSE 'Technical/Functional'
                            END as type")
                ])
                ->leftJoin('competency as c', 'c.comp_id', '=', 'ci.competency_id')
                ->where('c.comp_id', $competency->comp_id)
                ->where('ci.proficiency', '<=', $request->proficiency)
                ->orderBy('ci.proficiency', 'desc')
                ->orderBy('type', 'asc')
                ->orderBy('c.competency', 'asc')
                ->orderBy('ci.proficiency', 'desc')
                ->orderBy('ci.indicator', 'asc')
                ->get()
                ->groupBy('proficiency');
        }

        if($request->has('all') && $request->all){
            
            $indicators = $conn2->table('competency_indicator as ci')
                ->select([
                    'ci.id as indicator_id',
                    'c.competency',
                    'c.description',
                    'ci.indicator',
                    'ci.proficiency',
                    DB::raw("CASE 
                                WHEN c.comp_type = 'org' THEN 'Organizational'
                                WHEN c.comp_type = 'mnt' THEN 'Managerial'
                                ELSE 'Technical/Functional'
                            END as type")
                ])
                ->leftJoin('competency as c', 'c.comp_id', '=', 'ci.competency_id')
                ->where('c.comp_id', $competency->comp_id)
                ->orderBy('ci.proficiency', 'desc')
                ->orderBy('type', 'asc')
                ->orderBy('c.competency', 'asc')
                ->orderBy('ci.proficiency', 'desc')
                ->orderBy('ci.indicator', 'asc')
                ->get()
                ->groupBy('proficiency');
        }

        return response()->json($indicators);
    }

    public function showCompliances($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $position = $conn3->table('tblemp_emp_item as eei')
            ->select([
                'epi.*'
            ])
            ->leftJoin('tblemp_position_item as epi', 'eei.item_no', '=', 'epi.item_no')
            ->where('eei.emp_id', $this->emp_id)
            ->whereNull('eei.to_date')
            ->orderBy('eei.from_date', 'desc')
            ->first();

        $indicatorIDs = $conn2->table('competency_indicator')
                ->where('competency_id', $id)
                ->get()
                ->pluck('id');

        $compliances = $conn2->table('staff_competency_indicator')
            ->where('emp_id', $this->emp_id)
            ->where('position_id', $position->item_no)
            ->whereIn('indicator_id', $indicatorIDs)
            ->orderBy('id', 'desc')
            ->get()
            ->keyBy('indicator_id');

        if(($request->has('all') && $request->all) || ($request->has('custom') && $request->custom)){
            $compliances = $conn2->table('staff_all_indicator')
            ->where('emp_id', $this->emp_id)
            ->whereIn('indicator_id', $indicatorIDs)
            ->orderBy('id', 'desc')
            ->get()
            ->keyBy('indicator_id');
        }

        $compliances = $compliances->map(function ($compliance) {
            return [
                'compliance' => $compliance->compliance == 1, 
                'id' => $compliance->id,
                'indicator_id' => $compliance->indicator_id,
            ];
        });
            
        return response()->json($compliances);
    }

    public function updateCompliances($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $position = $conn3->table('tblemp_emp_item as eei')
            ->select([
                'epi.*'
            ])
            ->leftJoin('tblemp_position_item as epi', 'eei.item_no', '=', 'epi.item_no')
            ->where('eei.emp_id', $this->emp_id)
            ->whereNull('eei.to_date')
            ->orderBy('eei.from_date', 'desc')
            ->first();

        if(!$position){
            return redirect()->back()->with([
                'error' => 'Failed to retrieve position. Please try again.'
            ])->withStatus(500);
        }

        $allIndicator = $conn2->table('staff_all_indicator')
        ->where('emp_id', $this->emp_id)
        ->where('indicator_id', $id)
        ->first();

        if(!$allIndicator){
            $newIndicator = $conn2->table('staff_all_indicator')->insertGetId([
                'emp_id' => $this->emp_id,
                'indicator_id' => $id,
                'compliance' => 0,
            ]);
        }

        $competencyIndicator = $conn2->table('staff_competency_indicator')
        ->where('emp_id', $this->emp_id)
        ->where('position_id', $position->item_no)
        ->where('indicator_id', $id)
        ->first();

        if(!$competencyIndicator){
            $newCompetencyIndicator = $conn2->table('staff_competency_indicator')->insertGetId([
                'emp_id' => $this->emp_id,
                'position_id' => $position->item_no,
                'indicator_id' => $id,
                'compliance' => 0,
            ]);
        }

        $conn2->table('staff_competency_indicator')
            ->where('emp_id', $this->emp_id)
            ->where('indicator_id', $id)
            ->update([
                'compliance' => $request->input('compliance') ? 1 : 0
            ]);
        
        $conn2->table('staff_all_indicator')
            ->where('emp_id', $this->emp_id)
            ->where('indicator_id', $id)
            ->update([
                'compliance' => $request->input('compliance')
            ]);

        return redirect()->back()->with('message', 'Indicator compliance updated successfully.');
    }
    
    public function showIndicator(Request $request)
    {

        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $position = $conn3->table('tblemp_emp_item as eei')
            ->select([
                'epi.*'
            ])
            ->leftJoin('tblemp_position_item as epi', 'eei.item_no', '=', 'epi.item_no')
            ->where('eei.emp_id', $this->emp_id)
            ->whereNull('eei.to_date')
            ->orderBy('eei.from_date', 'desc')
            ->first();
            

        $staffAllIndicator = $conn2->table('staff_all_indicator')
            ->where('emp_id', $this->emp_id)
            ->where('indicator_id', $request->indicator_id)
            ->first();

        if(!$staffAllIndicator)
        {
            $conn2->table('staff_all_indicator')->insert([
                'emp_id' => $this->emp_id,
                'indicator_id' => $request->indicator_id,
                'compliance' => 0
            ]);
        }

        $staffCompetencyIndicator = $conn2->table('staff_competency_indicator')
            ->where('emp_id', $this->emp_id)
            ->where('position_id', $position->item_no)
            ->where('indicator_id', $request->indicator_id)
            ->first();

        if(!$staffCompetencyIndicator)
        {
            $staffCompetencyIndicator = $conn2->table('staff_competency_indicator')
            ->insert([
                'emp_id' => $this->emp_id,
                'position_id' => $position->item_no,
                'indicator_id' => $request->indicator_id,
                'compliance' => 0
            ]);
        }
    }

    public function showEvidences($id,Request $request)
    {
        $connection = DB::connection('mysql2');

        $query = $connection->table('staff_competency_indicator_evidence')
            ->where('emp_id', $this->emp_id)
            ->where('indicator_id', $id);

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function($query) use ($search) {
                $query->where('title', 'LIKE', "%$search%")
                    ->orWhere('description', 'LIKE', "%$search%");
            });
        }

        if ($request->has('references')) {
            
            $references = explode(",", $request->input('references'));
            $references = array_map('trim', $references);

            $query->where(function($query) use ($references) {
                $query->whereIn('reference', $references);
            });
        }

        $evidences = $query->orderBy('id', 'desc')->paginate(10);

        $files = $connection->table('evidence_files')
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
        ]);
    }

    public function showEvidencesCount($id, Request $request)
    {
        $connection = DB::connection('mysql2');

        $allCount = $connection->table('staff_competency_indicator_evidence')
            ->where('emp_id', $this->emp_id)
            ->where('indicator_id', $id);

        $pendingCount = $connection->table('staff_competency_indicator_evidence')
            ->where('emp_id', $this->emp_id)
            ->where('indicator_id', $id)
            ->whereNull('hr_confirmation')
            ->whereNull('dc_confirmation');

        $hrConfirmedCount = $connection->table('staff_competency_indicator_evidence')
            ->where('emp_id', $this->emp_id)
            ->where('indicator_id', $id)
            ->whereNotNull('hr_confirmation');

        $dcConfirmedCount = $connection->table('staff_competency_indicator_evidence')
            ->where('emp_id', $this->emp_id)
            ->where('indicator_id', $id)
            ->whereNotNull('dc_confirmation');

        if ($request->has('search')) {
            $search = $request->input('search');
            $allCount->where(function($query) use ($search) {
                $query->where('title', 'LIKE', "%$search%")
                    ->orWhere('description', 'LIKE', "%$search%");
            });

            $pendingCount->where(function($query) use ($search) {
                $query->where('title', 'LIKE', "%$search%")
                    ->orWhere('description', 'LIKE', "%$search%");
            });

            $hrConfirmedCount->where(function($query) use ($search) {
                $query->where('title', 'LIKE', "%$search%")
                    ->orWhere('description', 'LIKE', "%$search%");
            });

            $dcConfirmedCount->where(function($query) use ($search) {
                $query->where('title', 'LIKE', "%$search%")
                    ->orWhere('description', 'LIKE', "%$search%");
            });
        }

        if ($request->has('references')) {

            $references = explode(",", $request->input('references'));
            $references = array_map('trim', $references);
            
            $allCount->whereIn('reference', $references);
            $pendingCount->whereIn('reference', $references);
            $hrConfirmedCount->whereIn('reference', $references);
            $dcConfirmedCount->whereIn('reference', $references);
            
        }

        $allCount = $allCount->count();
        $pendingCount = $pendingCount->count();
        $hrConfirmedCount = $hrConfirmedCount->count();
        $dcConfirmedCount = $dcConfirmedCount->count();

        return response()->json([
            'all' => $allCount,
            'pending' => $pendingCount,
            'hrConfirmed' => $hrConfirmedCount,
            'dcConfirmed' => $dcConfirmedCount,
        ]);
    }

    public function showTrainings()
    {
        $connection = DB::connection('mysql3');

        $trainings = $connection->table('tblemp_training_program')
            ->select([
                DB::raw('concat(seminar_title,"__",from_date) as value'),
                DB::raw('IF(from_date <> to_date, concat(seminar_title," (",from_date," to ",to_date,")"), concat(seminar_title," (",from_date,")")) as label'),
            ])
            ->where('emp_id', $this->emp_id)
            ->where('approval', 'yes')
            ->orderBy('seminar_title', 'asc')
            ->get();

        return response()->json($trainings);   
    }

    public function showAwards()
    {
        $connection = DB::connection('mysql3');

        $awards = $connection->table('tblemp_other_info')
            ->select([
                'description as value',
                'description as label',
            ])
            ->where('emp_id', $this->emp_id)
            ->where('type', 'recognition')
            ->where('approval', 'yes')
            ->orderBy('description', 'asc')
            ->get();

        return response()->json($awards);    
    }

    public function showPerformances()
    {
        $connection = DB::connection('mysql3');

        $performances = $connection->table('tblemp_ipcr')
            ->select([
                'id as value',
                DB::raw('concat("IPCR for ", IF(semester = 1, "1st", "2nd") ," Semester ", year) as label'),
            ])
            ->where('emp_id', $this->emp_id)
            ->whereNotNull('verified_by')
            ->orderBy('year', 'desc')
            ->orderBy('semester', 'desc')
            ->get();

        return response()->json($performances);   

    }

    public function showCareers()
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $careers = $conn2->table('career_path')
            ->where('emp_id', $this->emp_id)
            ->where('type', 'CareerPath')
            ->pluck('position_id'); 

        $positions = $conn3->table('tblemp_position_item as epi')
            ->select(
                'item_no as value',
                DB::raw('concat(division_id, ": ", p.position_id, " (",item_no,")") as label')
                )
            ->leftJoin('tblposition as p', 'p.position_id', '=', 'epi.position_id')
            ->whereIn('epi.item_no', $careers)
            ->orderBy('epi.division_id', 'asc')
            ->orderBy('p.position_id', 'asc')
            ->get();

        return response()->json($positions);   

    }

    public function showDesignations()
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $designations = $conn2->table('career_path')
            ->where('emp_id', $this->emp_id)
            ->where('type', 'Designation')
            ->pluck('position_id'); 

        $positions = $conn3->table('tblemp_position_item as epi')
            ->select(
                'item_no as value',
                DB::raw('concat(division_id, ": ", p.position_id, " (",item_no,")") as label')
                )
            ->leftJoin('tblposition as p', 'p.position_id', '=', 'epi.position_id')
            ->whereIn('epi.item_no', $designations)
            ->orderBy('epi.division_id', 'asc')
            ->orderBy('p.position_id', 'asc')
            ->get();

        return response()->json($positions);   

    }

    public function showCareerPositions()
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $paths = $conn2->table('career_path')
            ->where('emp_id', $this->emp_id)
            ->pluck('position_id'); 

        $currentPosition = $conn3->table('tblemp_emp_item as eei')
            ->select([
                'epi.*'
            ])
            ->leftJoin('tblemp_position_item as epi', 'eei.item_no', '=', 'epi.item_no')
            ->where('eei.emp_id', $this->emp_id)
            ->whereNull('eei.to_date')
            ->orderBy('eei.from_date', 'desc')
            ->first();

        $positions = $conn3->table('tblemp_position_item as epi')
            ->select(
                'item_no as value',
                DB::raw('concat(division_id, ": ", p.position_id, " (",item_no,")") as label')
                )
            ->leftJoin('tblposition as p', 'p.position_id', '=', 'epi.position_id')
            ->whereNotIn('epi.item_no', $paths)
            ->where('epi.item_no', '<>', $currentPosition->item_no)
            ->where('epi.grade', '>', $currentPosition->grade)
            ->where('epi.status', 1)
            ->orderBy('epi.division_id', 'asc')
            ->orderBy('p.position_id', 'asc')
            ->get();

        return response()->json($positions); 
    }

    public function storeCareerPath(Request $request)
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
                'emp_id' => $this->emp_id,
                'position_id' => $request->position_id,
                'type' => 'CareerPath',
            ]); 

        return redirect()->back()->with('message', 'Career path added successfully.');
    }

    public function deleteCareerPath(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $career = $conn2->table('career_path')
        ->where('emp_id', $this->emp_id)
        ->where('position_id', $request->position_id)
        ->where('type', 'CareerPath')
        ->delete();

        $indicators = $conn2->table('staff_competency_indicator')
        ->where('emp_id', $this->emp_id)
        ->where('position_id', $request->position_id)
        ->delete();

        return redirect()->back()->with('message', 'Career path deleted successfully.');
    }

    public function storeTrainings(Request $request, string $id)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $request->validate([
            'training_id' => 'required',
            'description' => 'required|string',
            'files' => 'required|array|max:5', 
            'files.*' => 'file|mimes:jpeg,png,jpg,pdf|max:5120',
        ],[
            'training_id.required' => 'The training field is required.',

            'description.required' => 'The context field is required.',
            'description.string' => 'The context field must be an acceptable text.',

            'files.required' => 'You must upload at least one file.',
            'files.array' => 'Files must be an array.',
            'files.max' => 'You can upload a maximum of 5 files.',
            'files.*.file' => 'Each uploaded file must be valid.',
            'files.*.mimes' => 'Each file must be a JPEG, JPG, PNG, or PDF.',
            'files.*.max' => 'Each file may not be greater than 5 MB.',
        ]);

        $trainingID = explode('__', $request->input('training_id'));

        $training = $conn3->table('tblemp_training_program')->where([
            'emp_id' => $this->emp_id,
            'seminar_title' => $trainingID[0],
            'from_date' => $trainingID[1],
            'approval' => 'yes'
        ])
        ->first();

        $evidence = $conn2->table('staff_competency_indicator_evidence')
            ->insertGetId([
                'emp_id' => $this->emp_id,
                'indicator_id' => $id,
                'title' => 'Attendance to '.$training->seminar_title,
                'description' => $request->input('description'),
                'start_date' => $training->from_date,
                'end_date' => $training->to_date,
                'reference' => 'Training',
            ]);

        $trainingEvidence = $conn2->table('evidence_training')
            ->insert([
                'evidence_id' => $evidence,
                'emp_id' => $this->emp_id,
                'seminar_title' => $training->seminar_title,
                'from_date' => $training->from_date,
            ]);

        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {

                $filename = Str::random(20) . '_' . time() . '.' . $file->getClientOriginalExtension();

                $filePath = $file->storeAs('uploads/evidence', $filename, 'public');

                $conn2->table('evidence_files')
                ->insert([
                    'evidence_id' => $evidence,
                    'filename' => $file->getClientOriginalName(),
                    'path' => $filePath,
                ]);

            }
        }

        return redirect()->back()->with('message', 'Training evidence added successfully.');
    }

    public function updateTrainings(Request $request, string $id)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $request->validate([
            'training_id' => 'required',
            'description' => 'required|string',
            'files.*' => 'file|mimes:jpeg,png,jpg,pdf|max:5120',
        ],[
            'training_id.required' => 'The training field is required.',

            'description.required' => 'The context field is required.',
            'description.string' => 'The context field must be an acceptable text.',
        ]);

        $trainingID = explode('__', $request->input('training_id'));

        $training = $conn3->table('tblemp_training_program')->where([
            'emp_id' => $this->emp_id,
            'seminar_title' => $trainingID[0],
            'from_date' => $trainingID[1],
            'approval' => 'yes'
        ])
        ->first();

        $evidence = $conn2->table('staff_competency_indicator_evidence')
            ->where('id', $id)
            ->update([
                'title' => 'Attendance to '.$training->seminar_title,
                'description' => $request->description,
                'start_date' => $training->from_date,
                'end_date' => $training->to_date,
            ]);

        $trainingEvidence = $conn2->table('evidence_training')
            ->where('evidence_id', $id)
            ->first();

        if($trainingEvidence){
            $conn2->table('evidence_training')
            ->where('evidence_id', $id)
            ->update([
                'seminar_title' => $training->seminar_title,
                'from_date' => $training->from_date,
            ]);
        }else{
            $conn2->table('evidence_training')
            ->insert([
                'evidence_id' => $id,
                'emp_id' => $this->emp_id,
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

        // Handle newly uploaded files
        if ($request->hasFile('files')) {

            foreach ($request->file('files') as $file) {

                $filename = Str::random(20) . '_' . time() . '.' . $file->getClientOriginalExtension();

                $filePath = $file->storeAs('uploads/evidence', $filename, 'public');

                $conn2->table('evidence_files')
                ->insert([
                    'evidence_id' => $id,
                    'filename' => $file->getClientOriginalName(),
                    'path' => $filePath,
                ]);

            }
        }

        return redirect()->back()->with('message', 'Training evidence updated successfully.');
    }

    public function storeAwards(Request $request, string $id)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $request->validate([
            'award_id' => 'required',
            'description' => 'required|string',
            'files' => 'required|array|max:5', 
            'files.*' => 'file|mimes:jpeg,png,jpg,pdf|max:5120',
        ],[
            'award_id.required' => 'The award field is required.',

            'description.required' => 'The context field is required.',
            'description.string' => 'The context field must be an acceptable text.',

            'files.required' => 'You must upload at least one file.',
            'files.array' => 'Files must be an array.',
            'files.max' => 'You can upload a maximum of 5 files.',
            'files.*.file' => 'Each uploaded file must be valid.',
            'files.*.mimes' => 'Each file must be a JPEG, JPG, PNG, or PDF.',
            'files.*.max' => 'Each file may not be greater than 5 MB.',
        ]);

        $award = $conn3->table('tblemp_other_info')->where([
            'emp_id' => $this->emp_id,
            'type' => 'recognition',
            'description' => $request->input('award_id'),
            'approval' => 'yes'
        ])
        ->first();

        $evidence = $conn2->table('staff_competency_indicator_evidence')
            ->insertGetId([
                'emp_id' => $this->emp_id,
                'indicator_id' => $id,
                'title' => 'Awarded with '.$award->description,
                'description' => $request->input('description'),
                'start_date' => $award->year.'-01-01',
                'end_date' => $award->year.'-12-31',
                'reference' => 'Award',
            ]);

        $awardEvidence = $conn2->table('evidence_award')
            ->insert([
                'evidence_id' => $evidence,
                'emp_id' => $this->emp_id,
                'type' => 'recognition',
                'description' => $award->description,
            ]);

        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {

                $filename = Str::random(20) . '_' . time() . '.' . $file->getClientOriginalExtension();

                $filePath = $file->storeAs('uploads/evidence', $filename, 'public');

                $conn2->table('evidence_files')
                ->insert([
                    'evidence_id' => $evidence,
                    'filename' => $file->getClientOriginalName(),
                    'path' => $filePath,
                ]);

            }
        }

        return redirect()->back()->with('message', 'Award evidence added successfully.');
      
    }
    
    public function updateAwards(Request $request, string $id)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $request->validate([
            'award_id' => 'required',
            'description' => 'required|string',
        ],[
            'award_id.required' => 'The award field is required.',
            'description.required' => 'The context field is required.',
            'description.string' => 'The context field must be an acceptable text.',
        ]);

        $award = $conn3->table('tblemp_other_info')->where([
            'emp_id' => $this->emp_id,
            'type' => 'recognition',
            'description' => $request->input('award_id'),
            'approval' => 'yes'
        ])
        ->first();

        $evidence = $conn2->table('staff_competency_indicator_evidence')
            ->where('id', $id)
            ->update([
                'title' => 'Awarded with '.$award->description,
                'description' => $award->description,
                'start_date' => $award->year.'-01-01',
                'end_date' => $award->year.'-12-31',
            ]);

        $awardEvidence = $conn2->table('evidence_award')
            ->where('evidence_id', $id)
            ->update([
                'description' => $award->description,
            ]);

        if($awardEvidence){
            $conn2->table('evidence_award')
            ->where('evidence_id', $id)
            ->update([
                'description' => $award->description,
            ]);
        }else{
            $conn2->table('evidence_award')
            ->insert([
                'evidence_id' => $id,
                'emp_id' => $this->emp_id,
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

        // Handle newly uploaded files
        if ($request->hasFile('files')) {

            foreach ($request->file('files') as $file) {

                $filename = Str::random(20) . '_' . time() . '.' . $file->getClientOriginalExtension();

                $filePath = $file->storeAs('uploads/evidence', $filename, 'public');

                $conn2->table('evidence_files')
                ->insert([
                    'evidence_id' => $id,
                    'filename' => $file->getClientOriginalName(),
                    'path' => $filePath,
                ]);

            }
        }

        return redirect()->back()->with('message', 'Award evidence updated successfully.');
    }

    public function storePerformances(Request $request, string $id)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $request->validate([
            'ipcr_id' => 'required',
            'description' => 'required|string',
            'files' => 'required|array|max:5', 
            'files.*' => 'file|mimes:jpeg,png,jpg,pdf|max:5120',
        ],[
            'ipcr_id.required' => 'The performance field is required.',

            'description.required' => 'The context field is required.',
            'description.string' => 'The context field must be an acceptable text.',

            'files.required' => 'You must upload at least one file.',
            'files.array' => 'Files must be an array.',
            'files.max' => 'You can upload a maximum of 5 files.',
            'files.*.file' => 'Each uploaded file must be valid.',
            'files.*.mimes' => 'Each file must be a JPEG, JPG, PNG, or PDF.',
            'files.*.max' => 'Each file may not be greater than 5 MB.',
        ]);

        $performance = $conn3->table('tblemp_ipcr')->where([
            'id' => $request->input('ipcr_id'),
        ])
        ->first();

        $evidence = $conn2->table('staff_competency_indicator_evidence')
            ->insertGetId([
                'emp_id' => $this->emp_id,
                'indicator_id' => $id,
                'title' => 'IPCR for '.($performance->semester == 1 ? '1st' : '2nd')." Semester ".$performance->year,
                'description' => $request->input('description'),
                'start_date' => $performance->year.'-01-01',
                'end_date' => $performance->year.'-12-31',
                'reference' => 'Performance',
            ]);

        $performanceEvidence = $conn2->table('evidence_performance')
            ->insert([
                'evidence_id' => $evidence,
                'emp_id' => $this->emp_id,
                'ipcr_id' => $performance->id,
            ]);

        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {

                $filename = Str::random(20) . '_' . time() . '.' . $file->getClientOriginalExtension();

                $filePath = $file->storeAs('uploads/evidence', $filename, 'public');

                $conn2->table('evidence_files')
                ->insert([
                    'evidence_id' => $evidence,
                    'filename' => $file->getClientOriginalName(),
                    'path' => $filePath,
                ]);

            }
        }

        return redirect()->back()->with('message', 'Performance evidence added successfully.');
    }

    public function updatePerformances(Request $request, string $id)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $request->validate([
            'ipcr_id' => 'required',
            'description' => 'required|string',
        ],[
            'ipcr_id.required' => 'The performance field is required.',
            'description.required' => 'The context field is required.',
            'description.string' => 'The context field must be an acceptable text.',
        ]);

        $performance = $conn3->table('tblemp_ipcr')->where([
            'id' => $request->input('ipcr_id'),
        ])
        ->first();

        $evidence = $conn2->table('staff_competency_indicator_evidence')
            ->where('id', $id)
            ->update([
                'title' => 'IPCR for '.($performance->semester == 1 ? '1st' : '2nd')." Semester ".$performance->year,
                'description' => $request->input('description'),
                'start_date' => $performance->year.'-01-01',
                'end_date' => $performance->year.'-12-31',
            ]);

        $performanceEvidence = $conn2->table('evidence_performance')
            ->where('evidence_id', $id)
            ->update([
                'ipcr_id' => $performance->id,
            ]);

        if($performanceEvidence){
            $conn2->table('evidence_performance')
            ->where('evidence_id', $id)
            ->update([
                'ipcr_id' => $performance->id,
            ]);
        }else{
            $conn2->table('evidence_performance')
            ->insert([
                'evidence_id' => $id,
                'emp_id' => $this->emp_id,
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

        // Handle newly uploaded files
        if ($request->hasFile('files')) {

            foreach ($request->file('files') as $file) {

                $filename = Str::random(20) . '_' . time() . '.' . $file->getClientOriginalExtension();

                $filePath = $file->storeAs('uploads/evidence', $filename, 'public');

                $conn2->table('evidence_files')
                ->insert([
                    'evidence_id' => $id,
                    'filename' => $file->getClientOriginalName(),
                    'path' => $filePath,
                ]);

            }
        }

        return redirect()->back()->with('message', 'Performance evidence updated successfully.'); 
    }

    public function storeOtherEvidences(Request $request, string $id)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $request->validate([
            'title' => 'required|string|max:100',
            'description' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'after_or_equal:start_date',
            'files' => 'required|array|max:5', 
            'files.*' => 'file|mimes:jpeg,png,jpg,pdf|max:5120',
        ], [
            'title.required' => 'The title field is required.',
            'title.string' => 'The title must be a string.',
            'title.max' => 'The title may not be greater than 100 characters.',
            
            'description.required' => 'The context field is required.',
            'description.string' => 'The context must be a valid string.',
            
            'start_date.required' => 'The start date field is required.',
            'start_date.date' => 'The start date must be a valid date.',
            
            'end_date.after_or_equal' => 'The end date must be a date after or equal to the start date.',
            
            'files.required' => 'You must upload at least one file.',
            'files.array' => 'Files must be an array.',
            'files.max' => 'You can upload a maximum of 5 files.',
            'files.*.file' => 'Each uploaded file must be valid.',
            'files.*.mimes' => 'Each file must be a JPEG, JPG, PNG, or PDF.',
            'files.*.max' => 'Each file may not be greater than 5 MB.',
        ]);

        $evidence = $conn2->table('staff_competency_indicator_evidence')
        ->insertGetId([
            'emp_id' => $this->emp_id,
            'indicator_id' => $id,
            'title' => $request->title,
            'description' => $request->description,
            'start_date' => Carbon::parse($request->start_date)->format('Y-m-d'),
            'end_date' => Carbon::parse($request->end_date)->format('Y-m-d'),
            'reference' => 'Others'
        ]);

        if(!$evidence){
            return redirect()->back()->with([
                'error' => 'Failed to add evidence. Please try again.'
            ])->withStatus(500);
        }

        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {

                $filename = Str::random(20) . '_' . time() . '.' . $file->getClientOriginalExtension();

                $filePath = $file->storeAs('uploads/evidence', $filename, 'public');

                $conn2->table('evidence_files')
                ->insert([
                    'evidence_id' => $evidence,
                    'filename' => $file->getClientOriginalName(),
                    'path' => $filePath,
                ]);

            }
        }

        return redirect()->back()->with('message', 'Other evidence saved successfully.');
    }

    public function updateOtherEvidences(Request $request, string $id)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $request->validate([
            'title' => 'required|string|max:100',
            'description' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'after_or_equal:start_date',
        ], [
            'title.required' => 'The title field is required.',
            'title.string' => 'The title must be a string.',
            'title.max' => 'The title may not be greater than 100 characters.',
            
            'description.required' => 'The context field is required.',
            'description.string' => 'The context must be a valid string.',
            
            'start_date.required' => 'The start date field is required.',
            'start_date.date' => 'The start date must be a valid date.',
            
            'end_date.after_or_equal' => 'The end date must be a date after or equal to the start date.',
            
        ]);

        $evidence = $conn2->table('staff_competency_indicator_evidence')
            ->where('id', $id)
            ->update([
                'title' => $request->title,
                'description' => $request->description,
                'start_date' => Carbon::parse($request->start_date)->format('Y-m-d'),
                'end_date' => Carbon::parse($request->end_date)->format('Y-m-d'),
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
    
        // Handle newly uploaded files
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {

                $filename = Str::random(20) . '_' . time() . '.' . $file->getClientOriginalExtension();

                $filePath = $file->storeAs('uploads/evidence', $filename, 'public');

                $conn2->table('evidence_files')
                ->insert([
                    'evidence_id' => $id,
                    'filename' => $file->getClientOriginalName(),
                    'path' => $filePath,
                ]);

            }
        }

        return redirect()->back()->with('message', 'Other evidence updated successfully.');
    }

    public function showEvidence($id)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $evidence = $conn2->table('staff_competency_indicator_evidence')
        ->where('id', $id)
        ->first();

        if(!$evidence){
            return redirect()->back()->with([
                'error' => 'Failed to add evidence. Please try again.'
            ])->withStatus(500);
        }

        $files = $conn2->table('evidence_files')
        ->where('evidence_id', $evidence->id)
        ->get();

        switch ($evidence->reference) {
            case 'Training':

                $query = $conn2->table('evidence_training')
                    ->where('emp_id',$this->emp_id)
                    ->where('evidence_id',$evidence->id)
                    ->first();

                break;
            case 'Award':
                
                $query = $conn2->table('evidence_award')
                    ->where('emp_id',$this->emp_id)
                    ->where('evidence_id',$evidence->id)
                    ->first();

                break;
            case 'Performance':
                
                $query = $conn2->table('evidence_performance')
                    ->where('emp_id',$this->emp_id)
                    ->where('evidence_id',$evidence->id)
                    ->first();

                break;
            case 'Others':
                
                $query = $evidence;
                break;
        }

        return response()->json([
            'evidence' => $query,
            'files' => $files
        ]);
    }

    public function deleteEvidence($id)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $evidence = $conn2->table('staff_competency_indicator_evidence')
        ->where('id', $id)
        ->first();

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
    }
}
