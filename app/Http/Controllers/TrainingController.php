<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TrainingController extends Controller
{
    public function show()
    {
        $conn2 = DB::connection('mysql2');

        $trainings = $conn2->table('training')
            ->select([
                DB::raw('id as value'),
                DB::raw('training_title as label'),
            ])
            ->orderBy('training_title', 'asc')
            ->get();
        
        return response()->json($trainings);  
    }
}
