<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class EmployeeController extends Controller
{
    public function getEmployees(Request $request)
    {
        $conn3 = DB::connection('mysql3'); // employees, position tables
        $conn2 = DB::connection('mysql2'); // career_path (designations)

        $filters = $request->query('filters', []);
        $today = now()->toDateString();

        // -------------------------
        // Step 1: Get employees and latest assignments from mysql3
        // -------------------------
        $latestAssignments = $conn3->table('tblemp_emp_item as eei')
            ->select('eei.emp_id', DB::raw('MAX(eei.from_date) as max_from_date'))
            ->where(function ($query) {
                $query->whereNull('eei.to_date')
                    ->orWhere('eei.to_date', '0000-00-00');
            })
            ->groupBy('eei.emp_id');

        $latestAssignmentsFull = $conn3->table('tblemp_emp_item as eei')
            ->joinSub($latestAssignments, 'latest', function ($join) {
                $join->on('eei.emp_id', '=', 'latest.emp_id')
                    ->on('eei.from_date', '=', 'latest.max_from_date');
            })
            ->leftJoin('tblemp_position_item as epi', 'eei.item_no', '=', 'epi.item_no')
            ->select('eei.emp_id', 'epi.item_no', 'epi.step', 'epi.position_id', 'epi.grade');

        $employeesQuery = $conn3->table('tblemployee as e')
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
            ->leftJoinSub($latestAssignmentsFull, 'latest_eei', function ($join) {
                $join->on('e.emp_id', '=', 'latest_eei.emp_id');
            })
            ->leftJoin('tblemp_position_item as epi', 'latest_eei.item_no', '=', 'epi.item_no')
            ->leftJoin('tblposition as p', 'p.position_id', '=', 'epi.position_id');

        // Apply filters if provided
        collect($filters)->each(fn($v, $k) => !empty($v) && $employeesQuery->where("e.$k", $v));

        $rawEmployees = $employeesQuery
            ->orderBy('e.lname')
            ->orderBy('e.fname')
            ->orderBy('e.mname')
            ->get();

        // -------------------------
        // Step 2: Get latest designations from mysql2
        // -------------------------
        $latestDesignations = $conn2->table('career_path as c')
            ->select('c.emp_id', DB::raw('MAX(c.start_date) as max_start_date'))
            ->where('c.type', 'Designation')
            ->whereDate('c.start_date', '<=', $today)
            ->where(function ($query) use ($today) {
                $query->whereNull('c.end_date')
                    ->orWhereDate('c.end_date', '>=', $today);
            })
            ->groupBy('c.emp_id');

        $latestDesignationsBase = $conn2->table('career_path as c')
            ->joinSub($latestDesignations, 'latest_c', function ($join) {
                $join->on('c.emp_id', '=', 'latest_c.emp_id')
                    ->on('c.start_date', '=', 'latest_c.max_start_date');
            })
            ->select('c.emp_id', 'c.position_id')
            ->get()
            ->keyBy('emp_id');

        // -------------------------
        // Step 3: Fetch position details from mysql3 for designations
        // -------------------------
        $positionIds = $latestDesignationsBase->pluck('position_id')->filter()->unique();

        $positionsMap = $conn3->table('tblemp_position_item as epi')
            ->leftJoin('tblposition as p', 'p.position_id', '=', 'epi.position_id')
            ->whereIn('epi.position_id', $positionIds)
            ->select(
                'epi.position_id',
                'epi.item_no as designation_item_no',
                'epi.grade as designation_grade',
                'epi.step as designation_step',
                'p.post_description as designation_position'
            )
            ->get()
            ->keyBy('position_id');

        // -------------------------
        // Step 4: Merge employees with designations in PHP
        // -------------------------
        $transformed = $rawEmployees->map(function ($emp) use ($latestDesignationsBase, $positionsMap) {
            $designationBase = $latestDesignationsBase->get($emp->value);
            $designation = $designationBase ? $positionsMap->get($designationBase->position_id) : null;

            return [
                'value'       => $emp->value,
                'label'       => $emp->label,
                'position_id' => $emp->position_id,
                'position'    => $emp->position,
                'item_no'     => $emp->item_no,
                'grade'       => $emp->grade,
                'step'        => $emp->step,
                'division_id' => $emp->division_id,
                'designation' => $designation ? [
                    'position_id' => $designationBase->position_id,
                    'item_no'     => $designation->designation_item_no,
                    'grade'       => $designation->designation_grade,
                    'step'        => $designation->designation_step,
                    'position'    => $designation->designation_position,
                ] : null,
            ];
        });

        return response()->json($transformed);
    }

    public function showAllEmployees()
    {
        $conn3 = DB::connection('mysql3');

        $employees = $conn3->table('tblemployee')
            ->select([
                'emp_id as value',
                DB::raw('concat(lname,", ",fname," ",mname) as label'),
            ])
            ->orderBy('lname', 'asc')
            ->orderBy('fname', 'asc')
            ->orderBy('mname', 'asc')
            ->get();
        
        return response()->json($employees);  
    }

    public function showActiveEmployees(Request $request)
    {
        $conn3 = DB::connection('mysql3');

        $employees = $conn3->table('tblemployee')
            ->select([
                'emp_id as value',
                DB::raw('concat(lname,", ",fname," ",mname) as label'),
            ])
            ->where('work_status', 'active');

        if($request->division_id !== null && $request->division_id !== 'null'){
            $employees->where('division', $request->division);
        }

        $employees = $employees
        ->orderBy('lname', 'asc')
        ->orderBy('fname', 'asc')
        ->orderBy('mname', 'asc')
        ->get();
        
        return response()->json($employees);
    }

    public function showFilteredEmployees(Request $request)
    {
        $conn3 = DB::connection('mysql3');

        $user = Auth::user();

        $employee = $conn3->table('tblemployee')
        ->where('emp_id', $user->ipms_id)
        ->first();

        $roles = $user->getRoleNames();

        $employees = $conn3->table('tblemployee')
            ->select([
                'emp_id as value',
                DB::raw('concat(lname,", ",fname," ",mname) as label'),
            ])
            ->where('work_status', 'active');

        if (!$roles->contains('HRIS_HR')) {
            if ($roles->contains('HRIS_DC')) {
                $employees->where('division_id', $employee->division_id);
            }
        }

        if($request->emp_type_id !== null && $request->emp_type_id !== 'null'){
            $employees->where('emp_type_id', $request->emp_type_id);
        }

        $employees = $employees
        ->orderBy('lname', 'asc')
        ->orderBy('fname', 'asc')
        ->orderBy('mname', 'asc')
        ->get();
        
        return response()->json($employees);
    }

    public function showImage($id)
    {
        $conn3 = DB::connection('mysql3');

        $employee = $conn3->table('tblemployee')
            ->select([
                'picture'
            ])
            ->where('emp_id', $id)
            ->first();

        return response($employee->picture, 200)
            ->header('Content-Type', 'image/jpeg')
            ->header('Content-Disposition', 'inline; filename="'.$id.'.jpg"');
    }

    public function showCurrentPosition($id)
    {
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

        return response()->json($position->item_no);
    }
}
