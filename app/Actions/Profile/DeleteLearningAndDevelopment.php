<?php

namespace App\Actions\Profile;

use App\Services\Profile\ProfileContextResolver;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class DeleteLearningAndDevelopment
{
    use AsAction;

    public function __construct(
        protected ProfileContextResolver $contextResolver
    ) {
    }

    public function authorize(ActionRequest $request): bool
    {
        return $request->user() !== null;
    }

    public function asController(ActionRequest $request, int $id)
    {
        try {
            $context = $this->contextResolver->resolve();
            $user = $context['user'];
            $type = $context['type'];
            $conn = $context['appConn'];

            $record = $conn->table('applicant_learning')
                ->join('applicant', 'applicant.id', '=', 'applicant_learning.applicant_id')
                ->where('applicant_learning.id', $id)
                ->where('applicant.user_id', $user->id)
                ->where('applicant.type', $type)
                ->select('applicant_learning.id')
                ->first();

            abort_unless($record, 404);

            $conn->table('applicant_learning')
                ->where('id', $id)
                ->delete();

            return response()->json([
                'status' => 'success',
                'title' => 'Deleted',
                'message' => 'Learning and development deleted successfully.',
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to delete learning and development: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the record.',
            ], 500);
        }
    }
}
