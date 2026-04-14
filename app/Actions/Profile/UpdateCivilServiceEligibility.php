<?php

namespace App\Actions\Profile;

use App\Services\Profile\ProfileContextResolver;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class UpdateCivilServiceEligibility
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

    public function rules(): array
    {
        return [
            'eligibility' => ['required', 'string'],
            'rating' => ['nullable', 'string'],
            'exam_date' => ['required', 'date'],
            'exam_place' => ['required', 'string'],
            'license_no' => ['nullable', 'string'],
            'validity_date' => ['nullable', 'date'],
        ];
    }

    public function asController(ActionRequest $request, int $id)
    {
        try {
            $context = $this->contextResolver->resolve();
            $user = $context['user'];
            $type = $context['type'];
            $conn = $context['appConn'];

            $data = $request->validated();

            $recordExists = $conn->table('applicant_eligibility as ae')
                ->join('applicant as a', 'a.id', '=', 'ae.applicant_id')
                ->where('ae.id', $id)
                ->where('a.user_id', $user->id)
                ->where('a.type', $type)
                ->exists();

            abort_unless($recordExists, 404);

            $conn->table('applicant_eligibility')
                ->where('id', $id)
                ->update([
                    'eligibility' => $data['eligibility'],
                    'rating' => $data['rating'] ?? null,
                    'exam_date' => $data['exam_date'],
                    'exam_place' => $data['exam_place'],
                    'license_no' => $data['license_no'] ?? null,
                    'validity_date' => $data['validity_date'] ?? null,
                ]);

            return response()->json([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Civil service eligibility updated successfully.',
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to update civil service eligibility', [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating the record.',
            ], 500);
        }
    }
}
