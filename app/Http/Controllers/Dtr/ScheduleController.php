<?php

namespace App\Http\Controllers\Dtr;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class ScheduleController extends Controller
{
    public function indexPublic(Request $request, $key)
    {
        abort_if($key !== env('PUBLIC_FWA_KEY'), 404);

        return $this->index($request); 
    }

    public function index(Request $request)
    {
        $conn2 = DB::connection('mysql2'); 
        $conn3 = DB::connection('mysql3');

        // Check if there’s an authenticated user
        $user = Auth::user();
        $isPublic = !$user; // Or $request->has('public') if you want a ?public=1 param

        $monthStr = $request->input('month', now()->format('Y-m'));
        [$year, $month] = explode('-', $monthStr);

        $employeesQuery = $conn3->table('tblemployee')
            ->select([
                'emp_id',
                DB::raw('concat(lname, ", ", fname, " ", mname) as name'),
                'division_id',
            ])
            ->where('work_status', 'active')
            ->orderBy('lname')
            ->orderBy('fname')
            ->orderBy('mname');

        // Apply filters only if NOT public
        if (!$isPublic) {
            $hasDCRole = $user->hasRole('HRIS_DC');
            $hasADCRole = $user->hasRole('HRIS_ADC');
            $hasStaffRole = $user->hasRole('HRIS_Staff');
            $hasHRRole = $user->hasRole('HRIS_HR');

            if (!$hasHRRole) {
                if ($hasDCRole || $hasADCRole) {
                    $employeesQuery->where('division_id', $user->division);
                } elseif ($hasStaffRole) {
                    $employeesQuery->where('emp_id', $user->ipms_id);
                }
            }
        }

        $employees = $employeesQuery->get();

        $employeesByDivision = $employees->groupBy('division_id')->map(function ($emps) {
            return $emps->map(function ($emp) {
                return [
                    'id' => $emp->emp_id,
                    'name' => $emp->name,
                ];
            });
        });

        $fridays = [];
        $date = \Carbon\Carbon::createFromDate($year, $month, 1);
        $lastDay = $date->copy()->endOfMonth();

        while ($date->lte($lastDay)) {
            if ($date->isFriday()) {
                $fridays[] = $date->format('Y-m-d');
            }
            $date->addDay();
        }

        $schedules = $conn2->table('flexi_schedule')
            ->select('emp_id', 'dtr_type', 'date')
            ->whereRaw("DATE_FORMAT(date, '%Y-%m') = ?", [$monthStr])
            ->get();

        $scheduleMap = [];
        foreach ($schedules as $s) {
            $scheduleMap[$s->emp_id][$s->date] = $s->dtr_type;
        }

        $employeesByDivision = $employeesByDivision->map(function ($emps) use ($fridays, $scheduleMap) {
            return $emps->map(function ($emp) use ($fridays, $scheduleMap) {
                foreach ($fridays as $friday) {
                    $emp[$friday] = $scheduleMap[$emp['id']][$friday] ?? null;
                }
                return $emp;
            });
        });

        return Inertia::render('Dtr/Schedule/index', [
            'data' => [
                'employeesByDivision' => $employeesByDivision,
                'employees' => $employees->map(function ($emp) {
                    return [
                        'value' => $emp->emp_id,
                        'label' => $emp->name,
                    ];
                }),
                'fridays' => $fridays,
                'month' => $monthStr,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $conn2 = DB::connection('mysql2'); 
        $conn3 = DB::connection('mysql3');

        DB::beginTransaction();

        try {

            $conn2->table('flexi_schedule')->updateOrInsert(
                [
                    'emp_id' => $request['emp_id'],
                    'date' => $request['date'],
                ],
                [
                    'dtr_type' => $request['dtr_type'],
                    'created_by' => auth()->user()->ipms_id,
                    'date_created' => now(),
                ]
            );

            return redirect()->back()->with([
                'status' => 'success',
                'title'  => 'Success!',
                'message'=> 'Flexiplace schedule saved successfully.'
            ]);

        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error recording time: ' . $e->getMessage());
            
            return redirect()->back()->with([
                'status' => 'error',
                'title'  => 'Uh oh! Something went wrong.',
                'message'=> 'An error occurred while saving flexiplace schedule. Please try again.'
            ]);
        }   
    }

    public function bulkStore(Request $request)
    {
        $conn2 = DB::connection('mysql2'); 
        $conn3 = DB::connection('mysql3');

        $validated = $request->validate([
            'employees'   => ['required', 'array', 'min:1'],
            'dates'        => ['required', 'array', 'min:1'],
            'dtr_type'    => ['required', 'string'],
        ], [
            'employees.required' => 'Please select at least one employee.',
            'employees.min'      => 'You must select at least one employee.',
            'dates.required'      => 'Please select at least one date.',
            'dates.min'      => 'You must select at least one date.',
            'dtr_type.required'  => 'The DTR type is required.',
        ]);

        DB::beginTransaction();
        try {
            foreach ($validated['employees'] as $empId) {
                foreach ($validated['dates'] as $date) {
                    $conn2->table('flexi_schedule')->updateOrInsert(
                        [
                            'emp_id' => $empId,
                            'date'   => $date,
                        ],
                        [
                            'dtr_type'     => $validated['dtr_type'],
                            'created_by'   => auth()->user()->ipms_id,
                            'date_created' => now(),
                        ]
                    );
                }
            }

            DB::commit();

            return redirect()->back()->with([
                'status'  => 'success',
                'title'   => 'Success!',
                'message' => 'Flexiplace schedule saved successfully for selected employees and dates.'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk Store Error: ' . $e->getMessage());

            return redirect()->back()->with([
                'status'  => 'error',
                'title'   => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving schedules. Please try again.'
            ]);
        }
    }
}
