<?php

namespace App\Http\Controllers\Applicants;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Arr;

class ApplicationsController extends Controller
{
    public function index(Request $request)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $sort      = $request->get('sort');
        $direction = strtolower($request->get('direction', 'asc')) === 'desc' ? 'desc' : 'asc';
        $search    = $request->input('search', '');

        $sortable = [
            'name' => DB::raw("CONCAT(
                a.last_name,
                IF(a.ext_name IS NOT NULL AND a.ext_name != '', CONCAT(' ', a.ext_name), ''),
                ', ',
                a.first_name,
                ' ',
                IFNULL(CONCAT(LEFT(a.middle_name, 1), '.'), '')
            )"),
            'birth_date' => DB::raw('birth_date'),       
            'email_address' => DB::raw('email_address'),             
            'mobile_no' => DB::raw('mobile_no'),             
        ];

        $searchable = [
            'name',
            'birth_date',
            'email_address',
            'mobile_no',
        ];

        $filterable = [
            'type' => 'a.type',
            'gender' => 'a.gender',
        ];
        
        $applicationsQuery = $conn->table('application as a')
        ->select([
            'a.*',
            DB::raw("CONCAT(
                a.last_name,
                IF(a.ext_name IS NOT NULL AND a.ext_name != '', CONCAT(' ', a.ext_name), ''),
                ', ',
                a.first_name,
                ' ',
                IFNULL(CONCAT(LEFT(a.middle_name, 1), '.'), '')
            ) AS name"),
        ]);

        // filtering
        foreach ($filterable as $param => $column) {
            if ($request->filled($param)) {
                $applicationsQuery->where($column, $request->input($param));
            }
        }

        // sorting
        if ($sort && isset($sortable[$sort]) && in_array(strtolower($direction), ['asc', 'desc'])) {
            $applicationsQuery->orderBy($sortable[$sort], $direction);
        }

        $applications = $applicationsQuery
                    ->where('a.status', 'Submitted')
                    ->orderByDesc('a.date_submitted')
                    ->paginate(20);

        if ($search) {
            $searchLower = strtolower($search);

            $applications->setCollection(
                $applications->getCollection()->filter(function ($application) use ($searchable, $searchLower) {
                    foreach ($searchable as $field) {
                        if (str_contains(strtolower($application->{$field} ?? ''), $searchLower)) {
                            return true;
                        }
                    }
                    return false;
                })->values()
            );

        }

        return Inertia::render('Applications/index', [
            'data' => [
                'applications' => $applications,
            ],
        ]);
    }

    public function create()
    {
        $applicant = [
            'id' => null,
            'emp_id' => '',
            'type' => 'Applicant',
            'email_address' => '',
            'last_name' => '',
            'first_name' => '',
            'middle_name' => '',
            'ext_name' => '',
            'birth_date' => "",
            'birth_place' => "",
            'gender' => "",
            'civil_status' => "",
            'height' => 0,
            'weight' => 0,
            'blood_type' => "",
            'gsis_no' => "",
            'pag_ibig_no' => "",
            'philhealth_no' => "",
            'sss_no' => "",
            'tin_no' => "",
            'agency_employee_no' => "",
            'citizenship' => "",
            'citizenship_by' => "",
            'citizenship_country' => "",
            'isResidenceSameWithPermanentAddress' => false,
            'permanent_house_no' => "",
            'permanent_street' => "",
            'permanent_subdivision' => "",
            'permanent_barangay' => "",
            'permanent_city' => "",
            'permanent_province' => "",
            'permanent_zip' => "",
            'residential_house_no' => "",
            'residential_street' => "",
            'residential_subdivision' => "",
            'residential_barangay' => "",
            'residential_city' => "",
            'residential_province' => "",
            'residential_zip' => "",
            'telephone_no' => "",
            'mobile_no' => "",
        ];

        return inertia('Applicants/Pds/PersonalInformation', [
            'applicant' => $applicant,
            'mode' => 'create'
        ]);
    }

    public function store(Request $request)
    {
        $conn = DB::connection('mysql');

        return $this->storePersonalInformation($request, $conn);

    }

    public function edit($id, Request $request)
    {
        $conn = DB::connection('mysql');

        $step = $request->input('step');
        
        switch($step){
            case 'personalInformation':
                return $this->editPersonalInformation($id);
            break;
            case 'familyBackground':
                return $this->editFamilyBackground($id);
            break;
            case 'educationalBackground':
                return $this->editEducationalBackground($id);
            break;
            case 'civilServiceEligibility':
                return $this->editCivilServiceEligibility($id);
            break;
            case 'workExperience':
                return $this->editWorkExperience($id);
            break;
            case 'voluntaryWork':
                return $this->editVoluntaryWork($id);
            break;
            case 'learningAndDevelopment':
                return $this->editLearningAndDevelopment($id);
            break;
            case 'otherInformation':
                return $this->editOtherInformation($id);
            break;
             default:
                return $this->editPersonalInformation($id);
        }
    }

    public function update($id, Request $request)
    {
        $conn = DB::connection('mysql');

        $step = $request->input('step');
        
        switch($step){
            case 'personalInformation':
                return $this->storePersonalInformation($request, $conn, $id);
            break;
            case 'familyBackground':
                return $this->storeFamilyBackground($request, $conn, $id);
            break;
            case 'educationalBackground':
                return $this->storeEducationalBackground($request, $conn, $id);
            break;
            case 'civilServiceEligibility':
                return $this->storeCivilServiceEligibilty($request, $conn, $id);
            break;
            case 'workExperience':
                return $this->storeWorkExperience($request, $conn, $id);
            break;
            case 'voluntaryWork':
                return $this->storeVoluntaryWork($request, $conn, $id);
            break;
            case 'learningAndDevelopment':
                return $this->storeLearningAndDevelopment($request, $conn, $id);
            break;
            case 'otherInformation':
                return $this->storeOtherInformation($request, $conn, $id);
            break;
             default:
                throw new \Exception("Invalid step: {$step}");
        }
    }

    private function storePersonalInformation($request, $conn)
    {
        $validated = $request->validate([
            'last_name' => 'required',
            'first_name' => 'required',
            'ext_name' => 'nullable',
            'birth_date' => 'required|date',
            'birth_place' => 'required',
            'gender' => 'required',
            'civil_status' => 'required',
            'height' => 'required|numeric',
            'weight' => 'required|numeric',
            'blood_type' => 'required',
            'gsis_no' => 'required',
            'pag_ibig_no' => 'required',
            'philhealth_no' => 'required',
            'sss_no' => 'required',
            'tin_no' => 'required',
            'agency_employee_no' => 'required',
            'citizenship' => 'required',
            'citizenship_by' => 'required_unless:citizenship,Filipino',
            'citizenship_country' => 'required_unless:citizenship,Filipino',
            'isResidenceSameWithPermanentAddress' => 'required|boolean',
            'permanent_house_no' => 'required_if:isResidenceSameWithPermanentAddress,false',
            'permanent_street' => 'required_if:isResidenceSameWithPermanentAddress,false',
            'permanent_subdivision' => 'required_if:isResidenceSameWithPermanentAddress,false',
            'permanent_barangay' => 'required_if:isResidenceSameWithPermanentAddress,false',
            'permanent_city' => 'required_if:isResidenceSameWithPermanentAddress,false',
            'permanent_province' => 'required_if:isResidenceSameWithPermanentAddress,false',
            'permanent_zip' => 'required_if:isResidenceSameWithPermanentAddress,false|max:5',
            'residential_house_no' => 'required',
            'residential_street' => 'required',
            'residential_subdivision' => 'required',
            'residential_barangay' => 'required',
            'residential_city' => 'required',
            'residential_province' => 'required',
            'residential_zip' => 'required|max:5',
            'telephone_no' => 'required',
            'mobile_no' => 'required|max:11',
            'email_address' => 'required|email',
        ], [
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
            'gsis_no.required' => 'The GSIS number is required.',
            'pag_ibig_no.required' => 'The PAG-IBIG number is required.',
            'philhealth_no.required' => 'The PhilHealth number is required.',
            'sss_no.required' => 'The SSS number is required.',
            'tin_no.required' => 'The TIN number is required.',
            'agency_employee_no.required' => 'The agency employee number is required.',
            'citizenship.required' => 'The citizenship is required.',
            'citizenship_by.required_unless' => 'The "Citizenship by" field is required unless the citizenship is Filipino.',
            'citizenship_country.required_unless' => 'The "Citizenship country" is required unless the citizenship is Filipino.',
            'isResidenceSameWithPermanentAddress.required' => 'Please specify if residence is the same with permanent address.',
            'isResidenceSameWithPermanentAddress.boolean' => 'The residence indicator must be true or false.',
            'permanent_house_no.required_if' => 'Permanent house number is required if not same as residence.',
            'permanent_street.required_if' => 'Permanent street is required if not same as residence.',
            'permanent_subdivision.required_if' => 'Permanent subdivision is required if not same as residence.',
            'permanent_barangay.required_if' => 'Permanent barangay is required if not same as residence.',
            'permanent_city.required_if' => 'Permanent city is required if not same as residence.',
            'permanent_province.required_if' => 'Permanent province is required if not same as residence.',
            'permanent_zip.required_if' => 'Permanent ZIP code is required if not same as residence.',
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
        ]);

        $data = $request->all();

        // ✅ Handle same address case
        if (!empty($data['isResidenceSameWithPermanentAddress']) && $data['isResidenceSameWithPermanentAddress']) {
            $data['permanent_province'] = $data['residential_province'];
            $data['permanent_city'] = $data['residential_city'];
            $data['permanent_barangay'] = $data['residential_barangay'];
            $data['permanent_house_no'] = $data['residential_house_no'];
            $data['permanent_street'] = $data['residential_street'];
            $data['permanent_subdivision'] = $data['residential_subdivision'];
            $data['permanent_zip'] = $data['residential_zip'];
        }

        // ✅ Handle Filipino citizenship case
        if ($data['citizenship'] === 'Filipino') {
            $data['citizenship_by'] = null;
            $data['citizenship_country'] = null;
        }

        $data['type'] = 'Applicant';

        try {
            $conn->beginTransaction();

            unset($data['step']);

            if (!empty($data['id'])) {
                // 🔹 UPDATE existing applicant
                $applicantId = $data['id'];

                $conn->table('applicant')
                    ->where('id', $applicantId)
                    ->update(collect($data)->except(['id'])->toArray());

                // Ensure PDS step exists or update status
                $exists = $conn->table('applicant_pds')
                    ->where('applicant_id', $applicantId)
                    ->where('step', 'personalInformation')
                    ->exists();

                if ($exists) {
                    $conn->table('applicant_pds')
                        ->where('applicant_id', $applicantId)
                        ->where('step', 'personalInformation')
                        ->update(['status' => 1]);
                } else {
                    $conn->table('applicant_pds')->insert([
                        'applicant_id' => $applicantId,
                        'step' => 'personalInformation',
                        'status' => 1,
                    ]);
                }
            } else {
                $applicantId = $conn->table('applicant')->insertGetId($data);

                $conn->table('applicant_pds')->insert([
                    'applicant_id' => $applicantId,
                    'step' => 'personalInformation',
                    'status' => 1,
                ]);
            }

            $conn->commit();

            return redirect()->route('applicants.edit', [
                'id' => $applicantId,
                'step' => 'familyBackground'
            ])->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Applicant saved successfully! Proceed with this step.'
            ]);
        } catch (\Exception $e) {
            $conn->rollBack();
            Log::error('Failed to save personal information of applicant: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving personal information of an applicant. Please try again.'
            ]);
        }
    }

    public function editPersonalInformation($id)
    {
        $conn = DB::connection('mysql');

        $applicant = $conn->table('applicant')
            ->where('id', $id)
            ->first();

        if (!$applicant) {
            abort(404);
        }

        return inertia('Applicants/Pds/PersonalInformation', [
            'applicant' => $applicant,
            'mode' => 'edit'
        ]);
    }

    public function editFamilyBackground($id)
    {
        $conn = DB::connection('mysql');

        $applicant = $conn->table('applicant')
            ->where('id', $id)
            ->first();

        if (!$applicant) {
            abort(404);
        }

        $emptySpouse = [
            'id' => null,
            'isThereSpouse' => false,
            'applicant_id' => $id,
            'last_name' => '',
            'first_name' => '',
            'middle_name' => '',
            'ext_name' => '',
            'occupation' => '',
            'employer_name' => '',
            'business_address' => '',
            'telephone_no' => '',
        ];

        $emptyFather = [
            'id' => null,
            'applicant_id' => $id,
            'last_name' => '',
            'first_name' => '',
            'middle_name' => '',
            'ext_name' => '',
            'birth_date' => '',
        ];

        $emptyMother = [
            'id' => null,
            'applicant_id' => $id,
            'last_name' => '',
            'first_name' => '',
            'middle_name' => '',
            'maiden_name' => '',
            'birth_date' => '',
        ];

        $spouse = $conn->table('applicant_spouse')->where('applicant_id', $id)->first() ?? (object) $emptySpouse;
        $father = $conn->table('applicant_father')->where('applicant_id', $id)->first() ?? (object) $emptyFather;
        $mother = $conn->table('applicant_mother')->where('applicant_id', $id)->first() ?? (object) $emptyMother;

        $children = $conn->table('applicant_child')
            ->where('applicant_id', $id)
            ->get();

        return inertia('Applicants/Pds/FamilyBackground', [
            'applicant' => $applicant,
            'isThereSpouse' => !is_null($spouse) ? true : false,
            'spouse' => $spouse,
            'father' => $father,
            'mother' => $mother,
            'children' => $children ?? [],
        ]);
    }

    private function storeFamilyBackground($request, $conn, $applicantId)
    {
        $validated = $request->validate([
            'spouse.last_name' => 'required_if:isThereSpouse,true|nullable',
            'spouse.first_name' => 'required_if:isThereSpouse,true|nullable',
            'spouse.occupation' => 'required_if:isThereSpouse,true|nullable',
            'spouse.employer_name' => 'required_if:isThereSpouse,true|nullable',
            'spouse.business_address' => 'required_if:isThereSpouse,true|nullable',
            'spouse.telephone_no' => 'required_if:isThereSpouse,true|nullable',

            'father.last_name' => 'required',
            'father.first_name' => 'required',
            'father.birth_date' => 'required|date',

            'mother.last_name' => 'required',
            'mother.first_name' => 'required',
            'mother.maiden_name' => 'required',
            'mother.birth_date' => 'required|date',

            'children.*.last_name' => 'required',
            'children.*.first_name' => 'required',
            'children.*.birth_date' => 'required|date',
        ], [
            'spouse.last_name.required_if' => 'The spouse\'s last name is required.',
            'spouse.first_name.required_if' => 'The spouse\'s first name is required.',
            'spouse.occupation.required_if' => 'The spouse\'s occupation is required.',
            'spouse.employer_name.required_if' => 'The spouse\'s employer name is required.',
            'spouse.business_address.required_if' => 'The spouse\'s business address is required.',
            'spouse.telephone_no.required_if' => 'The spouse\'s telephone number is required.',

            'father.last_name.required' => 'The father\'s last name is required.',
            'father.first_name.required' => 'The father\'s first name is required.',
            'father.birth_date.required' => 'The father\'s birth date is required.',
            'father.birth_date.date' => 'The father\'s birth date must be a valid date.',

            'mother.last_name.required' => 'The mother\'s last name is required.',
            'mother.first_name.required' => 'The mother\'s first name is required.',
            'mother.maiden_name.required' => 'The mother\'s maiden name is required.',
            'mother.birth_date.required' => 'The mother\'s birth date is required.',
            'mother.birth_date.date' => 'The mother\'s birth date must be a valid date.',

            'children.*.last_name.required' => 'Each child\'s last name is required.',
            'children.*.first_name.required' => 'Each child\'s first name is required.',
            'children.*.birth_date.required' => 'Each child\'s birth date is required.',
            'children.*.birth_date.date' => 'Each child\'s birth date must be a valid date.',
        ]);

        $spouse = $request['spouse'];
        $father = $request['father'];
        $mother = $request['mother'];
        $children = $request['children'];

        $spouse['hasSpouse'] = $request['isThereSpouse'];

        try{
            $conn->beginTransaction();

            if (!empty($spouse)) {
                $conn->table('applicant_spouse')->updateOrInsert(
                    ['applicant_id' => $applicantId],
                    Arr::except($spouse, ['id'])
                );
            }

            $conn->table('applicant_father')->updateOrInsert(
                ['applicant_id' => $applicantId],
                Arr::except($father, ['id'])
            );

            $conn->table('applicant_mother')->updateOrInsert(
                ['applicant_id' => $applicantId],
                Arr::except($mother, ['id'])
            );

            $existingChildIds = $conn->table('applicant_child')
                ->where('applicant_id', $applicantId)
                ->pluck('id')
                ->toArray();

            $incomingChildIds = collect($children)
                ->pluck('id')
                ->filter()
                ->toArray();

            $childToDelete = array_diff($existingChildIds, $incomingChildIds);
            if (!empty($childToDelete)) {
                $conn->table('applicant_child')
                    ->whereIn('id', $childToDelete)
                    ->delete();
            }

            foreach ($children as $child) {
                if (!empty($child['id'])) {
                    $conn->table('applicant_child')
                        ->where('id', $child['id'])
                        ->where('applicant_id', $applicantId)
                        ->update(Arr::except($child, ['id']));
                } else {
                    $conn->table('applicant_child')->insert(array_merge(
                        ['applicant_id' => $applicantId],
                        $child
                    ));
                }
                
            }

            $conn->table('applicant_pds')->updateOrInsert(
                [
                    'applicant_id' => $applicantId,
                    'step' => 'familyBackground',
                ],
                [
                    'status' => 1
                ]
            );

            $conn->commit();

            return redirect()->route('applicants.edit', [
                'id' => $applicantId,
                'step' => 'educationalBackground',
            ])
            ->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Family background saved successfully! Proceed with this step.'
            ]);

        }catch (\Exception $e) {
            $conn->rollBack();
            Log::error('Failed to save family background of applicant: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving family background of an applicant. Please try again.'
            ]);
        }
    }

    public function editEducationalBackground($id)
    {
        $conn = DB::connection('mysql');

        $applicant = $conn->table('applicant')
            ->where('id', $id)
            ->first();

        if (!$applicant) {
            abort(404);
        }

        $rawEducations = $conn->table('applicant_education')
            ->where('applicant_id', $id)
            ->get()
            ->groupBy('level');

        $levels = [
            ['id' => 'elementary', 'label' => 'Elementary'],
            ['id' => 'secondary', 'label' => 'Secondary'],
            ['id' => 'vocational', 'label' => 'Vocational/Trade Course'],
            ['id' => 'college', 'label' => 'College'],
            ['id' => 'graduate', 'label' => 'Graduate Studies'],
        ];

        $educations = [];

        foreach ($levels as $level) {
            $idKey = $level['id'];
            $label = $level['label'];

            $educations[$idKey] = $rawEducations[$label] ?? collect();

            $educations[$idKey] = $educations[$idKey]->sortByDesc('from_year')->values();

            if (in_array($idKey, ['elementary', 'secondary']) && $educations[$idKey]->isEmpty()) {
                $educations[$idKey] = collect([
                    (object)[
                        'id' => null,
                        'applicant_id' => $id,
                        'level' => $label,
                        'school' => '',
                        'course' => '',
                        'highest_attainment' => '',
                        'from_year' => '',
                        'to_year' => '',
                        'year_graduated' => '',
                        'award' => '',
                        'is_graduated' => false,
                        'created_at' => null,
                        'updated_at' => null,
                    ]
                ]);
            }
        }

        return inertia('Applicants/Pds/EducationalBackground', [
            'applicant' => $applicant,
            'educations' => $educations,
        ]);
    }

    private function storeEducationalBackground($request, $conn, $applicantId)
    {
        $levels = [
            ['id' => 'elementary', 'label' => 'Elementary'],
            ['id' => 'secondary', 'label' => 'Secondary'],
            ['id' => 'vocational', 'label' => 'Vocational/Trade Course'],
            ['id' => 'college', 'label' => 'College'],
            ['id' => 'graduate', 'label' => 'Graduate Studies'],
        ];

        $rules = [];
        $messages = [];

        foreach ($levels as $level) {
            $id = $level['id'];
            $label = $level['label'];

            $rules["{$id}.*.school"] = 'required';
            $rules["{$id}.*.course"] = 'required';
            $rules["{$id}.*.highest_attainment"] = 'required';
            $rules["{$id}.*.from_year"] = 'required|digits:4';
            $rules["{$id}.*.to_year"] = 'required|digits:4';
            $rules["{$id}.*.award"] = 'required';
            $rules["{$id}.*.year_graduated"] = 'nullable|digits:4';

            $messages["{$id}.*.school.required"] = "Each {$label} record must have a school name.";
            $messages["{$id}.*.course.required"] = "Each {$label} record must have a course/degree.";
            $messages["{$id}.*.highest_attainment.required"] = "Each {$label} record must have highest level/units earned.";
            $messages["{$id}.*.from_year.required"] = "Each {$label} record must have a start year.";
            $messages["{$id}.*.to_year.required"] = "Each {$label} record must have an end year.";
            $messages["{$id}.*.from_year.digits"] = "The start year for {$label} must be a 4-digit year.";
            $messages["{$id}.*.to_year.digits"] = "The end year for {$label} must be a 4-digit year.";
            $messages["{$id}.*.award.required"] = "Each {$label} record must have a scholarship/academic honor.";
            $messages["{$id}.*.year_graduated.digits"] = "The year graduated for {$label} must be a 4-digit year.";
        }

        $validator = \Validator::make($request->all(), $rules, $messages);

        $validator->after(function ($validator) use ($request, $levels) {
            foreach ($levels as $level) {
                $id = $level['id'];
                $entries = $request->input($id, []);
                foreach ($entries as $index => $entry) {
                    if (!empty($entry['is_graduated']) && empty($entry['year_graduated'])) {
                        $validator->errors()->add(
                            "{$id}.{$index}.year_graduated",
                            "Year graduated is required for {$level['label']} when marked as graduated."
                        );
                    }

                    if (!empty($entry['from_year']) && !empty($entry['to_year']) && (int)$entry['to_year'] < (int)$entry['from_year']) {
                        $validator->errors()->add(
                            "{$id}.{$index}.to_year",
                            "End year must be after or equal to start year for {$level['label']}."
                        );
                    }
                }
            }
        });

        $validated = $validator->validate();

        try{
            $conn->beginTransaction();

            $existingIds = $conn->table('applicant_education')
            ->where('applicant_id', $applicantId)
            ->pluck('id')
            ->toArray();

            $incomingIds = [];
            
            foreach ($levels as $level) {
                $id = $level['id'];
                $label = $level['label'];

                $entries = $request->input($id, []);
                foreach ($entries as $entry) {
                    $entryData = [
                        'level' => $label,
                        'course' => $entry['course'] ?? null,
                        'school' => $entry['school'] ?? null,
                        'highest_attainment' => $entry['highest_attainment'] ?? null,
                        'from_year' => $entry['from_year'] ?? null,
                        'to_year' => $entry['to_year'] ?? null,
                        'year_graduated' => $entry['year_graduated'] ?? null,
                        'award' => $entry['award'] ?? null,
                        'is_graduated' => !empty($entry['is_graduated']) ? 1 : 0,
                        'applicant_id' => $applicantId,
                    ];

                    if (!empty($entry['id'])) {
                        $conn->table('applicant_education')
                            ->where('id', $entry['id'])
                            ->update($entryData);
                        $incomingIds[] = $entry['id'];
                    } else {
                        $newId = $conn->table('applicant_education')->insertGetId($entryData);
                        $incomingIds[] = $newId;
                    }
                }
            }

            $toDelete = array_diff($existingIds, $incomingIds);
            if (!empty($toDelete)) {
                $conn->table('applicant_education')
                    ->whereIn('id', $toDelete)
                    ->delete();
            }

            $conn->table('applicant_pds')->updateOrInsert(
                [
                    'applicant_id' => $applicantId,
                    'step' => 'educationalBackground',
                ],
                [
                    'status' => 1
                ]
            );

            $conn->commit();

            return redirect()->route('applicants.edit', [
                'id' => $applicantId,
                'step' => 'civilServiceEligibility',
            ])
            ->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Educational background saved successfully! Proceed with this step.'
            ]);

        }catch (\Exception $e) {
            $conn->rollBack();
            Log::error('Failed to save educational background of applicant: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving educational background of an applicant. Please try again.'
            ]);
        }
    }

    public function editCivilServiceEligibility($id)
    {
        $conn = DB::connection('mysql');

        $applicant = $conn->table('applicant')
            ->where('id', $id)
            ->first();

        if (!$applicant) {
            abort(404);
        }

        $eligibilities = $conn->table('applicant_eligibility')
            ->where('applicant_id', $id)
            ->get();

        return inertia('Applicants/Pds/CivilServiceEligibility', [
            'applicant' => $applicant,
            'civilServiceEligibility' => $eligibilities,
        ]);
    }

    private function storeCivilServiceEligibilty($request, $conn, $applicantId)
    {
   
        $validated = $request->validate([
            'civilServiceEligibility.*.eligibility' => 'required',
            'civilServiceEligibility.*.rating' => 'required',
            'civilServiceEligibility.*.exam_date' => 'required|date',
            'civilServiceEligibility.*.exam_place' => 'required',
            'civilServiceEligibility.*.license_no' => 'required',
            'civilServiceEligibility.*.validity_date' => 'required|date',
        ], [
            'civilServiceEligibility.*.eligibility.required' => 'Each eligibility\'s title is required.',
            'civilServiceEligibility.*.rating.required' => 'Each eligibility\'s rating is required.',
            'civilServiceEligibility.*.exam_date.required' => 'Each eligibility\'s examination date is required.',
            'civilServiceEligibility.*.exam_date.date' => 'Must be a valid date',
            'civilServiceEligibility.*.exam_place.required' => 'Each eligibility\'s examination place is required.',
            'civilServiceEligibility.*.license_no.required' => 'Each eligibility\'s license number is required.',
            'civilServiceEligibility.*.validity_date.required' => 'Each eligibility\'s validity date is required.',
            'civilServiceEligibility.*.validity_date.date' => 'Must be a valid date',   
        ]);

        try{
            $conn->beginTransaction();

            $eligibilities = $request->input('civilServiceEligibility', []);

            $existingIds = $conn->table('applicant_eligibility')
                ->where('applicant_id', $applicantId)
                ->pluck('id')
                ->toArray();

            $submittedIds = [];

            foreach ($eligibilities as $eligibility) {
                $data = [
                    'applicant_id' => $applicantId,
                    'eligibility' => $eligibility['eligibility'],
                    'rating' => $eligibility['rating'],
                    'exam_date' => $eligibility['exam_date'],
                    'exam_place' => $eligibility['exam_place'],
                    'license_no' => $eligibility['license_no'],
                    'validity_date' => $eligibility['validity_date'],
                ];

                if (isset($eligibility['id']) && in_array($eligibility['id'], $existingIds)) {

                    $conn->table('applicant_eligibility')
                        ->where('id', $eligibility['id'])
                        ->update($data);

                    $submittedIds[] = $eligibility['id'];
                } else {
                    $newId = $conn->table('applicant_eligibility')->insertGetId($data);

                    $submittedIds[] = $newId;
                }
            }

            $conn->table('applicant_eligibility')
            ->where('applicant_id', $applicantId)
            ->whereNotIn('id', $submittedIds)
            ->delete();


            $conn->table('applicant_pds')->updateOrInsert(
                [
                    'applicant_id' => $applicantId,
                    'step' => 'civilServiceEligibility',
                ],
                [
                    'status' => 1
                ]
            );

            $conn->commit();

            return redirect()->route('applicants.edit', [
                'id' => $applicantId,
                'step' => 'workExperience',
            ])
               ->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Civil service eligibilities saved successfully! Proceed with this step.'
            ]);

        }catch (\Exception $e) {
            $conn->rollBack();
            Log::error('Failed to save civil service eligibilities of applicant: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving civil service eligibilities of an applicant. Please try again.'
            ]);
        }
    }

    public function editWorkExperience($id)
    {
        $conn = DB::connection('mysql');

        $applicant = $conn->table('applicant')
            ->where('id', $id)
            ->first();

        if (!$applicant) {
            abort(404);
        }

        $workExperiences = $conn->table('applicant_work_experience')
            ->where('applicant_id', $id)
            ->orderByDesc('to_date')
            ->get();

        return inertia('Applicants/Pds/WorkExperience', [
            'applicant' => $applicant,
            'workExperience' => $workExperiences,
        ]);
    }

    private function storeWorkExperience($request, $conn, $applicantId)
    {
        $validated = $request->validate([
            'workExperience.*.agency' => 'required',
            'workExperience.*.position' => 'required',
            'workExperience.*.appointment' => 'required',
            'workExperience.*.grade' => 'required',
            'workExperience.*.step' => 'required',
            'workExperience.*.monthly_salary' => 'required',
            'workExperience.*.from_date' => 'required|date',
            'workExperience.*.to_date' => 'nullable|date|after_or_equal:workExperience.*.from_date',
        ], [
            'workExperience.*.agency.required' => 'The agency name is required for each work experience.',
            'workExperience.*.position.required' => 'The position title is required for each work experience.',
            'workExperience.*.appointment.required' => 'The appointment status is required for each work experience.',
            'workExperience.*.grade.required' => 'The salary grade is required for each work experience.',
            'workExperience.*.step.required' => 'The step increment is required for each work experience.',
            'workExperience.*.monthly_salary.required' => 'The monthly salary is required for each work experience.',
            'workExperience.*.from_date.required' => 'The start date is required for each work experience.',
            'workExperience.*.from_date.date' => 'Must be a valid date.',
            'workExperience.*.to_date.required' => 'The end date is required for each work experience.',
            'workExperience.*.to_date.date' => 'Must be a valid date.',
            'workExperience.*.to_date.after_or_equal' => 'The end date must be after or equal to the start date for each work experience.',

        ]);

        $extraValidator = \Validator::make($request->all(), [], []);

        $extraValidator->after(function ($validator) use ($request) {
            foreach ($request->input('workExperience', []) as $index => $entry) {

                $isPresent = isset($entry['isPresent']) && $entry['isPresent'];

                if (!$isPresent && empty($entry['to_date'])) {
                    $validator->errors()->add(
                        "workExperience.$index.to_date",
                        "The end date is required unless the position is currently held."
                    );
                }
            }
        });

        if ($extraValidator->fails()) {
            return back()->withErrors($extraValidator)->withInput();
        }

        try{
            $conn->beginTransaction();

            $workExperiences = $request->input('workExperience', []);

            $existingIds = $conn->table('applicant_work_experience')
                ->where('applicant_id', $applicantId)
                ->pluck('id')
                ->toArray();

            $submittedIds = [];

            foreach ($workExperiences as $workExperience) {
                $data = [
                    'applicant_id' => $applicantId,
                    'agency' => $workExperience['agency'] ?? null,
                    'position' => $workExperience['position'] ?? null,
                    'appointment' => $workExperience['appointment'] ?? null,
                    'grade' => $workExperience['grade'] ?? null,
                    'step' => $workExperience['step'] ?? null,
                    'monthly_salary' => $workExperience['monthly_salary'] ?? null,
                    'from_date' => $workExperience['from_date'] ?? null,
                    'to_date' => isset($workExperience['isPresent']) && $workExperience['isPresent'] ? null : ($workExperience['to_date'] ?? null),
                    'isPresent' => $workExperience['isPresent'] ?? 0,
                    'isGovtService' => $workExperience['isGovtService'] ?? 0,
                ];

                if (isset($workExperience['id']) && in_array($workExperience['id'], $existingIds)) {

                    $conn->table('applicant_work_experience')
                        ->where('id', $workExperience['id'])
                        ->update($data);

                    $submittedIds[] = $workExperience['id'];
                } else {
                    $newId = $conn->table('applicant_work_experience')->insertGetId($data);

                    $submittedIds[] = $newId;
                }
            }

            $conn->table('applicant_work_experience')
            ->where('applicant_id', $applicantId)
            ->whereNotIn('id', $submittedIds)
            ->delete();


            $conn->table('applicant_pds')->updateOrInsert(
                [
                    'applicant_id' => $applicantId,
                    'step' => 'workExperience',
                ],
                [
                    'status' => 1
                ]
            );

            $conn->commit();

            return redirect()->route('applicants.edit', [
                'id' => $applicantId,
                'step' => 'voluntaryWork',
            ])
               ->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Work experiences saved successfully! Proceed with this step.'
            ]);

        }catch (\Exception $e) {
            $conn->rollBack();
            Log::error('Failed to save work experiences of applicant: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving work experiences of an applicant. Please try again.'
            ]);
        }
    }

    public function editVoluntaryWork($id)
    {
        $conn = DB::connection('mysql');

        $applicant = $conn->table('applicant')
            ->where('id', $id)
            ->first();

        if (!$applicant) {
            abort(404);
        }

        $voluntaryWorks = $conn->table('applicant_voluntary_work')
            ->where('applicant_id', $id)
            ->orderByDesc('to_date')
            ->get();

        return inertia('Applicants/Pds/VoluntaryWork', [
            'applicant' => $applicant,
            'voluntaryWork' => $voluntaryWorks,
        ]);
    }

    private function storeVoluntaryWork($request, $conn, $applicantId)
    {
        $validated = $request->validate([
            'voluntaryWork.*.org_name' => 'required',
            'voluntaryWork.*.org_address' => 'required',
            'voluntaryWork.*.from_date' => 'required|date',
            'voluntaryWork.*.to_date' => 'nullable|date|after_or_equal:voluntaryWork.*.from_date',
            'voluntaryWork.*.nature_of_work' => 'required',
        ], [
            'voluntaryWork.*.org_name.required' => 'The name of organization is required for each voluntary work.',
            'voluntaryWork.*.org_address.required' => 'The address of organization is required for each voluntary work.',
            'voluntaryWork.*.from_date.required' => 'The start date is required for each voluntary work.',
            'voluntaryWork.*.from_date.date' => 'Must be a valid date.',
            'voluntaryWork.*.to_date.date' => 'Must be a valid date.',
            'voluntaryWork.*.to_date.after_or_equal' => 'The end date must be after or equal to the start date for each voluntary work.',
            'voluntaryWork.*.nature_of_work.required' => 'The nature of work is required for each voluntary work.',
        ]);

        $extraValidator = \Validator::make($request->all(), [], []);

        $extraValidator->after(function ($validator) use ($request) {
            foreach ($request->input('voluntaryWork', []) as $index => $entry) {

                $isPresent = isset($entry['isPresent']) && $entry['isPresent'];

                if (!$isPresent && empty($entry['to_date'])) {
                    $validator->errors()->add(
                        "voluntaryWork.$index.to_date",
                        "The end date is required unless the voluntary work is currently held."
                    );

                    $validator->errors()->add(
                        "voluntaryWork.$index.hours",
                        "The number of hours is required unless the voluntary work is currently held."
                    );
                }
            }
        });

        if ($extraValidator->fails()) {
            return back()->withErrors($extraValidator)->withInput();
        }

        try{
            $conn->beginTransaction();

            $voluntaryWorks = $request->input('voluntaryWork', []);

            $existingIds = $conn->table('applicant_voluntary_work')
                ->where('applicant_id', $applicantId)
                ->pluck('id')
                ->toArray();

            $submittedIds = [];

            foreach ($voluntaryWorks as $voluntaryWork) {
                $cleanedHours = preg_replace('/[^0-9.]/', '', $voluntaryWork['hours']);
                $voluntaryWork['hours'] = (float) $cleanedHours;

                $data = [
                    'applicant_id' => $applicantId,
                    'org_name' => $voluntaryWork['org_name'] ?? null,
                    'from_date' => $voluntaryWork['from_date'] ?? null,
                    'to_date' => $voluntaryWork['to_date'] ?? null,
                    'hours' => $voluntaryWork['hours'] ?? null,
                    'nature_of_work' => $voluntaryWork['nature_of_work'] ?? null,
                    'isPresent' => $voluntaryWork['isPresent'] ?? 0,
                ];

                if (isset($voluntaryWork['id']) && in_array($voluntaryWork['id'], $existingIds)) {

                    $conn->table('applicant_voluntary_work')
                        ->where('id', $voluntaryWork['id'])
                        ->update($data);

                    $submittedIds[] = $voluntaryWork['id'];
                } else {
                    $newId = $conn->table('applicant_voluntary_work')->insertGetId($data);

                    $submittedIds[] = $newId;
                }
            }

            $conn->table('applicant_voluntary_work')
            ->where('applicant_id', $applicantId)
            ->whereNotIn('id', $submittedIds)
            ->delete();


            $conn->table('applicant_pds')->updateOrInsert(
                [
                    'applicant_id' => $applicantId,
                    'step' => 'voluntaryWork',
                ],
                [
                    'status' => 1
                ]
            );

            $conn->commit();

            return redirect()->route('applicants.edit', [
                'id' => $applicantId,
                'step' => 'learningAndDevelopment',
            ])
               ->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Voluntary works saved successfully! Proceed with this step.'
            ]);

        }catch (\Exception $e) {
            $conn->rollBack();
            Log::error('Failed to save voluntary works of applicant: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving voluntary works of an applicant. Please try again.'
            ]);
        }
    }

    public function editLearningAndDevelopment($id)
    {
        $conn = DB::connection('mysql');

        $applicant = $conn->table('applicant')
            ->where('id', $id)
            ->first();

        if (!$applicant) {
            abort(404);
        }

        $learningAndDevelopments = $conn->table('applicant_learning')
            ->where('applicant_id', $id)
            ->orderByDesc('from_date')
            ->get();

        return inertia('Applicants/Pds/LearningAndDevelopment', [
            'applicant' => $applicant,
            'learningAndDevelopment' => $learningAndDevelopments,
        ]);
    }

    private function storeLearningAndDevelopment($request, $conn, $applicantId)
    {
        $validated = $request->validate([
            'learningAndDevelopment.*.seminar_title' => 'required',
            'learningAndDevelopment.*.from_date' => 'required|date',
            'learningAndDevelopment.*.to_date' => 'required|date',
            'learningAndDevelopment.*.to_date' => 'nullable|date|after_or_equal:learningAndDevelopment.*.from_date',
            'learningAndDevelopment.*.hours' => 'required',
            'learningAndDevelopment.*.participation' => 'required',
            'learningAndDevelopment.*.type' => 'required',
            'learningAndDevelopment.*.conducted_by' => 'required',
        ], [
            'learningAndDevelopment.*.seminar_title.required' => 'The title of training is required for each L&D.',
            'learningAndDevelopment.*.from_date.required' => 'The start date is required for each L&D.',
            'learningAndDevelopment.*.from_date.date' => 'Must be a valid date.',
            'learningAndDevelopment.*.to_date.required' => 'The end date is required for each L&D.',
            'learningAndDevelopment.*.to_date.date' => 'Must be a valid date.',
            'learningAndDevelopment.*.to_date.after_or_equal' => 'The end date must be after or equal to the start date for each L&D.',
            'learningAndDevelopment.*.hours.required' => 'The number of hours is required for each L&D.',
            'learningAndDevelopment.*.participation.required' => 'The participation is required for each L&D.',
            'learningAndDevelopment.*.type.required' => 'The type is required for each L&D.',
            'learningAndDevelopment.*.conducted_by.required' => 'The conducted by is required for each L&D.',
        ]);

        try{
            $conn->beginTransaction();

            $learningAndDevelopments = $request->input('learningAndDevelopment', []);

            $existingIds = $conn->table('applicant_learning')
                ->where('applicant_id', $applicantId)
                ->pluck('id')
                ->toArray();

            $submittedIds = [];

            foreach ($learningAndDevelopments as $learningAndDevelopment) {
                $cleanedHours = preg_replace('/[^0-9.]/', '', $learningAndDevelopment['hours']);
                $learningAndDevelopment['hours'] = (float) $cleanedHours;

                $data = [
                    'applicant_id' => $applicantId,
                    'seminar_title' => $learningAndDevelopment['seminar_title'] ?? null,
                    'from_date' => $learningAndDevelopment['from_date'] ?? null,
                    'to_date' => $learningAndDevelopment['to_date'] ?? null,
                    'hours' => $learningAndDevelopment['hours'] ?? null,
                    'participation' => $learningAndDevelopment['participation'] ?? null,
                    'type' => $learningAndDevelopment['type'] ?? null,
                    'conducted_by' => $learningAndDevelopment['conducted_by'] ?? null,
                ];

                if (isset($learningAndDevelopment['id']) && in_array($learningAndDevelopment['id'], $existingIds)) {

                    $conn->table('applicant_learning')
                        ->where('id', $learningAndDevelopment['id'])
                        ->update($data);

                    $submittedIds[] = $voluntaryWork['id'];
                } else {
                    $newId = $conn->table('applicant_learning')->insertGetId($data);

                    $submittedIds[] = $newId;
                }
            }

            $conn->table('applicant_learning')
            ->where('applicant_id', $applicantId)
            ->whereNotIn('id', $submittedIds)
            ->delete();


            $conn->table('applicant_pds')->updateOrInsert(
                [
                    'applicant_id' => $applicantId,
                    'step' => 'learningAndDevelopment',
                ],
                [
                    'status' => 1
                ]
            );

            $conn->commit();

            return redirect()->route('applicants.edit', [
                'id' => $applicantId,
                'step' => 'otherInformation',
            ])
               ->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Learning and development saved successfully! Proceed with this step.'
            ]);

        }catch (\Exception $e) {
            $conn->rollBack();
            Log::error('Failed to save learning and development of applicant: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving learning and development of an applicant. Please try again.'
            ]);
        }
        
    }

    private function getDefaultQuestions()
    {
        return [
            [
                'item_no' => '34',
                'list' => '',
                'question' => "Are you related by consanguinity or affinity to the appointing or recommending authority, or to the chief of bureau or office or to the person who has immediate supervision over you in the Office, Bureau or Department where you will be apppointed,",
                'isAnswerable' => false,
                'subQuestions' => [
                    [
                        'item_no' => '34',
                        'list' => 'A',
                        'question' => "within the third degree?",
                        'isAnswerable' => true,
                        'answer' => "no",
                        'question_details' => "If YES, give details",
                        'details' => ""
                    ],
                    [
                        'item_no' => '34',
                        'list' => 'B',
                        'question' => "within the fourth degree (for Local Government Unit - Career Employees)?",
                        'isAnswerable' => true,
                        'answer' => "no",
                        'question_details' => "If YES, give details",
                        'details' => ""
                    ],
                ]
            ],
            [
                'item_no' => '35',
                'list' => '',
                'question' => "",
                'isAnswerable' => false,
                'subQuestions' => [
                    [
                        'item_no' => '35',
                        'list' => 'A',
                        'question' => "Have you ever been found guilty of any administrative offense?",
                        'isAnswerable' => true,
                        'answer' => "no",
                        'question_details' => "If YES, give details",
                        'details' => ""
                    ],
                    [
                        'item_no' => '35',
                        'list' => 'B',
                        'question' => "Have you been criminally charged before any court?",
                        'isAnswerable' => true,
                        'answer' => "no",
                        'question_details' => "If YES, give the date of filing and the status of case/s",
                        'details' => ""
                    ],
                ]
            ],
            [
                'item_no' => '36',
                'list' => '',
                'question' => "Have you ever been convicted of any crime or violation of any law, decree, ordinance or regulation by any court or tribunal?",
                'isAnswerable' => true,
                'answer' => "no",
                'question_details' => "If YES, give details",
                'details' => ""
            ],
            [
                'item_no' => '37',
                'list' => '',
                'question' => "Have you ever been separated from the service in any of the following modes: resignation, retirement, dropped from the rolls, dismissal, termination, end of term, finished contract or phased out (abolition) in the public or private sector?",
                'isAnswerable' => true,
                'answer' => "no",
                'question_details' => "If YES, give details",
                'details' => ""
            ],
            [
                'item_no' => '38',
                'list' => '',
                'question' => "",
                'isAnswerable' => false,
                'subQuestions' => [
                    [
                        'item_no' => '38',
                        'list' => 'A',
                        'question' => "Have you ever been a candidate in a national or local election held within the last year (except Barangay election)?",
                        'isAnswerable' => true,
                        'answer' => "no",
                        'question_details' => "If YES, give details",
                        'details' => ""
                    ],
                    [
                        'item_no' => '38',
                        'list' => 'B',
                        'question' => "Have you resigned from the government service during the three (3)-month period before the last election to promote/actively campaign for a national or local candidate?",
                        'isAnswerable' => true,
                        'answer' => "no",
                        'question_details' => "If YES, give details (country)",
                        'details' => ""
                    ],
                ]
            ],
            [
                'item_no' => '39',
                'list' => '',
                'question' => "Have you acquired the status of an immigrant or permanent resident of another country?",
                'isAnswerable' => true,
                'answer' => "no",
                'question_details' => "If YES, give details",
                'details' => ""
            ],
            [
                'item_no' => '40',
                'list' => '',
                'question' => "Pursuant to: (a) Indigenous People's Act (RA 8371) (b) Magna Carta for Disabled Persons (RA 7277) and (c) Solo Parents Welfare Act of 2000 (RA 8972), please answer the following items:",
                'isAnswerable' => false,
                'subQuestions' => [
                    [
                        'item_no' => '40',
                        'list' => 'A',
                        'question' => "Are you a member of any indigenous group?",
                        'isAnswerable' => true,
                        'answer' => "no",
                        'question_details' => "If YES, please specify",
                        'details' => ""
                    ],
                    [
                        'item_no' => '40',
                        'list' => 'B',
                        'question' => "Are you a person with disability?",
                        'isAnswerable' => true,
                        'answer' => "no",
                        'question_details' => "If YES, please specify ID No.",
                        'details' => ""
                    ],
                    [
                        'item_no' => '40',
                        'list' => 'C',
                        'question' => "Are you a solo parent?",
                        'isAnswerable' => true,
                        'answer' => "no",
                        'question_details' => "If YES, please specify ID No.",
                        'details' => ""
                    ],
                ]
            ],
        ];
    }

    public function editOtherInformation($id)
    {
        $conn = DB::connection('mysql');

        $applicant = $conn->table('applicant')
            ->where('id', $id)
            ->first();

        if (!$applicant) {
            abort(404);
        }

        $others = $conn->table('applicant_other_info')
        ->where('applicant_id', $id)
        ->whereIn('type', ['hobbies', 'recognition', 'membership'])
        ->get()
        ->groupBy('type');

        $defaultQuestions = $this->getDefaultQuestions();

        $questions = $conn->table('applicant_question')
            ->select(
                'id',
                'item_no',
                'list',
                'answer',
                'details',
            )
            ->where('applicant_id', $id)
            ->get()
            ->map(function ($item) {
                return [
                    'item_no' => (string) $item->item_no,
                    'list' => $item->list ?? 'NA',
                    'answer' => $item->answer,
                    'details' => $item->details,
                ];
            })
            ->toArray();

            $answersMap = [];

            foreach ($questions as $item) {
                $key = $item['item_no'] . '-' . ($item['list'] ?? 'NA');
                $answersMap[$key] = [
                    'answer' => $item['answer'],
                    'details' => $item['details'],
                ];
            }

            foreach ($defaultQuestions as &$q) {
                if (isset($q['isAnswerable']) && $q['isAnswerable']) {
                    $key = $q['item_no'] . '-' . ($q['list'] ?: 'NA');
                    if (isset($answersMap[$key])) {
                        $q['answer'] = $answersMap[$key]['answer'];
                        $q['details'] = $answersMap[$key]['details'];
                    }
                }

                if (isset($q['subQuestions'])) {
                    foreach ($q['subQuestions'] as &$subQ) {
                        $key = $subQ['item_no'] . '-' . ($subQ['list'] ?: 'NA');
                        if (isset($answersMap[$key])) {
                            $subQ['answer'] = $answersMap[$key]['answer'];
                            $subQ['details'] = $answersMap[$key]['details'];
                        }
                    }
                    unset($subQ);
                }
            }

        $references = $conn->table('applicant_reference')
        ->where('applicant_id', $id)
        ->get();

        $referenceTemplate = [
            'name' => '',
            'address' => '',
            'contact_no' => '',
        ];

        $filledReferences = $references->map(function ($ref) {
            return [
                'id' => $ref->id,
                'name' => $ref->name ?? '',
                'address' => $ref->address ?? '',
                'contact_no' => $ref->contact_no ?? '',
            ];
        });

        while ($filledReferences->count() < 3) {
            $filledReferences->push($referenceTemplate);
        }

        return inertia('Applicants/Pds/OtherInformation', [
            'applicant' => $applicant,
            'otherInformation' => [
                'skills' => $others->get('hobbies', collect()),
                'recognitions' => $others->get('recognition', collect()),
                'memberships' => $others->get('membership', collect()),
                'questions' => $defaultQuestions,
                'references' => $filledReferences,
            ]
        ]);
    }

    private function storeOtherInformation($request, $conn, $applicantId)
    {
        $rules = [
            // Static validation rules
            'otherInformation.skills.*.description'       => 'required',
            'otherInformation.recognitions.*.description' => 'required',
            'otherInformation.memberships.*.description'  => 'required',

            'otherInformation.references'                 => 'required|array|size:3',
            'otherInformation.references.*.name'          => 'required',
            'otherInformation.references.*.address'       => 'required',
            'otherInformation.references.*.contact_no'    => 'required',
        ];

        $messages = [
            'otherInformation.skills.*.description.required'       => 'Each special skill/hobby is required.',
            'otherInformation.recognitions.*.description.required' => 'Each non-academic distinction/recognition is required.',
            'otherInformation.memberships.*.description.required'  => 'Each membership in association/organization is required.',

            'otherInformation.references.required'                 => 'Exactly 3 references are required.',
            'otherInformation.references.size'                     => 'Exactly 3 references are required.',
            'otherInformation.references.*.name.required'          => 'Each reference\'s name is required.',
            'otherInformation.references.*.address.required'       => 'Each reference\'s address is required.',
            'otherInformation.references.*.contact_no.required'    => 'Each reference\'s contact number is required.',
        ];

        // First, validate static rules
        $validator = Validator::make($request->all(), $rules, $messages);

        // Collect custom question errors
        $questionErrors = [];
        $questions = $request->input('otherInformation.questions', []);

        foreach ($questions as $qIndex => $q) {
            $isAnswerable = filter_var($q['isAnswerable'] ?? true, FILTER_VALIDATE_BOOLEAN);

            if ($isAnswerable) {
                $answer = strtolower(trim($q['answer'] ?? ''));
                $details = trim($q['details'] ?? '');

                if (!in_array($answer, ['yes', 'no'])) {
                    $questionErrors["otherInformation.questions.$qIndex.answer"] = "Please select 'Yes' or 'No'.";
                }

                if ($answer === 'yes' && $details === '') {
                    $questionErrors["otherInformation.questions.$qIndex.details"] = "Details are required when the answer is 'Yes'.";
                }
            }

            if (!empty($q['subQuestions'])) {
                foreach ($q['subQuestions'] as $sIndex => $sq) {
                    $isSubAnswerable = filter_var($sq['isAnswerable'] ?? true, FILTER_VALIDATE_BOOLEAN);
                    if (!$isSubAnswerable) continue;

                    $subAnswer = strtolower(trim($sq['answer'] ?? ''));
                    $subDetails = trim($sq['details'] ?? '');

                    if (!in_array($subAnswer, ['yes', 'no'])) {
                        $questionErrors["otherInformation.questions.$qIndex.subQuestions.$sIndex.answer"] = "Please select 'Yes' or 'No'.";
                    }

                    if ($subAnswer === 'yes' && $subDetails === '') {
                        $questionErrors["otherInformation.questions.$qIndex.subQuestions.$sIndex.details"] = "Details are required when the answer is 'Yes'.";
                    }
                }
            }
        }

        // ✅ Merge custom question errors into the validator
        if (!empty($questionErrors)) {
            foreach ($questionErrors as $field => $message) {
                $validator->errors()->add($field, $message);
            }
        }

        // ✅ Now, re-check after adding manual errors
        if ($validator->errors()->any()) {
            return back()->withErrors($validator)->withInput();
        }

        /**
         * 💾 Continue with saving logic (same upsert code as before)
         */
        try {
            $conn->beginTransaction();

            $skills       = $request['otherInformation']['skills'];
            $recognitions = $request['otherInformation']['recognitions'];
            $memberships  = $request['otherInformation']['memberships'];
            $references   = $request['otherInformation']['references'];
            $questions    = $request['otherInformation']['questions'];

            $upsert = function ($table, $data, $matchColumns) use ($conn) {
                $existing = $conn->table($table)->where($matchColumns)->first();

                if ($existing) {
                    $conn->table($table)->where('id', $existing->id)->update($data);
                } else {
                    $conn->table($table)->insert($data);
                }
            };

            // Hobbies / Skills
            foreach ($skills as $skill) {
                $data = array_merge(['applicant_id' => $applicantId, 'type' => 'hobbies'], $skill);
                $match = isset($skill['id'])
                    ? ['id' => $skill['id']]
                    : ['applicant_id' => $applicantId, 'type' => 'hobbies', 'description' => $skill['description']];
                $upsert('applicant_other_info', $data, $match);
            }

            // Recognitions
            foreach ($recognitions as $recognition) {
                $data = array_merge(['applicant_id' => $applicantId, 'type' => 'recognition'], $recognition);
                $match = isset($recognition['id'])
                    ? ['id' => $recognition['id']]
                    : ['applicant_id' => $applicantId, 'type' => 'recognition', 'description' => $recognition['description']];
                $upsert('applicant_other_info', $data, $match);
            }

            // Memberships
            foreach ($memberships as $membership) {
                $data = array_merge(['applicant_id' => $applicantId, 'type' => 'membership'], $membership);
                $match = isset($membership['id'])
                    ? ['id' => $membership['id']]
                    : ['applicant_id' => $applicantId, 'type' => 'membership', 'description' => $membership['description']];
                $upsert('applicant_other_info', $data, $match);
            }

            // Questions and Subquestions
            foreach ($questions as $question) {
                $base = [
                    'applicant_id' => $applicantId,
                    'item_no'      => $question['item_no'],
                    'list'         => $question['list'] ?? null,
                    'answer'       => $question['answer'] ?? null,
                    'details'      => $question['details'] ?? null,
                ];

                $match = [
                    'applicant_id' => $applicantId,
                    'item_no'      => $question['item_no'],
                    'list'         => $question['list'] ?? null,
                ];

                $upsert('applicant_question', $base, $match);

                if (!empty($question['subQuestions'])) {
                    foreach ($question['subQuestions'] as $sub) {
                        $subData = [
                            'applicant_id' => $applicantId,
                            'item_no'      => $question['item_no'],
                            'list'         => $sub['list'] ?? null,
                            'answer'       => $sub['answer'] ?? null,
                            'details'      => $sub['details'] ?? null,
                        ];

                        $subMatch = [
                            'applicant_id' => $applicantId,
                            'item_no'      => $question['item_no'],
                            'list'         => $sub['list'] ?? null,
                        ];

                        $upsert('applicant_question', $subData, $subMatch);
                    }
                }
            }

            // References (always 3)
            foreach ($references as $reference) {
                $data = array_merge(['applicant_id' => $applicantId], $reference);
                $match = isset($reference['id'])
                    ? ['id' => $reference['id']]
                    : ['applicant_id' => $applicantId, 'name' => $reference['name']];
                $upsert('applicant_reference', $data, $match);
            }

            // Update progress
            $conn->table('applicant_pds')->updateOrInsert(
                ['applicant_id' => $applicantId, 'step' => 'otherInformation'],
                ['status' => 1]
            );

            $conn->commit();

            return redirect()->route('applicants.index')
               ->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Other information saved successfully!'
            ]);
        } catch (\Exception $e) {
            $conn->rollBack();
            Log::error('Failed to save other information of applicant: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving other information of an applicant. Please try again.'
            ]);
        }
    }

    public function destroy($id)
    {
        $conn = DB::connection('mysql');

        try {

            $conn->beginTransaction();

            $conn->table('applicant')
                ->where('id', $id)
                ->delete();

            $conn->commit();

            return redirect()->route('applicants.index')->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Applicant deleted successfully.'
            ]);
        } catch (\Exception $e) {
            $conn->rollBack();
            Log::error('Failed to delete applicant: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the applicant. Please try again.'
            ]);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $conn = DB::connection('mysql');

        $ids = $request->input('ids');

        try {

            $conn->beginTransaction();

            $conn->table('applicant')
                ->whereIn('id', $ids)
                ->delete();

            $conn->commit();

            return redirect()->route('applicants.index')->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Applicants deleted successfully.'
            ]);
        } catch (\Exception $e) {
            $conn->rollBack();
            Log::error('Failed to delete applicants: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the applicants. Please try again.'
            ]);
        }
    }

    public function getPds($id)
    {
        try {
            $personalInformation = $this->getPersonalInformation($id)->getData(true);
            $familyBackground = $this->getFamilyBackground($id)->getData(true);
            $educationalBackground = $this->getEducationalBackground($id)->getData(true);
            $civilServiceEligibility = $this->getCivilServiceEligibility($id)->getData(true);
            $workExperience = $this->getWorkExperience($id)->getData(true);
            $voluntaryWork = $this->getVoluntaryWork($id)->getData(true);
            $learningAndDevelopment = $this->getLearningAndDevelopment($id)->getData(true);
            $otherInformation = $this->getOtherInformation($id)->getData(true);

            return response()->json([
                'personalInformation' => $personalInformation,
                'familyBackground' => $familyBackground,
                'educationalBackground' => $educationalBackground,
                'civilServiceEligibility' => $civilServiceEligibility,
                'workExperience' => $workExperience,
                'voluntaryWork' => $voluntaryWork,
                'learningAndDevelopment' => $learningAndDevelopment,
                'otherInformation' => $otherInformation,
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to fetch full PDS: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while fetching the PDS. Please try again.'
            ], 500);
        }
    }

    public function getPersonalInformation()
    {
        $conn = DB::connection('mysql');

        if (!$id) {
            return response()->json([
                'emp_id' => '',
                'type' => 'Applicant',
                'email_address' => '',
                'last_name' => '',
                'first_name' => '',
                'middle_name' => '',
                'ext_name' => '',
                'birth_date' => '',
                'birth_place' => '',
                'gender' => '',
                'civil_status' => '',
                'height' => '',
                'weight' => '',
                'blood_type' => '',
                'gsis_no' => '',
                'pag_ibig_no' => '',
                'philhealth_no' => '',
                'sss_no' => '',
                'tin_no' => '',
                'agency_employee_no' => '',
                'citizenship' => '',
                'citizenship_by' => '',
                'citizenship_country' => '',
                'isResidenceSameWithPermanentAddress' => false,
                'permanent_house_no' => '',
                'permanent_street' => '',
                'permanent_subdivision' => '',
                'permanent_barangay' => '',
                'permanent_city' => '',
                'permanent_province' => '',
                'permanent_zip' => '',
                'residential_house_no' => '',
                'residential_street' => '',
                'residential_subdivision' => '',
                'residential_barangay' => '',
                'residential_city' => '',
                'residential_province' => '',
                'residential_zip' => '',
                'telephone_no' => '',
                'mobile_no' => '',
            ]);
        }

        $applicant = $conn->table('applicant')
            ->where('id', $id)
            ->first();

        if(!$applicant) {
            return response()->json([
                'status' => 'error',
                'title' => 'Applicant Not Found',
                'message' => 'The applicant does not exist.'
            ], 404);
        }

        $basicInformation = (object) [
            'id' => $applicant->id ?? null,
            'emp_id' => $applicant->emp_id ?? '',
            'type' => $applicant->emp_id ? 'Staff' : 'Applicant',
            'email_address' => $applicant->email_address ?? '',
            'last_name' => $applicant->last_name ?? '',
            'first_name' => $applicant->first_name ?? '',
            'middle_name' => $applicant->middle_name ?? '',
            'ext_name' => $applicant->ext_name ?? '',
            'birth_date' => $applicant->birth_date ?? '',
            'birth_place' => $applicant->birth_place ?? '',
            'gender' => $applicant->gender ?? '',
            'civil_status' => $applicant->civil_status ?? '',
            'height' => $applicant->height ?? 0,
            'weight' => $applicant->weight ?? 0,
            'blood_type' => $applicant->blood_type ?? '',
            'gsis_no' => $applicant->gsis_no ?? '',
            'pag_ibig_no' => $applicant->pag_ibig_no ?? '',
            'philhealth_no' => $applicant->philhealth_no ?? '',
            'sss_no' => $applicant->sss_no ?? '',
            'tin_no' => $applicant->tin_no ?? '',
            'agency_employee_no' => $applicant->agency_employee_no ?? '',
            'citizenship' => $applicant->citizenship ?? '',
            'citizenship_by' => $applicant->citizenship_by ?? '',
            'citizenship_country' => $applicant->citizenship_country ?? '',
            'isResidenceSameWithPermanentAddress' => (bool) ($applicant->isResidenceSameWithPermanentAddress ?? false),
            'permanent_house_no' => $applicant->permanent_house_no ?? '',
            'permanent_street' => $applicant->permanent_street ?? '',
            'permanent_subdivision' => $applicant->permanent_subdivision ?? '',
            'permanent_barangay' => $applicant->permanent_barangay ?? '',
            'permanent_city' => $applicant->permanent_city ?? '',
            'permanent_province' => $applicant->permanent_province ?? '',
            'permanent_zip' => $applicant->permanent_zip ?? '',
            'residential_house_no' => $applicant->residential_house_no ?? '',
            'residential_street' => $applicant->residential_street ?? '',
            'residential_subdivision' => $applicant->residential_subdivision ?? '',
            'residential_barangay' => $applicant->residential_barangay ?? '',
            'residential_city' => $applicant->residential_city ?? '',
            'residential_province' => $applicant->residential_province ?? '',
            'residential_zip' => $applicant->residential_zip ?? '',
            'telephone_no' => $applicant->telephone_no ?? '',
            'mobile_no' => $applicant->mobile_no ?? '',
        ];

        return response()->json($basicInformation);
    }

    public function getFamilyBackground($id)
    {

        $conn = DB::connection('mysql');

        // Fetch related family records
        $children = $conn->table('applicant_child')
            ->where('applicant_id', $id)
            ->get();

        $spouse = $conn->table('applicant_spouse')
            ->where('applicant_id', $id)
            ->first();

        $mother = $conn->table('applicant_mother')
            ->where('applicant_id', $id)
            ->first();

        $father = $conn->table('applicant_father')
            ->where('applicant_id', $id)
            ->first();

        // Build family background object
        $familyBackground = [
            'isThereSpouse' => $spouse && $spouse->hasSpouse ? (bool) $spouse->hasSpouse : false,
            'spouse' => [
                'last_name' => $spouse->last_name ?? '',
                'first_name' => $spouse->first_name ?? '',
                'middle_name' => $spouse->middle_name ?? '',
                'ext_name' => $spouse->ext_name ?? '',
                'occupation' => $spouse->occupation ?? '',
                'employer_name' => $spouse->employer_name ?? '',
                'business_address' => $spouse->business_address ?? '',
                'telephone_no' => $spouse->telephone_no ?? '',
                'hasSpouse' => $spouse && $spouse->hasSpouse ? (bool) $spouse->hasSpouse : false,
            ],
            'father' => [
                'last_name' => $father->last_name ?? '',
                'first_name' => $father->first_name ?? '',
                'middle_name' => $father->middle_name ?? '',
                'ext_name' => $father->ext_name ?? '',
                'birth_date' => $father->birth_date ?? '',
            ],
            'mother' => [
                'last_name' => $mother->last_name ?? '',
                'first_name' => $mother->first_name ?? '',
                'middle_name' => $mother->middle_name ?? '',
                'maiden_name' => $mother->maiden_name ?? '',
                'birth_date' => $mother->birth_date ?? '',
            ],
            'children' => $children->map(function ($child) {
                return [
                    'last_name' => $child->last_name ?? '',
                    'first_name' => $child->first_name ?? '',
                    'middle_name' => $child->middle_name ?? '',
                    'ext_name' => $child->ext_name ?? '',
                    'birth_date' => $child->birth_date ?? '',
                ];
            })->toArray(),
        ];

        return response()->json($familyBackground);
    }

    private static function mapEducation($item)
    {
        return [
            'level' => $item->level ?? '',
            'course' => $item->course ?? '',
            'school' => $item->school ?? '',
            'highest_attainment' => $item->highest_attainment ?? '',
            'from_year' => $item->from_year ?? '',
            'from_date' => $item->from_date ?? '',
            'to_year' => $item->to_year ?? '',
            'to_date' => $item->to_date ?? '',
            'award' => $item->award ?? '',
            'year_graduated' => $item->year_graduated ?? '',
        ];
    }

    public function getEducationalBackground($id)
    {
        $conn = DB::connection('mysql');

        $educations = $conn->table('application_education')
            ->where('application_id', $id)
            ->get();

        // Default structure
        $educationalBackground = (object) [
            'elementary' => [],
            'secondary' => [],
            'vocational' => [],
            'college' => [],
            'graduate' => [],
        ];

        // Map level names to keys
        foreach ($educations as $edu) {
            $level = strtolower(trim($edu->level));

            if ($level === 'elementary') {
                $educationalBackground->elementary[] = self::mapEducation($edu);
            } elseif ($level === 'secondary') {
                $educationalBackground->secondary[] = self::mapEducation($edu);
            } elseif (in_array($level, ['vocational', 'vocational/trade course'])) {
                $educationalBackground->vocational[] = self::mapEducation($edu);
            } elseif ($level === 'college') {
                $educationalBackground->college[] = self::mapEducation($edu);
            } elseif (in_array($level, ['graduate', 'graduate studies'])) {
                $educationalBackground->graduate[] = self::mapEducation($edu);
            }
        }

        return response()->json($educationalBackground);
    }

    private static function mapEligibility($item)
    {
        return [
            'eligibility' => $item->eligibility ?? '',
            'rating' => $item->rating ?? '',
            'exam_date' => $item->exam_date ?? '',
            'exam_place' => $item->exam_place ?? '',
            'license_no' => $item->license_no ?? '',
            'validity_date' => $item->validity_date ?? '',
        ];
    }

    public function getCivilServiceEligibility($id)
    {
        $conn = DB::connection('mysql');

        $eligibilities = $conn->table('application_eligibility')
            ->where('application_id', $id)
            ->get();

        $civilServiceEligibilities = [];

        foreach ($eligibilities as $item) {
            $civilServiceEligibilities[] = self::mapEligibility($item);
        }

        return response()->json($civilServiceEligibilities);
    }

    private static function mapWorkExperience($item)
    {
        return [
            'agency' => $item->agency ?? '',
            'position' => $item->position ?? '',
            'appointment' => $item->appointment ?? '',
            'grade' => $item->grade ?? '',
            'step' => $item->step ?? '',
            'monthly_salary' => $item->monthly_salary ?? '',
            'from_date' => $item->from_date ?? '',
            'to_date' => $item->to_date ?? '',
            'isGovtService' => $item->isGovtService ?? false,
            'isPresent' => $item->isPresent ?? false,
        ];
    }

    public function getWorkExperience($id)
    {
        $conn = DB::connection('mysql');

        $works = $conn->table('application_work_experience')
            ->where('application_id', $id)
            ->orderBy('from_date', 'desc')
            ->get();

        $workExperiences = [];

        foreach ($works as $item) {
            $workExperiences[] = self::mapWorkExperience($item);
        }

        return response()->json($workExperiences);
    }

    private static function mapVoluntaryWork($item)
    {
        return [
            'org_name' => $item->org_name ?? '',
            'from_date' => $item->from_date ?? '',
            'to_date' => $item->to_date ?? '',
            'hours' => $item->hours ?? '',
            'nature_of_work' => $item->nature_of_work ?? false,
            'isPresent' => $item->isPresent ?? false,
        ];
    }

    public function getVoluntaryWork($id)
    {
        $conn = DB::connection('mysql');

        $works = $conn->table('application_voluntary_work')
            ->where('application_id', $id)
            ->orderBy('from_date', 'desc')
            ->get();

        $voluntaryWorks = [];

        foreach ($works as $item) {
            $voluntaryWorks[] = self::mapVoluntaryWork($item);
        }

        return response()->json($voluntaryWorks);
    }

    private static function mapLearningAndDevelopment($item)
    {
        return [
            'seminar_title' => $item->seminar_title ?? '',
            'from_date' => $item->from_date ?? '',
            'to_date' => $item->to_date ?? '',
            'hours' => $item->hours ?? '',
            'participation' => $item->participation ?? '',
            'type' => $item->type ?? '',
            'conducted_by' => $item->conducted_by ?? '',
        ];
    }

    public function getLearningAndDevelopment($id)
    {
        $conn = DB::connection('mysql');

        $learnings = $conn->table('application_learning')
            ->where('application_id', $id)
            ->orderBy('from_date', 'desc')
            ->get();

        $learningAndDevelopments = [];

        foreach ($learnings as $item) {
            $learningAndDevelopments[] = self::mapLearningAndDevelopment($item);
        }

        return response()->json($learningAndDevelopments);
    }

    private static function mapOtherInformation($item)
    {
        return [
            'type' => $item->type ?? '',
            'description' => $item->description ?? '',
            'year' => $item->year ?? '',
        ];
    }

    private static function mapQuestion($item)
    {
        return [
            'item_no' => $item->item_no ?? '',
            'list' => $item->list ?? '',
            'answer' => $item->answer ?? '',
            'details' => $item->details ?? '',
        ];
    }

    private static function mapReference($item)
    {
        return [
            'name' => $item->name ?? '',
            'address' => $item->address ?? '',
            'contact_no' => $item->contact_no ?? '',
        ];
    }

    public function getOtherInformation($id)
    {
        $conn = DB::connection('mysql');

        $otherInfos = $conn->table('application_other_info')
            ->where('application_id', $id)
            ->get();

        $questions = $conn->table('application_question')
            ->where('application_id', $id)
            ->get();

        $references = $conn->table('application_reference')
            ->where('application_id', $id)
            ->get();

        $otherInformation = (object) [
            'skills' => [],
            'recognitions' => [],
            'memberships' => [],
            'questions' => [],
            'references' => [],
        ];

        // Map level names to keys
        foreach ($otherInfos as $item) {
            $type = strtolower(trim($item->type));

            if ($type === 'hobbies') {
                $otherInformation->skills[] = self::mapOtherInformation($item);
            } elseif ($type === 'recognition') {
                $otherInformation->recognitions[] = self::mapOtherInformation($item);
            } elseif ($type === 'membership') {
                $otherInformation->memberships[] = self::mapOtherInformation($item);
            }
        }

        $defaultQuestions = $this->getDefaultQuestions();

        $answered = [];
        foreach ($questions as $q) {
            $key = $q->item_no . ($q->list ? '-' . $q->list : '');
            $answered[$key] = [
                'answer' => strtolower($q->answer ?? 'no'),
                'details' => $q->details ?? '',
            ];
        }

        foreach ($defaultQuestions as $question) {
            // If has subQuestions
            if (!empty($question['subQuestions'])) {
                foreach ($question['subQuestions'] as &$subQ) {
                    $key = $subQ['item_no'] . ($subQ['list'] ? '-' . $subQ['list'] : '');
                    if (isset($answered[$key])) {
                        $subQ['answer'] = $answered[$key]['answer'];
                        $subQ['details'] = $answered[$key]['details'];
                    }
                }
            } else {
                // If top-level question is answerable
                $key = $question['item_no'];
                if (isset($answered[$key])) {
                    $question['answer'] = $answered[$key]['answer'];
                    $question['details'] = $answered[$key]['details'];
                }
            }

            $otherInformation->questions[] = $question;
        }

        foreach ($references as $item) {
            $otherInformation->references[] = self::mapReference($item);
        }

        return response()->json($otherInformation);
    }
}
