<?php

namespace App\Actions\Profile;

use App\Services\Profile\ProfileContextResolver;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use Illuminate\Support\Facades\Gate;

class UpdateVoluntaryWork
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
            'org_name' => ['required', 'string'],
            'org_address' => ['required', 'string'],
            'from_date' => ['required', 'date'],
            'to_date' => ['nullable', 'date', 'after_or_equal:from_date'],
            'hours' => ['nullable', 'numeric'],
            'nature_of_work' => ['required', 'string'],
            'isPresent' => ['required', 'boolean'],
        ];
    }

    public function withValidator($validator, ActionRequest $request): void
    {
        $validator->after(function ($validator) use ($request) {
            $data = $request->all();

            $isPresent = filter_var($data['isPresent'] ?? false, FILTER_VALIDATE_BOOLEAN);

            if (! $isPresent && blank($data['to_date'] ?? null)) {
                $validator->errors()->add(
                    'to_date',
                    'The end date is required when this is not your present voluntary work.'
                );
            }

            if (! $isPresent && blank($data['hours'] ?? null)) {
                $validator->errors()->add(
                    'hours',
                    'The number of hours is required when this is not your present voluntary work.'
                );
            }
        });
    }

    public function getValidationMessages(): array
    {
        return [
            'to_date.date' => 'The to date must be a valid date.',
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

            $updated = $conn->table('applicant_voluntary_work')
                ->join('applicant', 'applicant.id', '=', 'applicant_voluntary_work.applicant_id')
                ->where('applicant_voluntary_work.id', $id)
                ->where('applicant.user_id', $user->id)
                ->where('applicant.type', $type)
                ->update([
                    'org_name' => $data['org_name'],
                    'org_address' => $data['org_address'],
                    'from_date' => $data['from_date'],
                    'to_date' => $data['to_date'],
                    'hours' => $data['hours'],
                    'nature_of_work' => $data['nature_of_work'],
                    'isPresent' => $data['isPresent'] ?? null,
                ]);

            abort_unless($updated, 404);

            return response()->json([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Voluntary work updated successfully.',
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to update voluntary work: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating the record.',
            ], 500);
        }
    }
}
