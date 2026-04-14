<?php

namespace App\Actions\Applicants;

use App\Services\Profile\ProfileStepUpdater;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class StoreCivilServiceEligibilitySection
{
    use AsAction;

    public function __construct(
        protected ProfileStepUpdater $stepUpdater
    ) {
    }

    public function authorize(ActionRequest $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.applicants.create');
    }

    public function rules(): array
    {
        return [
            'civilServiceEligibility' => ['nullable', 'array'],
            'civilServiceEligibility.*.id' => ['nullable', 'integer'],
            'civilServiceEligibility.*.eligibility' => ['required'],
            'civilServiceEligibility.*.rating' => ['required'],
            'civilServiceEligibility.*.exam_date' => ['nullable', 'date'],
            'civilServiceEligibility.*.exam_place' => ['required'],
            'civilServiceEligibility.*.license_no' => ['required'],
            'civilServiceEligibility.*.validity_date' => ['nullable', 'date'],
        ];
    }

    public function getValidationMessages(): array
    {
        return [
            'civilServiceEligibility.*.eligibility.required' => 'Each eligibility\'s title is required.',
            'civilServiceEligibility.*.rating.required' => 'Each eligibility\'s rating is required.',
            'civilServiceEligibility.*.exam_place.required' => 'Each eligibility\'s examination place is required.',
            'civilServiceEligibility.*.license_no.required' => 'Each eligibility\'s license number is required.',
            'civilServiceEligibility.*.exam_date.date' => 'Must be a valid date.',
            'civilServiceEligibility.*.validity_date.date' => 'Must be a valid date.',
        ];
    }

    public function handle(array $data, int $applicantId)
    {
        $conn = DB::connection('mysql');

        try {
            $conn->beginTransaction();

            $this->stepUpdater->markComplete($conn, $applicantId, 'civilServiceEligibility');

            $conn->commit();

            if (request()->expectsJson()) {
                return response()->json([
                    'status' => 'success',
                    'title' => 'Success!',
                    'message' => 'Civil service eligibilities saved successfully! Proceed with this step.',
                    'applicantId' => $applicantId,
                    'nextStep' => 'workExperience',
                ]);
            }

            return redirect()->route('applicants.edit', [
                'id' => $applicantId,
                'step' => 'workExperience',
            ])->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Civil service eligibilities saved successfully! Proceed with this step.',
            ]);
        } catch (\Throwable $e) {
            $conn->rollBack();
            Log::error('Failed to save civil service eligibilities of applicant: ' . $e->getMessage());

            if (request()->expectsJson()) {
                return response()->json([
                    'status' => 'error',
                    'title' => 'Uh oh! Something went wrong.',
                    'message' => 'An error occurred while saving civil service eligibilities of an applicant. Please try again.',
                ], 500);
            }

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving civil service eligibilities of an applicant. Please try again.',
            ]);
        }
    }

    public function asController(ActionRequest $request, int $applicantId)
    {
        return $this->handle($request->validated(), $applicantId);
    }
}
