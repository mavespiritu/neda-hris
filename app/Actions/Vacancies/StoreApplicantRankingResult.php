<?php

namespace App\Actions\Vacancies;

use App\Models\AppRankingResult;
use Illuminate\Http\Request;
use Lorisleiva\Actions\Concerns\AsAction;

class StoreApplicantRankingResult
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.vacancies.assessment.applicants.rank');
    }

    public function asController(Request $request, int $vacancy, int $application)
    {
        $validated = $request->validate([
            'rank' => ['required', 'string', 'max:100'],
            'date_ranked' => ['required', 'date'],
        ]);

        $ipmsId = $request->user()?->ipms_id;

        $result = AppRankingResult::query()->updateOrCreate(
            [
                'application_id' => $application,
                'vacancy_id' => $vacancy,
            ],
            [
                'rank' => $validated['rank'],
                'date_ranked' => $validated['date_ranked'],
                'created_by' => $ipmsId,
                'updated_by' => $ipmsId,
            ]
        );

        return response()->json([
            'status' => 'success',
            'title' => 'Success!',
            'message' => 'Ranking saved successfully.',
            'data' => $result,
        ]);
    }
}
