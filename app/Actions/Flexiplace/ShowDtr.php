<?php

namespace App\Actions\Flexiplace;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowDtr
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('show', 'flexiplace.dtr');
    }

    public function asController(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $empId = $request->user()->ipms_id ?? null;
        $today = now()->format('Y-m-d');
        $year = now()->year;
        $month = now()->format('F');
        $invalidDate = '0001-01-01 00:00:00';

        $am = $conn3->table('tblactual_dtr')
            ->where('emp_id', $empId)
            ->where('date', $today)
            ->where('time', 'AM')
            ->where('year', $year)
            ->where('month', $month)
            ->first();

        $pm = $conn3->table('tblactual_dtr')
            ->where('emp_id', $empId)
            ->where('date', $today)
            ->where('time', 'PM')
            ->where('year', $year)
            ->where('month', $month)
            ->first();

        $amIn = ($am?->time_in === $invalidDate) ? null : $am?->time_in;
        $amOut = ($am?->time_out === $invalidDate) ? null : $am?->time_out;
        $pmIn = ($pm?->time_in === $invalidDate) ? null : $pm?->time_in;
        $pmOut = ($pm?->time_out === $invalidDate) ? null : $pm?->time_out;

        $logType = null;

        if (! $amIn) {
            $logType = 'amIn';
        } elseif (! $amOut) {
            $logType = 'amOut';
        } elseif (! $pmIn) {
            $logType = 'pmIn';
        } elseif (! $pmOut) {
            $logType = 'pmOut';
        }

        $schedule = $conn2->table('flexi_schedule')
            ->select('emp_id', 'dtr_type', 'date')
            ->where('emp_id', $empId)
            ->where('date', $today)
            ->where('dtr_type', 'Flexiplace')
            ->first();

        $approvedRto = $conn2->table('flexi_rto')
            ->where('emp_id', $empId)
            ->whereDate('date', $today)
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('submission_history as sh')
                    ->whereColumn('sh.model_id', 'flexi_rto.id')
                    ->where('sh.model', 'RTO')
                    ->where('sh.status', 'Approved')
                    ->orderBy('sh.date_acted', 'desc');
            })
            ->exists();

        $isFlexiplaceToday = $schedule !== null && $approvedRto;

        return Inertia::render('Dtr/Fwa/index', [
            'data' => [
                'amIn' => $amIn,
                'amOut' => $amOut,
                'pmIn' => $pmIn,
                'pmOut' => $pmOut,
                'logType' => $logType,
                'schedule' => $schedule,
                'approvedRto' => $approvedRto,
                'isFlexiplaceToday' => $isFlexiplaceToday,
            ],
        ]);
    }
}
