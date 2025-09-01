<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class EmployeeController extends Controller
{
    public function getEmployees(Request $request)
    {
        $conn3 = DB::connection('mysql3');
        $conn2 = DB::connection('mysql2');

        $filters = $request->query('filters', []);
        $today = now()->toDateString();

        $latestAssignments = $conn3->table('tblemp_emp_item as eei')
            ->select([
                'eei.emp_id',
                'epi.item_no',
                'eei.from_date',
                'epi.step',
                DB::raw('ROW_NUMBER() OVER (PARTITION BY eei.emp_id ORDER BY eei.from_date DESC, epi.step DESC) as rn')
            ])
            ->leftJoin('tblemp_position_item as epi', 'eei.item_no', '=', 'epi.item_no')
            ->where(function ($query) {
                $query->whereNull('eei.to_date')
                    ->orWhere('eei.to_date', '0000-00-00');
            });

        $latestDesignations = $conn2->table('career_path as c')
            ->select([
                'c.emp_id',
                'c.position_id as item_no',
                DB::raw('ROW_NUMBER() OVER (PARTITION BY c.emp_id ORDER BY c.start_date DESC) as rn')
            ])
            ->where('c.type', 'Designation')
            ->whereDate('c.start_date', '<=', $today)
            ->where(function ($query) use ($today) {
                $query->whereNull('c.end_date')
                    ->orWhereDate('c.end_date', '>=', $today);
            });

        $employees = $conn3->table('tblemployee as e')
            ->select([
                'e.emp_id as value',
                DB::raw('concat(e.lname,", ",e.fname," ",e.mname) as label'),
                'epi.position_id',
                'p.post_description as position',
                'epi.item_no',
                'epi.grade',
                'epi.step',
                'e.division_id',
                'des.position_id as designation_position_id',
                'des.item_no as designation_item_no',
                'des.grade as designation_grade',
                'des.step as designation_step',
                'dp.post_description as designation_position',
            ])
            ->leftJoinSub($latestAssignments, 'latest_eei', function ($join) {
                $join->on('e.emp_id', '=', 'latest_eei.emp_id')
                    ->where('latest_eei.rn', '=', 1);
            })
            ->leftJoin('tblemp_position_item as epi', 'latest_eei.item_no', '=', 'epi.item_no')
            ->leftJoin('tblposition as p', 'p.position_id', '=', 'epi.position_id')

            ->leftJoinSub($latestDesignations, 'latest_designation', function ($join) {
                $join->on('e.emp_id', '=', 'latest_designation.emp_id')
                    ->where('latest_designation.rn', '=', 1);
            })
            ->leftJoin('tblemp_position_item as des', 'latest_designation.item_no', '=', 'des.item_no')
            ->leftJoin('tblposition as dp', 'dp.position_id', '=', 'des.position_id');

        collect($filters)->each(fn($v, $k) => !empty($v) && $employees->where("e.$k", $v));

        $rawEmployees = $employees
            ->orderBy('e.lname')
            ->orderBy('e.fname')
            ->orderBy('e.mname')
            ->get();

        $transformed = $rawEmployees->map(function ($emp) {
            return [
                'value' => $emp->value,
                'label' => $emp->label,
                'position_id' => $emp->position_id,
                'position' => $emp->position,
                'item_no' => $emp->item_no,
                'grade' => $emp->grade,
                'step' => $emp->step,
                'division_id' => $emp->division_id,
                'designation' => $emp->designation_position_id ? [
                    'position_id' => $emp->designation_position_id,
                    'item_no' => $emp->designation_item_no,
                    'grade' => $emp->designation_grade,
                    'step' => $emp->designation_step,
                    'position' => $emp->designation_position,
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
