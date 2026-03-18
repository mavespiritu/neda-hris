<?php

namespace App\Actions\Applications;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Lorisleiva\Actions\Concerns\AsAction;

class ListApplications
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('list', 'applications');
    }

    public function asController(Request $request)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');

        $sort = $request->get('sort');
        $direction = strtolower($request->get('direction', 'asc')) === 'desc' ? 'desc' : 'asc';
        $search = trim($request->input('search', ''));

        $sortable = [
            'name' => DB::raw("CONCAT(
                aa.last_name,
                IF(aa.ext_name IS NOT NULL AND aa.ext_name != '', CONCAT(' ', aa.ext_name), ''),
                ', ',
                aa.first_name,
                ' ',
                IFNULL(CONCAT(LEFT(aa.middle_name, 1), '.'), '')
            )"),
            'date_submitted' => DB::raw('a.date_submitted'),
        ];

        $applicationsQuery = $conn->table('application_applicant as aa')
            ->select([
                'a.*',
                DB::raw('DATE(a.date_submitted) as date_submitted'),
                DB::raw("CONCAT(
                    aa.last_name,
                    IF(aa.ext_name IS NOT NULL AND aa.ext_name != '', CONCAT(' ', aa.ext_name), ''),
                    ', ',
                    aa.first_name,
                    ' ',
                    IFNULL(CONCAT(LEFT(aa.middle_name, 1), '.'), '')
                ) AS name"),
                'aa.email_address',
            ])
            ->leftJoin('application as a', 'a.id', '=', 'aa.application_id')
            ->where('a.status', 'Submitted');

        if ($sort && isset($sortable[$sort])) {
            $applicationsQuery->orderBy($sortable[$sort], $direction);
        } else {
            $applicationsQuery->orderByDesc('a.date_submitted');
        }

        $applications = $applicationsQuery->paginate(20)->appends($request->all());

        $vacancyIds = $applications->pluck('vacancy_id')->filter()->unique();
        $publicationIds = $applications->pluck('publication_id')->filter()->unique();

        $vacancies = $conn2->table('vacancy')
            ->whereIn('id', $vacancyIds)
            ->get(['id', 'item_no', 'position_description', 'division', 'monthly_salary', 'appointment_status']);

        $publications = $conn2->table('publication')
            ->whereIn('id', $publicationIds)
            ->get(['id', 'reference_no', 'date_published', 'date_closed']);

        $vacanciesById = $vacancies->keyBy('id');
        $publicationsById = $publications->keyBy('id');

        $applications->getCollection()->transform(function ($application) use ($vacanciesById, $publicationsById) {
            $application->vacancy = $vacanciesById->get($application->vacancy_id);
            $application->publication = $publicationsById->get($application->publication_id);

            return $application;
        });

        if (! empty($search) || $request->filled('division') || $request->filled('appointment_status')) {
            $applications->setCollection(
                $applications->getCollection()->filter(function ($application) use ($search, $request) {
                    $matchSearch = true;
                    $matchFilter = true;

                    if (! empty($search)) {
                        $searchLower = strtolower($search);
                        $matchSearch = (
                            str_contains(strtolower($application->name ?? ''), $searchLower) ||
                            str_contains(strtolower($application->vacancy->position_description ?? ''), $searchLower) ||
                            str_contains(strtolower($application->publication->reference_no ?? ''), $searchLower) ||
                            str_contains(strtolower($application->date_submitted ?? ''), $searchLower)
                        );
                    }

                    if ($request->filled('division')) {
                        $matchFilter = $matchFilter && (($application->vacancy->division ?? null) === $request->input('division'));
                    }

                    if ($request->filled('appointment_status')) {
                        $matchFilter = $matchFilter && (($application->vacancy->appointment_status ?? null) === $request->input('appointment_status'));
                    }

                    return $matchSearch && $matchFilter;
                })->values()
            );
        }

        return Inertia::render('Applications/index', [
            'data' => [
                'applications' => $applications,
            ],
        ]);
    }
}
