<?php

namespace App\Actions\Applicants;

use App\Services\Profile\ProfileStepUpdater;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class StoreFamilyBackground
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
            'isThereSpouse' => ['nullable', 'boolean'],
            'spouse.id' => ['nullable', 'integer'],
            'spouse.last_name' => ['required_if:isThereSpouse,true', 'nullable'],
            'spouse.first_name' => ['required_if:isThereSpouse,true', 'nullable'],
            'spouse.middle_name' => ['nullable'],
            'spouse.ext_name' => ['nullable'],
            'spouse.occupation' => ['required_if:isThereSpouse,true', 'nullable'],
            'spouse.employer_name' => ['required_if:isThereSpouse,true', 'nullable'],
            'spouse.business_address' => ['required_if:isThereSpouse,true', 'nullable'],
            'spouse.telephone_no' => ['required_if:isThereSpouse,true', 'nullable'],
            'father.id' => ['nullable', 'integer'],
            'father.last_name' => ['required'],
            'father.first_name' => ['required'],
            'father.middle_name' => ['nullable'],
            'father.ext_name' => ['nullable'],
            'father.birth_date' => ['nullable', 'date'],
            'mother.id' => ['nullable', 'integer'],
            'mother.last_name' => ['required'],
            'mother.first_name' => ['required'],
            'mother.middle_name' => ['nullable'],
            'mother.maiden_name' => ['required'],
            'mother.birth_date' => ['nullable', 'date'],
            'children' => ['nullable', 'array'],
            'children.*.id' => ['nullable', 'integer'],
            'children.*.last_name' => ['required'],
            'children.*.first_name' => ['required'],
            'children.*.middle_name' => ['nullable'],
            'children.*.ext_name' => ['nullable'],
            'children.*.birth_date' => ['required', 'date'],
        ];
    }

    public function getValidationMessages(): array
    {
        return [
            'spouse.last_name.required_if' => 'The spouse\'s last name is required.',
            'spouse.first_name.required_if' => 'The spouse\'s first name is required.',
            'spouse.occupation.required_if' => 'The spouse\'s occupation is required.',
            'spouse.employer_name.required_if' => 'The spouse\'s employer name is required.',
            'spouse.business_address.required_if' => 'The spouse\'s business address is required.',
            'spouse.telephone_no.required_if' => 'The spouse\'s telephone number is required.',
            'father.last_name.required' => 'The father\'s last name is required.',
            'father.first_name.required' => 'The father\'s first name is required.',
            'mother.last_name.required' => 'The mother\'s last name is required.',
            'mother.first_name.required' => 'The mother\'s first name is required.',
            'mother.maiden_name.required' => 'The mother\'s maiden name is required.',
            'children.*.last_name.required' => 'Each child\'s last name is required.',
            'children.*.first_name.required' => 'Each child\'s first name is required.',
            'children.*.birth_date.required' => 'Each child\'s birth date is required.',
            'children.*.birth_date.date' => 'Each child\'s birth date must be a valid date.',
        ];
    }

    public function handle(array $data, int $applicantId)
    {
        $conn = DB::connection('mysql');

        $spouse = $data['spouse'] ?? [];
        $father = $data['father'] ?? [];
        $mother = $data['mother'] ?? [];
        $children = $data['children'] ?? [];

        $spouse['hasSpouse'] = filter_var($data['isThereSpouse'] ?? false, FILTER_VALIDATE_BOOLEAN);

        try {
            $conn->beginTransaction();

            $conn->table('applicant_spouse')->updateOrInsert(
                ['applicant_id' => $applicantId],
                array_merge(
                    ['applicant_id' => $applicantId],
                    Arr::except($spouse, ['id'])
                )
            );

            $conn->table('applicant_father')->updateOrInsert(
                ['applicant_id' => $applicantId],
                array_merge(
                    ['applicant_id' => $applicantId],
                    Arr::except($father, ['id'])
                )
            );

            $conn->table('applicant_mother')->updateOrInsert(
                ['applicant_id' => $applicantId],
                array_merge(
                    ['applicant_id' => $applicantId],
                    Arr::except($mother, ['id'])
                )
            );

            $existingChildIds = $conn->table('applicant_child')
                ->where('applicant_id', $applicantId)
                ->pluck('id')
                ->toArray();

            $incomingChildIds = collect($children)
                ->pluck('id')
                ->filter()
                ->toArray();

            $childIdsToDelete = array_diff($existingChildIds, $incomingChildIds);

            if (! empty($childIdsToDelete)) {
                $conn->table('applicant_child')
                    ->whereIn('id', $childIdsToDelete)
                    ->delete();
            }

            foreach ($children as $child) {
                if (! empty($child['id'])) {
                    $conn->table('applicant_child')
                        ->where('id', $child['id'])
                        ->where('applicant_id', $applicantId)
                        ->update(Arr::except($child, ['id']));
                    continue;
                }

                $conn->table('applicant_child')->insert(array_merge(
                    ['applicant_id' => $applicantId],
                    Arr::except($child, ['id'])
                ));
            }

            $this->stepUpdater->markComplete($conn, $applicantId, 'familyBackground');

            $conn->commit();

            if (request()->expectsJson()) {
                return response()->json([
                    'status' => 'success',
                    'title' => 'Success!',
                    'message' => 'Family background saved successfully! Proceed with this step.',
                    'applicantId' => $applicantId,
                    'nextStep' => 'educationalBackground',
                ]);
            }

            return redirect()->route('applicants.edit', [
                'id' => $applicantId,
                'step' => 'educationalBackground',
            ])->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Family background saved successfully! Proceed with this step.',
            ]);
        } catch (\Throwable $e) {
            $conn->rollBack();
            Log::error('Failed to save family background of applicant: ' . $e->getMessage());

            if (request()->expectsJson()) {
                return response()->json([
                    'status' => 'error',
                    'title' => 'Uh oh! Something went wrong.',
                    'message' => 'An error occurred while saving family background of an applicant. Please try again.',
                ], 500);
            }

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving family background of an applicant. Please try again.',
            ]);
        }
    }

    public function asController(ActionRequest $request, int $applicantId)
    {
        return $this->handle($request->validated(), $applicantId);
    }
}

