<?php

namespace App\Actions\Publications;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Lorisleiva\Actions\Concerns\AsAction;

class ListPublication
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.publications.page.view');
    }

    public function asController(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $sort = $request->get('sort');
        $direction = strtolower($request->get('direction', 'asc')) === 'desc' ? 'desc' : 'asc';
        $search = $request->input('search', '');

        $sortable = [
            'reference_no' => DB::raw('reference_no'),
            'date_published' => DB::raw('date_published'),
            'date_closed' => DB::raw('date_closed'),
            'is_public' => DB::raw('is_public'),
        ];

        $searchable = [
            'reference_no',
            'date_published',
            'date_closed',
            'creator',
        ];

        $publicationsQuery = $conn2->table('publication as p')->select(['p.*']);

        if ($request->filled('is_public')) {
            $publicationsQuery->where('is_public', $request->input('is_public'));
        }

        if ($sort && isset($sortable[$sort]) && in_array(strtolower($direction), ['asc', 'desc'], true)) {
            $publicationsQuery->orderBy($sortable[$sort], $direction);
        }

        $publications = $publicationsQuery->orderBy('p.id', 'desc')->paginate(20);
        $publicationIds = $publications->pluck('id')->all();

        $vacancyCounts = $conn2->table('publication_vacancies')
            ->select('publication_id', DB::raw('COUNT(*) as vacancy_count'))
            ->whereIn('publication_id', $publicationIds)
            ->groupBy('publication_id')
            ->pluck('vacancy_count', 'publication_id');

        $employees = $conn3->table('tblemployee as e')
            ->select([
                'e.emp_id',
                DB::raw("CONCAT(e.lname, ', ', e.fname, ' ', IF(e.mname IS NOT NULL AND e.mname != '', CONCAT(LEFT(e.mname, 1), '.'), '')) as name"),
            ])
            ->get()
            ->keyBy('emp_id');

        $files = $conn2->table('file')
            ->select(['id', 'itemId', 'name', 'path', 'size', 'mime'])
            ->where('model', 'Publication')
            ->whereIn('itemId', $publicationIds)
            ->get()
            ->groupBy('itemId');

        $publications->getCollection()->transform(function ($publication) use ($employees, $vacancyCounts, $files) {
            $publication->creator = $employees->get($publication->created_by)->name ?? null;
            $publication->vacancy_count = $vacancyCounts[$publication->id] ?? 0;
            $publication->files = $files[$publication->id] ?? collect();

            if (! empty($publication->date_closed)) {
                $closingDateTime = Carbon::parse($publication->date_closed . ' ' . ($publication->time_closed ?? '23:59:59'));
                $publication->status = Carbon::now()->greaterThan($closingDateTime)
                    ? 'Closed'
                    : ($publication->is_public ? 'Published' : 'Draft');
            } else {
                $publication->status = $publication->is_public ? 'Published' : 'Draft';
            }

            return $publication;
        });

        if ($request->filled('status')) {
            $status = $request->input('status');
            $publications->setCollection(
                $publications->getCollection()->filter(fn ($publication) => $publication->status === $status)->values()
            );
        }

        if ($sort === 'creator') {
            $publications->setCollection(
                $publications->getCollection()->sortBy(fn ($publication) => $publication->creator ?? '', SORT_REGULAR, $direction === 'desc')->values()
            );
        }

        if ($sort === 'vacancy_count') {
            $publications->setCollection(
                $publications->getCollection()->sortBy(fn ($publication) => $publication->vacancy_count ?? 0, SORT_REGULAR, $direction === 'desc')->values()
            );
        }

        if ($sort === 'status') {
            $publications->setCollection(
                $publications->getCollection()->sortBy(fn ($publication) => $publication->status ?? '', SORT_REGULAR, $direction === 'desc')->values()
            );
        }

        if ($search) {
            $searchLower = strtolower($search);
            $publications->setCollection(
                $publications->getCollection()->filter(function ($publication) use ($searchable, $searchLower) {
                    foreach ($searchable as $field) {
                        if (str_contains(strtolower($publication->{$field} ?? ''), $searchLower)) {
                            return true;
                        }
                    }

                    return false;
                })->values()
            );
        }

        return Inertia::render('Publications/index', [
            'data' => [
                'publications' => $publications,
            ],
        ]);
    }
}
