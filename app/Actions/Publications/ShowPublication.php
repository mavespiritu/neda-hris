<?php

namespace App\Actions\Publications;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowPublication
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.publications.view');
    }

    public function asController(int $id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

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

        $signatoryName = $conn2->table('settings')->where('title', 'Agency Head')->first();
        $signatoryPosition = $conn2->table('settings')->where('title', 'Agency Head Position')->first();
        $agencyAddress = $conn2->table('settings')->where('title', 'Agency Address')->first();

        $requirements = $conn2->table('recruitment_requirements')
            ->where('is_default', 1)
            ->pluck('requirement');

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

        $buildVacanciesQuery = function () use ($conn2, $publication) {
            return $conn2->table('publication_vacancies as pv')
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
                    'v.step',
                    'v.monthly_salary',
                    'v.prescribed_education',
                    'v.prescribed_training',
                    'v.prescribed_experience',
                    'v.prescribed_eligibility',
                ])
                ->where('pv.publication_id', $publication->id);
        };

        $vacanciesQuery = $buildVacanciesQuery();

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

        $paginatedVacancies = (clone $vacanciesQuery)->orderBy('pv.id', 'desc')->paginate(20);
        $allVacancies = (clone $vacanciesQuery)->orderBy('pv.id', 'desc')->get();

        if ($search) {
            $searchLower = strtolower($search);
            $paginatedVacancies->setCollection(
                $paginatedVacancies->getCollection()->filter(function ($vacancy) use ($searchable, $searchLower) {
                    foreach ($searchable as $field) {
                        if (str_contains(strtolower($vacancy->{$field} ?? ''), $searchLower)) {
                            return true;
                        }
                    }

                    return false;
                })->values()
            );
        }

        $addMetaToVacancy = function ($vacancy) use ($conn2, $conn3) {
            $vacancyCompetencies = $conn2->table('vacancy_competencies as vc')
                ->leftJoin('competency as c', 'c.comp_id', '=', 'vc.competency_id')
                ->select('vc.competency_id as id', 'c.competency', 'vc.level', 'vc.comp_type')
                ->where('vacancy_id', $vacancy->vacancy_id ?? $vacancy->id)
                ->get()
                ->groupBy('comp_type');

            $vacancy->competencies = [
                'organizational' => $vacancyCompetencies->get('org', collect())->values(),
                'leadership' => $vacancyCompetencies->get('mnt', collect())->values(),
                'functional' => $vacancyCompetencies->get('func', collect())->values(),
            ];

            $salary = $conn3->table('tblprl_salary_schedule')
                ->select('salary')
                ->where('grade', $vacancy->sg)
                ->where('step', $vacancy->step)
                ->orderByDesc('effectivity_date_start')
                ->first();

            $position = $conn3->table('tblposition')
                ->select('post_description')
                ->where('position_id', $vacancy->position)
                ->first();

            $vacancy->monthly_salary = $salary->salary ?? $vacancy->monthly_salary ?? 0;
            $vacancy->positionTitle = $position->post_description ?? $vacancy->position_description ?? '';

            return $vacancy;
        };

        $paginatedVacancies->getCollection()->transform($addMetaToVacancy);
        $allVacancies = $allVacancies->map($addMetaToVacancy);

        return Inertia::render('Publications/View', [
            'data' => [
                'publication' => $publication,
                'vacancies' => $paginatedVacancies,
                'allVacancies' => $allVacancies,
                'signatoryName' => $signatoryName ? $signatoryName->value : '',
                'signatoryPosition' => $signatoryPosition ? $signatoryPosition->value : '',
                'agencyAddress' => $agencyAddress ? $agencyAddress->value : '',
                'requirements' => $requirements,
            ],
        ]);
    }
}
