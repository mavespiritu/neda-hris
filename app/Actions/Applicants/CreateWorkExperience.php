<?php

namespace App\Actions\Applicants;

use App\Services\Applicants\WorkExperienceRecordFormBuilder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class CreateWorkExperience
{
    use AsAction;

    public function __construct(protected WorkExperienceRecordFormBuilder $builder)
    {
    }

    public function authorize(ActionRequest $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.applicants.create');
    }

    public function asController(ActionRequest $request, int $applicantId)
    {
        try {
            return response()->json($this->builder->build(DB::connection('mysql'), $applicantId));
        } catch (\Throwable $e) {
            Log::error('Failed to fetch applicant work experience create form: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while opening the form.',
            ], 500);
        }
    }
}
