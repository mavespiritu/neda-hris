<?php

namespace App\Actions\Applicants;

use App\Services\Profile\ProfileStepUpdater;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class StoreLearningAndDevelopmentSection
{
    use AsAction;

    public function __construct(protected ProfileStepUpdater $stepUpdater)
    {
    }

    public function authorize(ActionRequest $request): bool
    {
        return $request->user() !== null;
    }

    public function rules(): array
    {
        return [
            'learningAndDevelopment' => ['nullable', 'array'],
            'learningAndDevelopment.*.id' => ['nullable', 'integer'],
            'learningAndDevelopment.*.seminar_title' => ['required'],
            'learningAndDevelopment.*.from_date' => ['required', 'date'],
            'learningAndDevelopment.*.to_date' => ['required', 'date'],
            'learningAndDevelopment.*.hours' => ['required'],
            'learningAndDevelopment.*.participation' => ['required'],
            'learningAndDevelopment.*.type' => ['required'],
            'learningAndDevelopment.*.conducted_by' => ['required'],
        ];
    }

    public function getValidationMessages(): array
    {
        return [
            'learningAndDevelopment.*.seminar_title.required' => 'The title of training is required for each L&D.',
            'learningAndDevelopment.*.from_date.required' => 'The start date is required for each L&D.',
            'learningAndDevelopment.*.from_date.date' => 'Must be a valid date.',
            'learningAndDevelopment.*.to_date.required' => 'The end date is required for each L&D.',
            'learningAndDevelopment.*.to_date.date' => 'Must be a valid date.',
            'learningAndDevelopment.*.hours.required' => 'The number of hours is required for each L&D.',
            'learningAndDevelopment.*.participation.required' => 'The participation is required for each L&D.',
            'learningAndDevelopment.*.type.required' => 'The type is required for each L&D.',
            'learningAndDevelopment.*.conducted_by.required' => 'The conducted by is required for each L&D.',
        ];
    }

    public function withValidator($validator, ActionRequest $request): void
    {
        $validator->after(function ($validator) use ($request) {
            foreach ($request->input('learningAndDevelopment', []) as $index => $entry) {
                $fromDate = $entry['from_date'] ?? null;
                $toDate = $entry['to_date'] ?? null;
                if (! empty($fromDate) && ! empty($toDate) && strtotime($toDate) < strtotime($fromDate)) {
                    $validator->errors()->add("learningAndDevelopment.$index.to_date", 'The end date must be after or equal to the start date for each L&D.');
                }
            }
        });
    }

    public function handle(array $data, int $applicantId)
    {
        $conn = DB::connection('mysql');
        try {
            $conn->beginTransaction();
            $rows = $data['learningAndDevelopment'] ?? [];
            $existingIds = $conn->table('applicant_learning')->where('applicant_id', $applicantId)->pluck('id')->toArray();
            $submittedIds = [];
            foreach ($rows as $row) {
                $cleanedHours = preg_replace('/[^0-9.]/', '', (string) ($row['hours'] ?? ''));
                $payload = [
                    'applicant_id' => $applicantId,
                    'seminar_title' => $row['seminar_title'] ?? null,
                    'from_date' => $row['from_date'] ?? null,
                    'to_date' => $row['to_date'] ?? null,
                    'hours' => $cleanedHours === '' ? null : (float) $cleanedHours,
                    'participation' => $row['participation'] ?? null,
                    'type' => $row['type'] ?? null,
                    'conducted_by' => $row['conducted_by'] ?? null,
                ];
                if (! empty($row['id']) && in_array($row['id'], $existingIds)) {
                    $conn->table('applicant_learning')->where('id', $row['id'])->update($payload);
                    $submittedIds[] = $row['id'];
                    continue;
                }
                $submittedIds[] = $conn->table('applicant_learning')->insertGetId($payload);
            }
            $query = $conn->table('applicant_learning')->where('applicant_id', $applicantId);
            if (! empty($submittedIds)) $query->whereNotIn('id', $submittedIds);
            $query->delete();
            $this->stepUpdater->markComplete($conn, $applicantId, 'learningAndDevelopment');
            $conn->commit();
            if (request()->expectsJson()) return response()->json(['status' => 'success','title' => 'Success!','message' => 'Learning and development saved successfully! Proceed with this step.','applicantId' => $applicantId,'nextStep' => 'otherInformation']);
            return redirect()->route('applicants.edit', ['id' => $applicantId,'step' => 'otherInformation'])->with(['status' => 'success','title' => 'Success!','message' => 'Learning and development saved successfully! Proceed with this step.']);
        } catch (\Throwable $e) {
            $conn->rollBack();
            Log::error('Failed to save learning and development of applicant: ' . $e->getMessage());
            if (request()->expectsJson()) return response()->json(['status' => 'error','title' => 'Uh oh! Something went wrong.','message' => 'An error occurred while saving learning and development of an applicant. Please try again.'], 500);
            return redirect()->back()->with(['status' => 'error','title' => 'Uh oh! Something went wrong.','message' => 'An error occurred while saving learning and development of an applicant. Please try again.']);
        }
    }

    public function asController(ActionRequest $request, int $applicantId)
    {
        return $this->handle($request->validated(), $applicantId);
    }
}
