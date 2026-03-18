<?php

namespace App\Actions\Profile;

use App\Services\Profile\ProfileContextResolver;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use Illuminate\Support\Facades\Gate;

class StoreLearningAndDevelopment
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
            'seminar_title' => ['required', 'string'],
            'from_date' => ['required', 'date'],
            'to_date' => ['required', 'date', 'after_or_equal:from_date'],
            'hours' => ['required'],
            'participation' => ['required', 'string'],
            'type' => ['required', 'string'],
            'conducted_by' => ['required', 'string'],
        ];
    }

    public function getValidationMessages(): array
    {
        return [
            'from_date.date' => 'The start date must be a valid date.',
            'to_date.date' => 'The end date must be a valid date.',
            'to_date.after_or_equal' => 'The end date must be after or equal to the start date.',
            'hours.numeric' => 'The number of hours must be a valid number.',
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

            $id = $conn->table('applicant_learning')->insertGetId($data);

            return response()->json([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Learning and development added successfully.',
                'id' => $id,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to store learning and development: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving the record.',
            ], 500);
        }
    }
}
