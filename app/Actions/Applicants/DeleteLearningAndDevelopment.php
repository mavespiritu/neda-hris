<?php

namespace App\Actions\Applicants;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class DeleteLearningAndDevelopment
{
    use AsAction;

    public function authorize(ActionRequest $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.applicants.delete');
    }

    public function asController(ActionRequest $request, int $applicantId, int $id)
    {
        try {
            $deleted = DB::connection('mysql')->table('applicant_learning')
                ->where('applicant_id', $applicantId)
                ->where('id', $id)
                ->delete();
            abort_unless($deleted, 404);
            return response()->json(['status' => 'success','title' => 'Deleted','message' => 'Learning and development deleted successfully.']);
        } catch (\Throwable $e) {
            Log::error('Failed to delete applicant learning and development: ' . $e->getMessage());
            return response()->json(['status' => 'error','title' => 'Uh oh! Something went wrong.','message' => 'An error occurred while deleting the record.'], 500);
        }
    }
}
