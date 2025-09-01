<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TrainingController extends Controller
{
    public function index(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $filters = $request->query('filters', []);

        $trainings = $conn2->table('training')
            ->select([
                DB::raw('id as value'),
                DB::raw("REPLACE(training_title, '\"', '') as label"),
                'no_of_hours',
                'cost',
                'modality'
            ]);
        
        collect($filters)->each(fn($v, $k) => !empty($v) && $trainings->where("$k", $v));

        $trainings = $trainings
            ->orderBy('training_title', 'asc')
            ->get();
        
        return response()->json($trainings);  
    }
}
