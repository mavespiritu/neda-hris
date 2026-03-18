<?php

namespace App\Actions\Applicants;

use App\Services\Applicants\EducationalBackgroundFormBuilder;
use App\Services\Profile\ProfileStepUpdater;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class StoreEducationalBackground
{
    use AsAction;

    public function __construct(
        protected ProfileStepUpdater $stepUpdater
    ) {
    }

    public function authorize(ActionRequest $request): bool
    {
        return $request->user() !== null;
    }

    public function rules(): array
    {
        $rules = [];

        foreach (EducationalBackgroundFormBuilder::levels() as $id => $label) {
            $rules["{$id}"] = ['nullable', 'array'];
            $rules["{$id}.*.id"] = ['nullable', 'integer'];
            $rules["{$id}.*.school"] = ['required'];
            $rules["{$id}.*.course"] = ['required'];
            $rules["{$id}.*.highest_attainment"] = ['required'];
            $rules["{$id}.*.from_year"] = ['required', 'digits:4'];
            $rules["{$id}.*.to_year"] = ['required', 'digits:4'];
            $rules["{$id}.*.award"] = ['required'];
            $rules["{$id}.*.year_graduated"] = ['nullable', 'digits:4'];
            $rules["{$id}.*.is_graduated"] = ['nullable', 'boolean'];
        }

        return $rules;
    }

    public function getValidationMessages(): array
    {
        $messages = [];

        foreach (EducationalBackgroundFormBuilder::levels() as $id => $label) {
            $messages["{$id}.*.school.required"] = "Each {$label} record must have a school name.";
            $messages["{$id}.*.course.required"] = "Each {$label} record must have a course/degree.";
            $messages["{$id}.*.highest_attainment.required"] = "Each {$label} record must have highest level/units earned.";
            $messages["{$id}.*.from_year.required"] = "Each {$label} record must have a start year.";
            $messages["{$id}.*.to_year.required"] = "Each {$label} record must have an end year.";
            $messages["{$id}.*.from_year.digits"] = "The start year for {$label} must be a 4-digit year.";
            $messages["{$id}.*.to_year.digits"] = "The end year for {$label} must be a 4-digit year.";
            $messages["{$id}.*.award.required"] = "Each {$label} record must have a scholarship/academic honor.";
            $messages["{$id}.*.year_graduated.digits"] = "The year graduated for {$label} must be a 4-digit year.";
        }

        return $messages;
    }

    public function withValidator($validator, ActionRequest $request): void
    {
        $validator->after(function ($validator) use ($request) {
            foreach (EducationalBackgroundFormBuilder::levels() as $id => $label) {
                $entries = $request->input($id, []);

                foreach ($entries as $index => $entry) {
                    if (! empty($entry['is_graduated']) && empty($entry['year_graduated'])) {
                        $validator->errors()->add(
                            "{$id}.{$index}.year_graduated",
                            "Year graduated is required for {$label} when marked as graduated."
                        );
                    }

                    if (
                        ! empty($entry['from_year']) &&
                        ! empty($entry['to_year']) &&
                        (int) $entry['to_year'] < (int) $entry['from_year']
                    ) {
                        $validator->errors()->add(
                            "{$id}.{$index}.to_year",
                            "End year must be after or equal to start year for {$label}."
                        );
                    }
                }
            }
        });
    }

    public function handle(array $data, int $applicantId)
    {
        $conn = DB::connection('mysql');

        try {
            $conn->beginTransaction();

            $existingIds = $conn->table('applicant_education')
                ->where('applicant_id', $applicantId)
                ->pluck('id')
                ->toArray();

            $incomingIds = [];

            foreach (EducationalBackgroundFormBuilder::levels() as $id => $label) {
                $entries = $data[$id] ?? [];

                foreach ($entries as $entry) {
                    $entryData = [
                        'applicant_id' => $applicantId,
                        'level' => $label,
                        'course' => $entry['course'] ?? null,
                        'school' => $entry['school'] ?? null,
                        'highest_attainment' => $entry['highest_attainment'] ?? null,
                        'from_year' => $entry['from_year'] ?? null,
                        'to_year' => $entry['to_year'] ?? null,
                        'year_graduated' => $entry['year_graduated'] ?? null,
                        'award' => $entry['award'] ?? null,
                        'is_graduated' => ! empty($entry['is_graduated']) ? 1 : 0,
                    ];

                    if (! empty($entry['id'])) {
                        $conn->table('applicant_education')
                            ->where('id', $entry['id'])
                            ->update($entryData);
                        $incomingIds[] = $entry['id'];
                        continue;
                    }

                    $incomingIds[] = $conn->table('applicant_education')->insertGetId($entryData);
                }
            }

            $idsToDelete = array_diff($existingIds, $incomingIds);

            if (! empty($idsToDelete)) {
                $conn->table('applicant_education')
                    ->whereIn('id', $idsToDelete)
                    ->delete();
            }

            $this->stepUpdater->markComplete($conn, $applicantId, 'educationalBackground');

            $conn->commit();

            if (request()->expectsJson()) {
                return response()->json([
                    'status' => 'success',
                    'title' => 'Success!',
                    'message' => 'Educational background saved successfully! Proceed with this step.',
                    'applicantId' => $applicantId,
                    'nextStep' => 'civilServiceEligibility',
                ]);
            }

            return redirect()->route('applicants.edit', [
                'id' => $applicantId,
                'step' => 'civilServiceEligibility',
            ])->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Educational background saved successfully! Proceed with this step.',
            ]);
        } catch (\Throwable $e) {
            $conn->rollBack();
            Log::error('Failed to save educational background of applicant: ' . $e->getMessage());

            if (request()->expectsJson()) {
                return response()->json([
                    'status' => 'error',
                    'title' => 'Uh oh! Something went wrong.',
                    'message' => 'An error occurred while saving educational background of an applicant. Please try again.',
                ], 500);
            }

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving educational background of an applicant. Please try again.',
            ]);
        }
    }

    public function asController(ActionRequest $request, int $applicantId)
    {
        $validator = Validator::make(
            $request->all(),
            $this->rules(),
            $this->getValidationMessages()
        );
        $this->withValidator($validator, $request);

        return $this->handle($validator->validate(), $applicantId);
    }
}
