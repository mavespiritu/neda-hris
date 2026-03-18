<?php

namespace App\Actions\Publications;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowPublication
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('list', 'publications');
    }

    public function asController(int $id, Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $publication = $conn2->table('publication')->where('id', $id)->first();

        if (! $publication) {
            abort(404, 'Page not found.');
        }

        $publication->files = $conn2->table('file')
            ->where('model', 'Publication')
            ->where('itemId', $publication->id)
            ->select(['id', 'itemId', 'name', 'path', 'size', 'mime'])
            ->orderBy('id', 'desc')
            ->get();

        if (! empty($publication->date_closed)) {
            $closingDate = Carbon::parse($publication->date_closed)->toDateString();
            $publication->status = now()->toDateString() > $closingDate
                ? 'Closed'
                : ($publication->is_public ? 'Published' : 'Draft');
        } else {
            $publication->status = $publication->is_public ? 'Published' : 'Draft';
        }

        $sort = $request->get('sort');
        $direction = strtolower($request->get('direction', 'asc')) === 'desc' ? 'desc' : 'asc';
        $search = $request->input('search', '');

        $sortable = [
            'reference_no' => DB::raw('reference_no'),
            'division' => DB::raw('division'),
            'appointment_status' => DB::raw('appointment_status'),
            'position_description' => DB::raw('position_description'),
            'sg' => DB::raw('sg'),
            'monthly_salary' => DB::raw('monthly_salary'),
        ];

        $searchable = [
            'reference_no',
            'division',
            'appointment_status',
            'position',
            'position_description',
            'sg',
            'monthly_salary',
        ];

        $vacanciesQuery = $conn2->table('publication_vacancies as pv')
            ->join('vacancy as v', 'pv.vacancy_id', '=', 'v.id')
            ->select([
                'pv.id as id',
                'v.id as vacancy_id',
                'v.reference_no as reference_no',
                'v.position',
                'v.position_description',
                'v.item_no',
                'v.division',
                'v.appointment_status',
                'v.sg',
                'v.monthly_salary',
            ])
            ->where('pv.publication_id', $publication->id);

        foreach ([
            'division' => 'v.division',
            'appointment_status' => 'v.appointment_status',
            'sg' => 'v.sg',
        ] as $param => $column) {
            if ($request->filled($param)) {
                $vacanciesQuery->where($column, $request->input($param));
            }
        }

        if ($sort && isset($sortable[$sort]) && in_array(strtolower($direction), ['asc', 'desc'], true)) {
            $vacanciesQuery->orderBy($sortable[$sort], $direction);
        }

        $vacancies = $vacanciesQuery->orderBy('pv.id', 'desc')->paginate(20);

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

        return Inertia::render('Publications/View', [
            'data' => [
                'publication' => $publication,
                'vacancies' => $vacancies,
            ],
        ]);
    }
}
