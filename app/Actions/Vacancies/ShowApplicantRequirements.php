<?php

namespace App\Actions\Vacancies;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowApplicantRequirements
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.vacancies.applicants.view');
    }

    public function asController(Request $request, int $id)
    {
        $application = DB::connection('mysql')->table('application')->where('id', $id)->first();

        if (! $application) {
            return response()->json(['message' => 'Application not found'], 404);
        }

        return response()->json(app(ApplicantDataSupport::class)->buildRequirementsData($application));
    }
}
