<?php

namespace App\Actions\Profile;

use App\Services\Profile\ProfileContextResolver;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use Illuminate\Support\Facades\Gate;

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

            $updated = $conn->table('applicant_eligibility')
                ->join('applicant', 'applicant.id', '=', 'applicant_eligibility.applicant_id')
                ->where('applicant_eligibility.id', $id)
                ->where('applicant.user_id', $user->id)
                ->where('applicant.type', $type)
                ->update([
                    'eligibility' => $data['eligibility'],
                    'rating' => $data['rating'] ?? null,
                    'exam_date' => $data['exam_date'],
                    'exam_place' => $data['exam_place'],
                    'license_no' => $data['license_no'] ?? null,
                    'validity_date' => $data['validity_date'] ?? null,
                ]);

            abort_unless($updated, 404);

            return response()->json([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Civil service eligibility updated successfully.',
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to update civil service eligibility: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating the record.',
            ], 500);
        }
    }
}
