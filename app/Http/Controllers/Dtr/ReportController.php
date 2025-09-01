<?php

namespace App\Http\Controllers\Dtr;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use App\Exports\TimeRecordsExport;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Dtr/Report/index');
    }

    public function timeRecords(Request $request)
    {
        $conn2 = DB::connection('mysql2'); 
        $conn3 = DB::connection('mysql3');

        $date = $request->date ? Carbon::parse($request->date)->format('Y-m-d') : Carbon::today()->format('Y-m-d');

        $fullName = DB::raw("
            CONCAT(
                e.lname, ', ',
                e.fname, ' ',
                IF(e.mname IS NOT NULL AND e.mname != '', CONCAT(LEFT(e.mname, 1), '.'), '')
            ) AS name
        ");

        $timeRecords = $conn3->table('tblactual_dtr as d')
        ->select(
            'e.division_id as division',
            $fullName,
            DB::raw("MAX(CASE WHEN d.time = 'AM' THEN TIME(d.time_in) END) as am_time_in"),
            DB::raw("MAX(CASE WHEN d.time = 'AM' THEN TIME(d.time_out) END) as am_time_out"),
            DB::raw("MAX(CASE WHEN d.time = 'PM' THEN TIME(d.time_in) END) as pm_time_in"),
            DB::raw("MAX(CASE WHEN d.time = 'PM' THEN TIME(d.time_out) END) as pm_time_out"),
            DB::raw("
                (
                    SUM(
                        GREATEST(
                            0,
                            TIMESTAMPDIFF(
                                SECOND,
                                d.time_in,
                                d.time_out
                            )
                        )
                    )
                    - 3600
                ) / 3600 as total_hours
            ")
        )
        ->leftJoin('tblemployee as e', 'e.emp_id', '=', 'd.emp_id')
        ->join('tblemp_dtr_type as dt', function ($join) {
            $join->on('dt.emp_id', '=', 'd.emp_id')
                 ->on('dt.date', '=', 'd.date');
        })
        ->where('dt.dtr_id', 'FLEXIPLACE')
        ->whereDate('d.date', $date)
        ->groupBy('d.emp_id', 'd.date')
        ->orderBy('e.division_id')
        ->orderBy('e.lname')
        ->orderBy('e.fname')
        ->orderBy('e.mname')
        ->get();

        return response()->json([
            'data' => [
                'timeRecords' => $timeRecords
            ]
        ]);
    }

    /* public function timeRecords(Request $request)
    {
        $conn2 = DB::connection('mysql2'); 
        $conn3 = DB::connection('mysql3');

        $date = $request->date ? Carbon::parse($request->date)->format('Y-m-d') : Carbon::today()->format('Y-m-d');

        $fullName = DB::raw("
            CONCAT(
                e.lname, ', ',
                e.fname, ' ',
                IF(e.mname IS NOT NULL AND e.mname != '', CONCAT(LEFT(e.mname, 1), '.'), '')
            ) AS name
        ");

        $timeRecords = $conn3->table('tblemp_dtr_type as d')
        ->select(
            'e.division_id as division',
            $fullName,
            'd.am_in',
            'd.am_out',
            'd.pm_in',
            'd.pm_out',
            'total_with_pass_slip as total_hours'
        )
        ->leftJoin('tblemployee as e', 'e.emp_id', '=', 'd.emp_id')
        ->whereDate('d.date', $date)
        ->orderBy('e.division_id')
        ->orderBy('e.lname')
        ->orderBy('e.fname')
        ->orderBy('e.mname')
        ->get();

        return response()->json([
            'data' => [
                'timeRecords' => $timeRecords
            ]
        ]);
    } */

    public function exportTimeRecords(Request $request)
    {
        $date = $request->date ?? null;

        return Excel::download(new TimeRecordsExport($date), 'flexiplace_time_records.xlsx');
    }
}
