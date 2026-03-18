<?php

namespace App\Actions\Applicants;

use App\Services\Applicants\LearningAndDevelopmentRecordFormBuilder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class EditLearningAndDevelopment
{
    use AsAction;

    public function __construct(protected LearningAndDevelopmentRecordFormBuilder $builder)
    {
    }

    public function authorize(ActionRequest $request): bool
    {
        return $request->user() !== null;
    }

    public function asController(ActionRequest $request, int $applicantId, int $id)
    {
        try {
            return response()->json($this->builder->build(DB::connection('mysql'), $applicantId, $id));
        } catch (\Throwable $e) {
            Log::error('Failed to fetch applicant learning and development record: ' . $e->getMessage());
            return response()->json(['status' => 'error','title' => 'Uh oh! Something went wrong.','message' => 'An error occurred while fetching the record.'], 500);
        }
    }
}
