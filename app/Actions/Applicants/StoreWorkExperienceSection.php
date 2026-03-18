<?php

namespace App\Actions\Applicants;

use App\Services\Profile\ProfileStepUpdater;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class StoreWorkExperienceSection
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
            'workExperience' => ['nullable', 'array'],
            'workExperience.*.id' => ['nullable', 'integer'],
            'workExperience.*.agency' => ['required'],
            'workExperience.*.position' => ['required'],
            'workExperience.*.appointment' => ['required'],
            'workExperience.*.grade' => ['nullable'],
            'workExperience.*.step' => ['nullable'],
            'workExperience.*.monthly_salary' => ['nullable'],
            'workExperience.*.from_date' => ['required', 'date'],
            'workExperience.*.to_date' => ['nullable', 'date'],
            'workExperience.*.isPresent' => ['nullable', 'boolean'],
            'workExperience.*.isGovtService' => ['nullable', 'boolean'],
        ];
    }

    public function getValidationMessages(): array
    {
        return [
            'workExperience.*.agency.required' => 'The agency name is required for each work experience.',
            'workExperience.*.position.required' => 'The position title is required for each work experience.',
            'workExperience.*.appointment.required' => 'The appointment status is required for each work experience.',
            'workExperience.*.from_date.required' => 'The start date is required for each work experience.',
            'workExperience.*.from_date.date' => 'Must be a valid date.',
            'workExperience.*.to_date.date' => 'Must be a valid date.',
        ];
    }

    public function withValidator($validator, ActionRequest $request): void
    {
        $validator->after(function ($validator) use ($request) {
            foreach ($request->input('workExperience', []) as $index => $entry) {
                $isPresent = filter_var($entry['isPresent'] ?? false, FILTER_VALIDATE_BOOLEAN);
                $fromDate = $entry['from_date'] ?? null;
                $toDate = $entry['to_date'] ?? null;

                if (! $isPresent && empty($toDate)) {
                    $validator->errors()->add("workExperience.$index.to_date", 'The end date is required unless the position is currently held.');
                }

                if (! empty($fromDate) && ! empty($toDate) && strtotime($toDate) < strtotime($fromDate)) {
                    $validator->errors()->add("workExperience.$index.to_date", 'The end date must be after or equal to the start date for each work experience.');
                }
            }
        });
    }

    public function handle(array $data, int $applicantId)
    {
        $conn = DB::connection('mysql');

        try {
            $conn->beginTransaction();
            $rows = $data['workExperience'] ?? [];
            $existingIds = $conn->table('applicant_work_experience')->where('applicant_id', $applicantId)->pluck('id')->toArray();
            $submittedIds = [];

            foreach ($rows as $row) {
                $payload = [
                    'applicant_id' => $applicantId,
                    'agency' => $row['agency'] ?? null,
                    'position' => $row['position'] ?? null,
                    'appointment' => $row['appointment'] ?? null,
                    'grade' => $row['grade'] ?? null,
                    'step' => $row['step'] ?? null,
                    'monthly_salary' => $row['monthly_salary'] ?? null,
                    'from_date' => $row['from_date'] ?? null,
                    'to_date' => filter_var($row['isPresent'] ?? false, FILTER_VALIDATE_BOOLEAN) ? null : ($row['to_date'] ?? null),
                    'isPresent' => filter_var($row['isPresent'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 1 : 0,
                    'isGovtService' => filter_var($row['isGovtService'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 1 : 0,
                ];

                if (! empty($row['id']) && in_array($row['id'], $existingIds)) {
                    $conn->table('applicant_work_experience')->where('id', $row['id'])->update($payload);
                    $submittedIds[] = $row['id'];
                    continue;
                }

                $submittedIds[] = $conn->table('applicant_work_experience')->insertGetId($payload);
            }

            $query = $conn->table('applicant_work_experience')->where('applicant_id', $applicantId);
            if (! empty($submittedIds)) {
                $query->whereNotIn('id', $submittedIds);
            }
            $query->delete();

            $this->stepUpdater->markComplete($conn, $applicantId, 'workExperience');
            $conn->commit();

            if (request()->expectsJson()) {
                return response()->json(['status' => 'success','title' => 'Success!','message' => 'Work experiences saved successfully! Proceed with this step.','applicantId' => $applicantId,'nextStep' => 'voluntaryWork']);
            }

            return redirect()->route('applicants.edit', ['id' => $applicantId,'step' => 'voluntaryWork'])->with(['status' => 'success','title' => 'Success!','message' => 'Work experiences saved successfully! Proceed with this step.']);
        } catch (\Throwable $e) {
            $conn->rollBack();
            Log::error('Failed to save work experiences of applicant: ' . $e->getMessage());

            if (request()->expectsJson()) {
                return response()->json(['status' => 'error','title' => 'Uh oh! Something went wrong.','message' => 'An error occurred while saving work experiences of an applicant. Please try again.'], 500);
            }

            return redirect()->back()->with(['status' => 'error','title' => 'Uh oh! Something went wrong.','message' => 'An error occurred while saving work experiences of an applicant. Please try again.']);
        }
    }

    public function asController(ActionRequest $request, int $applicantId)
    {
        return $this->handle($request->validated(), $applicantId);
    }
}
