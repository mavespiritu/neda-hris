<?php

namespace App\Http\Controllers\JobPortal;

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
use Illuminate\Pagination\LengthAwarePaginator;

class ApplicationsController extends Controller
{
    public function index()
    {
        $conn  = DB::connection('mysql');  
        $conn2 = DB::connection('mysql2');  

        $applications = $conn->table('application as a')
            ->leftJoinSub(
                $conn->table('application_status as s1')
                    ->select('s1.application_id', 's1.status', 's1.created_at')
                    ->whereRaw('s1.created_at = (
                        SELECT MAX(s2.created_at) 
                        FROM application_status as s2 
                        WHERE s2.application_id = s1.application_id
                    )'),
                'latest_status',
                'latest_status.application_id',
                '=',
                'a.id'
            )
            ->select(
                'a.*',
                'latest_status.status as latest_status',
                'latest_status.created_at as status_date'
            )
            ->where('a.user_id', auth()->user()->id)
            ->latest('a.date_created')
            ->paginate(5);

        $vacancyIds = $applications->pluck('vacancy_id')->filter()->unique();

        $vacancies = $conn2->table('vacancy')
            ->whereIn('id', $vacancyIds)
            ->get()
            ->keyBy('id'); 

        $applications->getCollection()->transform(function ($app) use ($vacancies) {
            $vacancy = $vacancies->get($app->vacancy_id);

            $app->reference_no = $vacancy->reference_no ?? null;
            $app->item_no = $vacancy->item_no ?? null;
            $app->position = $vacancy->position_description ?? null;
            $app->hashed_id = sha1($vacancy->id);

            return $app;
        });

        return Inertia::render('JobPortal/Applications/index', [
            'data' => [
                'applications' => $applications,
            ],
        ]);
    }
}
