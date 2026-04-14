<?php

namespace App\Actions\Applicants;

use App\Services\Profile\ProfileStepUpdater;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class UpdateLearningAndDevelopment
{
    use AsAction;

    public function __construct(protected ProfileStepUpdater $stepUpdater)
    {
    }

    public function authorize(ActionRequest $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.applicants.update');
    }

    public function rules(): array
    {
        return [
            'seminar_title' => ['required', 'string'],
            'from_date' => ['required', 'date'],
            'to_date' => ['required', 'date'],
            'hours' => ['required'],
            'participation' => ['required', 'string'],
            'type' => ['required', 'string'],
            'conducted_by' => ['required', 'string'],
        ];
    }

    public function withValidator($validator, ActionRequest $request): void
    {
        $validator->after(function ($validator) use ($request) {
            $fromDate = $request->input('from_date');
            $toDate = $request->input('to_date');
            if (! empty($fromDate) && ! empty($toDate) && strtotime($toDate) < strtotime($fromDate)) {
                $validator->errors()->add('to_date', 'The end date must be after or equal to the start date.');
            }
        });
    }

    public function asController(ActionRequest $request, int $applicantId, int $id)
    {
        try {
            $conn = DB::connection('mysql');
            $data = $request->validated();
            $cleanedHours = preg_replace('/[^0-9.]/', '', (string) ($data['hours'] ?? ''));

            $recordExists = $conn->table('applicant_learning')
                ->where('applicant_id', $applicantId)
                ->where('id', $id)
                ->exists();

            abort_unless($recordExists, 404);

            $conn->table('applicant_learning')
                ->where('applicant_id', $applicantId)
                ->where('id', $id)
                ->update([
                    'seminar_title' => $data['seminar_title'],
                    'from_date' => $data['from_date'],
                    'to_date' => $data['to_date'],
                    'hours' => $cleanedHours === '' ? null : (float) $cleanedHours,
                    'participation' => $data['participation'],
                    'type' => $data['type'],
                    'conducted_by' => $data['conducted_by'],
                ]);

            $this->stepUpdater->markComplete($conn, $applicantId, 'learningAndDevelopment');

            return response()->json([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Learning and development updated successfully.',
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to update applicant learning and development: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating the record.',
            ], 500);
        }
    }
}
