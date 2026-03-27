<?php

namespace App\Actions\Vacancies;

use App\Models\AppExamResult;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Lorisleiva\Actions\Concerns\AsAction;

class StoreApplicantExamResult
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        $user = $request->user();

        if (! $user) {
            return false;
        }

        $allowedRoles = ['HRIS_HR', 'HRIS_RD', 'HRIS_ARD'];
        $userRoles = $user->roles->pluck('name')->toArray();

        return (bool) array_intersect($allowedRoles, $userRoles);
    }

    public function asController(Request $request, int $vacancy, int $application)
    {
        $validated = $request->validate([
            'test_type' => ['required', Rule::in(['Skill Test', 'DPE'])],
            'date_conducted' => ['required', 'date'],
            'status' => ['required', 'string', 'max:100'],
            'score' => ['nullable', 'string', 'max:100'],
        ]);

        $ipmsId = $request->user()?->ipms_id;

        $result = AppExamResult::query()->updateOrCreate(
            [
                'application_id' => $application,
                'vacancy_id' => $vacancy,
                'test_type' => $validated['test_type'],
            ],
            [
                'date_conducted' => $validated['date_conducted'],
                'status' => $validated['status'],
                'score' => $validated['score'] ?? null,
                'created_by' => $ipmsId,
                'updated_by' => $ipmsId,
            ]
        );

        return response()->json([
            'status' => 'success',
            'title' => 'Success!',
            'message' => $validated['test_type'] . ' result saved successfully.',
            'data' => $result,
        ]);
    }
}
