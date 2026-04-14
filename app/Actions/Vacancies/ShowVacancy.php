<?php

namespace App\Actions\Vacancies;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowVacancy
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.vacancies.view');
    }

    public function asController(int $id, Request $request)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $search = $request->input('search', '');
        $competencyFilter = $request->input('competency');
        $matchingEmployeeIds = collect();

        if (! empty($search)) {
            $matchingEmployeeIds = $conn3->table('tblemployee')
                ->where(DB::raw("CONCAT(fname, ' ', lname)"), 'like', '%' . $search . '%')
                ->pluck('emp_id');
        }

        $vacancy = $conn2->table('vacancy')->where('id', $id)->first();
        if (! $vacancy) {
            abort(404, 'Vacancy not found.');
        }

        $requirementsCount = $conn2->table('vacancy_requirements')
            ->where('vacancy_id', $id)
            ->count();

        $applicantsCount = $conn->query()
            ->fromSub(
                $conn->table('application as a')
                    ->where('a.vacancy_id', $id)
                    ->where('a.status', 'Submitted')
                    ->select('a.user_id')
                    ->groupBy('a.user_id'),
                'unique_applicants'
            )
            ->count();

        $vacancy->requirements_count = (int) $requirementsCount;
        $vacancy->applicants_count = (int) $applicantsCount;

        $competencies = $conn2->table('vacancy_competencies as vc')
            ->leftJoin('competency as c', 'vc.competency_id', '=', 'c.comp_id')
            ->where('vc.vacancy_id', $vacancy->id)
            ->select(
                'c.comp_id as value',
                DB::raw('CONCAT(c.competency, " (Level ", vc.level, ")") as label'),
                'c.competency',
                'vc.level',
                'vc.comp_type'
            )
            ->get();

        $questionsQuery = $conn2->table('vacancy_questions as vq')
            ->where('vq.vacancy_id', $id)
            ->when($competencyFilter, function ($q) use ($conn2, $competencyFilter) {
                $questionIds = $conn2->table('vacancy_question_competencies')
                    ->where('competency_id', $competencyFilter)
                    ->pluck('question_id');
                $q->whereIn('vq.id', $questionIds);
            })
            ->when($search, function ($query) use ($search, $matchingEmployeeIds) {
                $query->where(function ($q) use ($search, $matchingEmployeeIds) {
                    $q->where('vq.question', 'like', '%' . $search . '%');
                    if ($matchingEmployeeIds->isNotEmpty()) {
                        $q->orWhereIn('vq.created_by', $matchingEmployeeIds);
                    }
                });
            })
            ->select('vq.id', 'vq.question', 'vq.created_by', 'vq.date_created')
            ->orderByDesc('vq.id');

        $questions = $questionsQuery->paginate(20);
        $questionIds = $questions->pluck('id')->toArray();

        $competencyNames = $conn2->table('vacancy_question_competencies as vqc')
            ->leftJoin('competency as c', 'vqc.competency_id', '=', 'c.comp_id')
            ->whereIn('vqc.question_id', $questionIds)
            ->select('vqc.question_id', 'c.competency')
            ->get()
            ->groupBy('question_id')
            ->map(fn ($items) => $items->pluck('competency')->filter()->unique()->sort()->implode(', '));

        $competencyIds = $conn2->table('vacancy_question_competencies')
            ->whereIn('question_id', $questionIds)
            ->select('question_id', 'competency_id')
            ->get()
            ->groupBy('question_id');

        $ratings = $conn2->table('vacancy_ratings')
            ->whereIn('question_id', $questionIds)
            ->select('question_id', 'score', 'title', 'description', 'element')
            ->orderBy('score')
            ->get()
            ->groupBy('question_id');

        $creatorIds = $questions->pluck('created_by')->filter()->unique();
        $employees = $conn3->table('tblemployee')
            ->whereIn('emp_id', $creatorIds)
            ->select('emp_id', 'fname', 'lname')
            ->get()
            ->keyBy('emp_id')
            ->map(fn ($e) => $e->fname . ' ' . $e->lname);

        $questions->getCollection()->transform(function ($item) use ($ratings, $competencyIds, $competencyNames, $employees) {
            $item->ratings = optional($ratings->get($item->id))->values() ?? collect();
            $item->competencyIds = optional($competencyIds->get($item->id))->pluck('competency_id')->values() ?? collect();
            $item->competencies = $competencyNames->get($item->id) ?? '';
            $item->creator = $employees->get($item->created_by) ?? null;
            return $item;
        });

        return Inertia::render('Vacancies/ViewVacancy', [
            'vacancy' => $vacancy,
            'competencies' => $competencies,
            'questions' => $questions,
        ]);
    }
}
