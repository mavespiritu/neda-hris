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


class CompareCgaController extends Controller
{
    public function index()
    {
        return inertia('CompareCga/index');
    }

    public function showComparison(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        if (!$request->has('staffs') && $request->staffs != '') {
            return response()->json([]);
        }

        $staffs = explode(",", $request->staffs);
        $staffs = array_map('trim', $staffs);

        $competencies = $conn2->table('staff_all_competency_history as sach')
        ->select([
            'c.comp_id as id',
            'c.competency',
            'sach.emp_id',
            'sach.percentage'
        ])
        ->leftJoin('competency as c', 'c.comp_id', '=', 'sach.competency_id')
        ->whereIn('sach.emp_id', $staffs)
        ->whereRaw('sach.date_created = (
            SELECT MAX(date_created) 
            FROM staff_all_competency_history 
            WHERE emp_id = sach.emp_id 
              AND competency_id = sach.competency_id
        )')
        ->orderBy('c.comp_id', 'asc')
        ->get();

        return response()->json($competencies);
    }

    public function showComparisonIndicators($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        if (!$request->has('staffs') && $request->staffs != '') {
            return response()->json([]);
        }

        $staffs = explode(",", $request->staffs);
        $staffs = array_map('trim', $staffs);

        $indicators = $conn2->table('competency_indicator as ci')
            ->select([
                'ci.indicator',
                'scih.emp_id',
                'scih.compliance',
                'ci.proficiency'
            ])
            ->leftJoin('staff_all_competency_indicator_history as scih', function($join) use ($staffs) {
                $join->on('ci.id', '=', 'scih.indicator_id')
                    ->whereIn('scih.emp_id', $staffs)
                    ->whereRaw('scih.date_created = (
                        SELECT MAX(date_created) 
                        FROM staff_all_competency_indicator_history 
                        WHERE emp_id = scih.emp_id 
                        AND indicator_id = scih.indicator_id
                    )');
            })
            ->leftJoin('competency as c', 'c.comp_id', '=', 'ci.competency_id')
            ->where('c.comp_id', $id)
            ->orderBy('scih.date_created', 'asc')
            ->orderBy('ci.indicator', 'asc')
            ->get();

        return response()->json($indicators);
    }
}
