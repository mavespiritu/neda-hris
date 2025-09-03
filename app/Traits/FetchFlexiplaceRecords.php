<?php

namespace App\Traits;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

trait FetchFlexiplaceRecords
{
    public function fetchFlexiplaceRecords($date)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $date = $date ? Carbon::parse($date)->format('Y-m-d') : Carbon::today()->format('Y-m-d');

        $rtoSubmissions = $conn2->table('flexi_rto as frt')
            ->join('submission_history as sh', function ($j) {
                $j->on('sh.model_id', '=', 'frt.id')
                  ->where('sh.model', '=', 'RTO');
            })
            ->whereDate('frt.date', '=', $date)
            ->whereIn('sh.status', ['Submitted', 'Approved'])
            ->select('frt.emp_id', 'sh.status', 'sh.date_acted')
            ->orderByDesc('sh.id')
            ->get()
            ->groupBy('emp_id')
            ->map(function ($rows) {
                $submitted = $rows->firstWhere('status', 'Submitted');
                $approved = $rows->firstWhere('status', 'Approved');

                return [
                    'rto_date_submitted' => $submitted->date_acted ?? null,
                    'rto_date_approved'  => $approved->date_acted ?? null,
                ];
            });

        $raaSubmissions = $conn2->table('flexi_raa as fr')
            ->join('flexi_rto as frt', 'fr.rto_id', '=', 'frt.id')
            ->join('submission_history as sh', function ($j) {
                $j->on('sh.model_id', '=', 'fr.id')
                ->where('sh.model', '=', 'RAA');
            })
            ->whereDate('frt.date', '=', $date) 
            ->select('frt.emp_id', 'sh.status', 'sh.date_acted')
            ->orderByDesc('sh.id')
            ->get()
            ->groupBy('emp_id')
            ->map(function ($rows) {
                $submitted = $rows->firstWhere('status', 'Submitted');
                $approved  = $rows->firstWhere('status', 'Approved');

                return [
                    'raa_date_submitted' => $submitted->date_acted ?? null,
                    'raa_date_approved'  => $approved->date_acted ?? null,
                ];
            });

        $records = $conn3->table('tblemployee as e')
            ->select(
                'e.emp_id',
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
            ->leftJoinSub(function ($query) use ($date) {
                $query->from('tblactual_dtr')
                    ->select('emp_id', 'time_in', 'time_out')
                    ->where('time', 'AM')
                    ->whereDate('date', $date);
            }, 'am', function ($join) {
                $join->on('am.emp_id', '=', 'e.emp_id');
            })
            ->leftJoinSub(function ($query) use ($date) {
                $query->from('tblactual_dtr')
                    ->select('emp_id', 'time_in', 'time_out')
                    ->where('time', 'PM')
                    ->whereDate('date', $date);
            }, 'pm', function ($join) {
                $join->on('pm.emp_id', '=', 'e.emp_id');
            })
            ->leftJoin('tblemp_dtr_type as dtr_type', function ($join) use ($date) {
                $join->on('dtr_type.emp_id', '=', 'e.emp_id')
                    ->whereDate('dtr_type.date', '=', $date)
                    ->whereIn('dtr_type.dtr_id', ['FWA', 'FLEXIPLACE']);
            })
            ->whereNotNull('dtr_type.dtr_id')
            ->orderBy('e.division_id')
            ->orderBy('e.lname')
            ->orderBy('e.fname')
            ->orderBy('e.mname')
            ->get();
        
        $records = $records->map(function ($record) use ($raaSubmissions, $rtoSubmissions) {
            $rto = $rtoSubmissions->get($record->emp_id, [
                'rto_date_submitted' => null,
                'rto_date_approved'  => null,
            ]);

            $raa = $raaSubmissions->get($record->emp_id, [
                'raa_date_submitted' => null,
                'raa_date_approved'  => null,
            ]);
            
            $totalSeconds = 0;
            if ($record->total_hours) {
                $parts = explode(':', $record->total_hours);
                $totalSeconds = ((int)$parts[0] * 3600) + ((int)$parts[1] * 60) + (int)$parts[2];
            }

            $recommendedPmTimeOut = null;
            if ($totalSeconds > 28800 && $record->pm_time_out) { // Over 8 hours
                $extraSeconds = $totalSeconds - 28800;
                $recommendedPmTimeOut = Carbon::createFromFormat('H:i:s', $record->pm_time_out)
                    ->copy()
                    ->subSeconds($extraSeconds)
                    ->format('H:i:s');
            }

            return (object) array_merge((array) $record, $raa, $rto, [
                'recommended_pm_time_out' => $recommendedPmTimeOut,
            ]);
        });

        return $records;
    }
}