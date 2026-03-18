<?php

namespace App\Actions\Applicants;

use App\Services\Profile\ProfileStepUpdater;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class StoreVoluntaryWorkSection
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
            'voluntaryWork' => ['nullable', 'array'],
            'voluntaryWork.*.id' => ['nullable', 'integer'],
            'voluntaryWork.*.org_name' => ['required'],
            'voluntaryWork.*.org_address' => ['required'],
            'voluntaryWork.*.from_date' => ['required', 'date'],
            'voluntaryWork.*.to_date' => ['nullable', 'date'],
            'voluntaryWork.*.hours' => ['nullable'],
            'voluntaryWork.*.nature_of_work' => ['required'],
            'voluntaryWork.*.isPresent' => ['nullable', 'boolean'],
        ];
    }

    public function getValidationMessages(): array
    {
        return [
            'voluntaryWork.*.org_name.required' => 'The name of organization is required for each voluntary work.',
            'voluntaryWork.*.org_address.required' => 'The address of organization is required for each voluntary work.',
            'voluntaryWork.*.from_date.required' => 'The start date is required for each voluntary work.',
            'voluntaryWork.*.from_date.date' => 'Must be a valid date.',
            'voluntaryWork.*.to_date.date' => 'Must be a valid date.',
            'voluntaryWork.*.nature_of_work.required' => 'The nature of work is required for each voluntary work.',
        ];
    }

    public function withValidator($validator, ActionRequest $request): void
    {
        $validator->after(function ($validator) use ($request) {
            foreach ($request->input('voluntaryWork', []) as $index => $entry) {
                $isPresent = filter_var($entry['isPresent'] ?? false, FILTER_VALIDATE_BOOLEAN);
                $fromDate = $entry['from_date'] ?? null;
                $toDate = $entry['to_date'] ?? null;
                $hours = trim((string) ($entry['hours'] ?? ''));
                if (! $isPresent && empty($toDate)) {
                    $validator->errors()->add("voluntaryWork.$index.to_date", 'The end date is required unless the voluntary work is currently held.');
                }
                if (! $isPresent && $hours === '') {
                    $validator->errors()->add("voluntaryWork.$index.hours", 'The number of hours is required unless the voluntary work is currently held.');
                }
                if (! empty($fromDate) && ! empty($toDate) && strtotime($toDate) < strtotime($fromDate)) {
                    $validator->errors()->add("voluntaryWork.$index.to_date", 'The end date must be after or equal to the start date for each voluntary work.');
                }
            }
        });
    }

    public function handle(array $data, int $applicantId)
    {
        $conn = DB::connection('mysql');
        try {
            $conn->beginTransaction();
            $rows = $data['voluntaryWork'] ?? [];
            $existingIds = $conn->table('applicant_voluntary_work')->where('applicant_id', $applicantId)->pluck('id')->toArray();
            $submittedIds = [];
            foreach ($rows as $row) {
                $cleanedHours = preg_replace('/[^0-9.]/', '', (string) ($row['hours'] ?? ''));
                $payload = [
                    'applicant_id' => $applicantId,
                    'org_name' => $row['org_name'] ?? null,
                    'org_address' => $row['org_address'] ?? null,
                    'from_date' => $row['from_date'] ?? null,
                    'to_date' => filter_var($row['isPresent'] ?? false, FILTER_VALIDATE_BOOLEAN) ? null : ($row['to_date'] ?? null),
                    'hours' => $cleanedHours === '' ? null : (float) $cleanedHours,
                    'nature_of_work' => $row['nature_of_work'] ?? null,
                    'isPresent' => filter_var($row['isPresent'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 1 : 0,
                ];
                if (! empty($row['id']) && in_array($row['id'], $existingIds)) {
                    $conn->table('applicant_voluntary_work')->where('id', $row['id'])->update($payload);
                    $submittedIds[] = $row['id'];
                    continue;
                }
                $submittedIds[] = $conn->table('applicant_voluntary_work')->insertGetId($payload);
            }
            $query = $conn->table('applicant_voluntary_work')->where('applicant_id', $applicantId);
            if (! empty($submittedIds)) $query->whereNotIn('id', $submittedIds);
            $query->delete();
            $this->stepUpdater->markComplete($conn, $applicantId, 'voluntaryWork');
            $conn->commit();
            if (request()->expectsJson()) return response()->json(['status' => 'success','title' => 'Success!','message' => 'Voluntary works saved successfully! Proceed with this step.','applicantId' => $applicantId,'nextStep' => 'learningAndDevelopment']);
            return redirect()->route('applicants.edit', ['id' => $applicantId,'step' => 'learningAndDevelopment'])->with(['status' => 'success','title' => 'Success!','message' => 'Voluntary works saved successfully! Proceed with this step.']);
        } catch (\Throwable $e) {
            $conn->rollBack();
            Log::error('Failed to save voluntary works of applicant: ' . $e->getMessage());
            if (request()->expectsJson()) return response()->json(['status' => 'error','title' => 'Uh oh! Something went wrong.','message' => 'An error occurred while saving voluntary works of an applicant. Please try again.'], 500);
            return redirect()->back()->with(['status' => 'error','title' => 'Uh oh! Something went wrong.','message' => 'An error occurred while saving voluntary works of an applicant. Please try again.']);
        }
    }

    public function asController(ActionRequest $request, int $applicantId)
    {
        return $this->handle($request->validated(), $applicantId);
    }
}
