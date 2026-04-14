<?php

namespace App\Actions\Vacancies;

use App\Services\Vacancies\VacancyFormBuilder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Lorisleiva\Actions\Concerns\AsAction;

class CreateVacancy
{
    use AsAction;

    public function __construct(protected VacancyFormBuilder $builder)
    {
    }

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.vacancies.create');
    }

    public function asController()
    {
        return Inertia::render('Vacancies/CreateVacancy', [
            'vacancy' => $this->builder->build(DB::connection('mysql2')),
        ]);
    }
}
