<?php

namespace App\Http\Controllers;

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

class HomeController extends Controller
{
    public function index(Request $request)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $divisions = $conn3->table('tbldivision')
            ->select('division_id', 'division_name')
            ->get()
            ->pluck('division_name', 'division_id');

        $publicationIds = $conn2->table('publication')
        ->where('is_public', 1)
        ->whereRaw("CONCAT(date_closed, ' ', time_closed) >= NOW()")
        ->pluck('id');

        $vacancyIds = $conn2->table('publication_vacancies')
        ->whereIn('publication_id', $publicationIds)
        ->distinct()
        ->pluck('vacancy_id');

        $vacancies = $conn2->table('vacancy as v')
            ->select([
                'v.id',
                'v.reference_no',
                'v.appointment_status',
                'v.item_no',
                'v.position',
                'v.position_description',
                'v.division',
                'v.sg',
                'v.step',
                'v.monthly_salary',
                'v.classification',
                'v.prescribed_eligibility',
                'v.prescribed_education',
                'v.prescribed_experience',
                'v.prescribed_training',
                'v.preferred_eligibility',
                'v.preferred_education',
                'v.preferred_experience',
                'v.preferred_training',
                'v.summary',
                'v.output',
                'v.examination',
                'v.responsibility',
                'v.status',
                'v.remarks',
                'p.id as publication_id',
                'p.date_published',
                'p.date_closed',
                'p.time_closed',
            ])
            ->leftJoin('publication_vacancies as pv', 'pv.vacancy_id', '=', 'v.id')
            ->leftJoin('publication as p', 'p.id', '=', 'pv.publication_id')
            ->whereIn('v.id', $vacancyIds)
            ->where('p.is_public', 1);

        if ($search = $request->input('search')) {
            $vacancies->where(function ($q) use ($search) {
                $q->where('v.position_description', 'LIKE', "%{$search}%")
                ->orWhere('v.position', 'LIKE', "%{$search}%")
                ->orWhere('v.item_no', 'LIKE', "%{$search}%");
            });
        }

        if ($filters = $request->input('filter')) {
            if (!empty($filters['division'])) {
                $vacancies->where('v.division', $filters['division']);
            }
            if (!empty($filters['sg'])) {
                $vacancies->where('v.sg', $filters['sg']);
            }
            if (!empty($filters['appointment_status'])) {
                $vacancies->where('v.appointment_status', $filters['appointment_status']);
            }
        }

        $vacancies = $vacancies->paginate(9)->withQueryString();

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
            ->get()
            ->groupBy('vacancy_id');

        $requirements = $conn2->table('vacancy_requirements')
            ->whereIn('vacancy_id', $vacancyIds)
            ->get()
            ->groupBy('vacancy_id');


        $vacancies->transform(function ($vacancy) use ($divisions, $competencies,  $requirements) {
            $vacancy->hashed_id = sha1($vacancy->id);
            $vacancy->division_name = $divisions->get($vacancy->division);

            $vacancyCompetencies = $competencies->get($vacancy->id, collect());

            $vacancy->requirements = $requirements->get($vacancy->id, collect());

            $vacancy->competencies = $vacancyCompetencies->groupBy('comp_type')->map(function ($items) {
                return $items->values();
            });

            return $vacancy;
        });

        return Inertia::render('Home', [
            'data' => [
                'jobs' => $vacancies,
                'filters' => $request->only(['search', 'filter']),
            ],
        ]);
    }

    public function reportIssue(Request $request)
    {
        $conn = DB::connection('mysql');

        $request->validate([
            'message'   => 'required|string|max:500',
        ], [
            'message.required'       => 'The description of the issue is required',
            'message.string'         => 'The description of the issue must be a valid string',
            'message.max'            => 'Must not exceed 500 characters',
        ]);

        try {
            $conn->beginTransaction();

            $issueId = $conn->table('issues')->insertGetId([
                'name' => $request->input('name'),
                'email' => $request->input('email'),
                'message' => $request->input('message'),
                'created_at' => Carbon::now()->timestamp,
            ]);

            $conn->commit();

            app(\App\Http\Controllers\JobPortal\NotificationController::class)
                    ->reportIssue($issueId);

            return redirect()->back()->with('success', 'Issue reported successfully. Thank you for your feedback!');

        } catch (Exception $e) {
            $conn->rollBack();
            Log::error("Failed to report issue: {$e->getMessage()}");
            return redirect()->back()->with('error', 'There was an error reporting your issue. Please try again later.');
        }
    }
}
