<?php

namespace App\Actions\Profile;

use App\Services\Profile\ProfileContextResolver;
use App\Services\Profile\ProfileStepUpdater;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use Illuminate\Support\Facades\Gate;

class StoreEducationalBackground
{
    use AsAction;

    public function __construct(
        protected ProfileContextResolver $contextResolver,
        protected ProfileStepUpdater $stepUpdater
    ) {
    }

    public function authorize(ActionRequest $request): bool
    {
        return $request->user() !== null;
    }

    protected function levels(): array
    {
        return [
            'elementary' => 'Elementary',
            'secondary' => 'Secondary',
            'vocational' => 'Vocational/Trade Course',
            'college' => 'College',
            'graduate' => 'Graduate Studies',
        ];
    }

    public function rules(): array
    {
        $rules = [];

        foreach ($this->levels() as $key => $label) {
            $rules["$key"] = ['nullable', 'array'];
            $rules["$key.*.id"] = ['nullable'];
            $rules["$key.*.course"] = ['required'];
            $rules["$key.*.school"] = ['required'];
            $rules["$key.*.highest_attainment"] = ['required'];
            $rules["$key.*.from_year"] = ['required', 'digits:4'];
            $rules["$key.*.to_year"] = ['required', 'digits:4'];
            $rules["$key.*.award"] = ['required'];
            $rules["$key.*.year_graduated"] = ['nullable', 'digits:4'];
            $rules["$key.*.is_graduated"] = ['nullable', 'boolean'];
        }

        return $rules;
    }

    public function getValidationMessages(): array
    {
        $messages = [];

        foreach ($this->levels() as $key => $label) {
            $messages["$key.*.course.required"] = "Each $key's course is required.";
            $messages["$key.*.school.required"] = "Each $key's school is required.";
            $messages["$key.*.highest_attainment.required"] = "Each $key's highest level/units earned is required.";
            $messages["$key.*.from_year.required"] = "Each $key's start year is required.";
            $messages["$key.*.to_year.required"] = "Each $key's end year is required.";
            $messages["$key.*.from_year.digits"] = "Must be a 4-digit year.";
            $messages["$key.*.to_year.digits"] = "Must be a 4-digit year.";
            $messages["$key.*.award.required"] = "Each $key's scholarship/academic honors received is required.";
            $messages["$key.*.year_graduated.digits"] = "Each $key's year graduated must be a 4-digit year.";
        }

        return $messages;
    }

    public function withValidator($validator, ActionRequest $request): void
    {
        $validator->after(function ($validator) use ($request) {
            foreach ($this->levels() as $key => $label) {
                $entries = $request->input("$key", []);

                foreach ($entries as $index => $entry) {
                    if (!empty($entry['is_graduated']) && empty($entry['year_graduated'])) {
                        $validator->errors()->add(
                            "$key.$index.year_graduated",
                            'The year graduated is required when you have graduated.'
                        );
                    }

                    if (
                        !empty($entry['from_year']) &&
                        !empty($entry['to_year']) &&
                        (int) $entry['to_year'] < (int) $entry['from_year']
                    ) {
                        $validator->errors()->add(
                            "$key.$index.to_year",
                            'The end year must be after or equal to the start year.'
                        );
                    }
                }
            }
        });
    }

    public function asController(ActionRequest $request)
    {
        try {
            $context = $this->contextResolver->resolve();
            $user = $context['user'];
            $type = $context['type'];
            $conn = $context['appConn'];

            $data = $request->validated();

            $conn->beginTransaction();

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

            $allEntries = [];

            foreach ($this->levels() as $key => $label) {
                $entries = $data[$key] ?? [];

                foreach ($entries as $entry) {
                    $entry['level'] = $label;
                    $entry['applicant_id'] = $applicantId;
                    $allEntries[] = $entry;
                }
            }

            $existingIds = $conn->table('applicant_education')
                ->where('applicant_id', $applicantId)
                ->pluck('id')
                ->toArray();

            $incomingIds = collect($allEntries)
                ->pluck('id')
                ->filter()
                ->toArray();

            $idsToDelete = array_diff($existingIds, $incomingIds);

            if (!empty($idsToDelete)) {
                $conn->table('applicant_education')
                    ->where('applicant_id', $applicantId)
                    ->whereIn('id', $idsToDelete)
                    ->delete();
            }

            foreach ($allEntries as $entry) {
                if (!empty($entry['id'])) {
                    $id = $entry['id'];
                    unset($entry['id']);

                    $conn->table('applicant_education')
                        ->where('id', $id)
                        ->where('applicant_id', $applicantId)
                        ->update($entry);
                } else {
                    $conn->table('applicant_education')->insert($entry);
                }
            }

            $this->stepUpdater->markComplete($conn, (int) $applicantId, 'educationalBackground');

            $conn->commit();

            return back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Educational Background saved successfully.',
            ]);
        } catch (\Throwable $e) {
            if (isset($conn)) {
                $conn->rollBack();
            }

            Log::error('Failed to save educational background: ' . $e->getMessage());

            return back()->withInput()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving educational background. Please try again.',
            ]);
        }
    }
}
