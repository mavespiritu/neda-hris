<?php

namespace App\Actions\Profile;

use App\Services\Profile\ProfileContextResolver;
use App\Services\Profile\ProfileStepUpdater;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use Illuminate\Support\Facades\Gate;

class StoreOtherInformation
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

    public function rules(): array
    {
        return [
            'skills.*.description' => ['required', 'string'],
            'skills.*.year' => ['nullable', 'digits:4'],

            'recognitions.*.description' => ['required', 'string'],
            'recognitions.*.year' => ['nullable', 'digits:4'],

            'memberships.*.description' => ['required', 'string'],
            'memberships.*.year' => ['nullable', 'digits:4'],

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
                    if (!isset($question['answer']) || !in_array($question['answer'], ['yes', 'no'], true)) {
                        $validator->errors()->add(
                            "questions.{$itemNo}.answer",
                            'Please select an option.'
                        );
                    }

                    if (($question['answer'] ?? '') === 'yes' && empty($question['details'])) {
                        $validator->errors()->add(
                            "questions.{$itemNo}.details",
                            "Details are required when answer is 'Yes'."
                        );
                    }
                }

                if (!empty($question['subQuestions'])) {
                    foreach ($question['subQuestions'] as $subIndex => $subQuestion) {
                        $isSubAnswerable = isset($subQuestion['isAnswerable'])
                            ? filter_var($subQuestion['isAnswerable'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true
                            : true;

                        if (! $isSubAnswerable) {
                            continue;
                        }

                        if (!isset($subQuestion['answer']) || !in_array($subQuestion['answer'], ['yes', 'no'], true)) {
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

            $skills = $request->input('skills', []);
            $recognitions = $request->input('recognitions', []);
            $memberships = $request->input('memberships', []);
            $questions = $request->input('questions', []);
            $references = $request->input('references', []);

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
                $parentData = [
                    'applicant_id' => $applicantId,
                    'item_no' => $question['item_no'] ?? null,
                    'list' => $question['list'] ?? null,
                    'answer' => $question['answer'] ?? null,
                    'details' => $question['details'] ?? null,
                ];

                $existing = $conn->table('applicant_question')
                    ->where('applicant_id', $applicantId)
                    ->where('item_no', $question['item_no'] ?? null)
                    ->whereNull('list')
                    ->first();

                if ($existing) {
                    $conn->table('applicant_question')
                        ->where('id', $existing->id)
                        ->update($parentData);
                    $questionIds[] = $existing->id;
                } else {
                    $questionIds[] = $conn->table('applicant_question')->insertGetId($parentData);
                }

                foreach (($question['subQuestions'] ?? []) as $subQuestion) {
                    $subData = [
                        'applicant_id' => $applicantId,
                        'item_no' => $question['item_no'] ?? null,
                        'list' => $subQuestion['list'] ?? null,
                        'answer' => $subQuestion['answer'] ?? null,
                        'details' => $subQuestion['details'] ?? null,
                    ];

                    $existingSub = $conn->table('applicant_question')
                        ->where('applicant_id', $applicantId)
                        ->where('item_no', $question['item_no'] ?? null)
                        ->where('list', $subQuestion['list'] ?? null)
                        ->first();

                    if ($existingSub) {
                        $conn->table('applicant_question')
                            ->where('id', $existingSub->id)
                            ->update($subData);
                        $questionIds[] = $existingSub->id;
                    } else {
                        $questionIds[] = $conn->table('applicant_question')->insertGetId($subData);
                    }
                }
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

                if (!empty($reference['id'])) {
                    $conn->table('applicant_reference')
                        ->where('id', $reference['id'])
                        ->update($payload);
                    $referenceIds[] = $reference['id'];
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

            $this->stepUpdater->markComplete($conn, (int) $applicantId, 'otherInformation');
            $this->stepUpdater->markComplete($conn, (int) $applicantId, 'review');

            return response()->json([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Other information saved successfully.',
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to store other information: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving other information.',
            ], 500);
        }
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

            if (!empty($item['id'])) {
                $conn->table('applicant_other_info')
                    ->where('id', $item['id'])
                    ->update($payload);

                $ids[] = $item['id'];
            } else {
                $ids[] = $conn->table('applicant_other_info')->insertGetId([
                    'applicant_id' => $applicantId,
                    ...$payload,
                ]);
            }
        }

        return $ids;
    }
}
