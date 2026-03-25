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
            ->leftJoin('applicant as ap', 'ap.id', '=', 'a.applicant_id')
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
            ->where('ap.type', auth()->user()->ipms_id ? 'Staff' : 'Applicant')
            ->latest('a.date_created')
            ->paginate(5);

        $vacancyIds = $applications->pluck('vacancy_id')->filter()->unique();

        $vacancies = $conn2->table('vacancy')
            ->whereIn('id', $vacancyIds)
            ->get()
            ->keyBy('id'); 
        $editRequests = $conn->table('app_edit_requests')
            ->select('application_id', 'status', 'remarks', 'opened_at', 'expires_at', 'closed_at')
            ->whereIn('application_id', $applications->pluck('id'))
            ->orderByDesc('id')
            ->get()
            ->unique('application_id')
            ->keyBy('application_id');

        $applications->getCollection()->transform(function ($app) use ($vacancies, $editRequests) {
            $vacancy = $vacancies->get($app->vacancy_id);
            $editRequest = $editRequests->get($app->id);
            $hasActiveEditWindow = $editRequest
                && $editRequest->status === 'Open'
                && $editRequest->expires_at
                && now()->lessThanOrEqualTo(Carbon::parse($editRequest->expires_at));

            $app->reference_no = $vacancy->reference_no ?? null;
            $app->appointment_status = $vacancy->appointment_status ?? null;
            $app->item_no = $vacancy->item_no ?? null;
            $app->position = $vacancy->position_description ?? null;
            $app->hashed_id = sha1($vacancy->id);
            $app->can_edit_submission = $hasActiveEditWindow;
            $app->edit_request_status = $editRequest->status ?? null;
            $app->edit_request_expires_at = $editRequest->expires_at ?? null;
            $app->edit_request_remarks = $editRequest->remarks ?? null;

            return $app;
        });

        return Inertia::render('JobPortal/Applications/index', [
            'data' => [
                'applications' => $applications,
            ],
        ]);
    }
}
