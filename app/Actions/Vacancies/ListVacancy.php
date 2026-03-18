<?php

namespace App\Actions\Vacancies;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Lorisleiva\Actions\Concerns\AsAction;

class ListVacancy
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('list', 'vacancies');
    }

    public function asController(Request $request)
    {
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

        $vacancies->getCollection()->transform(function ($vacancy) use ($histories, $employees) {
            $latestHistory = $histories->get($vacancy->id, collect())->first();
            $vacancy->creator = $employees->get($vacancy->created_by)->name ?? null;
            $vacancy->status = $latestHistory->status ?? null;
            $vacancy->acted_by = $latestHistory->acted_by ?? null;
            $vacancy->acted_by_name = $latestHistory ? $employees->get($latestHistory->acted_by)->name ?? null : null;
            $vacancy->date_acted = $latestHistory->date_acted ?? null;
            $vacancy->remarks = $latestHistory->remarks ?? null;
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
