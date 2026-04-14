<?php

namespace App\Actions\Profile;

use App\Services\Profile\ProfileContextResolver;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

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

            $recordExists = $conn->table('applicant_learning as al')
                ->join('applicant as a', 'a.id', '=', 'al.applicant_id')
                ->where('al.id', $id)
                ->where('a.user_id', $user->id)
                ->where('a.type', $type)
                ->exists();

            abort_unless($recordExists, 404);

            $conn->table('applicant_learning')
                ->where('id', $id)
                ->update([
                    'seminar_title' => $data['seminar_title'],
                    'from_date' => $data['from_date'],
                    'to_date' => $data['to_date'],
                    'hours' => $data['hours'],
                    'participation' => $data['participation'],
                    'type' => $data['type'],
                    'conducted_by' => $data['conducted_by'],
                ]);

            return response()->json([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Learning and development updated successfully.',
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to update learning and development', [
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
