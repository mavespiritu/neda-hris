<?php

namespace App\Actions\Applicants;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Lorisleiva\Actions\Concerns\AsAction;

class CreateApplicant
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('create', 'applicants');
    }

    public function asController()
    {
        return Inertia::render('Applicants/Wizard/index', [
            'applicantId' => null,
            'profileType' => 'Applicant',
            'progress' => [],
        ]);
    }
}
