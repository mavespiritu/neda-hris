<?php

namespace App\Http\Controllers\TravelOrders;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Arr;

class TravelOrdersController extends Controller
{
    public function index(Request $request)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $sort      = $request->get('sort');
        $direction = strtolower($request->get('direction', 'asc')) === 'desc' ? 'desc' : 'asc';
        $search    = $request->input('search', '');

        $sortable = [
            'reference_no' => DB::raw('reference_no'),       
            'travel_type' => DB::raw('travel_type'),             
            'purpose' => DB::raw('purpose'),             
            'start_date' => DB::raw('start_date'),    
            'creator' => DB::raw("CONCAT(
                e.last_name,
                IF(e.ext_name IS NOT NULL AND e.ext_name != '', CONCAT(' ', e.ext_name), ''),
                ', ',
                e.first_name,
                ' ',
                IFNULL(CONCAT(LEFT(e.middle_name, 1), '.'), '')
            )"),         
        ];

        $searchable = [
            'reference_no',
            'travel_type',
            'purpose',
            'creator',
        ];

        $filterable = [
            'type' => 'type',
            'division' => 'division',
        ];
        
        $travelOrdersQuery = $conn2->table('travel_order as t')
        ->select([
            't.*',
            DB::raw("CONCAT(
                e.last_name,
                IF(e.ext_name IS NOT NULL AND e.ext_name != '', CONCAT(' ', e.ext_name), ''),
                ', ',
                e.first_name,
                ' ',
                IFNULL(CONCAT(LEFT(e.middle_name, 1), '.'), '')
            ) AS creator"),
        ]);

        // filtering
        foreach ($filterable as $param => $column) {
            if ($request->filled($param)) {
                $travelOrdersQuery->where($column, $request->input($param));
            }
        }

        // sorting
        if ($sort && isset($sortable[$sort]) && in_array(strtolower($direction), ['asc', 'desc'])) {
            $travelOrdersQuery->orderBy($sortable[$sort], $direction);
        }

        $travelOrders = $travelOrdersQuery
                    ->orderBy('t.id', 'desc')
                    ->paginate(20);

        if ($search) {
            $searchLower = strtolower($search);

            $travelOrders->setCollection(
                $travelOrders->getCollection()->filter(function ($travelOrder) use ($searchable, $searchLower) {
                    foreach ($searchable as $field) {
                        if (str_contains(strtolower($travelOrder->{$field} ?? ''), $searchLower)) {
                            return true;
                        }
                    }
                    return false;
                })->values()
            );

        }

        return Inertia::render('TravelOrders/index', [
            'data' => [
                'travelOrders' => $travelOrders,
            ],
        ]);
    }

    public function create()
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $travelCategories = $conn2->table('travel_category')
        ->select([
            'id as value',
            'title as label',
        ])
        ->orderBy('title')
        ->get();

        $employees = $conn3->table('tblemployee')
            ->select([
                'emp_id',
                DB::raw('concat(lname, ", ", fname, " ", mname) as name'),
                'division_id'
            ])
            ->where('work_status', 'active')
            ->orderBy('lname')
            ->orderBy('fname')
            ->orderBy('mname');

        $employees = $employees->get()->keyBy('emp_id');

        return Inertia::render('TravelOrders/Create', [
            'data' => [
                'travelCategories' => $travelCategories,
                'employees' => $employees->map(fn($emp) => [
                    'value' => $emp->emp_id,
                    'label' => $emp->name
                ])->values(),
            ],
        ]);
    }
}