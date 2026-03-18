<?php

namespace App\Actions\Vacancies;

use App\Services\Vacancies\VacancyFormBuilder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
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
            && Gate::forUser($request->user())->allows('create', 'vacancies');
    }

    public function asController()
    {
        return Inertia::render('Vacancies/CreateVacancy', [
            'vacancy' => $this->builder->build(DB::connection('mysql2')),
        ]);
    }
}
