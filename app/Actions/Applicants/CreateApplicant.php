<?php

namespace App\Actions\Applicants;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Lorisleiva\Actions\Concerns\AsAction;

class CreateApplicant
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.applicants.create');
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
