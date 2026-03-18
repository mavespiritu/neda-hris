<?php

namespace App\Actions\Applicants;

use App\Services\Applicants\PersonalInformationFormBuilder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowPersonalInformation
{
    use AsAction;

    public function __construct(
        protected PersonalInformationFormBuilder $builder
    ) {
    }

    public function authorize(ActionRequest $request): bool
    {
        return $request->user() !== null;
    }

    public function handle(?int $applicantId = null): object
    {
        return $this->builder->build(DB::connection('mysql'), $applicantId);
    }

    public function asController(ActionRequest $request, ?int $applicantId = null)
    {
        try {
            return response()->json($this->handle($applicantId));
        } catch (\Throwable $e) {
            Log::error('Failed to fetch applicant personal information: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while fetching personal information. Please try again.',
            ], 500);
        }
    }
}
