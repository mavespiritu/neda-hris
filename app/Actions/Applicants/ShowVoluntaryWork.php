<?php

namespace App\Actions\Applicants;

use App\Services\Applicants\VoluntaryWorkFormBuilder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowVoluntaryWork
{
    use AsAction;

    public function __construct(
        protected VoluntaryWorkFormBuilder $builder
    ) {
    }

    public function authorize(ActionRequest $request): bool
    {
        return $request->user() !== null;
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
            Log::error('Failed to fetch applicant voluntary work: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while fetching voluntary work. Please try again.',
            ], 500);
        }
    }
}
