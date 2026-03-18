<?php

namespace App\Actions\Competencies;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Lorisleiva\Actions\Concerns\AsAction;

class ListSubmissions
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('submissions', 'gap-analysis');
    }

    public function asController(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $rolePriorities = config('roles.priorities');
        $userRoles = $request->user()->roles->pluck('name')->toArray();
        $highestRole = collect($userRoles)
            ->mapWithKeys(fn ($role) => [$role => $rolePriorities[$role] ?? 0])
            ->sortDesc()
            ->keys()
            ->first();

        $search = trim($request->input('search', ''));

        $positions = $conn3->table('tblemp_position_item as epi')
            ->join('tblposition as p', 'p.position_id', '=', 'epi.position_id')
            ->select('epi.item_no', 'p.post_description')
            ->get()
            ->pluck('post_description', 'item_no');

        $employeeQuery = $conn3->table('tblemployee as e')
            ->select([
                DB::raw('CAST(e.emp_id AS CHAR) as emp_id'),
                DB::raw('CONCAT(e.lname, ", ", e.fname, " ", e.mname) as name'),
            ])
            ->where('e.work_status', 'Active');

        switch ($highestRole) {
            case 'HRIS_ADC':
            case 'HRIS_DC':
                $employeeQuery->where('e.division_id', $request->user()->division);
                break;
        }

        $employees = $employeeQuery->get()->pluck('name', 'emp_id');
        $empIds = $employees->keys();

        $filteredEmpIDs = collect();
        $filteredItemNos = collect();

        if ($search !== '') {
            $filteredEmpIDs = $employees->filter(fn ($name) => stripos($name, $search) !== false)->keys();
            $filteredItemNos = $positions->filter(fn ($postDescription) => stripos($postDescription, $search) !== false)->keys();
        }

        $submissions = $conn2->table('staff_competency_review as scr')
            ->select([
                'scr.id',
                'scr.emp_id',
                'scr.year',
                'scr.position_id',
                DB::raw("DATE_FORMAT(date_created, '%M %d, %Y %h:%i:%s %p') as date_submitted"),
                'scr.status',
                'scr.acted_by',
                'scr.endorsed_by',
                DB::raw("DATE_FORMAT(scr.date_acted, '%M %d, %Y %h:%i:%s %p') as date_acted"),
                DB::raw("DATE_FORMAT(scr.date_endorsed, '%M %d, %Y %h:%i:%s %p') as date_endorsed"),
            ])
            ->whereIn('scr.emp_id', $empIds);

        if ($search !== '') {
            $submissions->where(function ($query) use ($filteredEmpIDs, $filteredItemNos, $search) {
                if ($filteredEmpIDs->isNotEmpty()) {
                    $query->whereIn('scr.emp_id', $filteredEmpIDs);
                }

                if ($filteredItemNos->isNotEmpty()) {
                    $query->orWhereIn('scr.position_id', $filteredItemNos);
                }

                $query->orWhere(function ($subQuery) use ($search) {
                    $subQuery->where(function ($q) use ($search) {
                        $q->where('scr.status', 'like', "%{$search}%")
                            ->orWhere(function ($q2) use ($search) {
                                if (stripos('Submitted', $search) !== false) {
                                    $q2->whereNull('scr.status');
                                }
                            });
                    });
                });

                $query->orWhereRaw("DATE_FORMAT(scr.date_created, '%M %d, %Y') like ?", ["%{$search}%"]);
            });
        }

        $submissions = $submissions->orderBy('scr.date_created', 'desc')->paginate(20);

        $submissions->getCollection()->transform(function ($submission) use ($positions, $employees) {
            $submission->position = $positions[$submission->position_id] ?? null;
            $submission->name = $employees[$submission->emp_id] ?? null;
            return $submission;
        });

        return Inertia::render('Competencies/ReviewCga/index', [
            'submissions' => $submissions,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }
}
