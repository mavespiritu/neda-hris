<?php

namespace App\Actions\Flexiplace;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Lorisleiva\Actions\Concerns\AsAction;

class ListSchedule
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        $key = $request->route('key');

        if ($key !== null) {
            return hash_equals((string) config('fwa.public_key'), (string) $key);
        }

        return $request->user() !== null
            && Gate::forUser($request->user())->allows('list', 'flexiplace.schedule');
    }

    public function asController(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $user = Auth::user();
        $isPublic = ! $user;

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

        if (! $isPublic) {
            $userRoles = method_exists($user, 'getAllRolesRecursive')
                ? $user->getAllRolesRecursive()->pluck('name')->toArray()
                : $user->roles->pluck('name')->toArray();

            $userDivision = $user->division ?: $conn3->table('tblemployee')
                ->where('emp_id', $user->ipms_id)
                ->value('division_id');

            if (in_array('HRIS_HR', $userRoles, true)) {
                // no additional filter
            } elseif (count(array_intersect($userRoles, ['HRIS_DC', 'HRIS_ADC'])) > 0) {
                if (filled($userDivision)) {
                    $employeesQuery->where('division_id', $userDivision);
                } else {
                    $employeesQuery->whereRaw('1=0');
                }
            } elseif (in_array('HRIS_Staff', $userRoles, true)) {
                $employeesQuery->where('emp_id', $user->ipms_id);
            } else {
                $employeesQuery->whereRaw('1=0');
            }
        }

        $employees = $employeesQuery->get();

        $employeesByDivision = $employees->groupBy('division_id')->map(function ($items) {
            return $items->map(fn ($emp) => [
                'id' => $emp->emp_id,
                'name' => $emp->name,
            ]);
        });

        $fridays = [];
        $date = Carbon::createFromDate($year, $month, 1);
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

        foreach ($schedules as $schedule) {
            $scheduleMap[$schedule->emp_id][$schedule->date] = $schedule->dtr_type;
        }

        $employeesByDivision = $employeesByDivision->map(function ($items) use ($fridays, $scheduleMap) {
            return $items->map(function ($emp) use ($fridays, $scheduleMap) {
                foreach ($fridays as $friday) {
                    $emp[$friday] = $scheduleMap[$emp['id']][$friday] ?? null;
                }

                return $emp;
            });
        });

        return Inertia::render('Dtr/Schedule/index', [
            'data' => [
                'employeesByDivision' => $employeesByDivision,
                'employees' => $employees->map(fn ($emp) => [
                    'value' => $emp->emp_id,
                    'label' => $emp->name,
                ]),
                'fridays' => $fridays,
                'month' => $monthStr,
            ],
        ]);
    }
}




