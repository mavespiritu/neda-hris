<?php

namespace App\Actions\Applicants;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Lorisleiva\Actions\Concerns\AsAction;

class ListApplicants
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('list', 'applicants');
    }

    public function asController(Request $request)
    {
        $conn = DB::connection('mysql');

        $sort = $request->get('sort');
        $direction = strtolower($request->get('direction', 'asc')) === 'desc' ? 'desc' : 'asc';
        $search = $request->input('search', '');

        $sortable = [
            'name' => DB::raw("CONCAT(
                a.last_name,
                IF(a.ext_name IS NOT NULL AND a.ext_name != '', CONCAT(' ', a.ext_name), ''),
                ', ',
                a.first_name,
                ' ',
                IFNULL(CONCAT(LEFT(a.middle_name, 1), '.'), '')
            )"),
            'birth_date' => DB::raw('birth_date'),
            'email_address' => DB::raw('email_address'),
            'mobile_no' => DB::raw('mobile_no'),
        ];

        $searchable = [
            'name',
            'birth_date',
            'email_address',
            'mobile_no',
        ];

        $filterable = [
            'type' => 'a.type',
            'gender' => 'a.gender',
        ];

        $applicantsQuery = $conn->table('applicant as a')
            ->select([
                'a.*',
                DB::raw("CONCAT(
                    a.last_name,
                    IF(a.ext_name IS NOT NULL AND a.ext_name != '', CONCAT(' ', a.ext_name), ''),
                    ', ',
                    a.first_name,
                    ' ',
                    IFNULL(CONCAT(LEFT(a.middle_name, 1), '.'), '')
                ) AS name"),
            ]);

        foreach ($filterable as $param => $column) {
            if ($request->filled($param)) {
                $applicantsQuery->where($column, $request->input($param));
            }
        }

        if ($sort && isset($sortable[$sort]) && in_array(strtolower($direction), ['asc', 'desc'], true)) {
            $applicantsQuery->orderBy($sortable[$sort], $direction);
        }

        $applicants = $applicantsQuery
            ->whereNotNull('type')
            ->whereNotNull('last_name')
            ->orderBy('a.id', 'desc')
            ->paginate(20);

        if ($search) {
            $searchLower = strtolower($search);

            $applicants->setCollection(
                $applicants->getCollection()->filter(function ($applicant) use ($searchable, $searchLower) {
                    foreach ($searchable as $field) {
                        if (str_contains(strtolower($applicant->{$field} ?? ''), $searchLower)) {
                            return true;
                        }
                    }

                    return false;
                })->values()
            );
        }

        return Inertia::render('Applicants/index', [
            'data' => [
                'applicants' => $applicants,
            ],
        ]);
    }
}
