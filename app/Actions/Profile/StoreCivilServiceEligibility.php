<?php

namespace App\Actions\Profile;

use App\Services\Profile\ProfileContextResolver;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use Illuminate\Support\Facades\Gate;

class StoreCivilServiceEligibility
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
            'rating' => ['required', 'string'],
            'exam_date' => ['required', 'date'],
            'exam_place' => ['required', 'string'],
            'license_no' => ['required', 'string'],
            'validity_date' => ['required', 'date'],
        ];
    }

    public function asController(ActionRequest $request)
    {
        try {
            $context = $this->contextResolver->resolve();
            $user = $context['user'];
            $type = $context['type'];
            $conn = $context['appConn'];

            $data = $request->validated();

            $conn->table('applicant')->updateOrInsert(
                [
                    'user_id' => $user->id,
                    'type' => $type,
                ],
                [
                    'user_id' => $user->id,
                    'type' => $type,
                    'emp_id' => $user->ipms_id ?? null,
                ]
            );

            $applicantId = $conn->table('applicant')
                ->where('user_id', $user->id)
                ->where('type', $type)
                ->value('id');

            $data['applicant_id'] = $applicantId;

            $id = $conn->table('applicant_eligibility')->insertGetId($data);

            return response()->json([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Civil service eligibility added successfully.',
                'id' => $id,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to store civil service eligibility: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving the record.',
            ], 500);
        }
    }
}
