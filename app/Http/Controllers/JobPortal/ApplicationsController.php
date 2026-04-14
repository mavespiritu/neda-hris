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
        $conn3 = DB::connection('mysql3');

        $divisions = $conn3->table('tbldivision')
            ->select('division_id', 'division_name')
            ->get()
            ->pluck('division_name', 'division_id');

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

        $vacancies = $conn2->table('vacancy as v')
            ->select([
                'v.id as id',
                'v.*',
                'p.date_published',
                'p.date_closed',
                'p.time_closed',
            ])
            ->leftJoin('publication_vacancies as pv', 'pv.vacancy_id', '=', 'v.id')
            ->leftJoin('publication as p', 'p.id', '=', 'pv.publication_id')
            ->whereIn('v.id', $vacancyIds)
            ->get()
            ->keyBy('id');

        $requirements = $conn2->table('vacancy_requirements')
            ->whereIn('vacancy_id', $vacancyIds)
            ->get()
            ->groupBy('vacancy_id');

        $competencies = $conn2->table('vacancy_competencies as vc')
            ->leftJoin('competency as c', 'vc.competency_id', '=', 'c.comp_id')
            ->whereIn('vacancy_id', $vacancyIds)
            ->select(
                'vc.vacancy_id',
                'c.comp_id as value',
                DB::raw('CONCAT(c.competency, " (Level ", vc.level, ")") as label'),
                'c.competency',
                'vc.level',
                'c.comp_type'
            )
            ->get();

        $editRequests = $conn->table('app_edit_requests')
            ->select('application_id', 'status', 'remarks', 'opened_at', 'expires_at', 'closed_at')
            ->whereIn('application_id', $applications->pluck('id'))
            ->orderByDesc('id')
            ->get()
            ->unique('application_id')
            ->keyBy('application_id');

        $applications->getCollection()->transform(function ($app) use ($vacancies, $requirements, $competencies, $editRequests, $divisions) {
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
            $app->division_name = $divisions->get($vacancy->division) ?? null;
            $app->date_published = $vacancy->date_published ?? null;
            $app->date_closed = $vacancy->date_closed ?? null;
            $app->time_closed = $vacancy->time_closed ?? null;
            $app->sg = $vacancy->sg ?? null;
            $app->monthly_salary = $vacancy->monthly_salary ?? null;
            $app->prescribed_education = $vacancy->prescribed_education ?? null;
            $app->prescribed_experience = $vacancy->prescribed_experience ?? null;
            $app->prescribed_training = $vacancy->prescribed_training ?? null;
            $app->prescribed_eligibility = $vacancy->prescribed_eligibility ?? null;
            $app->preferred_education = $vacancy->preferred_education ?? null;
            $app->preferred_experience = $vacancy->preferred_experience ?? null;
            $app->preferred_training = $vacancy->preferred_training ?? null;
            $app->preferred_eligibility = $vacancy->preferred_eligibility ?? null;
            $app->summary = $vacancy->summary ?? null;
            $app->output = $vacancy->output ?? null;
            $app->responsibility = $vacancy->responsibility ?? null;
            $app->remarks = $vacancy->remarks ?? null;
            $app->requirements = $requirements->get($app->vacancy_id, collect());
            $app->competencies = $competencies
                ->where('vacancy_id', $app->vacancy_id)
                ->groupBy('comp_type')
                ->map(function ($items) {
                    return $items->values();
                });
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




