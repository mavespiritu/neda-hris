<?php

namespace App\Actions\Profile;

use App\Services\Profile\ProfileContextResolver;
use App\Services\Profile\ProfileStepUpdater;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use Illuminate\Support\Facades\Gate;

class StorePersonalInformation
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
            'last_name' => ['required'],
            'first_name' => ['required'],
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
            'permanent_barangay_name' => ['nullable'],
            'permanent_city' => ['nullable'],
            'permanent_city_name' => ['nullable'],
            'permanent_province' => ['nullable'],
            'permanent_province_name' => ['nullable'],
            'permanent_is_metro_manila' => ['nullable', 'boolean'],
            'permanent_district' => ['nullable'],
            'permanent_district_name' => ['nullable'],
            'permanent_zip' => ['nullable', 'max:5'],

            'residential_house_no' => ['required'],
            'residential_street' => ['required'],
            'residential_subdivision' => ['required'],
            'residential_barangay' => ['required'],
            'residential_barangay_name' => ['nullable'],
            'residential_city' => ['required'],
            'residential_city_name' => ['nullable'],
            'residential_province' => ['nullable'],
            'residential_province_name' => ['nullable'],
            'residential_is_metro_manila' => ['nullable', 'boolean'],
            'residential_district' => ['nullable'],
            'residential_district_name' => ['nullable'],
            'residential_zip' => ['required', 'max:5'],

            'telephone_no' => ['required'],
            'mobile_no' => ['required', 'max:11'],
        ];
    }

    public function withValidator($validator, ActionRequest $request): void
    {
        $validator->after(function ($validator) use ($request) {
            $data = $request->all();

            $sameAddress = filter_var(
                $data['isResidenceSameWithPermanentAddress'] ?? false,
                FILTER_VALIDATE_BOOLEAN
            );

            $resMetro = filter_var(
                $data['residential_is_metro_manila'] ?? false,
                FILTER_VALIDATE_BOOLEAN
            );

            $permMetro = filter_var(
                $data['permanent_is_metro_manila'] ?? false,
                FILTER_VALIDATE_BOOLEAN
            );

            foreach ([
                'residential_house_no' => 'Residential house number is required.',
                'residential_street' => 'Residential street is required.',
                'residential_subdivision' => 'Residential subdivision is required.',
                'residential_barangay' => 'Residential barangay is required.',
                'residential_city' => 'Residential city is required.',
                'residential_zip' => 'Residential zip code is required.',
            ] as $field => $message) {
                if (blank($data[$field] ?? null)) {
                    $validator->errors()->add("$field", $message);
                }
            }

            if ($resMetro) {
                if (blank($data['residential_district'] ?? null)) {
                    $validator->errors()->add(
                        'residential_district',
                        'Residential district is required when residential address is in Metro Manila.'
                    );
                }
            } else {
                if (blank($data['residential_province'] ?? null)) {
                    $validator->errors()->add(
                        'residential_province',
                        'Residential province is required when residential address is outside Metro Manila.'
                    );
                }
            }

            if (! $sameAddress) {
                foreach ([
                    'permanent_house_no' => 'Permanent house number is required.',
                    'permanent_street' => 'Permanent street is required.',
                    'permanent_subdivision' => 'Permanent subdivision is required.',
                    'permanent_barangay' => 'Permanent barangay is required.',
                    'permanent_city' => 'Permanent city is required.',
                    'permanent_zip' => 'Permanent zip code is required.',
                ] as $field => $message) {
                    if (blank($data[$field] ?? null)) {
                        $validator->errors()->add("$field", $message);
                    }
                }

                if ($permMetro) {
                    if (blank($data['permanent_district'] ?? null)) {
                        $validator->errors()->add(
                            'permanent_district',
                            'Permanent district is required when permanent address is in Metro Manila.'
                        );
                    }
                } else {
                    if (blank($data['permanent_province'] ?? null)) {
                        $validator->errors()->add(
                            'permanent_province',
                            'Permanent province is required when permanent address is outside Metro Manila.'
                        );
                    }
                }
            }
        });
    }

    public function getValidationMessages(): array
    {
        return [
            'last_name.required' => 'The last name is required.',
            'first_name.required' => 'The first name is required.',
            'birth_date.required' => 'The birth date is required.',
            'birth_place.required' => 'The birth place is required.',
            'birth_date.date' => 'The birth date must be a valid date.',
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
            'philsys_no.required' => 'The PhilSys ID number is required.',
            'tin_no.required' => 'The TIN number is required.',
            'agency_employee_no.required' => 'The agency employee number is required.',
            'citizenship.required' => 'The citizenship is required.',
            'citizenship_by.required_unless' => 'The citizenship by is required if citizenship is not Filipino.',
            'citizenship_country.required_unless' => 'The citizenship country is required if citizenship is not Filipino.',
            'isResidenceSameWithPermanentAddress.required' => 'Please specify if residence is same with permanent address.',
            'residential_zip.max' => 'Residential zip code must not exceed 5 characters.',
            'permanent_zip.max' => 'Permanent zip code must not exceed 5 characters.',
            'telephone_no.required' => 'Telephone number is required.',
            'mobile_no.required' => 'Mobile number is required.',
        ];
    }

    public function asController(ActionRequest $request)
    {
        try {
            $context = $this->contextResolver->resolve();
            $user = $context['user'];
            $type = $context['type'];
            $conn = $context['appConn'];

            $data = $request->validated();

            if (($data['citizenship'] ?? null) === 'Filipino') {
                $data['citizenship_by'] = null;
                $data['citizenship_country'] = null;
            }

            if (! filter_var($data['residential_is_metro_manila'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                $data['residential_district'] = null;
                $data['residential_district_name'] = null;
            } else {
                $data['residential_province'] = null;
                $data['residential_province_name'] = null;
            }

            if (filter_var($data['isResidenceSameWithPermanentAddress'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                $data['permanent_house_no'] = $data['residential_house_no'];
                $data['permanent_street'] = $data['residential_street'];
                $data['permanent_subdivision'] = $data['residential_subdivision'];
                $data['permanent_barangay'] = $data['residential_barangay'];
                $data['permanent_barangay_name'] = $data['residential_barangay_name'];
                $data['permanent_city'] = $data['residential_city'];
                $data['permanent_city_name'] = $data['residential_city_name'] ?? null;
                $data['permanent_province'] = $data['residential_province'] ?? null;
                $data['permanent_province_name'] = $data['residential_province_name'] ?? null;
                $data['permanent_is_metro_manila'] = $data['residential_is_metro_manila'] ?? 0;
                $data['permanent_district'] = $data['residential_district'] ?? null;
                $data['permanent_district_name'] = $data['residential_district_name'] ?? null;
                $data['permanent_zip'] = $data['residential_zip'];
            } else {
                if (! filter_var($data['permanent_is_metro_manila'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                    $data['permanent_district'] = null;
                    $data['permanent_district_name'] = null;
                } else {
                    $data['permanent_province'] = null;
                    $data['permanent_province_name'] = null;
                }
            }

            $data['email_address'] = $data['email_address'] ?? $user->email;
            $data['emp_id'] = $user->ipms_id ?? null;

            $conn->table('applicant')->updateOrInsert(
                [
                    'user_id' => $user->id,
                    'type' => $type,
                ],
                $data
            );

            $applicantId = $conn->table('applicant')
                ->where('user_id', $user->id)
                ->where('type', $type)
                ->value('id');

            $this->stepUpdater->markComplete($conn, (int) $applicantId, 'personalInformation');

            return response()->json([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Personal Information saved successfully.',
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to save personal information: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving personal information. Please try again.',
            ]);
        }
    }
}
