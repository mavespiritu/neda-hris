<?php

namespace App\Actions\Applicants;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class DeleteCivilServiceEligibility
{
    use AsAction;

    public function authorize(ActionRequest $request): bool
    {
        return $request->user() !== null;
    }

    public function asController(ActionRequest $request, int $applicantId, int $id)
    {
        try {
            $deleted = DB::connection('mysql')->table('applicant_eligibility')
                ->where('applicant_id', $applicantId)
                ->where('id', $id)
                ->delete();

            abort_unless($deleted, 404);

            return response()->json([
                'status' => 'success',
                'title' => 'Deleted',
                'message' => 'Civil service eligibility deleted successfully.',
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to delete applicant civil service eligibility: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the record.',
            ], 500);
        }
    }
}
