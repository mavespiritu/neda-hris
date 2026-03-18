<?php

namespace App\Actions\Profile;

use App\Services\Profile\ProfileContextResolver;
use App\Services\Profile\ProfileStepUpdater;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use Illuminate\Support\Facades\Gate;

class StoreFamilyBackground
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
            'isThereSpouse' => ['required', 'boolean'],

            'spouse.last_name' => ['nullable', 'string'],
            'spouse.first_name' => ['nullable', 'string'],
            'spouse.middle_name' => ['nullable', 'string'],
            'spouse.ext_name' => ['nullable', 'string'],
            'spouse.occupation' => ['nullable', 'string'],
            'spouse.employer_name' => ['nullable', 'string'],
            'spouse.business_address' => ['nullable', 'string'],
            'spouse.telephone_no' => ['nullable', 'string'],
            'spouse.hasSpouse' => ['nullable', 'boolean'],

            'father.last_name' => ['required', 'string'],
            'father.first_name' => ['required', 'string'],
            'father.middle_name' => ['nullable', 'string'],
            'father.ext_name' => ['nullable', 'string'],
            'father.birth_date' => ['nullable', 'date'],

            'mother.last_name' => ['required', 'string'],
            'mother.first_name' => ['required', 'string'],
            'mother.middle_name' => ['nullable', 'string'],
            'mother.maiden_name' => ['nullable', 'string'],
            'mother.birth_date' => ['nullable', 'date'],

            'children' => ['nullable', 'array'],
            'children.*.last_name' => ['nullable', 'string'],
            'children.*.first_name' => ['nullable', 'string'],
            'children.*.middle_name' => ['nullable', 'string'],
            'children.*.ext_name' => ['nullable', 'string'],
            'children.*.birth_date' => ['nullable', 'date'],
        ];
    }

    public function withValidator($validator, ActionRequest $request): void
    {
        $validator->after(function ($validator) use ($request) {
            $data = $request->all();

            if (filter_var($data['isThereSpouse'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                foreach ([
                    'spouse.last_name' => 'Spouse last name is required.',
                    'spouse.first_name' => 'Spouse first name is required.',
                    'spouse.middle_name' => 'Spouse middle name is required.',
                ] as $field => $message) {
                    if (blank(data_get($data, $field))) {
                        $validator->errors()->add($field, $message);
                    }
                }
            }

            foreach (($data['children'] ?? []) as $index => $child) {
                if (blank($child['last_name'] ?? null)) {
                    $validator->errors()->add("children.$index.last_name", 'Child last name is required.');
                }

                if (blank($child['first_name'] ?? null)) {
                    $validator->errors()->add("children.$index.first_name", 'Child first name is required.');
                }

                if (blank($child['middle_name'] ?? null)) {
                    $validator->errors()->add("children.$index.middle_name", 'Child middle name is required.');
                }

                if (blank($child['birth_date'] ?? null)) {
                    $validator->errors()->add("children.$index.birth_date", 'Child birth date is required.');
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

            if (filter_var($data['isThereSpouse'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                $spouse = $data['spouse'] ?? [];
                $spouse['hasSpouse'] = true;
                $spouse['applicant_id'] = $applicantId;

                $conn->table('applicant_spouse')->updateOrInsert(
                    ['applicant_id' => $applicantId],
                    $spouse
                );
            } else {
                $conn->table('applicant_spouse')
                    ->where('applicant_id', $applicantId)
                    ->delete();
            }

            $father = $data['father'] ?? [];
            $father['applicant_id'] = $applicantId;

            $conn->table('applicant_father')->updateOrInsert(
                ['applicant_id' => $applicantId],
                $father
            );

            $mother = $data['mother'] ?? [];
            $mother['applicant_id'] = $applicantId;

            $conn->table('applicant_mother')->updateOrInsert(
                ['applicant_id' => $applicantId],
                $mother
            );

            $conn->table('applicant_child')
                ->where('applicant_id', $applicantId)
                ->delete();

            foreach (($data['children'] ?? []) as $child) {
                $conn->table('applicant_child')->insert([
                    'applicant_id' => $applicantId,
                    'last_name' => $child['last_name'] ?? null,
                    'first_name' => $child['first_name'] ?? null,
                    'middle_name' => $child['middle_name'] ?? null,
                    'ext_name' => $child['ext_name'] ?? null,
                    'birth_date' => $child['birth_date'] ?? null,
                ]);
            }

            $this->stepUpdater->markComplete($conn, (int) $applicantId, 'familyBackground');

            $conn->commit();

            return response()->json([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Family Background saved successfully.',
            ]);
        } catch (\Throwable $e) {
            if (isset($conn)) {
                $conn->rollBack();
            }

            Log::error('Failed to save family background: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving family background. Please try again.',
            ]);
        }
    }
}
