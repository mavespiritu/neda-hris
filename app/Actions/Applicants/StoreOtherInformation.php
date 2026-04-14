<?php

namespace App\Actions\Applicants;

use App\Services\Profile\ProfileStepUpdater;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class StoreOtherInformation
{
    use AsAction;

    public function __construct(
        protected ProfileStepUpdater $stepUpdater
    ) {
    }

    public function authorize(ActionRequest $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.applicants.create');
    }

    public function rules(): array
    {
        return [
            'skills.*.id' => ['nullable', 'integer'],
            'skills.*.description' => ['required', 'string'],
            'skills.*.year' => ['nullable', 'digits:4'],
            'recognitions.*.id' => ['nullable', 'integer'],
            'recognitions.*.description' => ['required', 'string'],
            'recognitions.*.year' => ['nullable', 'digits:4'],
            'memberships.*.id' => ['nullable', 'integer'],
            'memberships.*.description' => ['required', 'string'],
            'memberships.*.year' => ['nullable', 'digits:4'],
            'references' => ['nullable', 'array'],
            'references.*.id' => ['nullable', 'integer'],
            'references.*.name' => ['required', 'string'],
            'references.*.address' => ['required', 'string'],
            'references.*.contact_no' => ['required', 'string'],
        ];
    }

    public function getValidationMessages(): array
    {
        return [
            'skills.*.description.required' => 'Each special skill/hobby is required.',
            'skills.*.year.digits' => 'Each special skill/hobby year must be 4 digits.',
            'recognitions.*.description.required' => 'Each non-academic distinction/recognition is required.',
            'recognitions.*.year.digits' => 'Each non-academic distinction/recognition year must be 4 digits.',
            'memberships.*.description.required' => 'Each membership in association/organization is required.',
            'memberships.*.year.digits' => 'Each membership year must be 4 digits.',
            'references.*.name.required' => 'Each reference name is required.',
            'references.*.address.required' => 'Each reference address is required.',
            'references.*.contact_no.required' => 'Each reference contact number is required.',
        ];
    }

    public function withValidator($validator, ActionRequest $request): void
    {
        $validator->after(function ($validator) use ($request) {
            $questions = $request->input('questions', []);

            foreach ($questions as $question) {
                $itemNo = $question['item_no'] ?? 'unknown';
                $isAnswerable = isset($question['isAnswerable'])
                    ? filter_var($question['isAnswerable'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true
                    : true;

                if ($isAnswerable) {
                    if (! isset($question['answer']) || ! in_array($question['answer'], ['yes', 'no'], true)) {
                        $validator->errors()->add("questions.{$itemNo}.answer", 'Please select an option.');
                    }

                    if (($question['answer'] ?? '') === 'yes' && empty($question['details'])) {
                        $validator->errors()->add("questions.{$itemNo}.details", "Details are required when answer is 'Yes'.");
                    }
                }

                foreach (($question['subQuestions'] ?? []) as $subIndex => $subQuestion) {
                    $isSubAnswerable = isset($subQuestion['isAnswerable'])
                        ? filter_var($subQuestion['isAnswerable'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true
                        : true;

                    if (! $isSubAnswerable) {
                        continue;
                    }

                    if (! isset($subQuestion['answer']) || ! in_array($subQuestion['answer'], ['yes', 'no'], true)) {
                        $validator->errors()->add(
                            "questions.{$itemNo}.subQuestions.{$subIndex}.answer",
                            'Please select an option.'
                        );
                    }

                    if (($subQuestion['answer'] ?? '') === 'yes' && empty($subQuestion['details'])) {
                        $validator->errors()->add(
                            "questions.{$itemNo}.subQuestions.{$subIndex}.details",
                            "Details are required when answer is 'Yes'."
                        );
                    }
                }
            }
        });
    }

    public function handle(array $data, int $applicantId)
    {
        $conn = DB::connection('mysql');

        $skills = $data['skills'] ?? [];
        $recognitions = $data['recognitions'] ?? [];
        $memberships = $data['memberships'] ?? [];
        $questions = $data['questions'] ?? [];
        $references = $data['references'] ?? [];

        try {
            $conn->beginTransaction();

            $skillIds = $this->syncOtherInfo($conn, $applicantId, $skills, 'hobbies');
            $recognitionIds = $this->syncOtherInfo($conn, $applicantId, $recognitions, 'recognition');
            $membershipIds = $this->syncOtherInfo($conn, $applicantId, $memberships, 'membership');

            $conn->table('applicant_other_info')
                ->where('applicant_id', $applicantId)
                ->where('type', 'hobbies')
                ->whereNotIn('id', $skillIds ?: [0])
                ->delete();

            $conn->table('applicant_other_info')
                ->where('applicant_id', $applicantId)
                ->where('type', 'recognition')
                ->whereNotIn('id', $recognitionIds ?: [0])
                ->delete();

            $conn->table('applicant_other_info')
                ->where('applicant_id', $applicantId)
                ->where('type', 'membership')
                ->whereNotIn('id', $membershipIds ?: [0])
                ->delete();

            $questionIds = [];

            foreach ($questions as $question) {
                if (! empty($question['subQuestions'])) {
                    foreach ($question['subQuestions'] as $subQuestion) {
                        $questionIds[] = $this->upsertQuestion($conn, $applicantId, [
                            'item_no' => $question['item_no'] ?? null,
                            'list' => $subQuestion['list'] ?? null,
                            'answer' => $subQuestion['answer'] ?? null,
                            'details' => $subQuestion['details'] ?? null,
                        ]);
                    }

                    continue;
                }

                $questionIds[] = $this->upsertQuestion($conn, $applicantId, [
                    'item_no' => $question['item_no'] ?? null,
                    'list' => $question['list'] ?? null,
                    'answer' => $question['answer'] ?? null,
                    'details' => $question['details'] ?? null,
                ]);
            }

            $conn->table('applicant_question')
                ->where('applicant_id', $applicantId)
                ->whereNotIn('id', $questionIds ?: [0])
                ->delete();

            $referenceIds = [];

            foreach ($references as $reference) {
                $payload = [
                    'name' => $reference['name'] ?? '',
                    'address' => $reference['address'] ?? '',
                    'contact_no' => $reference['contact_no'] ?? '',
                ];

                if (! empty($reference['id'])) {
                    $conn->table('applicant_reference')
                        ->where('id', $reference['id'])
                        ->where('applicant_id', $applicantId)
                        ->update($payload);

                    $referenceIds[] = (int) $reference['id'];
                } else {
                    $referenceIds[] = $conn->table('applicant_reference')->insertGetId([
                        'applicant_id' => $applicantId,
                        ...$payload,
                    ]);
                }
            }

            $conn->table('applicant_reference')
                ->where('applicant_id', $applicantId)
                ->whereNotIn('id', $referenceIds ?: [0])
                ->delete();

            $this->stepUpdater->markComplete($conn, $applicantId, 'otherInformation');
            $this->stepUpdater->markComplete($conn, $applicantId, 'review');

            $conn->commit();

            return response()->json([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Other information saved successfully.',
                'applicantId' => $applicantId,
                'nextStep' => 'review',
            ]);
        } catch (\Throwable $e) {
            $conn->rollBack();
            Log::error('Failed to store applicant other information: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving other information.',
            ], 500);
        }
    }

    public function asController(ActionRequest $request, int $applicantId)
    {
        return $this->handle($request->validated(), $applicantId);
    }

    protected function syncOtherInfo($conn, int $applicantId, array $items, string $type): array
    {
        $ids = [];

        foreach ($items as $item) {
            $payload = [
                'description' => $item['description'] ?? '',
                'year' => $item['year'] ?? null,
                'type' => $type,
            ];

            if (! empty($item['id'])) {
                $conn->table('applicant_other_info')
                    ->where('id', $item['id'])
                    ->where('applicant_id', $applicantId)
                    ->update($payload);

                $ids[] = (int) $item['id'];
            } else {
                $ids[] = $conn->table('applicant_other_info')->insertGetId([
                    'applicant_id' => $applicantId,
                    ...$payload,
                ]);
            }
        }

        return $ids;
    }

    protected function upsertQuestion($conn, int $applicantId, array $payload): int
    {
        $query = $conn->table('applicant_question')
            ->where('applicant_id', $applicantId)
            ->where('item_no', $payload['item_no']);

        if (($payload['list'] ?? null) === null || $payload['list'] === '') {
            $existing = $query->whereNull('list')->first();
        } else {
            $existing = $query->where('list', $payload['list'])->first();
        }

        $record = [
            'applicant_id' => $applicantId,
            'item_no' => $payload['item_no'],
            'list' => $payload['list'] ?: null,
            'answer' => $payload['answer'],
            'details' => $payload['details'],
        ];

        if ($existing) {
            $conn->table('applicant_question')
                ->where('id', $existing->id)
                ->update($record);

            return (int) $existing->id;
        }

        return $conn->table('applicant_question')->insertGetId($record);
    }
}
