<?php

namespace App\Actions\Vacancies;

use App\Services\Vacancies\VacancyFormBuilder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Lorisleiva\Actions\Concerns\AsAction;

class EditVacancy
{
    use AsAction;

    public function __construct(protected VacancyFormBuilder $builder)
    {
    }

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.vacancies.update');
    }

    public function asController(int $id)
    {
        return Inertia::render('Vacancies/EditVacancy', [
            'vacancy' => $this->builder->build(DB::connection('mysql2'), $id),
        ]);
    }
}
