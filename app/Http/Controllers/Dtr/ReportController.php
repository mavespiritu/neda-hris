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
        $conn3 = DB::connection('mysql3');
        $date = $request->date ? Carbon::parse($request->date)->format('Y-m-d') : Carbon::today()->format('Y-m-d');

        $timeRecords = $conn3->table('tblemployee as e')
            ->select(
                'e.division_id as division',
                DB::raw("CONCAT(e.lname, ', ', e.fname, ' ', IF(e.mname IS NOT NULL AND e.mname != '', CONCAT(LEFT(e.mname, 1), '.'), '')) as name"),
                DB::raw('TIME(am.time_in) as am_time_in'),
                DB::raw('TIME(am.time_out) as am_time_out'),
                DB::raw('TIME(pm.time_in) as pm_time_in'),
                DB::raw('TIME(pm.time_out) as pm_time_out'),
                DB::raw("
                    SEC_TO_TIME(
                        GREATEST(
                            0,
                            TIMESTAMPDIFF(
                                SECOND,
                                am.time_in,
                                CASE WHEN TIME(am.time_out) > '12:00:00' THEN CONCAT(DATE(am.time_out),' 12:00:00') ELSE am.time_out END
                            )
                            +
                            TIMESTAMPDIFF(
                                SECOND,
                                CASE WHEN TIME(pm.time_in) < '13:00:00' THEN CONCAT(DATE(pm.time_in),' 13:00:00') ELSE pm.time_in END,
                                pm.time_out
                            )
                        )
                    ) AS total_hours
                ")
            )
            ->leftJoinSub(function($query) use ($date) {
                $query->from('tblactual_dtr')
                    ->select(
                        'emp_id', 
                        'time_in', 
                        'time_out'
                    )
                    ->where('time', 'AM')
                    ->whereDate('date', $date);
            }, 'am', function($join){
                $join->on('am.emp_id', '=', 'e.emp_id');
            })
            ->leftJoinSub(function($query) use ($date) {
                $query->from('tblactual_dtr')
                    ->select(
                        'emp_id', 
                        'time_in', 
                        'time_out'
                    )
                    ->where('time', 'PM')
                    ->whereDate('date', $date);
            }, 'pm', function($join){
                $join->on('pm.emp_id', '=', 'e.emp_id');
            })
            ->where('e.work_status', 'active')
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

    public function exportTimeRecords(Request $request)
    {
        $date = $request->date ?? null;

        return Excel::download(new TimeRecordsExport($date), 'flexiplace_time_records.xlsx');
    }
}
