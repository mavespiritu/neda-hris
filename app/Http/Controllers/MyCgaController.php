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
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use App\Notifications\CompetenciesForReviewSubmitted;

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

        // Main competencies query with the percentage calculation
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
                            SELECT COUNT(DISTINCT latest_sai.indicator_id)
                            FROM (
                                SELECT indicator_id, MAX(id) as latest_id
                                FROM staff_all_indicator
                                WHERE emp_id = '".$id."'
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
            ->where('pci.position_id', $request->position_id)
            ->groupBy('c.comp_id', 'c.competency', 'c.comp_type', 'pci.position_id')
            ->orderBy('type', 'asc')
            ->orderBy('c.competency', 'asc')
            ->get()
            ->groupBy('type');
           
        // Selections query
        $competencySelections = $conn2->table('position_competency_indicator as pci')
            ->select([
                'c.comp_id as value',
                DB::raw("CONCAT(c.competency, ' (', MAX(ci.proficiency), ') - ', 
                        ROUND(
                            (
                                SELECT COUNT(DISTINCT latest_sai.indicator_id)
                                FROM (
                                    SELECT indicator_id, MAX(id) as latest_id
                                    FROM staff_all_indicator
                                    WHERE emp_id = '".$id."'
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
                        ), '%') AS label"),
                DB::raw('MAX(ci.proficiency) as proficiency'),
            ])
            ->leftJoin('competency_indicator as ci', 'ci.id', '=', 'pci.indicator_id')
            ->leftJoin('competency as c', 'c.comp_id', '=', 'ci.competency_id')
            ->where('pci.position_id', $request->position_id)
            ->groupBy('c.comp_id', 'c.competency', 'c.comp_type', 'pci.position_id')
            ->orderBy('c.competency', 'asc')
            ->get();

        // Alternative 'all' query
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
                                SELECT COUNT(DISTINCT latest_sai.indicator_id)
                                FROM (
                                    SELECT indicator_id, MAX(id) as latest_id
                                    FROM staff_all_indicator
                                    WHERE emp_id = '".$id."'
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
                        ) AS percentage
                    ")
                ])
                ->leftJoin('competency as c', 'c.comp_id', '=', 'ci.competency_id')
                ->groupBy('c.comp_id', 'c.competency', 'c.comp_type')
                ->orderBy('type', 'asc')
                ->orderBy('c.competency', 'asc')
                ->get()
                ->groupBy('type');

            $competencySelections = $conn2->table('competency_indicator as ci')
                ->select([
                    'c.comp_id as value',
                    DB::raw("CONCAT(c.competency, ' (', MAX(ci.proficiency), ') - ', 
                            ROUND(
                                (
                                    SELECT COUNT(DISTINCT latest_sai.indicator_id)
                                    FROM (
                                        SELECT indicator_id, MAX(id) as latest_id
                                        FROM staff_all_indicator
                                        WHERE emp_id = '".$id."'
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
                            ), '%') AS label"),
                    DB::raw('MAX(ci.proficiency) as proficiency'),
                ])
                ->leftJoin('competency as c', 'c.comp_id', '=', 'ci.competency_id')
                ->groupBy('c.comp_id', 'c.competency', 'c.comp_type')
                ->orderBy('c.competency', 'asc')
                ->get();
        }
<<<<<<< HEAD
        
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

=======

        return response()->json([
            'competencies' => $competencies,
            'competencySelections' => $competencySelections,
        ]);
    }

>>>>>>> a2f9eba91172d175281e5608c5b4dc935c15e2b5

    public function showCompetency($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');


        $competency = $conn2->table('competency')
                ->where('comp_id', $request->competency_id)
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
            ->where('pci.position_id', $request->position_id)
            ->where('c.comp_id', $competency->comp_id)
            ->whereIn('pci.indicator_id', $indicatorIDs)
            ->orderBy('ci.proficiency', 'desc')
            ->orderBy('type', 'asc')
            ->orderBy('c.competency', 'asc')
            ->orderBy('ci.indicator', 'asc')
            ->get()
            ->groupBy('proficiency');

        $indicatorSelections = $conn2->table('position_competency_indicator as pci')
            ->select([
                'pci.indicator_id as value',
                DB::raw("concat(ci.indicator,' (Level ',ci.proficiency,')') as label"),
                'ci.proficiency',
            ])
            ->leftJoin('competency_indicator as ci', 'ci.id', '=', 'pci.indicator_id')
            ->leftJoin('competency as c', 'c.comp_id', '=', 'ci.competency_id')
            ->where('pci.position_id', $request->position_id)
            ->where('c.comp_id', $competency->comp_id)
            ->whereIn('pci.indicator_id', $indicatorIDs)
            ->orderBy('ci.proficiency', 'desc')
            ->orderBy('ci.indicator', 'asc')
            ->get();

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
                ->orderBy('ci.indicator', 'asc')
                ->get()
                ->groupBy('proficiency');

            $indicatorSelections = $conn2->table('competency_indicator as ci')
                ->select([
                    'ci.id as value',
                    DB::raw("concat(ci.indicator,' (Level ',ci.proficiency,')') as label"),
                    'ci.proficiency',
                ])
                ->leftJoin('competency as c', 'c.comp_id', '=', 'ci.competency_id')
                ->where('c.comp_id', $competency->comp_id)
                ->where('ci.proficiency', '<=', $request->proficiency)
                ->orderBy('ci.proficiency', 'desc')
                ->orderBy('ci.indicator', 'asc')
                ->get();
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

            $indicatorSelections = $conn2->table('competency_indicator as ci')
                ->select([
                    'ci.id as value',
                    DB::raw("concat(ci.indicator,' (Level ',ci.proficiency,')') as label"),
                    'ci.proficiency',
                ])
                ->leftJoin('competency as c', 'c.comp_id', '=', 'ci.competency_id')
                ->where('c.comp_id', $competency->comp_id)
                ->orderBy('ci.proficiency', 'desc')
                ->orderBy('ci.indicator', 'asc')
                ->get();
        }

        return response()->json([
            'indicators' => $indicators,
            'indicatorSelections' => $indicatorSelections,
        ]);
    }

    public function showCompliances($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        // Get indicator IDs associated with the requested competency
        $indicatorIDs = $conn2->table('competency_indicator')
                    ->where('competency_id', $request->competency_id)
                    ->pluck('id');

        // Query for latest compliance records based on emp_id and indicator_id using a subquery
        $latestCompliances = $conn2->table('staff_all_indicator as sci')
            ->joinSub(
                $conn2->table('staff_all_indicator')
                    ->select('emp_id', 'indicator_id', DB::raw('MAX(id) as latest_id'))
                    ->where('emp_id', $id)
                    ->whereIn('indicator_id', $indicatorIDs)
                    ->groupBy('emp_id', 'indicator_id'),
                'latest',
                function ($join) {
                    $join->on('sci.emp_id', '=', 'latest.emp_id')
                        ->on('sci.indicator_id', '=', 'latest.indicator_id')
                        ->on('sci.id', '=', 'latest.latest_id');
                }
            )
            ->select('sci.id', 'sci.indicator_id', 'sci.compliance')
            ->get();

        // Format the result to match your requirements
        $compliances = $latestCompliances->mapWithKeys(function ($compliance) {
            return [
                $compliance->indicator_id => [
                    'compliance' => $compliance->compliance == 1,
                    'id' => $compliance->id,
                    'indicator_id' => $compliance->indicator_id,
                ],
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
            ->where('eei.emp_id', $id)
            ->whereNull('eei.to_date')
            ->orderBy('eei.from_date', 'desc')
            ->first();

        $allIndicator = $conn2->table('staff_all_indicator')
        ->where('emp_id', $id)
        ->where('indicator_id', $request->indicator_id)
        ->first();

        if(!$allIndicator){
            $newIndicator = $conn2->table('staff_all_indicator')->insert([
                'emp_id' => $id,
                'indicator_id' => $request->indicator_id,
                'compliance' => $request->compliance ? 1 : 0
            ]);
        }

        $competencyIndicator = $conn2->table('staff_competency_indicator')
        ->where('emp_id', $id)
        ->where('position_id', $position->item_no)
        ->where('indicator_id', $request->indicator_id)
        ->first();

        if(!$competencyIndicator){
            $newCompetencyIndicator = $conn2->table('staff_competency_indicator')->insert([
                'emp_id' => $id,
                'position_id' => $position->item_no,
                'indicator_id' => $request->indicator_id,
                'compliance' => $request->compliance ? 1 : 0
            ]);
        }

        $conn2->table('staff_competency_indicator')
            ->where('emp_id', $id)
            ->where('indicator_id', $request->indicator_id)
            ->update([
                'compliance' => $request->compliance ? 1 : 0
            ]);
        
        $conn2->table('staff_all_indicator')
            ->where('emp_id', $id)
            ->where('indicator_id', $request->indicator_id)
            ->update([
                'compliance' => $request->compliance ? 1 : 0
            ]);

        return redirect()->back()->with('message', 'Indicator compliance updated successfully.');
    }
    
    public function showIndicator($id, Request $request)
    {

        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $position = $conn3->table('tblemp_emp_item as eei')
            ->select([
                'epi.*'
            ])
            ->leftJoin('tblemp_position_item as epi', 'eei.item_no', '=', 'epi.item_no')
            ->where('eei.emp_id', $id)
            ->whereNull('eei.to_date')
            ->orderBy('eei.from_date', 'desc')
            ->first();
            

        $staffAllIndicator = $conn2->table('staff_all_indicator')
            ->where('emp_id', $id)
            ->where('indicator_id', $request->indicator_id)
            ->first();

        if(!$staffAllIndicator)
        {
            $conn2->table('staff_all_indicator')->insert([
                'emp_id' => $id,
                'indicator_id' => $request->indicator_id,
                'compliance' => 0
            ]);
        }

        $staffCompetencyIndicator = $conn2->table('staff_competency_indicator')
            ->where('emp_id', $id)
            ->where('position_id', $position->item_no)
            ->where('indicator_id', $request->indicator_id)
            ->first();

        if(!$staffCompetencyIndicator)
        {
            $staffCompetencyIndicator = $conn2->table('staff_competency_indicator')
            ->insert([
                'emp_id' => $id,
                'position_id' => $position->item_no,
                'indicator_id' => $request->indicator_id,
                'compliance' => 0
            ]);
        }
    }

    public function showEvidences($id, Request $request)
    {
        $connection = DB::connection('mysql2');

        $query = $connection->table('staff_competency_indicator_evidence')
            ->where('emp_id', $id)
            ->where('indicator_id', $request->indicator_id);

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function($query) use ($search) {
                $query->where('title', 'LIKE', "%$search%")
                    ->orWhere('description', 'LIKE', "%$search%");
            });
        }

        if ($request->has('references')) {
            
            $references = explode(",", $request->references);
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
            ->where('emp_id', $id)
            ->where('indicator_id', $request->indicator_id);

        $pendingCount = $connection->table('staff_competency_indicator_evidence')
            ->where('emp_id', $id)
            ->where('indicator_id', $request->indicator_id)
            ->whereNull('hr_confirmation')
            ->whereNull('dc_confirmation')
            ->whereNull('disapproved');

        $hrConfirmedCount = $connection->table('staff_competency_indicator_evidence')
            ->where('emp_id', $id)
            ->where('indicator_id', $request->indicator_id)
            ->whereNotNull('hr_confirmation')
            ->whereNull('disapproved');

        $dcConfirmedCount = $connection->table('staff_competency_indicator_evidence')
            ->where('emp_id', $id)
            ->where('indicator_id', $request->indicator_id)
            ->whereNotNull('dc_confirmation')
            ->whereNull('disapproved');

        $disapprovedCount = $connection->table('staff_competency_indicator_evidence')
            ->where('emp_id', $id)
            ->where('indicator_id', $request->indicator_id)
            ->whereNotNull('disapproved')
            ->whereNull('hr_confirmation')
            ->whereNull('dc_confirmation');

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

            $disapprovedCount->where(function($query) use ($search) {
                $query->where('title', 'LIKE', "%$search%")
                    ->orWhere('description', 'LIKE', "%$search%");
            });
        }

        if ($request->has('references')) {

            $references = explode(",", $request->references);
            $references = array_map('trim', $references);
            
            $allCount->whereIn('reference', $references);
            $pendingCount->whereIn('reference', $references);
            $hrConfirmedCount->whereIn('reference', $references);
            $dcConfirmedCount->whereIn('reference', $references);
            $disapprovedCount->whereIn('reference', $references);
            
        }

        $allCount = $allCount->count();
        $pendingCount = $pendingCount->count();
        $hrConfirmedCount = $hrConfirmedCount->count();
        $dcConfirmedCount = $dcConfirmedCount->count();
        $disapprovedCount = $disapprovedCount->count();

        return response()->json([
            'all' => $allCount,
            'pending' => $pendingCount,
            'hrConfirmed' => $hrConfirmedCount,
            'dcConfirmed' => $dcConfirmedCount,
            'disapproved' => $disapprovedCount,
        ]);
    }

    public function showTrainings($id)
    {
        $connection = DB::connection('mysql3');

        $trainings = $connection->table('tblemp_training_program')
            ->select([
                DB::raw('concat(seminar_title,"__",from_date) as value'),
                DB::raw('IF(from_date <> to_date, concat(seminar_title," (",from_date," to ",to_date,")"), concat(seminar_title," (",from_date,")")) as label'),
            ])
            ->where('emp_id', $id)
            ->where('approval', 'yes')
            ->orderBy('seminar_title', 'asc')
            ->get();

        return response()->json($trainings);   
    }

    public function showAwards($id)
    {
        $connection = DB::connection('mysql3');

        $awards = $connection->table('tblemp_other_info')
            ->select([
                'description as value',
                'description as label',
            ])
            ->where('emp_id', $id)
            ->where('type', 'recognition')
            ->where('approval', 'yes')
            ->orderBy('description', 'asc')
            ->get();

        return response()->json($awards);    
    }

    public function showPerformances($id)
    {
        $connection = DB::connection('mysql3');

        $performances = $connection->table('tblemp_ipcr')
            ->select([
                'id as value',
                DB::raw('concat("IPCR for ", IF(semester = 1, "1st", "2nd") ," Semester ", year) as label'),
            ])
            ->where('emp_id', $id)
            ->whereNotNull('verified_by')
            ->orderBy('year', 'desc')
            ->orderBy('semester', 'desc')
            ->get();

        return response()->json($performances);   

    }

    public function showCareers($id)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $careers = $conn2->table('career_path')
            ->where('emp_id', $id)
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

    public function showDesignations($id)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $designations = $conn2->table('career_path')
            ->where('emp_id', $id)
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

    public function showCareerPositions($id)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $paths = $conn2->table('career_path')
            ->where('emp_id', $id)
            ->pluck('position_id'); 

        $currentPosition = $conn3->table('tblemp_emp_item as eei')
            ->select([
                'epi.*'
            ])
            ->leftJoin('tblemp_position_item as epi', 'eei.item_no', '=', 'epi.item_no')
            ->where('eei.emp_id', $id)
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

    public function deleteCareerPath($id, Request $request)
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

        return redirect()->back()->with('message', 'Career path deleted successfully.');
    }

    public function storeTrainings(Request $request, string $id)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $request->validate([
            'training_id' => 'required',
            'description' => 'required|string',
            'newFiles.*' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
        ],[
            'training_id.required' => 'The training field is required.',

            'description.required' => 'The context field is required.',
            'description.string' => 'The context field must be an acceptable text.',

            'newFiles.array' => 'Files must be an array.',
            'newFiles.max' => 'You can upload a maximum of 5 files.',
            'newFiles.*.file' => 'Each uploaded file must be valid.',
            'newFiles.*.mimes' => 'Each file must be a JPEG, JPG, PNG, or PDF.',
            'newFiles.*.max' => 'Each file may not be greater than 5 MB.',
        ]);

        $trainingID = explode('__', $request->input('training_id'));

        $training = $conn3->table('tblemp_training_program')->where([
            'emp_id' => $id,
            'seminar_title' => $trainingID[0],
            'from_date' => $trainingID[1],
            'approval' => 'yes'
        ])
        ->first();

        $evidence = $conn2->table('staff_competency_indicator_evidence')
            ->insertGetId([
                'emp_id' => $id,
                'indicator_id' => $request->indicator_id,
                'title' => 'Attendance to '.$training->seminar_title,
                'description' => $request->input('description'),
                'start_date' => $training->from_date,
                'end_date' => $training->to_date,
                'reference' => 'Training',
            ]);

        $trainingEvidence = $conn2->table('evidence_training')
            ->insert([
                'evidence_id' => $evidence,
                'emp_id' => $id,
                'seminar_title' => $training->seminar_title,
                'from_date' => $training->from_date,
            ]);

        if ($request->hasFile('newFiles')) {
            foreach ($request->file('newFiles') as $file) {

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
            'newFiles.*' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
        ],[
            'training_id.required' => 'The training field is required.',

            'description.required' => 'The context field is required.',
            'description.string' => 'The context field must be an acceptable text.',

            'newFiles.array' => 'Files must be an array.',
            'newFiles.max' => 'You can upload a maximum of 5 files.',
            'newFiles.*.file' => 'Each uploaded file must be valid.',
            'newFiles.*.mimes' => 'Each file must be a JPEG, JPG, PNG, or PDF.',
            'newFiles.*.max' => 'Each file may not be greater than 5 MB.',
        ]);

        $selectedEvidence = $conn2->table('staff_competency_indicator_evidence')
            ->where('id', $id)
            ->first();

        $trainingID = explode('__', $request->input('training_id'));

        $training = $conn3->table('tblemp_training_program')->where([
            'emp_id' => $selectedEvidence->emp_id,
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
                'emp_id' => $selectedEvidence->emp_id,
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
        if ($request->hasFile('newFiles')) {

            foreach ($request->file('newFiles') as $file) {

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
            'newFiles.*' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
        ],[
            'award_id.required' => 'The award field is required.',

            'description.required' => 'The context field is required.',
            'description.string' => 'The context field must be an acceptable text.',

            'newFiles.array' => 'Files must be an array.',
            'newFiles.max' => 'You can upload a maximum of 5 files.',
            'newFiles.*.file' => 'Each uploaded file must be valid.',
            'newFiles.*.mimes' => 'Each file must be a JPEG, JPG, PNG, or PDF.',
            'newFiles.*.max' => 'Each file may not be greater than 5 MB.',
        ]);

        $award = $conn3->table('tblemp_other_info')->where([
            'emp_id' => $id,
            'type' => 'recognition',
            'description' => $request->input('award_id'),
            'approval' => 'yes'
        ])
        ->first();

        $evidence = $conn2->table('staff_competency_indicator_evidence')
            ->insertGetId([
                'emp_id' => $id,
                'indicator_id' => $request->indicator_id,
                'title' => 'Awarded with '.$award->description,
                'description' => $request->input('description'),
                'start_date' => $award->year.'-01-01',
                'end_date' => $award->year.'-12-31',
                'reference' => 'Award',
            ]);

        $awardEvidence = $conn2->table('evidence_award')
            ->insert([
                'evidence_id' => $evidence,
                'emp_id' => $id,
                'type' => 'recognition',
                'description' => $award->description,
            ]);

        if ($request->hasFile('newFiles')) {
            foreach ($request->file('newFiles') as $file) {

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
            'newFiles.*' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
        ],[
            'award_id.required' => 'The award field is required.',
            'description.required' => 'The context field is required.',
            'description.string' => 'The context field must be an acceptable text.',

            'newFiles.array' => 'Files must be an array.',
            'newFiles.max' => 'You can upload a maximum of 5 files.',
            'newFiles.*.file' => 'Each uploaded file must be valid.',
            'newFiles.*.mimes' => 'Each file must be a JPEG, JPG, PNG, or PDF.',
            'newFiles.*.max' => 'Each file may not be greater than 5 MB.',
        ]);

        
        $selectedEvidence = $conn2->table('staff_competency_indicator_evidence')
            ->where('id', $id)
            ->first();

        $award = $conn3->table('tblemp_other_info')->where([
            'emp_id' => $selectedEvidence->emp_id,
            'type' => 'recognition',
            'description' => $request->input('award_id'),
            'approval' => 'yes'
        ])
        ->first();

        $evidence = $conn2->table('staff_competency_indicator_evidence')
            ->where('id', $id)
            ->update([
                'title' => 'Awarded with '.$award->description,
                'description' => $request->input('description'),
                'start_date' => $award->year.'-01-01',
                'end_date' => $award->year.'-12-31',
            ]);

        $awardEvidence = $conn2->table('evidence_award')
            ->where('evidence_id', $id)
            ->first();

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
                'emp_id' => $selectedEvidence->emp_id,
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
        if ($request->hasFile('newFiles')) {

            foreach ($request->file('newFiles') as $file) {

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
            'newFiles.*' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
        ],[
            'ipcr_id.required' => 'The performance field is required.',

            'description.required' => 'The context field is required.',
            'description.string' => 'The context field must be an acceptable text.',

            'newFiles.array' => 'Files must be an array.',
            'newFiles.max' => 'You can upload a maximum of 5 files.',
            'newFiles.*.file' => 'Each uploaded file must be valid.',
            'newFiles.*.mimes' => 'Each file must be a JPEG, JPG, PNG, or PDF.',
            'newFiles.*.max' => 'Each file may not be greater than 5 MB.',
        ]);

        $performance = $conn3->table('tblemp_ipcr')->where([
            'id' => $request->input('ipcr_id'),
        ])
        ->first();

        $evidence = $conn2->table('staff_competency_indicator_evidence')
            ->insertGetId([
                'emp_id' => $id,
                'indicator_id' => $request->indicator_id,
                'title' => 'IPCR for '.($performance->semester == 1 ? '1st' : '2nd')." Semester ".$performance->year,
                'description' => $request->input('description'),
                'start_date' => $performance->year.'-01-01',
                'end_date' => $performance->year.'-12-31',
                'reference' => 'Performance',
            ]);

        $performanceEvidence = $conn2->table('evidence_performance')
            ->insert([
                'evidence_id' => $evidence,
                'emp_id' => $id,
                'ipcr_id' => $performance->id,
            ]);

        if ($request->hasFile('newFiles')) {
            foreach ($request->file('newFiles') as $file) {

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
            'newFiles.*' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
        ],[
            'ipcr_id.required' => 'The performance field is required.',

            'description.required' => 'The context field is required.',
            'description.string' => 'The context field must be an acceptable text.',

            'newFiles.array' => 'Files must be an array.',
            'newFiles.max' => 'You can upload a maximum of 5 files.',
            'newFiles.*.file' => 'Each uploaded file must be valid.',
            'newFiles.*.mimes' => 'Each file must be a JPEG, JPG, PNG, or PDF.',
            'newFiles.*.max' => 'Each file may not be greater than 5 MB.',
        ]);

        $selectedEvidence = $conn2->table('staff_competency_indicator_evidence')
            ->where('id', $id)
            ->first();

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
            ->first();

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
                'emp_id' => $selectedEvidence->emp_id,
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
        if ($request->hasFile('newFiles')) {

            foreach ($request->file('newFiles') as $file) {

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
            'newFiles.*' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
        ], [
            'title.required' => 'The title field is required.',
            'title.string' => 'The title must be a string.',
            'title.max' => 'The title may not be greater than 100 characters.',
            
            'description.required' => 'The context field is required.',
            'description.string' => 'The context must be a valid string.',
            
            'start_date.required' => 'The start date field is required.',
            'start_date.date' => 'The start date must be a valid date.',
            
            'end_date.after_or_equal' => 'The end date must be a date after or equal to the start date.',
            
            'newFiles.array' => 'Files must be an array.',
            'newFiles.max' => 'You can upload a maximum of 5 files.',
            'newFiles.*.file' => 'Each uploaded file must be valid.',
            'newFiles.*.mimes' => 'Each file must be a JPEG, JPG, PNG, or PDF.',
            'newFiles.*.max' => 'Each file may not be greater than 5 MB.',
        ]);

        $evidence = $conn2->table('staff_competency_indicator_evidence')
        ->insertGetId([
            'emp_id' => $id,
            'indicator_id' => $request->indicator_id,
            'title' => $request->title,
            'description' => $request->description,
            'start_date' => Carbon::parse($request->start_date)->format('Y-m-d'),
            'end_date' => Carbon::parse($request->end_date)->format('Y-m-d'),
            'reference' => 'Others'
        ]);

        if ($request->hasFile('newFiles')) {
            foreach ($request->file('newFiles') as $file) {

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
            'newFiles.*' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
        ], [
            'title.required' => 'The title field is required.',
            'title.string' => 'The title must be a string.',
            'title.max' => 'The title may not be greater than 100 characters.',
            
            'description.required' => 'The context field is required.',
            'description.string' => 'The context must be a valid string.',
            
            'start_date.required' => 'The start date field is required.',
            'start_date.date' => 'The start date must be a valid date.',
            
            'end_date.after_or_equal' => 'The end date must be a date after or equal to the start date.',

            'newFiles.array' => 'Files must be an array.',
            'newFiles.max' => 'You can upload a maximum of 5 files.',
            'newFiles.*.file' => 'Each uploaded file must be valid.',
            'newFiles.*.mimes' => 'Each file must be a JPEG, JPG, PNG, or PDF.',
            'newFiles.*.max' => 'Each file may not be greater than 5 MB.',
            
        ]);

        $selectedEvidence = $conn2->table('staff_competency_indicator_evidence')
            ->where('id', $id)
            ->first();

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
        if ($request->hasFile('newFiles')) {
            foreach ($request->file('newFiles') as $file) {

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

    public function showEvidence($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $evidence = $conn2->table('staff_competency_indicator_evidence')
        ->where('id', $request->evidence_id)
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
                    ->where('emp_id', $id)
                    ->where('evidence_id',$evidence->id)
                    ->first();

                break;
            case 'Award':
                
                $query = $conn2->table('evidence_award')
                    ->where('emp_id', $id)
                    ->where('evidence_id',$evidence->id)
                    ->first();

                break;
            case 'Performance':
                
                $query = $conn2->table('evidence_performance')
                    ->where('emp_id', $id)
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

    public function showHistories($id)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $position = $conn3->table('tblemp_emp_item as eei')
            ->select([
                'epi.*'
            ])
            ->leftJoin('tblemp_position_item as epi', 'eei.item_no', '=', 'epi.item_no')
            ->where('eei.emp_id', $id)
            ->whereNull('eei.to_date')
            ->orderBy('eei.from_date', 'desc')
            ->first();

        $histories = $conn2->table('staff_competency_review as scr')
        ->select(
            DB::raw("DATE_FORMAT(date_created, '%M %d, %Y %h:%i:%s %p') as dateCreated"),
            'scr.*',
        )
        ->where('emp_id', $id)
        ->where('position_id', $position->item_no)
        ->distinct()
        ->orderBy('date_created', 'desc')
        ->paginate(20);

        return response()->json($histories);
    }

    public function showProposedTrainings($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $trainings = $conn2->table('staff_competency_training as sct')
        ->select(
            'sct.*',
            'competency.competency',
            DB::raw("IF(sct.training_id IS NULL, sct.training_title, training.training_title) as title"),
            'scr.date_created'
        )
        ->leftJoin('competency', 'competency.comp_id', '=', 'sct.competency_id')
        ->leftJoin('training', 'training.id', '=', 'sct.training_id')
        ->leftJoin('staff_training_review as str', 'str.training_id', '=', 'sct.id')
        ->leftJoin('staff_competency_review as scr', 'scr.id', '=', 'str.review_id')
        ->where('sct.emp_id', $id)
        ->orderBy('sct.id', 'desc');

        if($request->has('review_id')){
            $trainings->where('str.review_id', $request->review_id);
        }

        $trainings = $trainings->paginate(20);

        return response()->json($trainings);
    }

    public function addProposedTraining(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try{
            $conn2->table('staff_competency_training')->insert([
                'emp_id' => $request->emp_id,
                'position_id' => $request->position_id,
                'competency_id' => $request->competency_id,
                'training_id' => $request->training_id,
                'training_title' => $request->training_title
            ]);

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Proposed training added successfully!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to submit competency: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while adding proposed training. Please try again.'
            ]);
        }    
    }

    public function editProposedTraining($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try{
            $conn2->table('staff_competency_training')
            ->where('id', $id)
            ->update([
                'competency_id' => $request->competency_id,
                'training_id' => $request->training_id,
                'training_title' => $request->training_title
            ]);

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Proposed training updated successfully!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to submit competency: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating proposed training. Please try again.'
            ]);
        }    
    }

    public function deleteProposedTraining($id, Request $request)
    {

        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try{
            $conn2->table('staff_competency_training')
            ->where('id', $id)
            ->delete();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Proposed training deleted successfully!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to submit competency: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting proposed training. Please try again.'
            ]);
        }    
    }

    public function storeHistories(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try{
            $position = $conn3->table('tblemp_emp_item as eei')
            ->select([
                'epi.*'
            ])
            ->leftJoin('tblemp_position_item as epi', 'eei.item_no', '=', 'epi.item_no')
            ->where('eei.emp_id', $request->emp_id)
            ->whereNull('eei.to_date')
            ->orderBy('eei.from_date', 'desc')
            ->first();

            $allCompetencies = $conn2->table('competency_indicator as ci')
                ->select([
                    'c.comp_id as id',
                    DB::raw("
                        ROUND(
                            (
                                SELECT COUNT(DISTINCT latest_sai.indicator_id)
                                FROM (
                                    SELECT indicator_id, MAX(id) as latest_id
                                    FROM staff_all_indicator
                                    WHERE emp_id = '".$request->emp_id."'
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
                        ) AS percentage
                    "),
                ])
                ->leftJoin('competency as c', 'c.comp_id', '=', 'ci.competency_id')
                ->groupBy('c.comp_id', 'c.competency', 'c.comp_type')
                ->get();

            $competencies = $conn2->table('position_competency_indicator as pci')
                ->select([
                    'c.comp_id as id',
                    DB::raw("
                        ROUND(
                            (
                                SELECT COUNT(DISTINCT latest_sai.indicator_id)
                                FROM (
                                    SELECT indicator_id, MAX(id) as latest_id
                                    FROM staff_all_indicator
                                    WHERE emp_id = '".$request->emp_id."'
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
                    "),
                    DB::raw('MAX(ci.proficiency) as proficiency'),
                ])
                ->leftJoin('competency_indicator as ci', 'ci.id', '=', 'pci.indicator_id')
                ->leftJoin('competency as c', 'c.comp_id', '=', 'ci.competency_id')
                ->where('pci.position_id', $position->item_no)
                ->groupBy('c.comp_id', 'c.competency', 'c.comp_type', 'pci.position_id')
                ->get();
            
            $positionIndicatorIDs = $conn2->table('position_competency_indicator')
                ->where('position_id', $position->item_no)
                ->get()
                ->pluck('indicator_id');

            $allIndicatorIDs = $conn2->table('competency_indicator')
                ->get()
                ->pluck('id');

            $allIndicators = $conn2->table('staff_all_indicator as sai')
                ->join(
                    DB::raw("(SELECT MAX(id) as latest_id FROM staff_all_indicator WHERE emp_id = '".$request->emp_id."' GROUP BY indicator_id) as latest"),
                    'sai.id', '=', 'latest.latest_id'
                )
                ->where('sai.emp_id', $request->emp_id)
                ->whereIn('sai.indicator_id', $allIndicatorIDs)
                ->get();

            $indicators = $conn2->table('staff_all_indicator as sai')
                ->join(
                    DB::raw("(SELECT MAX(id) as latest_id FROM staff_all_indicator WHERE emp_id = '".$request->emp_id."' GROUP BY indicator_id) as latest"),
                    'sai.id', '=', 'latest.latest_id'
                )
                ->where('sai.emp_id', $request->emp_id)
                ->whereIn('sai.indicator_id', $positionIndicatorIDs)
                ->get();

            $dateCreated = Carbon::now()->format('Y-m-d H:i:s');
            $createdBy = Auth::user()->ipms_id;

            $reviewId = $conn2->table('staff_competency_review')->insertGetId([
                'date_created' => $dateCreated,
                'emp_id' => $request->emp_id,
                'position_id' => $position->item_no
            ]);

            $unsavedTrainings = $conn2->table('staff_competency_training as sct')
            ->select([
                'sct.id as id',
            ])
            ->leftJoin('competency', 'competency.comp_id', '=', 'sct.competency_id')
            ->leftJoin('training', 'training.id', '=', 'sct.training_id')
            ->leftJoin('staff_training_review as str', 'str.training_id', '=', 'sct.id')
            ->leftJoin('staff_competency_review as scr', 'scr.id', '=', 'str.review_id')
            ->where('sct.emp_id', $request->emp_id)
            ->where('sct.position_id', $position->item_no)
            ->whereNull('scr.id')
            ->get()
            ->pluck('id');

            if ($unsavedTrainings) {
                $insertData = $unsavedTrainings->map(fn($id) => ['training_id' => $id, 'review_id' => $reviewId])->toArray();
            
                $conn2->table('staff_training_review')->insert($insertData);
            }

            $allCompetencyHistoryData = [];
            foreach ($allCompetencies as $competency) {
                $allCompetencyHistoryData[] = [
                    'emp_id' => $request->emp_id,
                    'competency_id' => $competency->id,
                    'percentage' => $competency->percentage,
                    'created_by' => $createdBy,
                    'date_created' => $dateCreated
                ];
            }

            $competencyHistoryData = [];
            foreach ($competencies as $competency) {
                $competencyHistoryData[] = [
                    'emp_id' => $request->emp_id,
                    'position_id' => $position->item_no,
                    'competency_id' => $competency->id,
                    'percentage' => $competency->percentage,
                    'proficiency' => $competency->proficiency,
                    'created_by' => $createdBy,
                    'date_created' => $dateCreated
                ];
            }

            $allIndicatorHistoryData = [];
            foreach ($allIndicators as $indicator) {
                $allIndicatorHistoryData[] = [
                    'emp_id' => $request->emp_id,
                    'indicator_id' => $indicator->indicator_id,
                    'compliance' => $indicator->compliance,
                    'created_by' => $createdBy,
                    'date_created' => $dateCreated
                ];
            }

            $indicatorHistoryData = [];
            foreach ($indicators as $indicator) {
                $indicatorHistoryData[] = [
                    'emp_id' => $request->emp_id,
                    'position_id' => $position->item_no,
                    'indicator_id' => $indicator->indicator_id,
                    'compliance' => $indicator->compliance,
                    'created_by' => $createdBy,
                    'date_created' => $dateCreated
                ];
            }

            if (!empty($allCompetencyHistoryData)) {
                $conn2->table('staff_all_competency_history')->insert($allCompetencyHistoryData);
            }

            if (!empty($competencyHistoryData)) {
                $conn2->table('staff_competency_history')->insert($competencyHistoryData);
            }

            if (!empty($allIndicatorHistoryData)) {
                $conn2->table('staff_all_competency_indicator_history')->insert($allIndicatorHistoryData);
            }

            if (!empty($indicatorHistoryData)) {
                $conn2->table('staff_competency_indicator_history')->insert($indicatorHistoryData);
            }

            /* $staff = $conn3->table('tblemployee')
                ->where('emp_id', $request->emp_id)
                ->first();

            $supervisors = User::role('HRIS_DC')->where('division', $staff->division_id)->get();

            $payload = [
                'emp_id' => $staff->emp_id
            ];

            if($supervisors){
                Notification::sendNow($supervisors, new CompetenciesForReviewSubmitted($payload));
            } */

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Competency submitted successfully!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to submit competency: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while approving the competency. Please try again.'
            ]);
        }    
    }

    public function deleteHistory($id)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try{

            $history = $conn2->table('staff_competency_review')
            ->where('id', $id)
            ->first();

            if($history){
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
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Submission deleted successfully!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to submit competency: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting submission. Please try again.'
            ]);
        }    

        return redirect()->back()->with('message', 'Evidence deleted successfully.');
    }

    public function showHistorySummary($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $position = $conn3->table('tblemp_emp_item as eei')
            ->select([
                'epi.*'
            ])
            ->leftJoin('tblemp_position_item as epi', 'eei.item_no', '=', 'epi.item_no')
            ->where('eei.emp_id', $id)
            ->whereNull('eei.to_date')
            ->orderBy('eei.from_date', 'desc')
            ->first();

        $dates = $conn2->table('staff_competency_review')
        ->select('date_created')
        ->where('emp_id', $id)
        ->orderBy('date_created', 'desc')
        ->limit(3)
        ->get()
        ->pluck('date_created');

        $competencies = $conn2->table('staff_competency_history as sch')
        ->select([
            'c.comp_id as id',
            'c.competency',
            'sch.proficiency',
            DB::raw("DATE_FORMAT(sch.date_created, '%M %d, %Y %h:%i:%s %p') as dateCreated"),
            'sch.percentage',
            'sch.date_created as raw_date_created'  // Keep the raw date for filtering
        ])
        ->leftJoin('competency as c', 'c.comp_id', '=', 'sch.competency_id')
        ->where('sch.emp_id', $id)
        ->whereIn('sch.date_created', $dates) // Filter by raw date_created values
        ->orderBy('c.comp_id', 'asc')
        ->orderBy('sch.date_created', 'desc')
        ->get();

        return response()->json($competencies);
    }

    public function showHistoryIndicators($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $position = $conn3->table('tblemp_emp_item as eei')
            ->select([
                'epi.*'
            ])
            ->leftJoin('tblemp_position_item as epi', 'eei.item_no', '=', 'epi.item_no')
            ->where('eei.emp_id', $id)
            ->whereNull('eei.to_date')
            ->orderBy('eei.from_date', 'desc')
            ->first();

        $indicators = $conn2->table('staff_competency_indicator_history as scih')
        ->select([
            'ci.indicator',
            'scih.compliance',
            'ci.proficiency',
            DB::raw("DATE_FORMAT(scih.date_created, '%M %d, %Y %h:%i:%s %p') as dateCreated"),
        ])
        ->leftJoin('competency_indicator as ci', 'ci.id', '=', 'scih.indicator_id')
        ->leftJoin('competency as c', 'c.comp_id', '=', 'ci.competency_id')
        ->where('c.comp_id', $request->competency_id)
        ->where('ci.proficiency', '<=', $request->proficiency)
        ->where('scih.emp_id', $id)
        ->where('scih.position_id', $position->item_no)
        ->orderBy('scih.date_created', 'asc')
        ->orderBy('ci.indicator', 'asc')
        ->get();

        return response()->json($indicators);
    }


}