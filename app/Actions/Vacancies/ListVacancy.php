<?php

namespace App\Actions\Vacancies;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Lorisleiva\Actions\Concerns\AsAction;

class ListVacancy
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.vacancies.page.view');
    }

    public function asController(Request $request)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $sort = $request->get('sort');
        $direction = strtolower($request->get('direction', 'asc')) === 'desc' ? 'desc' : 'asc';
        $search = $request->input('search', '');

        $sortable = [
            'division' => DB::raw('division'),
            'appointment_status' => DB::raw('appointment_status'),
            'position_description' => DB::raw('position_description'),
            'sg' => DB::raw('sg'),
            'monthly_salary' => DB::raw('monthly_salary'),
        ];

        $searchable = [
            'reference_no',
            'creator',
            'division',
            'appointment_status',
            'position',
            'position_description',
            'sg',
            'monthly_salary',
        ];

        $filterable = [
            'division' => 'v.division',
            'appointment_status' => 'v.appointment_status',
            'sg' => 'v.sg',
        ];

        $vacanciesQuery = $conn2->table('vacancy as v')->select(['v.*']);

        foreach ($filterable as $param => $column) {
            if ($request->filled($param)) {
                $vacanciesQuery->where($column, $request->input($param));
            }
        }

        if ($sort && isset($sortable[$sort]) && in_array(strtolower($direction), ['asc', 'desc'], true)) {
            $vacanciesQuery->orderBy($sortable[$sort], $direction);
        }

        $vacancies = $vacanciesQuery->orderBy('v.id', 'desc')->paginate(20);
        $vacancyIds = $vacancies->pluck('id')->toArray();

        $publicationDates = $conn2->table('publication_vacancies as pv')
            ->join('publication as p', 'p.id', '=', 'pv.publication_id')
            ->whereIn('pv.vacancy_id', $vacancyIds)
            ->select('pv.vacancy_id', DB::raw('MAX(p.date_published) as date_published'))
            ->groupBy('pv.vacancy_id')
            ->get()
            ->keyBy('vacancy_id');

        $applicantsCounts = $conn->table('application as a')
            ->whereIn('a.vacancy_id', $vacancyIds)
            ->where('a.status', 'Submitted')
            ->select('a.vacancy_id', DB::raw('COUNT(DISTINCT a.user_id) as applicants_count'))
            ->groupBy('a.vacancy_id')
            ->get()
            ->keyBy('vacancy_id');

        $prescreenedCounts = $conn->table('application as a')
            ->join('app_assessments as aa', 'aa.application_id', '=', 'a.id')
            ->whereIn('a.vacancy_id', $vacancyIds)
            ->where('a.status', 'Submitted')
            ->where('aa.stage', 'secretariat')
            ->select('a.vacancy_id', DB::raw('COUNT(DISTINCT a.user_id) as prescreened_count'))
            ->groupBy('a.vacancy_id')
            ->get()
            ->keyBy('vacancy_id');

        $shortlistedCounts = $conn->table('application as a')
            ->join('app_assessments as aa', 'aa.application_id', '=', 'a.id')
            ->whereIn('a.vacancy_id', $vacancyIds)
            ->where('a.status', 'Submitted')
            ->where('aa.stage', 'hrmpsb')
            ->where('aa.overall_status', 'Passed')
            ->select('a.vacancy_id', DB::raw('COUNT(DISTINCT a.user_id) as shortlisted_count'))
            ->groupBy('a.vacancy_id')
            ->get()
            ->keyBy('vacancy_id');

        $employees = $conn3->table('tblemployee as e')
            ->select([
                'e.emp_id',
                DB::raw("CONCAT(e.lname, ', ', e.fname, ' ', IF(e.mname IS NOT NULL AND e.mname != '', CONCAT(LEFT(e.mname, 1), '.'), '')) as name"),
            ])
            ->get()
            ->keyBy('emp_id');

        $histories = $conn2->table('submission_history')
            ->where('model', 'Vacancy')
            ->whereIn('model_id', $vacancyIds)
            ->orderBy('date_acted', 'desc')
            ->get()
            ->groupBy('model_id');

        $vacancies->getCollection()->transform(function ($vacancy) use ($histories, $employees, $applicantsCounts, $prescreenedCounts, $shortlistedCounts, $publicationDates) {
            $latestHistory = $histories->get($vacancy->id, collect())->first();
            $vacancy->creator = $employees->get($vacancy->created_by)->name ?? null;
            $vacancy->status = $latestHistory->status ?? null;
            $vacancy->acted_by = $latestHistory->acted_by ?? null;
            $vacancy->acted_by_name = $latestHistory ? $employees->get($latestHistory->acted_by)->name ?? null : null;
            $vacancy->date_acted = $latestHistory->date_acted ?? null;
            $vacancy->remarks = $latestHistory->remarks ?? null;
            $vacancy->date_published = $publicationDates->get($vacancy->id)->date_published ?? null;
            $vacancy->applicants_count = (int) ($applicantsCounts->get($vacancy->id)->applicants_count ?? 0);
            $vacancy->prescreened_count = (int) ($prescreenedCounts->get($vacancy->id)->prescreened_count ?? 0);
            $vacancy->shortlisted_count = (int) ($shortlistedCounts->get($vacancy->id)->shortlisted_count ?? 0);
            return $vacancy;
        });

        if ($sort === 'creator') {
            $vacancies->setCollection(
                $vacancies->getCollection()->sortBy(fn ($v) => $v->creator ?? '', SORT_REGULAR, $direction === 'desc')->values()
            );
        }

        if ($sort === 'status') {
            $vacancies->setCollection(
                $vacancies->getCollection()->sortBy(fn ($v) => $v->status ?? '', SORT_REGULAR, $direction === 'desc')->values()
            );
        }

        if ($search) {
            $searchLower = strtolower($search);
            $vacancies->setCollection(
                $vacancies->getCollection()->filter(function ($vacancy) use ($searchable, $searchLower) {
                    foreach ($searchable as $field) {
                        if (str_contains(strtolower($vacancy->{$field} ?? ''), $searchLower)) {
                            return true;
                        }
                    }
                    return false;
                })->values()
            );
        }

        return Inertia::render('Vacancies/index', [
            'data' => [
                'vacancies' => $vacancies,
            ],
        ]);
    }
}


