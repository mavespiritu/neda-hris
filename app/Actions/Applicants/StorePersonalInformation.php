<?php

namespace App\Actions\Applicants;

use App\Services\Profile\ProfileStepUpdater;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class StorePersonalInformation
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
        return [
            'id' => ['nullable', 'integer'],
            'last_name' => ['required'],
            'first_name' => ['required'],
            'middle_name' => ['nullable'],
            'ext_name' => ['nullable'],
            'birth_date' => ['required', 'date'],
            'birth_place' => ['required'],
            'gender' => ['required'],
            'civil_status' => ['required'],
            'height' => ['required', 'numeric'],
            'weight' => ['required', 'numeric'],
            'blood_type' => ['required'],
            'umid_no' => ['required'],
            'pag_ibig_no' => ['required'],
            'philhealth_no' => ['required'],
            'philsys_no' => ['required'],
            'tin_no' => ['required'],
            'agency_employee_no' => ['required'],
            'citizenship' => ['required'],
            'citizenship_by' => ['required_unless:citizenship,Filipino'],
            'citizenship_country' => ['required_unless:citizenship,Filipino'],
            'isResidenceSameWithPermanentAddress' => ['required', 'boolean'],
            'permanent_house_no' => ['nullable'],
            'permanent_street' => ['nullable'],
            'permanent_subdivision' => ['nullable'],
            'permanent_barangay' => ['nullable'],
            'permanent_city' => ['nullable'],
            'permanent_province' => ['nullable'],
            'permanent_zip' => ['nullable', 'max:5'],
            'residential_house_no' => ['required'],
            'residential_street' => ['required'],
            'residential_subdivision' => ['required'],
            'residential_barangay' => ['required'],
            'residential_city' => ['required'],
            'residential_province' => ['required'],
            'residential_zip' => ['required', 'max:5'],
            'telephone_no' => ['required'],
            'mobile_no' => ['required', 'max:11'],
            'email_address' => ['required', 'email'],
        ];
    }

    public function getValidationMessages(): array
    {
        return [
            'last_name.required' => 'The last name is required.',
            'first_name.required' => 'The first name is required.',
            'birth_date.required' => 'The birth date is required.',
            'birth_date.date' => 'The birth date must be a valid date.',
            'birth_place.required' => 'The birth place is required.',
            'gender.required' => 'The sex is required.',
            'civil_status.required' => 'The civil status is required.',
            'height.required' => 'The height is required.',
            'height.numeric' => 'The height must be a number.',
            'weight.required' => 'The weight is required.',
            'weight.numeric' => 'The weight must be a number.',
            'blood_type.required' => 'The blood type is required.',
            'umid_no.required' => 'The UMID number is required.',
            'pag_ibig_no.required' => 'The PAG-IBIG number is required.',
            'philhealth_no.required' => 'The PhilHealth number is required.',
            'tin_no.required' => 'The TIN number is required.',
            'philsys_no.required' => 'The PhilSys ID number is required.',
            'agency_employee_no.required' => 'The agency employee number is required.',
            'citizenship.required' => 'The citizenship is required.',
            'citizenship_by.required_unless' => 'The "Citizenship by" field is required unless the citizenship is Filipino.',
            'citizenship_country.required_unless' => 'The "Citizenship country" is required unless the citizenship is Filipino.',
            'isResidenceSameWithPermanentAddress.required' => 'Please specify if residence is the same with permanent address.',
            'isResidenceSameWithPermanentAddress.boolean' => 'The residence indicator must be true or false.',
            'permanent_zip.max' => 'Permanent ZIP code must not exceed 5 characters.',
            'residential_house_no.required' => 'Residential house number is required.',
            'residential_street.required' => 'Residential street is required.',
            'residential_subdivision.required' => 'Residential subdivision is required.',
            'residential_barangay.required' => 'Residential barangay is required.',
            'residential_city.required' => 'Residential city is required.',
            'residential_province.required' => 'Residential province is required.',
            'residential_zip.required' => 'Residential ZIP code is required.',
            'residential_zip.max' => 'Residential ZIP code must not exceed 5 characters.',
            'telephone_no.required' => 'Telephone number is required.',
            'mobile_no.required' => 'Mobile number is required.',
            'mobile_no.max' => 'Mobile number must not exceed 11 digits.',
            'email_address.required' => 'Email address is required.',
            'email_address.email' => 'Email address must be valid.',
        ];
    }

    public function withValidator($validator, ActionRequest $request): void
    {
        $validator->after(function ($validator) use ($request) {
            $data = $request->all();

            if (! filter_var($data['isResidenceSameWithPermanentAddress'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                foreach ([
                    'permanent_house_no' => 'Permanent house number is required if not same as residence.',
                    'permanent_street' => 'Permanent street is required if not same as residence.',
                    'permanent_subdivision' => 'Permanent subdivision is required if not same as residence.',
                    'permanent_barangay' => 'Permanent barangay is required if not same as residence.',
                    'permanent_city' => 'Permanent city is required if not same as residence.',
                    'permanent_province' => 'Permanent province is required if not same as residence.',
                    'permanent_zip' => 'Permanent ZIP code is required if not same as residence.',
                ] as $field => $message) {
                    if (blank($data[$field] ?? null)) {
                        $validator->errors()->add($field, $message);
                    }
                }
            }
        });
    }

    public function handle(array $data, ?int $applicantId = null)
    {
        $conn = DB::connection('mysql');

        try {
            $conn->beginTransaction();

            unset($data['step']);

            if (($data['citizenship'] ?? null) === 'Filipino') {
                $data['citizenship_by'] = null;
                $data['citizenship_country'] = null;
            }

            if (filter_var($data['isResidenceSameWithPermanentAddress'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                $data['permanent_province'] = $data['residential_province'] ?? null;
                $data['permanent_city'] = $data['residential_city'] ?? null;
                $data['permanent_barangay'] = $data['residential_barangay'] ?? null;
                $data['permanent_house_no'] = $data['residential_house_no'] ?? null;
                $data['permanent_street'] = $data['residential_street'] ?? null;
                $data['permanent_subdivision'] = $data['residential_subdivision'] ?? null;
                $data['permanent_zip'] = $data['residential_zip'] ?? null;
            }

            $data['type'] = 'Applicant';

            $resolvedApplicantId = $applicantId ?? ($data['id'] ?? null);

            if ($resolvedApplicantId) {
                $conn->table('applicant')
                    ->where('id', $resolvedApplicantId)
                    ->update(collect($data)->except(['id'])->toArray());
            } else {
                $resolvedApplicantId = $conn->table('applicant')
                    ->insertGetId(collect($data)->except(['id'])->toArray());
            }

            $this->stepUpdater->markComplete($conn, (int) $resolvedApplicantId, 'personalInformation');

            $conn->commit();

            if (request()->expectsJson()) {
                return response()->json([
                    'status' => 'success',
                    'title' => 'Success!',
                    'message' => 'Applicant saved successfully! Proceed with this step.',
                    'applicantId' => (int) $resolvedApplicantId,
                    'nextStep' => 'familyBackground',
                ]);
            }

            return redirect()->route('applicants.edit', [
                'id' => $resolvedApplicantId,
                'step' => 'familyBackground',
            ])->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Applicant saved successfully! Proceed with this step.',
            ]);
        } catch (\Throwable $e) {
            $conn->rollBack();
            Log::error('Failed to save personal information of applicant: ' . $e->getMessage());

            if (request()->expectsJson()) {
                return response()->json([
                    'status' => 'error',
                    'title' => 'Uh oh! Something went wrong.',
                    'message' => 'An error occurred while saving personal information of an applicant. Please try again.',
                ], 500);
            }

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving personal information of an applicant. Please try again.',
            ]);
        }
    }

    public function asController(ActionRequest $request, ?int $applicantId = null)
    {
        return $this->handle($request->validated(), $applicantId);
    }
}
