<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class EmployeeController extends Controller
{
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
