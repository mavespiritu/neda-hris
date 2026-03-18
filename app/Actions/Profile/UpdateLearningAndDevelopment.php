<?php

namespace App\Actions\Profile;

use App\Services\Profile\ProfileContextResolver;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use Illuminate\Support\Facades\Gate;

class UpdateLearningAndDevelopment
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

    public function asController(ActionRequest $request, int $id)
    {
        try {
            $context = $this->contextResolver->resolve();
            $user = $context['user'];
            $type = $context['type'];
            $conn = $context['appConn'];

            $data = $request->validated();

            $updated = $conn->table('applicant_learning')
                ->join('applicant', 'applicant.id', '=', 'applicant_learning.applicant_id')
                ->where('applicant_learning.id', $id)
                ->where('applicant.user_id', $user->id)
                ->where('applicant.type', $type)
                ->update([
                    'seminar_title' => $data['seminar_title'],
                    'from_date' => $data['from_date'],
                    'to_date' => $data['to_date'],
                    'hours' => $data['hours'],
                    'participation' => $data['participation'],
                    'applicant_learning.type' => $data['type'],
                    'conducted_by' => $data['conducted_by'],
                ]);

            abort_unless($updated, 404);

            return response()->json([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Learning and development updated successfully.',
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to update learning and development: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating the record.',
            ], 500);
        }
    }
}
