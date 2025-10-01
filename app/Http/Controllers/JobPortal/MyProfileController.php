<?php

namespace App\Http\Controllers\JobPortal;

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
use App\Traits\FetchPersonalInformation;
use App\Traits\FetchFamilyBackground;
use App\Traits\FetchEducationalBackground;
use App\Traits\FetchCivilServiceEligibility;
use App\Traits\FetchWorkExperience;
use App\Traits\FetchVoluntaryWork;
use App\Traits\FetchLearningAndDevelopment;
use App\Traits\FetchOtherInformation;

class MyProfileController extends Controller
{
    use FetchPersonalInformation;
    use FetchFamilyBackground;
    use FetchEducationalBackground;
    use FetchCivilServiceEligibility;
    use FetchWorkExperience;
    use FetchVoluntaryWork;
    use FetchLearningAndDevelopment;
    use FetchOtherInformation;

    public $id;

    public function __construct()
    {
        $this->id = Auth::check() ? Auth::user()->id : null; 
    }

    public function index()
    {
        return Inertia::render('MyProfile/index', [
            
        ]);
    }

    public function getProgress()
    {
        $conn = DB::connection('mysql');

        $user = Auth::user();

        $applicant = $conn->table('applicant')
        ->where('user_id', $user->id)
        ->where('type', $user->ipms_id ? 'Staff' : 'Applicant')
        ->first();

        $progress = [];

        if($applicant){
            $progress = $conn->table('applicant_pds')
                ->where('applicant_id', $applicant->id)
                ->pluck('status', 'step');
        }

        return response()->json($progress);
    }

    public function getPds()
    {
        try {
            $personalInformation = $this->getPersonalInformation()->getData(true);
            $familyBackground = $this->getFamilyBackground()->getData(true);
            $educationalBackground = $this->getEducationalBackground()->getData(true);
            $civilServiceEligibility = $this->getCivilServiceEligibility()->getData(true);
            $workExperience = $this->getWorkExperience()->getData(true);
            $voluntaryWork = $this->getVoluntaryWork()->getData(true);
            $learningAndDevelopment = $this->getLearningAndDevelopment()->getData(true);
            $otherInformation = $this->getOtherInformation()->getData(true);

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
        $appConn = DB::connection('mysql');
        $staffConn = DB::connection('mysql3');

        $user = Auth::user();

        $basicInformation = (object) [
            'emp_id' => $user->ipms_id,
            'type' => 'Applicant',
            'email_address' => $user->email,
            'last_name' => null,
            'first_name' => null,
            'middle_name' => null,
            'ext_name' => null,
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

        try {
            if ($user->ipms_id) {
                // Try to get from applicant first
                $_app = $this->fetchApplicantPersonalInfo($appConn, $this->id, 'Staff');

                if ($_app) {
                    $basicInformation = (object) $_app;
                } else {
                    // Get from staff
                    $staffData = $this->fetchStaffPersonalInfo($staffConn, $user->ipms_id);
                    $_staff = $staffData['personal'];
                    $_perm = $staffData['permanent'];
                    $_res = $staffData['residential'];

                    if ($_staff) {
                        $basicInformation->type = 'Staff';
                        $basicInformation->emp_id = $_staff->emp_id;
                        $basicInformation->last_name = $_staff->lname;
                        $basicInformation->first_name = $_staff->fname;
                        $basicInformation->middle_name = $_staff->mname;
                        $basicInformation->birth_date = $_staff->birth_date;
                        $basicInformation->birth_place = $_staff->birth_place;
                        $basicInformation->gender = $_staff->gender;
                        $basicInformation->civil_status = $_staff->civil_status;
                        $basicInformation->height = $_staff->height;
                        $basicInformation->weight = $_staff->weight;
                        $basicInformation->blood_type = $_staff->blood_type.'+';
                        $basicInformation->gsis_no = $_staff->GSIS;
                        $basicInformation->pag_ibig_no = $_staff->Pag_ibig;
                        $basicInformation->philhealth_no = $_staff->Philhealth;
                        $basicInformation->sss_no = $_staff->SSS;
                        $basicInformation->tin_no = $_staff->TIN;
                        $basicInformation->citizenship = $_staff->citizenship;
                        $basicInformation->mobile_no = $_staff->cell_no;
                    }

                    if ($_perm) {
                        $basicInformation->permanent_house_no = $_perm->house_no;
                        $basicInformation->permanent_street = $_perm->street;
                        $basicInformation->permanent_subdivision = $_perm->subdivision;
                        $basicInformation->permanent_zip = $_perm->zipcode;
                    }

                    if ($_res) {
                        $basicInformation->residential_house_no = $_res->house_no;
                        $basicInformation->residential_street = $_res->street;
                        $basicInformation->residential_subdivision = $_res->subdivision;
                        $basicInformation->residential_zip = $_res->zipcode;
                    }
                }
            } else {
                $_app = $this->fetchApplicantPersonalInfo($appConn, auth()->user()->id, 'Applicant');

                if ($_app) {
                    $basicInformation = (object) $_app;
                }
            }

            return response()->json($basicInformation);

        } catch (\Exception $e) {
            \Log::error('Failed to fetch personal information: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while fetching personal information. Please try again.'
            ], 500);
        }
    }

    public function storePersonalInformation(Request $request)
    {
        $conn = DB::connection('mysql');
        $user = Auth::user();

        $validated = $request->validate([
            'personalInformation.last_name' => 'required',
            'personalInformation.first_name' => 'required',
            'personalInformation.ext_name' => 'nullable',
            'personalInformation.birth_date' => 'required|date',
            'personalInformation.birth_place' => 'required',
            'personalInformation.gender' => 'required',
            'personalInformation.civil_status' => 'required',
            'personalInformation.height' => 'required|numeric',
            'personalInformation.weight' => 'required|numeric',
            'personalInformation.blood_type' => 'required',
            'personalInformation.gsis_no' => 'required',
            'personalInformation.pag_ibig_no' => 'required',
            'personalInformation.philhealth_no' => 'required',
            'personalInformation.sss_no' => 'required',
            'personalInformation.tin_no' => 'required',
            'personalInformation.agency_employee_no' => 'required',
            'personalInformation.citizenship' => 'required',
            'personalInformation.citizenship_by' => 'required_unless:personalInformation.citizenship,Filipino',
            'personalInformation.citizenship_country' => 'required_unless:personalInformation.citizenship,Filipino',
            'personalInformation.isResidenceSameWithPermanentAddress' => 'required|boolean',
            'personalInformation.permanent_house_no' => 'required_if:personalInformation.isResidenceSameWithPermanentAddress,false',
            'personalInformation.permanent_street' => 'required_if:personalInformation.isResidenceSameWithPermanentAddress,false',
            'personalInformation.permanent_subdivision' => 'required_if:personalInformation.isResidenceSameWithPermanentAddress,false',
            'personalInformation.permanent_barangay' => 'required_if:personalInformation.isResidenceSameWithPermanentAddress,false',
            'personalInformation.permanent_city' => 'required_if:personalInformation.isResidenceSameWithPermanentAddress,false',
            'personalInformation.permanent_province' => 'required_if:personalInformation.isResidenceSameWithPermanentAddress,false',
            'personalInformation.permanent_zip' => 'required_if:personalInformation.isResidenceSameWithPermanentAddress,false|max:5',
            'personalInformation.residential_house_no' => 'required',
            'personalInformation.residential_street' => 'required',
            'personalInformation.residential_subdivision' => 'required',
            'personalInformation.residential_barangay' => 'required',
            'personalInformation.residential_city' => 'required',
            'personalInformation.residential_province' => 'required',
            'personalInformation.residential_zip' => 'required|max:5',
            'personalInformation.telephone_no' => 'required',
            'personalInformation.mobile_no' => 'required|max:11',
        ], [
            'personalInformation.last_name.required' => 'The last name is required.',
            'personalInformation.first_name.required' => 'The first name is required.',
            'personalInformation.birth_date.required' => 'The birth date is required.',
            'personalInformation.birth_place.required' => 'The birth place is required.',
            'personalInformation.gender.required' => 'The sex is required.',
            'personalInformation.civil_status.required' => 'The civil status is required.',
            'personalInformation.height.required' => 'The height is required.',
            'personalInformation.weight.required' => 'The weight is required.',
            'personalInformation.blood_type.required' => 'The blood type is required.',
            'personalInformation.gsis_no.required' => 'The GSIS number is required.',
            'personalInformation.pag_ibig_no.required' => 'The PAG-IBIG number is required.',
            'personalInformation.philhealth_no.required' => 'The PhilHealth number is required.',
            'personalInformation.sss_no.required' => 'The SSS number is required.',
            'personalInformation.tin_no.required' => 'The TIN number is required.',
            'personalInformation.agency_employee_no.required' => 'The agency employee number is required.',
            'personalInformation.citizenship.required' => 'The citizenship is required.',
            'personalInformation.citizenship_by.required_unless' => 'The citizenship by is required if citizenship is not Filipino.',
            'personalInformation.citizenship_country.required_unless' => 'The citizenship country is required if citizenship is not Filipino.',
            'personalInformation.isResidenceSameWithPermanentAddress.required' => 'Please specify if residence is same with permanent address.',
            'personalInformation.permanent_house_no.required_if' => 'Permanent house number is required.',
            'personalInformation.permanent_street.required_if' => 'Permanent street is required.',
            'personalInformation.permanent_subdivision.required_if' => 'Permanent subdivision is required.',
            'personalInformation.permanent_barangay.required_if' => 'Permanent barangay is required.',
            'personalInformation.permanent_city.required_if' => 'Permanent city is required.',
            'personalInformation.permanent_province.required_if' => 'Permanent province is required.',
            'personalInformation.permanent_zip.required_if' => 'Permanent zip code is required.',
            'personalInformation.residential_zip.max' => 'Permanent zip code must not exceed 5 characters.',
            'personalInformation.residential_house_no.required' => 'Residential house number is required.',
            'personalInformation.residential_street.required' => 'Residential street is required.',
            'personalInformation.residential_subdivision.required' => 'Residential subdivision is required.',
            'personalInformation.residential_barangay.required' => 'Residential barangay is required.',
            'personalInformation.residential_city.required' => 'Residential city is required.',
            'personalInformation.residential_province.required' => 'Residential province is required.',
            'personalInformation.residential_zip.required' => 'Residential zip code is required.',
            'personalInformation.residential_zip.max' => 'Residential zip code must not exceed 5 characters.',
            'personalInformation.telephone_no.required' => 'Telephone number is required.',
            'personalInformation.mobile_no.required' => 'Mobile number is required.',
        ]);

        $data = $request['personalInformation'];

        if ($data['isResidenceSameWithPermanentAddress']) {
            $data['permanent_province'] = $data['residential_province'];
            $data['permanent_city'] = $data['residential_city'];
            $data['permanent_barangay'] = $data['residential_barangay'];
            $data['permanent_house_no'] = $data['residential_house_no'];
            $data['permanent_street'] = $data['residential_street'];
            $data['permanent_subdivision'] = $data['residential_subdivision'];
            $data['permanent_zip'] = $data['residential_zip'];
        }

        if ($data['citizenship'] == 'Filipino') {
            $data['citizenship_by'] = null;
            $data['citizenship_country'] = null;
        }

        $data['email_address'] = $data['email_address'] ?? Auth::user()->email;
        $data['emp_id'] = $data['emp_id'] ?? Auth::user()->ipms_id;

        $type = $request->personalInformation['type'] ?? 'Applicant';

        $conn->table('applicant')->updateOrInsert(
            [
                'user_id' => $user->id,
                'type' => $type
            ],
            $data
        );

        $applicantId = $conn->table('applicant')
            ->where('user_id', $user->id)
            ->where('type', $type)
            ->value('id');

        $conn->table('applicant_pds')->updateOrInsert(
            [
                'applicant_id' => $applicantId,
                'step' => 'personalInformation'
            ],
            [
                'status' => 1
            ]
        );

        return back()->with([
            'status' => 'success',
            'title' => 'Success!',
            'message' => 'Personal Information saved successfully.',
        ]);
    }

    public function getFamilyBackground()
    {
        $appConn = DB::connection('mysql');
        $staffConn = DB::connection('mysql3');
        $user = Auth::user();
        $isStaffDb = $user->ipms_id ? true : false;
        $idKey = $isStaffDb ? $user->ipms_id : $user->id;
        $conn = $isStaffDb ? $staffConn : $appConn;

        $familyBackground = (object) [
            'isThereSpouse' => false,
            'father' => [],
            'mother' => [],
            'spouse' => [],
            'children' => [],
        ];

        try {

            $applicantSpouseData = $this->fetchApplicantSpouse($appConn, $user->id, $user->ipms_id ? 'Staff' : 'Applicant');

            if ($applicantSpouseData) {

                $familyBackground->isThereSpouse = $applicantSpouseData->hasSpouse;
                $familyBackground->spouse = $applicantSpouseData;

            } elseif ($user->ipms_id) {
                
                $staffSpouseData = $this->fetchStaffSpouse($staffConn, $user->ipms_id);

                $personal = $staffSpouseData['personal'];
                $spouseOccupation = $staffSpouseData['spouseOccupation'];

                $familyBackground->isThereSpouse = !empty($personal->spouse_surname ?? null);
                $familyBackground->spouse = (object) [
                    'hasSpouse' => !empty($personal->spouse_surname ?? null),
                    'last_name' => $personal->spouse_surname ?? '',
                    'first_name' => $personal->spouse_firstname ?? '',
                    'middle_name' => $personal->spouse_middlename ?? '',
                    'ext_name' => '',
                    'occupation' => $spouseOccupation->occupation ?? '',
                    'employer_name' => $spouseOccupation->employer_business_name ?? '',
                    'business_address' => $spouseOccupation->business_address ?? '',
                    'telephone_no' => $spouseOccupation->tel_no ?? '',
                    'birth_date' => '',
                ];
            }

            $applicantFatherData = $this->fetchApplicantParent($appConn, $user->id, 'father',  $user->ipms_id ? 'Staff' : 'Applicant');

            if ($applicantFatherData) {

                $familyBackground->father = $applicantFatherData;

            } elseif ($user->ipms_id) {
                
                $staffFatherData = $this->fetchStaffParent($staffConn, $user->ipms_id);

                $familyBackground->father = (object) [
                    'last_name' => $staffFatherData->father_surname ?? '',
                    'first_name' => $staffFatherData->father_firstname ?? '',
                    'middle_name' => $staffFatherData->father_middlename ?? '',
                    'ext_name' => '',
                    'birth_date' => $staffFatherData->father_birthday ?? '',
                ];
            }

            $applicantMotherData = $this->fetchApplicantParent($appConn, $user->id, 'mother',  $user->ipms_id ? 'Staff' : 'Applicant');

            if ($applicantMotherData) {

                $familyBackground->mother = $applicantMotherData;

            } elseif ($user->ipms_id) {
                
                $staffMotherData = $this->fetchStaffParent($staffConn, $user->ipms_id);

                $familyBackground->mother = (object) [
                    'last_name' => $staffMotherData->mother_surname ?? '',
                    'first_name' => $staffMotherData->mother_firstname ?? '',
                    'middle_name' => $staffMotherData->mother_middlename ?? '',
                    'maiden_name' => $staffMotherData->mother_maiden_name ?? '',
                    'birth_date' => $staffMotherData->mother_birthday ?? '',
                ];
            }

            $applicantChildrenData = $this->fetchApplicantChildren($appConn, $user->id, $isStaffDb ? 'Staff' : 'Applicant');

            if ($applicantChildrenData && $applicantChildrenData->isNotEmpty()) {
                $familyBackground->children = $applicantChildrenData;
            } elseif ($isStaffDb) {
                $staffChildrenData = $this->fetchStaffChildren($staffConn, $user->ipms_id);
                
                if($staffChildrenData->isNotEmpty()) {
                    foreach($staffChildrenData as $child) {
                        $children[] = (object) [
                            'last_name'   => $child->child_name ?? '',
                            'birth_date'  => $child->birthday ?? '',
                        ];
                    }
                }

                $familyBackground->children = $children;
            }

            return response()->json($familyBackground);

        } catch (\Exception $e) {
            Log::error('Failed to fetch family background: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function storeFamilyBackground(Request $request)
    {
        $conn = DB::connection('mysql');
        $user = Auth::user();

        $validated = $request->validate([
            'familyBackground.spouse.last_name' => 'required_if:familyBackground.isThereSpouse,true|nullable',
            'familyBackground.spouse.first_name' => 'required_if:familyBackground.isThereSpouse,true|nullable',
            'familyBackground.spouse.occupation' => 'required_if:familyBackground.isThereSpouse,true|nullable',
            'familyBackground.spouse.employer_name' => 'required_if:familyBackground.isThereSpouse,true|nullable',
            'familyBackground.spouse.business_address' => 'required_if:familyBackground.isThereSpouse,true|nullable',
            'familyBackground.spouse.telephone_no' => 'required_if:familyBackground.isThereSpouse,true|nullable',

            'familyBackground.father.last_name' => 'required',
            'familyBackground.father.first_name' => 'required',
            'familyBackground.father.birth_date' => 'required|date',

            'familyBackground.mother.last_name' => 'required',
            'familyBackground.mother.first_name' => 'required',
            'familyBackground.mother.maiden_name' => 'required',
            'familyBackground.mother.birth_date' => 'required|date',

            'familyBackground.children.*.last_name' => 'required',
            'familyBackground.children.*.first_name' => 'required',
            'familyBackground.children.*.birth_date' => 'required|date',
        ], [
            'familyBackground.spouse.last_name.required_if' => 'The spouse\'s last name is required.',
            'familyBackground.spouse.first_name.required_if' => 'The spouse\'s first name is required.',
            'familyBackground.spouse.occupation.required_if' => 'The spouse\'s occupation is required.',
            'familyBackground.spouse.employer_name.required_if' => 'The spouse\'s employer name is required.',
            'familyBackground.spouse.business_address.required_if' => 'The spouse\'s business address is required.',
            'familyBackground.spouse.telephone_no.required_if' => 'The spouse\'s telephone number is required.',

            'familyBackground.father.last_name.required' => 'The father\'s last name is required.',
            'familyBackground.father.first_name.required' => 'The father\'s first name is required.',
            'familyBackground.father.birth_date.required' => 'The father\'s birth date is required.',
            'familyBackground.father.birth_date.date' => 'The father\'s birth date must be a valid date.',

            'familyBackground.mother.last_name.required' => 'The mother\'s last name is required.',
            'familyBackground.mother.first_name.required' => 'The mother\'s first name is required.',
            'familyBackground.mother.maiden_name.required' => 'The mother\'s maiden name is required.',
            'familyBackground.mother.birth_date.required' => 'The mother\'s birth date is required.',
            'familyBackground.mother.birth_date.date' => 'The mother\'s birth date must be a valid date.',

            'familyBackground.children.*.last_name.required' => 'Each child\'s last name is required.',
            'familyBackground.children.*.first_name.required' => 'Each child\'s first name is required.',
            'familyBackground.children.*.birth_date.required' => 'Each child\'s birth date is required.',
            'familyBackground.children.*.birth_date.date' => 'Each child\'s birth date must be a valid date.',
        ]);

        $spouse = $request['familyBackground']['spouse'];
        $father = $request['familyBackground']['father'];
        $mother = $request['familyBackground']['mother'];
        $children = $request['familyBackground']['children'];

        $spouse['hasSpouse'] = $request['familyBackground']['isThereSpouse'];

        $type = $request->personalInformation['type'] ?? 'Applicant';

        $applicant = $conn->table('applicant')->where([
            ['user_id', '=', $user->id],
            ['type', '=', $type]
        ])->first();

        $conn->table('applicant_spouse')->updateOrInsert(
            ['applicant_id' => $applicant->id],
            $spouse
        );

        $conn->table('applicant_father')->updateOrInsert(
            ['applicant_id' => $applicant->id],
            $father
        );

        $conn->table('applicant_mother')->updateOrInsert(
            ['applicant_id' => $applicant->id],
            $mother
        );

        $childIds = [];

        foreach ($children as $child) {
            if (isset($child['id']) && !empty($child['id'])) {
                $conn->table('applicant_child')
                    ->where('id', $child['id'])
                    ->update($child);
                $childIds[] = $child['id'];
            } else {
                $newId = $conn->table('applicant_child')->insertGetId(array_merge(
                    ['applicant_id' => $applicant->id],
                    $child
                ));
                $childIds[] = $newId; 
            }
        }

        $conn->table('applicant_child')
            ->where('applicant_id', $applicant->id)
            ->whereNotIn('id', $childIds)
            ->delete();

        $conn->table('applicant_pds')->updateOrInsert(
            [
                'applicant_id' => $applicant->id,
                'step' => 'familyBackground'
            ],
            [
                'status' => 1
            ]
        );

        return back()->with([
            'status' => 'success',
            'title' => 'Success!',
            'message' => 'Family Background saved successfully.',
        ]);
    }

    public function getEducationalBackground()
    {
        $appConn = DB::connection('mysql');
        $staffConn = DB::connection('mysql3');
        $user = Auth::user();
        $isStaffDb = $user->ipms_id ? true : false;
        $idKey = $isStaffDb ? $user->ipms_id : $user->id;
        $conn = $isStaffDb ? $staffConn : $appConn;

        $educationalBackground = (object) [
            'elementary' => [],
            'secondary' => [],
            'vocational' => [],
            'college' => [],
            'graduate' => [],
        ];

        try {

            $applicantData = $this->fetchApplicantEducationalBackground($appConn, $user->id, $user->ipms_id ? 'Staff' : 'Applicant');

            if ($applicantData->isNotEmpty()) {
                foreach ($applicantData as $edu) {
                    $levelKey = strtolower($edu->level);
                    $educationalBackground->{$levelKey}[] = $edu;
                }
            } elseif ($user->ipms_id) {
                foreach (['Elementary', 'Secondary', 'Vocational', 'College', 'Graduate'] as $level) {
                    $data = $this->fetchStaffEducationalBackground($staffConn, $user->ipms_id, $level);
                    if ($data->isNotEmpty()) {
                        foreach ($data as $edu) {
                            $educationalBackground->{strtolower($level)}[] = (object) [
                                'level' => $level,
                                'course' => $edu->course ?? '',
                                'school' => $edu->school ?? '',
                                'highest_attainment' => '',
                                'from_date' => $edu->from_date ?? '',
                                'from_year' => '',
                                'to_date' => $edu->to_date ?? '',
                                'to_year' => '',
                                'award' => $edu->award ?? '',
                                'year_graduated' => $edu->year_graduated ?? '',
                                'is_graduated' => !empty($edu->year_graduated),
                            ];
                        }
                    }
                }
            }

            return response()->json($educationalBackground);

        } catch (\Exception $e) {
            \Log::error('Failed to fetch educational background: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while fetching educational background. Please try again.'
            ], 500);
        }
    }

    public function storeEducationalBackground(Request $request)
    {
        $conn = DB::connection('mysql');
        $user = Auth::user();

        $levels = [
            'elementary',
            'secondary',
            'vocational',
            'college',
            'graduate',
        ];

        // Validation rules and messages
        $rules = [];
        $messages = [];

        foreach ($levels as $level) {
            $rules["educationalBackground.$level.*.course"] = 'required';
            $rules["educationalBackground.$level.*.school"] = 'required';
            $rules["educationalBackground.$level.*.highest_attainment"] = 'required';
            $rules["educationalBackground.$level.*.from_year"] = 'required|digits:4';
            $rules["educationalBackground.$level.*.to_year"] = 'required|digits:4';
            $rules["educationalBackground.$level.*.award"] = 'required';
            $rules["educationalBackground.$level.*.year_graduated"] = 'nullable|digits:4';

            $messages["educationalBackground.$level.*.course.required"] = "Each $level's course is required.";
            $messages["educationalBackground.$level.*.school.required"] = "Each $level's school is required.";
            $messages["educationalBackground.$level.*.highest_attainment.required"] = "Each $level's highest level/units earned is required.";
            $messages["educationalBackground.$level.*.from_year.required"] = "Each $level's start year is required.";
            $messages["educationalBackground.$level.*.to_year.required"] = "Each $level's end year is required.";
            $messages["educationalBackground.$level.*.from_year.digits"] = "Must be a 4-digit year.";
            $messages["educationalBackground.$level.*.to_year.digits"] = "Must be a 4-digit year.";
            $messages["educationalBackground.$level.*.award.required"] = "Each $level's scholarship/academic honors received is required.";
            $messages["educationalBackground.$level.*.year_graduated.digits"] = "Each $level's year graduated must be a 4-digit year.";
        }

        $validator = \Validator::make($request->all(), $rules, $messages);

        $validator->after(function ($validator) use ($request, $levels) {
            foreach ($levels as $level) {
                $entries = $request->input("educationalBackground.$level", []);
                foreach ($entries as $index => $entry) {
                    if (!empty($entry['is_graduated'])) {
                        if (empty($entry['year_graduated'])) {
                            $validator->errors()->add(
                                "educationalBackground.$level.$index.year_graduated",
                                "The year graduated is required when you have graduated."
                            );
                        }
                    }
                    if (!empty($entry['from_year']) && !empty($entry['to_year'])
                        && (int)$entry['to_year'] < (int)$entry['from_year']) {
                        $validator->errors()->add(
                            "educationalBackground.$level.$index.to_date",
                            "The end year must be after or equal to the start year."
                        );
                    }
                }
            }
        });

        $validated = $validator->validate();

        // Get applicant record
        $type = $request->personalInformation['type'] ?? 'Applicant';
        $applicant = $conn->table('applicant')->where([
            ['user_id', '=', $user->id],
            ['type', '=', $type]
        ])->first();

        // Merge all educational entries and set level
        $allEntries = [];
        foreach ($levels as $level) {
            $entries = $request['educationalBackground'][$level] ?? [];
            foreach ($entries as &$entry) {
                $entry['level'] = ucfirst($level);
                $entry['applicant_id'] = $applicant->id;
            }
            unset($entry); // break reference
            $allEntries = array_merge($allEntries, $entries);
        }

        // Get existing ids
        $existingIds = $conn->table('applicant_education')
            ->where('applicant_id', $applicant->id)
            ->pluck('id')
            ->toArray();

        // Get incoming ids from request
        $incomingIds = collect($allEntries)->pluck('id')->filter()->toArray();

        // Delete records removed on client side
        $idsToDelete = array_diff($existingIds, $incomingIds);
        if (!empty($idsToDelete)) {
            $conn->table('applicant_education')
                ->where('applicant_id', $applicant->id)
                ->whereIn('id', $idsToDelete)
                ->delete();
        }

        // Insert or update records
        foreach ($allEntries as $entry) {
            if (isset($entry['id']) && !empty($entry['id'])) {
                $id = $entry['id'];
                unset($entry['id']);
                $conn->table('applicant_education')
                    ->where('id', $id)
                    ->update($entry);
            } else {
                $conn->table('applicant_education')->insert($entry);
            }
        }

        $conn->table('applicant_pds')->updateOrInsert(
            [
                'applicant_id' => $applicant->id,
                'step' => 'educationalBackground'
            ],
            [
                'status' => 1
            ]
        );

        return back()->with([
            'status' => 'success',
            'title' => 'Success!',
            'message' => 'Educational Background saved successfully.',
        ]);
    }

    public function getCivilServiceEligibility()
    {
        $appConn = DB::connection('mysql');
        $staffConn = DB::connection('mysql3');
        $user = Auth::user();
        $isStaffDb = $user->ipms_id ? true : false;
        $idKey = $isStaffDb ? $user->ipms_id : $user->id;
        $conn = $isStaffDb ? $staffConn : $appConn;

        $civilServiceEligibilities = [];

        try {

            $applicantData = $this->fetchApplicantCivilServiceEligibility($appConn, $user->id, $user->ipms_id ? 'Staff' : 'Applicant');

            if ($applicantData->isNotEmpty()) {
                foreach ($applicantData as $civilServiceEligibility) {
                    $civilServiceEligibilities[] = $civilServiceEligibility;
                }
            } elseif ($user->ipms_id) {

                $staffData = $this->fetchStaffCivilServiceEligibility($staffConn, $user->ipms_id);

                if ($staffData->isNotEmpty()) {
                    foreach ($staffData as $eligibility) {
                        $civilServiceEligibilities[] = (object) [
                            'eligibility'    => $eligibility->eligibility ?? '',
                            'rating'         => $eligibility->rating ?? '',
                            'exam_date'      => $eligibility->exam_date ?? '',
                            'exam_place'     => $eligibility->exam_place ?? '',
                            'license_no'     => $eligibility->license_number ?? '',
                            'validity_date'  => $eligibility->release_date ?? '',
                        ];
                    }
                }
            }

            return response()->json($civilServiceEligibilities);

        } catch (\Exception $e) {
            \Log::error('Failed to fetch civil service eligibility: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while fetching civil service eligibility. Please try again.'
            ], 500);
        }
    }

    public function storeCivilServiceEligibility(Request $request)
    {
        $conn = DB::connection('mysql');
        $user = Auth::user();

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

        $type = $request->personalInformation['type'] ?? 'Applicant';

        $applicant = $conn->table('applicant')->where([
            ['user_id', '=', $user->id],
            ['type', '=', $type]
        ])->first();

        $eligibilityIds = [];

        $eligibilities = $request['civilServiceEligibility'];

        foreach ($eligibilities as $eligibility) {
            if (isset($eligibility['id']) && !empty($eligibility['id'])) {
                $conn->table('applicant_eligibility')
                    ->where('id', $eligibility['id'])
                    ->update($eligibility);
                $eligibilityIds[] = $eligibility['id'];
            } else {
                $newId = $conn->table('applicant_eligibility')->insertGetId(array_merge(
                    ['applicant_id' => $applicant->id],
                    $eligibility
                ));
                $eligibilityIds[] = $newId; 
            }
        }

        $conn->table('applicant_eligibility')
            ->where('applicant_id', $applicant->id)
            ->whereNotIn('id', $eligibilityIds)
            ->delete();

        $conn->table('applicant_pds')->updateOrInsert(
            [
                'applicant_id' => $applicant->id,
                'step' => 'civilServiceEligibility'
            ],
            [
                'status' => 1
            ]
        );

        return back()->with([
            'status' => 'success',
            'title' => 'Success!',
            'message' => 'Civil Service Eligibility saved successfully.',
        ]);
    }

    public function getWorkExperience()
    {
        $appConn = DB::connection('mysql');
        $staffConn = DB::connection('mysql3');
        $user = Auth::user();
        $isStaffDb = $user->ipms_id ? true : false;
        $idKey = $isStaffDb ? $user->ipms_id : $user->id;
        $conn = $isStaffDb ? $staffConn : $appConn;

        $workExperiences = [];

        try {

            $applicantData = $this->fetchApplicantWorkExperience($appConn, $user->id, $user->ipms_id ? 'Staff' : 'Applicant');

            if ($applicantData->isNotEmpty()) {
                foreach ($applicantData as $workExperience) {
                    $workExperiences[] = $workExperience;
                }
            } elseif ($user->ipms_id) {

                $staffData = $this->fetchStaffWorkExperience($staffConn, $user->ipms_id);

                if ($staffData->isNotEmpty()) {
                    foreach ($staffData as $workExperience) {
                        $workExperiences[] = (object) [
                            'agency'         => $workExperience->agency ?? '',
                            'position'       => $workExperience->position ?? '',
                            'appointment'    => $workExperience->appointment ?? '',
                            'grade'          => $workExperience->grade ?? '',
                            'step'           => $workExperience->step ?? '',
                            'monthly_salary' => $workExperience->monthly_salary ?? '',
                            'from_date'      => $workExperience->date_start ?? '',
                            'to_date'        => $workExperience->date_end ?? '',
                            'isGovtService'  => ($workExperience->type ?? '') === 'Yes',
                            'isPresent'      => false,
                        ];
                    }
                }
            }

            return response()->json($workExperiences);

        } catch (\Exception $e) {
            \Log::error('Failed to fetch work experience: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while fetching working experience. Please try again.'
            ], 500);
        }
    }

    public function storeWorkExperience(Request $request)
    {
        $conn = DB::connection('mysql');
        $user = Auth::user();

        $validator = \Validator::make($request->all(), [
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
        
        $validator->after(function ($validator) use ($request) {
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

        $validator->validate();

        $type = $request->personalInformation['type'] ?? 'Applicant';

        $applicant = $conn->table('applicant')->where([
            ['user_id', '=', $user->id],
            ['type', '=', $type]
        ])->first();

        $workExperienceIds = [];

        $workExperiences = $request['workExperience'];

        foreach ($workExperiences as $workExperience) {

            $cleanedMonthlySalary = preg_replace('/[^0-9.]/', '', $workExperience['monthly_salary']);
            $workExperience['monthly_salary'] = (float) $cleanedMonthlySalary;

            if (isset($workExperience['id']) && !empty($workExperience['id'])) {
                $conn->table('applicant_work_experience')
                    ->where('id', $workExperience['id'])
                    ->update($workExperience);
                $workExperienceIds[] = $workExperience['id'];
            } else {
                $newId = $conn->table('applicant_work_experience')->insertGetId(array_merge(
                    ['applicant_id' => $applicant->id],
                    $workExperience
                ));
                $workExperienceIds[] = $newId; 
            }
        }

        $conn->table('applicant_work_experience')
            ->where('applicant_id', $applicant->id)
            ->whereNotIn('id', $workExperienceIds)
            ->delete();

        $conn->table('applicant_pds')->updateOrInsert(
            [
                'applicant_id' => $applicant->id,
                'step' => 'workExperience'
            ],
            [
                'status' => 1
            ]
        );

        return back()->with([
            'status' => 'success',
            'title' => 'Success!',
            'message' => 'Work Experience saved successfully.',
        ]);
    }

    public function getVoluntaryWork()
    {
        $appConn = DB::connection('mysql');
        $staffConn = DB::connection('mysql3');
        $user = Auth::user();
        $isStaffDb = $user->ipms_id ? true : false;
        $idKey = $isStaffDb ? $user->ipms_id : $user->id;
        $conn = $isStaffDb ? $staffConn : $appConn;

        $voluntaryWorks = [];

        try {

            $applicantData = $this->fetchApplicantVoluntaryWork($appConn, $user->id, $user->ipms_id ? 'Staff' : 'Applicant');

            if ($applicantData->isNotEmpty()) {
                foreach ($applicantData as $voluntaryWork) {
                    $voluntaryWorks[] = $voluntaryWork;
                }
            } elseif ($user->ipms_id) {

                $staffData = $this->fetchStaffVoluntaryWork($staffConn, $user->ipms_id);

                if ($staffData->isNotEmpty()) {
                    foreach ($staffData as $voluntaryWork) {
                        $voluntaryWorks[] = (object) [
                            'org_name'       => $voluntaryWork->name_add_org ?? '',
                            'from_date'      => $voluntaryWork->from_date ?? '',
                            'to_date'        => $voluntaryWork->to_date ?? '',
                            'hours'          => $voluntaryWork->hours ?? '',
                            'nature_of_work' => $voluntaryWork->nature_of_work ?? '',
                            'isPresent'      => false,
                        ];
                    }
                }
            }

            return response()->json($voluntaryWorks);

        } catch (\Exception $e) {
            \Log::error('Failed to fetch voluntary work: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while fetching voluntary work. Please try again.'
            ], 500);
        }
    }

    public function storeVoluntaryWork(Request $request)
    {
        $conn = DB::connection('mysql');
        $user = Auth::user();

        $validator = \Validator::make($request->all(), [
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

        $validator->after(function ($validator) use ($request) {
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

        $validator->validate();

        $type = $request->personalInformation['type'] ?? 'Applicant';

        $applicant = $conn->table('applicant')->where([
            ['user_id', '=', $user->id],
            ['type', '=', $type]
        ])->first();

        $voluntaryWorkIds = [];

        $voluntaryWorks = $request['voluntaryWork'];

        foreach ($voluntaryWorks as $voluntaryWork) {

            $cleanedHours = preg_replace('/[^0-9.]/', '', $voluntaryWork['hours']);
            $voluntaryWork['hours'] = (float) $cleanedHours;

            if (isset($voluntaryWork['id']) && !empty($voluntaryWork['id'])) {
                $conn->table('applicant_voluntary_work')
                    ->where('id', $voluntaryWork['id'])
                    ->update($voluntaryWork);
                $voluntaryWorkIds[] = $voluntaryWork['id'];
            } else {
                $newId = $conn->table('applicant_voluntary_work')->insertGetId(array_merge(
                    ['applicant_id' => $applicant->id],
                    $voluntaryWork
                ));
                $voluntaryWorkIds[] = $newId; 
            }
        }

        $conn->table('applicant_voluntary_work')
            ->where('applicant_id', $applicant->id)
            ->whereNotIn('id', $voluntaryWorkIds)
            ->delete();
        
        $conn->table('applicant_pds')->updateOrInsert(
            [
                'applicant_id' => $applicant->id,
                'step' => 'voluntaryWork'
            ],
            [
                'status' => 1
            ]
        );

        return back()->with([
            'status' => 'success',
            'title' => 'Success!',
            'message' => 'Voluntary Work saved successfully.',
        ]);
    }

    public function getLearningAndDevelopment()
    {
        $appConn = DB::connection('mysql');
        $staffConn = DB::connection('mysql3');
        $user = Auth::user();
        $isStaffDb = $user->ipms_id ? true : false;
        $idKey = $isStaffDb ? $user->ipms_id : $user->id;
        $conn = $isStaffDb ? $staffConn : $appConn;

        $learningAndDevelopments = [];

        try {

            $applicantData = $this->fetchApplicantLearningAndDevelopment($appConn, $user->id, $user->ipms_id ? 'Staff' : 'Applicant');

            if ($applicantData->isNotEmpty()) {
                foreach ($applicantData as $learningAndDevelopment) {
                    $learningAndDevelopments[] = $learningAndDevelopment;
                }
            } elseif ($user->ipms_id) {

                $staffData = $this->fetchStaffLearningAndDevelopment($staffConn, $user->ipms_id);

                if ($staffData->isNotEmpty()) {
                    foreach ($staffData as $learningAndDevelopment) {
                        $learningAndDevelopments[] = (object) [
                            'seminar_title' => $learningAndDevelopment->seminar_title ?? '',
                            'from_date'      => $learningAndDevelopment->from_date ?? '',
                            'to_date'        => $learningAndDevelopment->to_date ?? '',
                            'hours'          => $learningAndDevelopment->hours ?? '',
                            'participation'  => $learningAndDevelopment->participation ?? '',
                            'type'           => $learningAndDevelopment->category ?? '',
                            'conducted_by'   => $learningAndDevelopment->sponsor ?? '',
                        ];
                    }
                }
            }

            return response()->json($learningAndDevelopments);

        } catch (\Exception $e) {
            \Log::error('Failed to fetch learning and development: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while fetching learning and development. Please try again.'
            ], 500);
        }
    }

    public function storeLearningAndDevelopment(Request $request)
    {
        $conn = DB::connection('mysql');
        $user = Auth::user();

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

        $type = $request->personalInformation['type'] ?? 'Applicant';

        $applicant = $conn->table('applicant')->where([
            ['user_id', '=', $user->id],
            ['type', '=', $type]
        ])->first();

        $learningAndDevelopmentIds = [];

        $learningAndDevelopments = $request['learningAndDevelopment'];

        foreach ($learningAndDevelopments as $learningAndDevelopment) {

            $cleanedHours = preg_replace('/[^0-9.]/', '', $learningAndDevelopment['hours']);
            $learningAndDevelopment['hours'] = (float) $cleanedHours;

            if (isset($learningAndDevelopment['id']) && !empty($learningAndDevelopment['id'])) {
                $conn->table('applicant_learning')
                    ->where('id', $learningAndDevelopment['id'])
                    ->update($learningAndDevelopment);
                $learningAndDevelopmentIds[] = $learningAndDevelopment['id'];
            } else {
                $newId = $conn->table('applicant_learning')->insertGetId(array_merge(
                    ['applicant_id' => $applicant->id],
                    $learningAndDevelopment
                ));
                $learningAndDevelopmentIds[] = $newId; 
            }
        }

        $conn->table('applicant_learning')
            ->where('applicant_id', $applicant->id)
            ->whereNotIn('id', $learningAndDevelopmentIds)
            ->delete();

        $conn->table('applicant_pds')->updateOrInsert(
            [
                'applicant_id' => $applicant->id,
                'step' => 'learningAndDevelopment'
            ],
            [
                'status' => 1
            ]
        );

        return back()->with([
            'status' => 'success',
            'title' => 'Success!',
            'message' => 'Learning and Development saved successfully.',
        ]);
    }

    public function getOtherInformation()
    {
        $appConn = DB::connection('mysql');
        $staffConn = DB::connection('mysql3');
        $user = Auth::user();
        $isStaffDb = $user->ipms_id ? true : false;
        $idKey = $isStaffDb ? $user->ipms_id : $user->id;
        $conn = $isStaffDb ? $staffConn : $appConn;

        $otherInformation = (object) [
            'skills' => [],
            'recognitions' => [],
            'memberships' => [],
            'questions' => [],
            'references' => [],
        ];

        try {

            $categories = [
                'skills'       => 'hobbies',
                'recognitions' => 'recognition',
                'memberships'  => 'membership',
            ];

            foreach ($categories as $key => $type) {
            
                $applicantData = $this->fetchApplicantOtherInformation(
                    $appConn, 
                    $user->id, 
                    $isStaffDb ? 'Staff' : 'Applicant', 
                    $type
                );

                if ($applicantData->isNotEmpty()) {
                    foreach ($applicantData as $item) {
                        $otherInformation->{$key}[] = $item;
                    }
                } elseif ($isStaffDb) {

                    $staffData = $this->fetchStaffOtherInformation($staffConn, $user->ipms_id, $type);

                    if ($staffData->isNotEmpty()) {
                        foreach ($staffData as $item) {
                            $otherInformation->{$key}[] = (object) [
                                'type'        => $item->type ?? '',
                                'description' => $item->description ?? '',
                                'year'        => $item->year ?? '',
                            ];
                        }
                    }
                }
            }

            $questionsData = $this->fetchApplicantQuestions($appConn, $user->id, $isStaffDb ? 'Staff' : 'Applicant');

            if (!empty($questionsData)) {
                foreach ($questionsData as $question) {
                    $otherInformation->questions[] = $question;
                }
            } elseif ($isStaffDb) {
                $staffQuestions = $this->fetchStaffQuestions($staffConn, $user->ipms_id);

                $otherInformation->questions = $staffQuestions;
            }

            $applicantReferenceData = $this->fetchApplicantReferences($appConn, $user->id, $user->ipms_id ? 'Staff' : 'Applicant');

            if ($applicantReferenceData->isNotEmpty()) {
                foreach ($applicantReferenceData as $reference) {
                    $otherInformation->references[] = $reference;
                }
            } elseif ($user->ipms_id) {

                $staffReferenceData = $this->fetchStaffReferences($staffConn, $user->ipms_id);

                if ($staffReferenceData->isNotEmpty()) {
                    foreach ($staffReferenceData as $reference) {
                        $otherInformation->references[] = (object) [
                            'name'       => $reference->ref_name ?? '',
                            'address'    => $reference->address ?? '',
                            'contact_no' => $reference->tel_no ?? '',
                        ];
                    }
                }
            }

            return response()->json($otherInformation);

        } catch (\Exception $e) {
            \Log::error('Failed to fetch other information: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while fetching other information. Please try again.'
            ], 500);
        }
    }

    public function storeOtherInformation(Request $request)
    {
        $conn = DB::connection('mysql');
        $user = Auth::user();

        $validated = $request->validate([
            'otherInformation.skills.*.description' => 'required',
            //'otherInformation.skills.*.year' => 'required|digits:4',

            'otherInformation.recognitions.*.description' => 'required',
            //'otherInformation.recognitions.*.year' => 'required|digits:4',

            'otherInformation.memberships.*.description' => 'required',
            //'otherInformation.memberships.*.year' => 'required|digits:4',

            'otherInformation.references.*.name' => 'required',
            'otherInformation.references.*.address' => 'required',
            'otherInformation.references.*.contact_no' => 'required',
        ], [
            'otherInformation.skills.*.description.required' => 'Each special skill/hobby is required.',
            //'otherInformation.skills.*.year.required' => 'Each special skill/hobby\'s year is required.',

            'otherInformation.recognitions.*.description.required' => 'Each non-academic distinction/recognition is required.',
            //'otherInformation.recognitions.*.year.required' => 'Each non-academic distinction/recognition\'s year is required.',

            'otherInformation.memberships.*.description.required' => 'Each membership in association/organization is required.',
            //'otherInformation.memberships.*.year.required' => 'Each membership in association/organization\'s year is required.',
            'otherInformation.references.*.name.required' => 'Each reference\'s name is required.',
            'otherInformation.references.*.address.required' => 'Each reference\'s address is required.',
            'otherInformation.references.*.contact_no.required' => 'Each reference\'s contact number is required.',
        ]);

        $errors = [];
        $questions = $request->input('otherInformation.questions', []);

        foreach ($questions as $question) {
            $itemNo = $question['item_no'] ?? 'unknown';
            $isAnswerable = isset($question['isAnswerable']) 
                ? ($question['isAnswerable'] === true || $question['isAnswerable'] === 'true' || $question['isAnswerable'] === 1 || $question['isAnswerable'] === '1')
                : true;

            if (!$isAnswerable) {
                // skip validating this question, just validate subquestions
            } else {
                if (!isset($question['answer']) || ($question['answer'] !== 'yes' && $question['answer'] !== 'no')) {
                    $errors["otherInformation.questions.{$itemNo}.answer"] = "Please select an option.";
                }

                if (($question['answer'] ?? '') === 'yes' && empty($question['details'])) {
                    $errors["otherInformation.questions.{$itemNo}.details"] = "Details are required when answer is 'Yes'.";
                }
            }

            if (!empty($question['subQuestions'])) {
                foreach ($question['subQuestions'] as $subIndex => $subQuestion) {
                    $isSubAnswerable = isset($subQuestion['isAnswerable']) 
                        ? ($subQuestion['isAnswerable'] === true || $subQuestion['isAnswerable'] === 'true' || $subQuestion['isAnswerable'] === 1 || $subQuestion['isAnswerable'] === '1')
                        : true;

                    if (!$isSubAnswerable) {
                        continue;
                    }

                    if (!isset($subQuestion['answer']) || ($subQuestion['answer'] !== 'yes' && $subQuestion['answer'] !== 'no')) {
                        $errors["otherInformation.questions.{$itemNo}.subQuestions.$subIndex.answer"] = "Please select an option";
                    }

                    if (($subQuestion['answer'] ?? '') === 'yes' && empty($subQuestion['details'])) {
                        $errors["otherInformation.questions.{$itemNo}.subQuestions.$subIndex.details"] = "Details are required when answer is 'Yes'.";
                    }
                }
            }
        }


        if (!empty($errors)) {
            return back()
                ->withErrors($errors)
                ->withInput();
        }

        $skills = $request['otherInformation']['skills'];
        $recognitions = $request['otherInformation']['recognitions'];
        $memberships = $request['otherInformation']['memberships'];
        $questions = $request['otherInformation']['questions'];
        $references = $request['otherInformation']['references'];

        $type = $request->personalInformation['type'] ?? 'Applicant';

        $applicant = $conn->table('applicant')->where([
            ['user_id', '=', $user->id],
            ['type', '=', $type]
        ])->first();

        $skillIds = [];

        foreach ($skills as $child) {
            $child['type'] = 'hobbies';
            if (isset($child['id']) && !empty($child['id'])) {
                $conn->table('applicant_other_info')
                    ->where('id', $child['id'])
                    ->update($child);
                $skillIds[] = $child['id'];
            } else {
                $newId = $conn->table('applicant_other_info')->insertGetId(array_merge(
                    ['applicant_id' => $applicant->id, 'type' => 'hobbies'],
                    $child
                ));
                $skillIds[] = $newId; 
            }
        }

        $conn->table('applicant_other_info')
            ->where('applicant_id', $applicant->id)
            ->where('type', 'hobbies')
            ->whereNotIn('id', $skillIds)
            ->delete();

        $recognitionIds = [];

        foreach ($recognitions as $child) {
            $child['type'] = 'recognition';
            if (isset($child['id']) && !empty($child['id'])) {
                $conn->table('applicant_other_info')
                    ->where('id', $child['id'])
                    ->update($child);
                $recognitionIds[] = $child['id'];
            } else {
                $newId = $conn->table('applicant_other_info')->insertGetId(array_merge(
                    ['applicant_id' => $applicant->id, 'type' => 'recognition'],
                    $child
                ));
                $recognitionIds[] = $newId; 
            }
        }

        $conn->table('applicant_other_info')
            ->where('applicant_id', $applicant->id)
            ->where('type', 'recognition')
            ->whereNotIn('id', $recognitionIds)
            ->delete();

        $membershipIds = [];

        foreach ($memberships as $child) {
            $child['type'] = 'membership';
            if (isset($child['id']) && !empty($child['id'])) {
                $conn->table('applicant_other_info')
                    ->where('id', $child['id'])
                    ->update($child);
                $membershipIds[] = $child['id'];
            } else {
                $newId = $conn->table('applicant_other_info')->insertGetId(array_merge(
                    ['applicant_id' => $applicant->id, 'type' => 'membership'],
                    $child
                ));
                $membershipIds[] = $newId; 
            }
        }

        $conn->table('applicant_other_info')
            ->where('applicant_id', $applicant->id)
            ->where('type', 'membership')
            ->whereNotIn('id', $membershipIds)
            ->delete();

        $questionIds = [];

        foreach ($questions as $question) {
            // Save parent question
            $data = [
                'applicant_id' => $applicant->id,
                'item_no'      => $question['item_no'] ?? null,
                'list'         => $question['list'] ?? null,
                'answer'       => $question['answer'] ?? null,
                'details'      => $question['details'] ?? null,
            ];

            // Try to find existing question by applicant_id and item_no
            $existing = $conn->table('applicant_question')
                ->where('applicant_id', $applicant->id)
                ->where('item_no', $question['item_no'])
                ->whereNull('list') // top-level question has no list
                ->first();

            if ($existing) {
                $conn->table('applicant_question')
                    ->where('id', $existing->id)
                    ->update($data);
                $questionIds[] = $existing->id;
            } else {
                $newId = $conn->table('applicant_question')->insertGetId($data);
                $questionIds[] = $newId;
            }

            // Save subQuestions
            if (!empty($question['subQuestions'])) {
                foreach ($question['subQuestions'] as $subQuestion) {
                    $subData = [
                        'applicant_id' => $applicant->id,
                        'item_no'      => $question['item_no'],
                        'list'         => $subQuestion['list'] ?? null,
                        'answer'       => $subQuestion['answer'] ?? null,
                        'details'      => $subQuestion['details'] ?? null,
                    ];

                    // Try to find existing subQuestion by applicant_id, item_no and list
                    $existingSub = $conn->table('applicant_question')
                        ->where('applicant_id', $applicant->id)
                        ->where('item_no', $question['item_no'])
                        ->where('list', $subQuestion['list'])
                        ->first();

                    if ($existingSub) {
                        $conn->table('applicant_question')
                            ->where('id', $existingSub->id)
                            ->update($subData);
                        $questionIds[] = $existingSub->id;
                    } else {
                        $newSubId = $conn->table('applicant_question')->insertGetId($subData);
                        $questionIds[] = $newSubId;
                    }
                }
            }
        }

        // Cleanup: remove old questions not present anymore
        $conn->table('applicant_question')
            ->where('applicant_id', $applicant->id)
            ->whereNotIn('id', $questionIds)
            ->delete();

        $referenceIds = [];

        foreach ($references as $child) {
            if (isset($child['id']) && !empty($child['id'])) {
                $conn->table('applicant_reference')
                    ->where('id', $child['id'])
                    ->update($child);
                $referenceIds[] = $child['id'];
            } else {
                $newId = $conn->table('applicant_reference')->insertGetId(array_merge(
                    ['applicant_id' => $applicant->id],
                    $child
                ));
                $referenceIds[] = $newId; 
            }
        }

        $conn->table('applicant_reference')
            ->where('applicant_id', $applicant->id)
            ->whereNotIn('id', $referenceIds)
            ->delete();

        $conn->table('applicant_pds')->updateOrInsert(
            [
                'applicant_id' => $applicant->id,
                'step' => 'otherInformation'
            ],
            [
                'status' => 1
            ]
        );

        $conn->table('applicant_pds')->updateOrInsert(
            [
                'applicant_id' => $applicant->id,
                'step' => 'review'
            ],
            [
                'status' => 1
            ]
        );

        return back()->with([
            'status' => 'success',
            'title' => 'Success!',
            'message' => 'Family Background saved successfully.',
        ]);
    }

    public function getRequirements()
    {
        $hrisConn = DB::connection('mysql');
        $ipmsConn = DB::connection('mysql2');
        $personnelConn = DB::connection('mysql3');

        $user = Auth::user();

        /* $type = $user->ipms_id ? 'Staff' : 'Applicant';

        $applicant = $hrisConn->table('applicant')->where([
            ['user_id', '=', $user->id],
            ['type', '=', $type]
        ])->first();

        $defaultRequirements = $ipmsConn->table('recruitment_requirements')
            ->where('is_default', true)
            ->get();

        $applicantRequirements = $ipmsConn->table('applicant_requirement')
            ->where('applicant_id', $applicant->id)
            ->get();

        $requirements = [];

        if($defaultRequirements){

            foreach($defaultRequirements as $requirement){

                $requirements[$requirement->id] =  's';
                
            }
        } */

        try {
            $educationalBackground = $this->getEducationalBackground()->getData(true);
            $civilServiceEligibility = $this->getCivilServiceEligibility()->getData(true);
            $workExperience = $this->getWorkExperience()->getData(true);
            $voluntaryWork = $this->getVoluntaryWork()->getData(true);
            $learningAndDevelopment = $this->getLearningAndDevelopment()->getData(true);
            $otherInformation = $this->getOtherInformation()->getData(true);

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
}
