<?php

namespace App\Actions\Applicants;

use App\Services\Applicants\OtherInformationFormBuilder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowOtherInformation
{
    use AsAction;

    public function __construct(
        protected OtherInformationFormBuilder $builder
    ) {
    }

    public function authorize(ActionRequest $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.applicants.page.view');
    }

    public function handle(?int $applicantId = null): array
    {
        return $this->builder->build(DB::connection('mysql'), $applicantId);
    }

    public function asController(ActionRequest $request, ?int $applicantId = null)
    {
        try {
            return response()->json($this->handle($applicantId));
        } catch (\Throwable $e) {
            Log::error('Failed to fetch applicant other information: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while fetching other information. Please try again.',
            ], 500);
        }
    }
}
