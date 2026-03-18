<?php

namespace App\Actions\Applicants;

use App\Services\Profile\ProfileStepUpdater;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class UpdateWorkExperience
{
    use AsAction;

    public function __construct(protected ProfileStepUpdater $stepUpdater)
    {
    }

    public function authorize(ActionRequest $request): bool
    {
        return $request->user() !== null;
    }

    public function rules(): array
    {
        return [
            'agency' => ['required', 'string'],
            'position' => ['required', 'string'],
            'appointment' => ['required', 'string'],
            'from_date' => ['required', 'date'],
            'to_date' => ['nullable', 'date', 'after_or_equal:from_date'],
            'isGovtService' => ['required', 'boolean'],
            'isPresent' => ['required', 'boolean'],
        ];
    }

    public function withValidator($validator, ActionRequest $request): void
    {
        $validator->after(function ($validator) use ($request) {
            $data = $request->all();
            $isPresent = filter_var($data['isPresent'] ?? false, FILTER_VALIDATE_BOOLEAN);

            if (! $isPresent && blank($data['to_date'] ?? null)) {
                $validator->errors()->add('to_date', 'The end date is required when this is not the present work.');
            }
        });
    }

    public function getValidationMessages(): array
    {
        return [
            'to_date.date' => 'The to date must be a valid date.',
            'to_date.after_or_equal' => 'The end date must be after or equal to the start date.',
        ];
    }

    public function asController(ActionRequest $request, int $applicantId, int $id)
    {
        try {
            $conn = DB::connection('mysql');
            $data = $request->validated();

            $updated = $conn->table('applicant_work_experience')
                ->where('applicant_id', $applicantId)
                ->where('id', $id)
                ->update([
                    'agency' => $data['agency'],
                    'position' => $data['position'],
                    'appointment' => $data['appointment'],
                    'from_date' => $data['from_date'],
                    'to_date' => filter_var($data['isPresent'] ?? false, FILTER_VALIDATE_BOOLEAN) ? null : ($data['to_date'] ?? null),
                    'isGovtService' => filter_var($data['isGovtService'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 1 : 0,
                    'isPresent' => filter_var($data['isPresent'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 1 : 0,
                ]);

            abort_unless($updated, 404);
            $this->stepUpdater->markComplete($conn, $applicantId, 'workExperience');

            return response()->json([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Work experience updated successfully.',
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to update applicant work experience: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating the record.',
            ], 500);
        }
    }
}
