<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

        if($request->division !== null && $request->division !== 'nul'){
            $employees->where('division', $request->division);
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
}
