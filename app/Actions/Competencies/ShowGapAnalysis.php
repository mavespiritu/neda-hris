<?php

namespace App\Actions\Competencies;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowGapAnalysis
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('gapAnalysis', 'gap-analysis');
    }

    public function asController(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $empId = $request->emp_id ?? $request->user()->ipms_id;
        $today = now()->toDateString();

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

        $designation = null;

        if ($latestDesignation) {
            $designation = $conn3->table('tblemp_emp_item as eei')
                ->select([
                    'epi.position_id',
                    'epi.item_no',
                    'epi.grade',
                    'epi.step',
                    'p.post_description as position',
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
}
