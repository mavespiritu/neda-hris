<?php

namespace App\Http\Controllers\Leaves;

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

class LeavesController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Leaves/index', [
            'data' => [
                
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('Leaves/Create');
    }
}