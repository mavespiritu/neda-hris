<?php

namespace App\Actions\Vacancies;

use App\Services\Vacancies\VacancyFormBuilder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
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
            && Gate::forUser($request->user())->allows('edit', 'vacancies');
    }

    public function asController(int $id)
    {
        return Inertia::render('Vacancies/EditVacancy', [
            'vacancy' => $this->builder->build(DB::connection('mysql2'), $id),
        ]);
    }
}
