<?php

namespace App\Actions\Applicants;

use App\Services\Profile\ProfileStepUpdater;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class StoreCivilServiceEligibility
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
            'eligibility' => ['required', 'string'],
            'rating' => ['required', 'string'],
            'exam_date' => ['required', 'date'],
            'exam_place' => ['required', 'string'],
            'license_no' => ['required', 'string'],
            'validity_date' => ['required', 'date'],
        ];
    }

    public function asController(ActionRequest $request, int $applicantId)
    {
        try {
            $conn = DB::connection('mysql');
            $data = $request->validated();

            $id = $conn->table('applicant_eligibility')->insertGetId([
                'applicant_id' => $applicantId,
                'eligibility' => $data['eligibility'],
                'rating' => $data['rating'],
                'exam_date' => $data['exam_date'] ?? null,
                'exam_place' => $data['exam_place'],
                'license_no' => $data['license_no'],
                'validity_date' => $data['validity_date'] ?? null,
            ]);

            $this->stepUpdater->markComplete($conn, $applicantId, 'civilServiceEligibility');

            return response()->json([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Civil service eligibility added successfully.',
                'id' => $id,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to store applicant civil service eligibility: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving the record.',
            ], 500);
        }
    }
}
