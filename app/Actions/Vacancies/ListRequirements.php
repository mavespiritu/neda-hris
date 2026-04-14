<?php

namespace App\Actions\Vacancies;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\Concerns\AsAction;

class ListRequirements
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.vacancies.requirements.view');
    }

    public function asController(Request $request, int $id)
    {
        $conn2 = DB::connection('mysql2');

        $sort = $request->get('sort');
        $direction = strtolower($request->get('direction', 'asc')) === 'desc' ? 'desc' : 'asc';
        $search = $request->input('search', '');

        $sortable = [
            'requirement' => DB::raw('requirement'),
        ];

        $searchable = [
            'requirement',
        ];

        $requirementsQuery = $conn2->table('vacancy_requirements as vr')
            ->select('vr.*')
            ->where('vr.vacancy_id', $id);

        if ($sort && isset($sortable[$sort]) && in_array(strtolower($direction), ['asc', 'desc'], true)) {
            $requirementsQuery->orderBy($sortable[$sort], $direction);
        }

        $requirements = $requirementsQuery->paginate(20);

        if ($search) {
            $searchLower = strtolower($search);

            $requirements->setCollection(
                $requirements->getCollection()->filter(function ($requirement) use ($searchable, $searchLower) {
                    foreach ($searchable as $field) {
                        if (str_contains(strtolower($requirement->{$field} ?? ''), $searchLower)) {
                            return true;
                        }
                    }

                    return false;
                })->values()
            );
        }

        return response()->json($requirements);
    }
}
