<?php

namespace App\Actions\Applicants;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Lorisleiva\Actions\Concerns\AsAction;

class EditApplicant
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('edit', 'applicants');
    }

    public function asController(int $id)
    {
        $conn = DB::connection('mysql');

        $applicant = $conn->table('applicant')
            ->where('id', $id)
            ->first();

        if (! $applicant) {
            abort(404);
        }

        $progress = $conn->table('applicant_pds')
            ->where('applicant_id', $id)
            ->pluck('status', 'step')
            ->toArray();

        return Inertia::render('Applicants/Wizard/index', [
            'applicantId' => (int) $id,
            'profileType' => $applicant->type ?? 'Applicant',
            'progress' => $progress,
        ]);
    }
}
