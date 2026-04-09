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
use Illuminate\Support\Facades\Validator;
use Illuminate\Pagination\LengthAwarePaginator;
use App\Traits\FetchCivilServiceEligibilityFiles;
use App\Traits\FetchLearningAndDevelopmentFiles;
use App\Traits\FetchEducationalBackgroundFiles;
use App\Traits\FetchWorkExperienceFiles;
use App\Traits\FetchRequirementFiles;
use App\Traits\CopiesApplicationData;
use App\Notifications\NotifyApplicantOfApplicationSubmission;


class JobsController extends Controller
{
    use FetchCivilServiceEligibilityFiles;
    use FetchLearningAndDevelopmentFiles;
    use FetchEducationalBackgroundFiles;
    use FetchWorkExperienceFiles;
    use FetchRequirementFiles;
    use CopiesApplicationData;

    protected function getActiveEditRequest(?object $application): ?object
    {
        if (! $application?->id || ! $application?->vacancy_id) {
            return null;
        }

        return DB::connection('mysql')
            ->table('app_edit_requests')
            ->where('application_id', $application->id)
            ->where('vacancy_id', $application->vacancy_id)
            ->where('status', 'Open')
            ->where('expires_at', '>=', now())
            ->orderByDesc('id')
            ->first();
    }

    protected function buildSubmittedApplicationReview(object $application, string $fallbackEmail = ''): object
    {
        $conn = DB::connection('mysql');

        $personal = $conn->table('application_applicant')
            ->where('application_id', $application->id)
            ->first();
        $spouse = $conn->table('application_spouse')->where('application_id', $application->id)->first();
        $father = $conn->table('application_father')->where('application_id', $application->id)->first();
        $mother = $conn->table('application_mother')->where('application_id', $application->id)->first();
        $children = $conn->table('application_child')
            ->where('application_id', $application->id)
            ->orderBy('birth_date')
            ->get();
        $educationRows = $conn->table('application_education')
            ->where('application_id', $application->id)
            ->orderBy('id')
            ->get();
        $eligibilities = $conn->table('application_eligibility')
            ->where('application_id', $application->id)
            ->orderBy('id')
            ->get();
        $workExperiences = $conn->table('application_work_experience')
            ->where('application_id', $application->id)
            ->orderBy('id')
            ->get();
        $voluntaryWorks = $conn->table('application_voluntary_work')
            ->where('application_id', $application->id)
            ->orderBy('id')
            ->get();
        $learnings = $conn->table('application_learning')
            ->where('application_id', $application->id)
            ->orderBy('id')
            ->get();
        $otherInfos = $conn->table('application_other_info')
            ->where('application_id', $application->id)
            ->orderBy('id')
            ->get();
        $questionRows = $conn->table('application_question')
            ->where('application_id', $application->id)
            ->orderBy('item_no')
            ->orderBy('list')
            ->get();
        $references = $conn->table('application_reference')
            ->where('application_id', $application->id)
            ->orderBy('id')
            ->get();

        $education = (object) [
            'elementary' => [],
            'secondary' => [],
            'vocational' => [],
            'college' => [],
            'graduate' => [],
        ];

        $levelMap = [
            'Elementary' => 'elementary',
            'Secondary' => 'secondary',
            'Vocational/Trade Course' => 'vocational',
            'College' => 'college',
            'Graduate Studies' => 'graduate',
        ];

        foreach ($educationRows as $row) {
            $bucket = $levelMap[$row->level] ?? null;

            if (! $bucket) {
                continue;
            }

            $education->{$bucket}[] = (object) [
                'level' => $row->level,
                'school' => $row->school ?? '',
                'course' => $row->course ?? '',
                'from_year' => $row->from_year ?? '',
                'to_year' => $row->to_year ?? '',
                'highest_attainment' => $row->highest_attainment ?? '',
                'year_graduated' => $row->year_graduated ?? '',
                'award' => $row->award ?? '',
            ];
        }

        $defaultQuestions = [
            [
                'item_no' => '34',
                'list' => '',
                'question' => "Are you related by consanguinity or affinity to the appointing or recommending authority, or to the chief of bureau or office or to the person who has immediate supervision over you in the Office, Bureau or Department where you will be apppointed,",
                'isAnswerable' => false,
                'subQuestions' => [
                    [
                        'item_no' => '34',
                        'list' => 'A',
                        'question' => 'within the third degree?',
                        'isAnswerable' => true,
                        'answer' => 'no',
                        'question_details' => 'If YES, give details',
                        'details' => '',
                    ],
                    [
                        'item_no' => '34',
                        'list' => 'B',
                        'question' => 'within the fourth degree (for Local Government Unit - Career Employees)?',
                        'isAnswerable' => true,
                        'answer' => 'no',
                        'question_details' => 'If YES, give details',
                        'details' => '',
                    ],
                ],
            ],
            [
                'item_no' => '35',
                'list' => '',
                'question' => '',
                'isAnswerable' => false,
                'subQuestions' => [
                    [
                        'item_no' => '35',
                        'list' => 'A',
                        'question' => 'Have you ever been found guilty of any administrative offense?',
                        'isAnswerable' => true,
                        'answer' => 'no',
                        'question_details' => 'If YES, give details',
                        'details' => '',
                    ],
                    [
                        'item_no' => '35',
                        'list' => 'B',
                        'question' => 'Have you been criminally charged before any court?',
                        'isAnswerable' => true,
                        'answer' => 'no',
                        'question_details' => 'If YES, give the date of filing and the status of case/s',
                        'details' => '',
                    ],
                ],
            ],
            [
                'item_no' => '36',
                'list' => '',
                'question' => 'Have you ever been convicted of any crime or violation of any law, decree, ordinance or regulation by any court or tribunal?',
                'isAnswerable' => true,
                'answer' => 'no',
                'question_details' => 'If YES, give details',
                'details' => '',
            ],
            [
                'item_no' => '37',
                'list' => '',
                'question' => 'Have you ever been separated from the service in any of the following modes: resignation, retirement, dropped from the rolls, dismissal, termination, end of term, finished contract or phased out (abolition) in the public or private sector?',
                'isAnswerable' => true,
                'answer' => 'no',
                'question_details' => 'If YES, give details',
                'details' => '',
            ],
            [
                'item_no' => '38',
                'list' => '',
                'question' => '',
                'isAnswerable' => false,
                'subQuestions' => [
                    [
                        'item_no' => '38',
                        'list' => 'A',
                        'question' => 'Have you ever been a candidate in a national or local election held within the last year (except Barangay election)?',
                        'isAnswerable' => true,
                        'answer' => 'no',
                        'question_details' => 'If YES, give details',
                        'details' => '',
                    ],
                    [
                        'item_no' => '38',
                        'list' => 'B',
                        'question' => 'Have you resigned from the government service during the three (3)-month period before the last election to promote/actively campaign for a national or local candidate?',
                        'isAnswerable' => true,
                        'answer' => 'no',
                        'question_details' => 'If YES, give details (country)',
                        'details' => '',
                    ],
                ],
            ],
            [
                'item_no' => '39',
                'list' => '',
                'question' => 'Have you acquired the status of an immigrant or permanent resident of another country?',
                'isAnswerable' => true,
                'answer' => 'no',
                'question_details' => 'If YES, give details',
                'details' => '',
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
                        'question' => 'Are you a member of any indigenous group?',
                        'isAnswerable' => true,
                        'answer' => 'no',
                        'question_details' => 'If YES, please specify',
                        'details' => '',
                    ],
                    [
                        'item_no' => '40',
                        'list' => 'B',
                        'question' => 'Are you a person with disability?',
                        'isAnswerable' => true,
                        'answer' => 'no',
                        'question_details' => 'If YES, please specify ID No.',
                        'details' => '',
                    ],
                    [
                        'item_no' => '40',
                        'list' => 'C',
                        'question' => 'Are you a solo parent?',
                        'isAnswerable' => true,
                        'answer' => 'no',
                        'question_details' => 'If YES, please specify ID No.',
                        'details' => '',
                    ],
                ],
            ],
        ];

        $answersMap = [];

        foreach ($questionRows as $row) {
            $answersMap[(string) ($row->item_no ?? '') . '-' . (trim((string) ($row->list ?? '')) ?: 'NA')] = [
                'answer' => strtolower((string) ($row->answer ?? '')),
                'details' => $row->details ?? '',
            ];
        }

        $resolvedQuestions = collect($defaultQuestions)->map(function ($question) use ($answersMap) {
            if (! empty($question['isAnswerable'])) {
                $key = $question['item_no'] . '-' . ($question['list'] ?: 'NA');

                if (isset($answersMap[$key])) {
                    $question['answer'] = $answersMap[$key]['answer'];
                    $question['details'] = $answersMap[$key]['details'];
                }
            }

            if (! empty($question['subQuestions'])) {
                foreach ($question['subQuestions'] as $index => $subQuestion) {
                    $key = $subQuestion['item_no'] . '-' . ($subQuestion['list'] ?: 'NA');

                    if (isset($answersMap[$key])) {
                        $question['subQuestions'][$index]['answer'] = $answersMap[$key]['answer'];
                        $question['subQuestions'][$index]['details'] = $answersMap[$key]['details'];
                    }
                }
            }

            return (object) [
                ...$question,
                'subQuestions' => collect($question['subQuestions'] ?? [])->map(fn ($subQuestion) => (object) $subQuestion)->all(),
            ];
        })->all();

        $otherInformation = (object) [
            'skills' => $otherInfos->where('type', 'hobbies')->values()->map(fn ($row) => (object) [
                'description' => $row->description ?? '',
            ])->all(),
            'recognitions' => $otherInfos->where('type', 'recognition')->values()->map(fn ($row) => (object) [
                'description' => $row->description ?? '',
            ])->all(),
            'memberships' => $otherInfos->where('type', 'membership')->values()->map(fn ($row) => (object) [
                'description' => $row->description ?? '',
            ])->all(),
            'questions' => $resolvedQuestions,
            'references' => $references->map(fn ($row) => (object) [
                'name' => $row->name ?? '',
                'address' => $row->address ?? '',
                'contact_no' => $row->contact_no ?? '',
            ])->all(),
        ];

        while (count($otherInformation->references) < 3) {
            $otherInformation->references[] = (object) [
                'name' => '',
                'address' => '',
                'contact_no' => '',
            ];
        }

        return (object) [
            'personalInformation' => (object) [
                'emp_id' => $personal->emp_id ?? '',
                'type' => $personal->type ?? 'Applicant',
                'email_address' => $personal->email_address ?? $fallbackEmail,
                'last_name' => $personal->last_name ?? '',
                'first_name' => $personal->first_name ?? '',
                'middle_name' => $personal->middle_name ?? '',
                'ext_name' => $personal->ext_name ?? '',
                'birth_date' => $personal->birth_date ?? '',
                'birth_place' => $personal->birth_place ?? '',
                'gender' => $personal->gender ?? '',
                'civil_status' => $personal->civil_status ?? '',
                'height' => $personal->height ?? '',
                'weight' => $personal->weight ?? '',
                'blood_type' => $personal->blood_type ?? '',
                'gsis_no' => $personal->gsis_no ?? '',
                'umid_no' => $personal->umid_no ?? '',
                'pag_ibig_no' => $personal->pag_ibig_no ?? '',
                'philhealth_no' => $personal->philhealth_no ?? '',
                'sss_no' => $personal->sss_no ?? '',
                'tin_no' => $personal->tin_no ?? '',
                'philsys_no' => $personal->philsys_no ?? '',
                'agency_employee_no' => $personal->agency_employee_no ?? '',
                'citizenship' => $personal->citizenship ?? '',
                'citizenship_by' => $personal->citizenship_by ?? '',
                'citizenship_country' => $personal->citizenship_country ?? '',
                'isResidenceSameWithPermanentAddress' => (bool) ($personal->isResidenceSameWithPermanentAddress ?? false),
                'permanent_house_no' => $personal->permanent_house_no ?? '',
                'permanent_street' => $personal->permanent_street ?? '',
                'permanent_subdivision' => $personal->permanent_subdivision ?? '',
                'permanent_barangay' => $personal->permanent_barangay ?? '',
                'permanent_barangay_name' => $personal->permanent_barangay_name ?? '',
                'permanent_city' => $personal->permanent_city ?? '',
                'permanent_city_name' => $personal->permanent_city_name ?? '',
                'permanent_province' => $personal->permanent_province ?? '',
                'permanent_province_name' => $personal->permanent_province_name ?? '',
                'permanent_is_metro_manila' => (bool) ($personal->permanent_is_metro_manila ?? false),
                'permanent_district' => $personal->permanent_district ?? '',
                'permanent_district_name' => $personal->permanent_district_name ?? '',
                'permanent_zip' => $personal->permanent_zip ?? '',
                'residential_house_no' => $personal->residential_house_no ?? '',
                'residential_street' => $personal->residential_street ?? '',
                'residential_subdivision' => $personal->residential_subdivision ?? '',
                'residential_barangay' => $personal->residential_barangay ?? '',
                'residential_barangay_name' => $personal->residential_barangay_name ?? '',
                'residential_city' => $personal->residential_city ?? '',
                'residential_city_name' => $personal->residential_city_name ?? '',
                'residential_province' => $personal->residential_province ?? '',
                'residential_province_name' => $personal->residential_province_name ?? '',
                'residential_is_metro_manila' => (bool) ($personal->residential_is_metro_manila ?? false),
                'residential_district' => $personal->residential_district ?? '',
                'residential_district_name' => $personal->residential_district_name ?? '',
                'residential_zip' => $personal->residential_zip ?? '',
                'telephone_no' => $personal->telephone_no ?? '',
                'mobile_no' => $personal->mobile_no ?? '',
            ],
            'familyBackground' => (object) [
                'spouse' => (object) [
                    'last_name' => $spouse->last_name ?? '',
                    'first_name' => $spouse->first_name ?? '',
                    'middle_name' => $spouse->middle_name ?? '',
                    'suffix' => $spouse->ext_name ?? '',
                    'occupation' => $spouse->occupation ?? '',
                    'employer_name' => $spouse->employer_name ?? '',
                    'business_address' => $spouse->business_address ?? '',
                    'telephone_no' => $spouse->telephone_no ?? '',
                ],
                'father' => (object) [
                    'last_name' => $father->last_name ?? '',
                    'first_name' => $father->first_name ?? '',
                    'middle_name' => $father->middle_name ?? '',
                    'suffix' => $father->ext_name ?? '',
                ],
                'mother' => (object) [
                    'maiden_name' => $mother->maiden_name ?? '',
                    'last_name' => $mother->last_name ?? '',
                    'first_name' => $mother->first_name ?? '',
                    'middle_name' => $mother->middle_name ?? '',
                ],
                'children' => $children->map(fn ($row) => (object) [
                    'first_name' => $row->first_name ?? '',
                    'middle_name' => $row->middle_name ?? '',
                    'last_name' => $row->last_name ?? '',
                    'ext_name' => $row->ext_name ?? '',
                    'birth_date' => $row->birth_date ?? '',
                ])->all(),
            ],
            'educationalBackground' => $education,
            'civilServiceEligibility' => $eligibilities->map(fn ($row) => (object) [
                'eligibility' => $row->eligibility ?? '',
                'rating' => $row->rating ?? '',
                'exam_date' => $row->exam_date ?? '',
                'exam_place' => $row->exam_place ?? '',
                'license_no' => $row->license_no ?? '',
                'validity_date' => $row->validity_date ?? '',
            ])->all(),
            'workExperience' => $workExperiences->map(fn ($row) => (object) [
                'from_date' => $row->from_date ?? '',
                'to_date' => ! empty($row->isPresent) ? null : ($row->to_date ?? ''),
                'position' => $row->position ?? '',
                'agency' => $row->agency ?? '',
                'monthly_salary' => $row->monthly_salary ?? '',
                'appointment' => $row->appointment ?? '',
                'isGovtService' => $row->isGovtService ?? false,
            ])->all(),
            'voluntaryWork' => $voluntaryWorks->map(fn ($row) => (object) [
                'org_name' => $row->org_name ?? '',
                'from_date' => $row->from_date ?? '',
                'to_date' => ! empty($row->isPresent) ? null : ($row->to_date ?? ''),
                'hours' => $row->hours ?? '',
                'nature_of_work' => $row->nature_of_work ?? '',
            ])->all(),
            'learningAndDevelopment' => $learnings->map(fn ($row) => (object) [
                'seminar_title' => $row->seminar_title ?? $row->title ?? '',
                'from_date' => $row->from_date ?? '',
                'to_date' => $row->to_date ?? '',
                'hours' => $row->hours ?? $row->hours_no ?? '',
                'type' => $row->type ?? '',
                'conducted_by' => $row->conducted_by ?? '',
            ])->all(),
            'otherInformation' => $otherInformation,
        ];
    }

    protected function normalizeSubmittedRequirementsForEdit(object $application, $requirements)
    {
        $submittedReview = $this->buildSubmittedApplicationReview($application);
        $normalizeText = function ($value) {
            $text = strtolower(trim((string) $value));
            return preg_replace('/\s+/', ' ', $text);
        };
        $normalizeDate = fn ($value) => trim(substr((string) ($value ?? ''), 0, 10));

        $educationRequirement = collect($requirements)->firstWhere('connected_to', 'Educational Background');
        $eligibilityRequirement = collect($requirements)->firstWhere('connected_to', 'Civil Service Eligibility');
        $learningRequirement = collect($requirements)->firstWhere('connected_to', 'Learning and Development');
        $workRequirement = collect($requirements)->firstWhere('connected_to', 'Work Experience');

        $educationItems = collect($educationRequirement->subItems ?? []);
        $eligibilityItems = collect($eligibilityRequirement->subItems ?? []);
        $learningItems = collect($learningRequirement->subItems ?? []);
        $workItems = collect($workRequirement->subItems ?? []);

        $submittedEducations = collect([
                ...($submittedReview->educationalBackground->vocational ?? []),
                ...($submittedReview->educationalBackground->college ?? []),
                ...($submittedReview->educationalBackground->graduate ?? []),
            ])
            ->map(function ($item) use ($educationItems, $normalizeText) {
                $matchedEducation = $educationItems->first(function ($education) use ($item, $normalizeText) {
                    return $normalizeText($education->level ?? '') === $normalizeText($item->level ?? '')
                        && $normalizeText($education->school ?? '') === $normalizeText($item->school ?? '')
                        && $normalizeText($education->course ?? '') === $normalizeText($item->course ?? '')
                        && trim((string) ($education->year_graduated ?? $education->to_year ?? '')) === trim((string) ($item->year_graduated ?? $item->to_year ?? ''));
                });

                if (! $matchedEducation) {
                    $matchedEducation = $educationItems->first(function ($education) use ($item, $normalizeText) {
                        return $normalizeText($education->school ?? '') === $normalizeText($item->school ?? '')
                            && $normalizeText($education->course ?? '') === $normalizeText($item->course ?? '');
                    });
                }

                $item->files = collect($matchedEducation->files ?? [])->values();

                return $item;
            })
            ->sortByDesc(fn ($item) => $item->to_year ?? '')
            ->values();

        $submittedEligibilities = collect($submittedReview->civilServiceEligibility ?? [])
            ->map(function ($item) use ($eligibilityItems, $normalizeText, $normalizeDate) {
                $matchedEligibility = $eligibilityItems->first(function ($eligibility) use ($item, $normalizeText, $normalizeDate) {
                    return $normalizeText($eligibility->eligibility ?? '') === $normalizeText($item->eligibility ?? '')
                        && $normalizeDate($eligibility->exam_date ?? '') === $normalizeDate($item->exam_date ?? '');
                });

                if (! $matchedEligibility) {
                    $matchedEligibility = $eligibilityItems->first(function ($eligibility) use ($item, $normalizeText) {
                        return $normalizeText($eligibility->eligibility ?? '') === $normalizeText($item->eligibility ?? '');
                    });
                }

                $item->files = collect($matchedEligibility->files ?? [])->values();
                return $item;
            })
            ->values();

        $submittedLearnings = collect($submittedReview->learningAndDevelopment ?? [])
            ->map(function ($item) use ($learningItems, $normalizeText, $normalizeDate) {
                $matchedLearning = $learningItems->first(function ($learning) use ($item, $normalizeText, $normalizeDate) {
                    return $normalizeText($learning->seminar_title ?? '') === $normalizeText($item->seminar_title ?? '')
                        && $normalizeDate($learning->from_date ?? '') === $normalizeDate($item->from_date ?? '');
                });

                if (! $matchedLearning) {
                    $matchedLearning = $learningItems->first(function ($learning) use ($item, $normalizeText) {
                        return $normalizeText($learning->seminar_title ?? '') === $normalizeText($item->seminar_title ?? '');
                    });
                }

                $item->files = collect($matchedLearning->files ?? [])->values();
                return $item;
            })
            ->sortByDesc(fn ($item) => $item->from_date ?? '')
            ->values();

        $submittedWorks = collect($submittedReview->workExperience ?? [])
            ->map(function ($item) use ($workItems) {
                $normalizeText = function ($value) {
                    $text = strtolower(trim((string) $value));
                    return preg_replace('/\s+/', ' ', $text);
                };
                $normalizeDate = fn ($value) => trim(substr((string) ($value ?? ''), 0, 10));
                $normalizeAmount = function ($value) {
                    if ($value === null || $value === '') {
                        return '';
                    }

                    return number_format((float) $value, 2, '.', '');
                };

                $agency = $normalizeText($item->agency ?? '');
                $position = $normalizeText($item->position ?? '');
                $fromDate = $normalizeDate($item->from_date ?? '');
                $toDate = $normalizeDate($item->to_date ?? '');
                $salary = $normalizeAmount($item->monthly_salary ?? '');

                $matchedWork = $workItems->first(function ($work) use ($agency, $position, $fromDate, $toDate, $salary, $normalizeText, $normalizeDate, $normalizeAmount) {
                    return $normalizeText($work->agency ?? '') === $agency
                        && $normalizeText($work->position ?? '') === $position
                        && $normalizeDate($work->from_date ?? '') === $fromDate
                        && $normalizeDate($work->to_date ?? '') === $toDate
                        && $normalizeAmount($work->monthly_salary ?? '') === $salary;
                });

                if (! $matchedWork) {
                    $matchedWork = $workItems->first(function ($work) use ($agency, $position, $fromDate, $salary, $normalizeText, $normalizeDate, $normalizeAmount) {
                        return $normalizeText($work->agency ?? '') === $agency
                            && $normalizeText($work->position ?? '') === $position
                            && $normalizeDate($work->from_date ?? '') === $fromDate
                            && $normalizeAmount($work->monthly_salary ?? '') === $salary;
                    });
                }

                if (! $matchedWork) {
                    $matchedWork = $workItems->first(function ($work) use ($agency, $position, $toDate, $salary, $normalizeText, $normalizeDate, $normalizeAmount) {
                        return $normalizeText($work->agency ?? '') === $agency
                            && $normalizeText($work->position ?? '') === $position
                            && $normalizeDate($work->to_date ?? '') === $toDate
                            && $normalizeAmount($work->monthly_salary ?? '') === $salary;
                    });
                }

                if (! $matchedWork) {
                    $matchedWork = $workItems->first(function ($work) use ($agency, $position, $normalizeText) {
                        return $normalizeText($work->agency ?? '') === $agency
                            && $normalizeText($work->position ?? '') === $position;
                    });
                }

                $item->files = collect($matchedWork->files ?? [])->values();
                return $item;
            })
            ->sortByDesc(fn ($item) => $item->from_date ?? '')
            ->values();

        return collect($requirements)->map(function ($req) use (
            $submittedEducations,
            $submittedEligibilities,
            $submittedLearnings,
            $submittedWorks
        ) {
            if ($req->connected_to === 'Educational Background') {
                $req->subItems = $submittedEducations;
            }

            if ($req->connected_to === 'Civil Service Eligibility') {
                $req->subItems = $submittedEligibilities;
            }

            if ($req->connected_to === 'Learning and Development') {
                $req->subItems = $submittedLearnings;
            }

            if ($req->connected_to === 'Work Experience') {
                $req->subItems = $submittedWorks;
            }

            return $req;
        });
    }

    protected function buildSubmittedRequirementsData(object $application)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');

        $applicant = $conn->table('applicant')
            ->where('id', $application->applicant_id)
            ->first();

        if (! $applicant) {
            abort(404, 'Applicant not found');
        }

        $educationReq = $conn2->table('recruitment_requirements')
            ->where('connected_to', 'Educational Background')
            ->first();

        $eligibilityReq = $conn2->table('recruitment_requirements')
            ->where('connected_to', 'Civil Service Eligibility')
            ->first();

        $learningReq = $conn2->table('recruitment_requirements')
            ->where('connected_to', 'Learning and Development')
            ->first();

        $workReq = $conn2->table('recruitment_requirements')
            ->where('connected_to', 'Work Experience')
            ->first();

        $educations = $this->fetchEducationalBackgroundFiles(
            $applicant,
            $application->vacancy_id,
            $application->type
        );

        $eligibilities = $this->fetchCivilServiceEligibilityFiles(
            $applicant,
            $application->vacancy_id,
            $application->type
        );

        $learnings = $this->fetchLearningAndDevelopmentFiles(
            $applicant,
            $application->vacancy_id,
            $application->type
        );

        $works = $this->fetchWorkExperienceFiles(
            $applicant,
            $application->vacancy_id,
            $application->type
        );

        $requirements = $conn2->table('vacancy_requirements')
            ->select([
                'vacancy_requirements.*',
                'recruitment_requirements.connected_to',
            ])
            ->leftJoin(
                'recruitment_requirements',
                'recruitment_requirements.id',
                '=',
                'vacancy_requirements.requirement_id'
            )
            ->where('vacancy_id', $application->vacancy_id)
            ->get()
            ->map(function ($req) use (
                $applicant,
                $application,
                $educationReq,
                $educations,
                $eligibilityReq,
                $eligibilities,
                $learningReq,
                $learnings,
                $workReq,
                $works
            ) {
                $req->files = $this->fetchRequirementFiles(
                    $applicant->id,
                    $application->vacancy_id,
                    $req,
                    $application->type
                );

                $req->subItems = [];

                if ($educationReq && $req->requirement_id == $educationReq->id) {
                    $req->subItems = $educations;
                }

                if ($eligibilityReq && $req->requirement_id == $eligibilityReq->id) {
                    $req->subItems = $eligibilities;
                }

                if ($learningReq && $req->requirement_id == $learningReq->id) {
                    $req->subItems = $learnings;
                }

                if ($workReq && $req->requirement_id == $workReq->id) {
                    $req->subItems = $works;
                }

                return $req;
            });

        return $this->normalizeSubmittedRequirementsForEdit($application, $requirements);
    }

    public function index(Request $request)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $divisions = $conn3->table('tbldivision')
            ->select('division_id', 'division_name')
            ->get()
            ->pluck('division_name', 'division_id');

        $publicationIds = $conn2->table('publication')
        ->where('is_public', 1)
        ->whereRaw("CONCAT(date_closed, ' 23:59:59') >= NOW()")
        ->pluck('id');

        $vacancyIds = $conn2->table('publication_vacancies')
        ->whereIn('publication_id', $publicationIds)
        ->distinct()
        ->pluck('vacancy_id');

        $vacancies = $conn2->table('vacancy as v')
            ->select([
                'v.id',
                'v.reference_no',
                'v.appointment_status',
                'v.item_no',
                'v.position',
                'v.position_description',
                'v.division',
                'v.sg',
                'v.step',
                'v.monthly_salary',
                'v.classification',
                'v.prescribed_eligibility',
                'v.prescribed_education',
                'v.prescribed_experience',
                'v.prescribed_training',
                'v.preferred_eligibility',
                'v.preferred_education',
                'v.preferred_experience',
                'v.preferred_training',
                'v.summary',
                'v.output',
                'v.examination',
                'v.responsibility',
                'v.status',
                'v.remarks',
                'p.id as publication_id',
                'p.date_published',
                'p.date_closed',
                'p.time_closed',
            ])
            ->leftJoin('publication_vacancies as pv', 'pv.vacancy_id', '=', 'v.id')
            ->leftJoin('publication as p', 'p.id', '=', 'pv.publication_id')
            ->whereIn('v.id', $vacancyIds)
            ->where('p.is_public', 1);

        if ($search = $request->input('search')) {
            $vacancies->where(function ($q) use ($search) {
                $q->where('v.position_description', 'LIKE', "%{$search}%")
                ->orWhere('v.position', 'LIKE', "%{$search}%")
                ->orWhere('v.item_no', 'LIKE', "%{$search}%");
            });
        }

        if ($filters = $request->input('filter')) {
            if (!empty($filters['division'])) {
                $vacancies->where('v.division', $filters['division']);
            }
            if (!empty($filters['sg'])) {
                $vacancies->where('v.sg', $filters['sg']);
            }
            if (!empty($filters['appointment_status'])) {
                $vacancies->where('v.appointment_status', $filters['appointment_status']);
            }
        }

        $vacancies = $vacancies->paginate(5)->withQueryString();

        $competencies = $conn2->table('vacancy_competencies as vc')
            ->leftJoin('competency as c', 'vc.competency_id', '=', 'c.comp_id')
            ->whereIn('vacancy_id', $vacancyIds)
            ->select(
                'vc.vacancy_id',
                'c.comp_id as value',
                DB::raw('CONCAT(c.competency, " (Level ", vc.level, ")") as label'),
                'c.competency',
                'vc.level',
                'c.comp_type'
            )
            ->get()
            ->groupBy('vacancy_id');

        $requirements = $conn2->table('vacancy_requirements')
            ->whereIn('vacancy_id', $vacancyIds)
            ->get()
            ->groupBy('vacancy_id');

        $applications = $conn->table('application as a')
        ->select([
            'a.id',
            'a.vacancy_id',
            'a.publication_id',
            'a.status',
            'a.date_submitted',
            's.status as latest_status',
            's.created_at as status_date'
        ])
        ->leftJoin('applicant as ap', 'a.applicant_id', '=', 'ap.id')
        ->leftJoin('application_status as s', function ($join) {
            $join->on('s.application_id', '=', 'a.id')
                 ->whereRaw('s.id = (
                    SELECT MAX(id) FROM application_status WHERE application_id = a.id
                 )');
        })
        ->where('a.user_id', auth()->user()->id)
        ->where('ap.type', auth()->user()->ipms_id ? 'Staff' : 'Applicant')
        ->get()
        ->groupBy('vacancy_id');

        $vacancies->transform(function ($vacancy) use ($divisions, $competencies, $applications, $requirements) {
            $vacancy->hashed_id = sha1($vacancy->id);
            $vacancy->division_name = $divisions->get($vacancy->division);

            $vacancyCompetencies = $competencies->get($vacancy->id, collect());

            $vacancy->requirements = $requirements->get($vacancy->id, collect());

            $vacancy->competencies = $vacancyCompetencies->groupBy('comp_type')->map(function ($items) {
                return $items->values();
            });

            $vacancy->application = $applications->get($vacancy->id)?->first();

            return $vacancy;
        });

        $latestApp = $conn->table('application as a')
            ->leftJoin('applicant as ap', 'a.applicant_id', '=', 'ap.id')
            ->where('a.user_id', auth()->user()->id)
            ->where('ap.type', auth()->user()->ipms_id ? 'Staff' : 'Applicant')
            ->where('a.status', 'Submitted')
            ->latest('a.date_submitted')
            ->first();
            
        return Inertia::render('JobPortal/index', [
            'data' => [
                'jobs' => $vacancies,
                'latest_application' => $latestApp,
                'filters' => $request->only(['search', 'filter']),
            ],
        ]);
    }

    public function store($hashedId, Request $request)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');

        $vacancy = $conn2->table('vacancy as v')
        ->select([
            'v.id',
            'p.id as publication_id',
            'p.date_closed'
        ])
        ->leftJoin('publication_vacancies as pv', 'pv.vacancy_id', '=', 'v.id')
        ->leftJoin('publication as p', 'p.id', '=', 'pv.publication_id')
        ->whereRaw("SHA1(v.id) = ?", [$hashedId])
        ->first();

        if (!$vacancy) {
            abort(404, 'Job not found');
        }

        $user = auth()->user();

        $existingApp = $conn->table('application')
            ->leftJoin('applicant', 'application.applicant_id', '=', 'applicant.id')
             ->when(is_null($user->ipms_id), function ($query) {
                return $query->where('applicant.type', 'Applicant');
            }, function ($query) {
                return $query->where('applicant.type', 'Staff');
            })
            ->where('vacancy_id', $vacancy->id)
            ->where('application.user_id', $user->id)
            ->first();

        if ($existingApp) {
            return redirect()->route('jobs.apply', $hashedId)
                ->with('status', 'info')
                ->with('message', 'You already have an application for this job.');
        }

        $vacancyRequirements = $conn2->table('vacancy_requirements')
            ->where('vacancy_id', $vacancy->id)
            ->get();

        try{
            $conn->beginTransaction();

            $applicant = $conn->table('applicant')
            ->when(is_null($user->ipms_id), function ($query) {
                return $query->where('type', 'Applicant');
            }, function ($query) {
                return $query->where('type', 'Staff');
            })
            ->where('user_id', $user->id)
            ->first();

            if (!$applicant) {
                $data = [
                    'user_id' => auth()->user()->id,
                    'type'    => is_null($user->ipms_id) ? 'Applicant' : 'Staff',
                ];

                $applicantId = $conn->table('applicant')->insertGetId($data);
            } else {
                $applicantId = $applicant->id;
            }

            $newAppId = $conn->table('application')->insertGetId([
                'publication_id' => $vacancy->publication_id,
                'vacancy_id'     => $vacancy->id,
                'user_id'        => auth()->user()->id,
                'applicant_id'   => $applicantId,
                'type'           => $request['type'] ?? 'manual',
                'date_created'   => now(),
                'status'         => 'Draft',
            ]);

            $conn->table('application_status')
            ->insert([
                'application_id' => $newAppId,
                'status' => 'Draft',
                'created_by' => auth()->user()->id,
                'created_at' => now()
            ]);

            $filesToCopy = collect();

            if($request['type'] === 'reuse') {

                $lastApplication = $conn->table('application')
                ->where('user_id', auth()->id())
                ->where('status', 'Submitted')
                ->where('id', '<>', $newAppId)
                ->orderByDesc('date_submitted')
                ->first();

                if ($lastApplication && $vacancyRequirements->count() > 0) {

                    // Get all previous requirements that match this applicant and last vacancy
                    $latestRequirements = $conn->table('application_requirement')
                    ->where('applicant_id', $applicantId)
                    ->where('vacancy_id', $lastApplication->vacancy_id)
                    ->whereIn('requirement_id', $vacancyRequirements->pluck('requirement_id'))
                    ->get();

                    if ($latestRequirements->isNotEmpty()) {
                        // Collect requirement data for insert (new vacancy)
                        $requirementsToInsert = $latestRequirements->map(function ($req) use ($newAppId, $vacancy, $applicantId) {
                            return [
                                'applicant_id'   => $applicantId,
                                'vacancy_id'     => $vacancy->id,
                                'requirement_id' => $req->requirement_id,
                                'requirement'    => $req->requirement,
                                'sub_requirement_id' => $req->sub_requirement_id,   
                                'created_by'     => auth()->id(),
                                'created_at'     => now(),
                            ];
                        });

                        $conn->table('application_requirement')->insert($requirementsToInsert->toArray());

                        // Fetch the newly inserted ones (latest IDs by created_at)
                        $newRequirements = $conn->table('application_requirement')
                            ->where('applicant_id', $applicantId)
                            ->where('vacancy_id', $vacancy->id)
                            ->orderByDesc('id')
                            ->take($requirementsToInsert->count())
                            ->get();

                        // Map old requirement_id → new id for easy reference
                        $idMap = $latestRequirements->pluck('requirement_id', 'id')->mapWithKeys(function ($requirement_id, $oldId) use ($newRequirements) {
                            $new = $newRequirements->firstWhere('requirement_id', $requirement_id);
                            return [$oldId => $new?->id];
                        });

                        // Fetch old files
                        $requirementIds = $latestRequirements->pluck('id');
                        $requirementFiles = $conn->table('file')
                        ->whereIn('itemId', $requirementIds)
                        ->where('model', 'like', 'Vacancy_' . $lastApplication->vacancy_id . '\_%')
                        ->get();

                        if ($requirementFiles->isNotEmpty()) {
                            // Prepare new files
                            $filesToInsert = $requirementFiles->map(function ($file) use ($vacancy, $idMap) {
                                $newModel = preg_replace(
                                    '/^Vacancy_(\d+)_/',
                                    'Vacancy_' . $vacancy->id . '_',
                                    $file->model
                                );

                                return [
                                    'name'        => $file->name,
                                    'model'       => $newModel,
                                    'itemId'      => $idMap[$file->itemId] ?? null,
                                    'hash'        => $file->hash,
                                    'size'        => $file->size,
                                    'type'        => $file->type,
                                    'mime'        => $file->mime,
                                    'is_main'     => $file->is_main,
                                    'date_upload' => now()->timestamp,
                                    'sort'        => $file->sort,
                                    'path'        => $file->path,
                                ];
                            })->filter(fn($f) => !is_null($f['itemId']));

                            if ($filesToInsert->isNotEmpty()) {
                                $conn->table('file')->insert($filesToInsert->toArray());
                            }
                        }
                    }
                }
            }

            $conn->commit();

            return redirect()->route('jobs.apply', $hashedId)
                ->with('status', 'success')
                ->with('message', 'Application created successfully.');

        } catch (\Exception $e) {
            $conn->rollBack();
            Log::error('Error on saving application: ' . $e->getMessage());

            return back()->with([
                'status'  => 'error',
                'title'   => 'Error',
                'message' => 'An error occurred while saving application.',
            ]);
        }
    }

    public function apply($hashedId)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $divisions = $conn3->table('tbldivision')
            ->select('division_id', 'division_name')
            ->get()
            ->pluck('division_name', 'division_id');

        $vacancy = $conn2->table('vacancy as v')
        ->select([
            'v.id as id',
            'v.*',
            'p.date_published',
            'p.date_closed',
            'p.time_closed',
        ])
        ->leftJoin('publication_vacancies as pv', 'pv.vacancy_id', '=', 'v.id')
        ->leftJoin('publication as p', 'p.id', '=', 'pv.publication_id')
        ->whereRaw("SHA1(v.id) = ?", [$hashedId])
        ->first();

        if (!$vacancy) {
            abort(404, 'Job not found');
        }

        $user = auth()->user();

        $applicant = $conn->table('applicant')
        ->when(is_null($user->ipms_id), function ($query) {
            return $query->where('type', 'Applicant');
        }, function ($query) {
            return $query->where('type', 'Staff');
        })
        ->where('user_id', $user->id)
        ->first();

        if (!$applicant) {
            abort(404, 'Applicant not found');
        }

        $application = $conn->table('application as a')
            ->leftJoin('applicant as ap', 'a.applicant_id', '=', 'ap.id')
            ->leftJoin('application_status as s', function ($join) {
                $join->on('s.application_id', '=', 'a.id')
                    ->whereRaw('s.id = (
                        SELECT MAX(id) FROM application_status WHERE application_id = a.id
                    )');
            })
            ->where('a.vacancy_id', $vacancy->id)
            ->where('a.user_id', $user->id)
            ->when(is_null($user->ipms_id), function ($query) {
                return $query->where('ap.type', 'Applicant');
            }, function ($query) {
                return $query->where('ap.type', 'Staff');
            })
            ->select('a.*', 's.status as latest_status')
            ->first();

        if (!$application) {
            abort(404, 'Job not found');
        }

        $activeEditRequest = $this->getActiveEditRequest($application);

        if (now()->toDateString() > $vacancy->date_closed && ! $activeEditRequest) {
            abort(404, 'Job not found');
        }

        if ($application && strtolower(trim($application->latest_status)) !== 'draft' && ! $activeEditRequest) {
            abort(404, 'Job not found');
        }
    
        $requirements = $conn2->table('vacancy_requirements')
        ->whereRaw("SHA1(vacancy_id) = ?", [$hashedId])
        ->get()
        ->groupBy('vacancy_id');

        $competencies = $conn2->table('vacancy_competencies as vc')
            ->leftJoin('competency as c', 'vc.competency_id', '=', 'c.comp_id')
            ->whereRaw("SHA1(vacancy_id) = ?", [$hashedId])
            ->select(
                'vc.vacancy_id',
                'c.comp_id as value',
                DB::raw('CONCAT(c.competency, " (Level ", vc.level, ")") as label'),
                'c.competency',
                'vc.level',
                'c.comp_type'
            )
            ->get();

        $vacancy->hashed_id = sha1($vacancy->id);
        $vacancy->requirements = $requirements->get($vacancy->id, collect());
        $vacancy->division_name = $divisions->get($vacancy->division);

        $vacancy->competencies = $competencies->groupBy('comp_type')->map(function ($items) {
            return $items->values();
        });

        $progress = $conn->table('applicant_pds')
            ->leftJoin('applicant', 'applicant.id', '=', 'applicant_pds.applicant_id')
            ->where('applicant.user_id', $user->id)
            ->when(is_null($user->ipms_id), function ($query) {
                return $query->where('applicant.type', 'Applicant');
            }, function ($query) {
                return $query->where('applicant.type', 'Staff');
            })
            ->count();

        return Inertia::render('JobPortal/apply', [
            'job' => $vacancy,
            'applicant' => $applicant,
            'progress' => ($progress / 8)*100,
            'isReopenedSubmission' => (bool) $activeEditRequest,
            'submittedProfileReview' => $activeEditRequest
                ? $this->buildSubmittedApplicationReview($application, $user->email ?? '')
                : null,
        ]);
    }

    public function submit($hashedId)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $vacancy = $conn2->table('vacancy as v')
        ->select([
            'v.id as id',
            'v.*',
            'p.date_published',
            'p.date_closed',
        ])
        ->leftJoin('publication_vacancies as pv', 'pv.vacancy_id', '=', 'v.id')
        ->leftJoin('publication as p', 'p.id', '=', 'pv.publication_id')
        ->whereRaw("SHA1(v.id) = ?", [$hashedId])
        ->first();

        if (!$vacancy) {
            abort(404, 'Job not found');
        }

        $user = auth()->user();

        $applicant = $conn->table('applicant')
        ->when(is_null($user->ipms_id), function ($query) {
            return $query->where('type', 'Applicant');
        }, function ($query) {
            return $query->where('type', 'Staff');
        })
        ->where('user_id', $user->id)
        ->first();

        if (!$applicant) {
            abort(404, 'Applicant not found');
        }

       $application = $conn->table('application as a')
        ->select('a.*')
        ->leftJoin('applicant as ap', 'a.applicant_id', '=', 'ap.id')
        ->where('vacancy_id', $vacancy->id)
        ->where('a.user_id', $user->id)
        ->when(is_null($user->ipms_id), function ($query) {
            return $query->where('ap.type', 'Applicant');
        }, function ($query) {
            return $query->where('ap.type', 'Staff');
        })
        ->first();

        if(!$application) {
            abort(404, 'Job not found');
        }

        $activeEditRequest = $this->getActiveEditRequest($application);

        if (now()->toDateString() > $vacancy->date_closed && ! $activeEditRequest) {
            abort(404, 'Job not found');
        }

         try{
            $conn->beginTransaction();

            if ($application) {
                /* update application status as Submitted */
                $conn->table('application')
                    ->where('id', $application->id)
                    ->update([
                        'status' => 'Submitted',
                        'date_submitted' => now()
                    ]);

                /* insert new status as Application Received */
                $conn->table('application_status')
                    ->insert([
                        'application_id' => $application->id,
                        'status' => 'Application Received',
                        'created_by' => auth()->user()->id,
                        'created_at' => now()
                    ]);

                $copies = [
                    ['applicant', 'application_applicant', true],
                    ['applicant_child', 'application_child'],
                    ['applicant_education', 'application_education'],
                    ['applicant_eligibility', 'application_eligibility'],
                    ['applicant_father', 'application_father', true],
                    ['applicant_learning', 'application_learning'],
                    ['applicant_mother', 'application_mother', true],
                    ['applicant_other_info', 'application_other_info'],
                    ['applicant_question', 'application_question'],
                    ['applicant_reference', 'application_reference'],
                    ['applicant_spouse', 'application_spouse', true],
                    ['applicant_voluntary_work', 'application_voluntary_work'],
                    ['applicant_work_experience', 'application_work_experience'],
                ];

                foreach ($copies as $copy) {
                    [, $target] = array_pad($copy, 2, null);
                    $conn->table($target)
                        ->where('application_id', $application->id)
                        ->delete();
                }

                foreach ($copies as $copy) {
                    [$source, $target, $single] = array_pad($copy, 3, null);

                    $this->copiesApplicationData($source, $target, $applicant->id, $application->id, $single);
                }

                if ($activeEditRequest) {
                    $conn->table('app_edit_requests')
                        ->where('id', $activeEditRequest->id)
                        ->update([
                            'status' => 'Closed',
                            'closed_at' => now(),
                            'updated_at' => now(),
                            'updated_by' => (string) (auth()->user()->ipms_id ?? ''),
                        ]);

                    $conn->table('app_edit_request_logs')->insert([
                        'app_edit_request_id' => $activeEditRequest->id,
                        'action' => 'Applicant Updated',
                        'remarks' => 'Applicant resubmitted the reopened application.',
                        'acted_by' => auth()->user()->id,
                        'acted_at' => now(),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            $conn->commit();

            try {
                // notify applicant
                app(\App\Http\Controllers\JobPortal\NotificationController::class)
                    ->submitApplication($application->id, (bool) $activeEditRequest);

                // notify HR
                app(\App\Http\Controllers\JobPortal\NotificationController::class)
                    ->receiveApplication($application->id, (bool) $activeEditRequest);

            } catch (\Throwable $notifyError) {
                \Log::error('Notification sending failed: ' . $notifyError->getMessage());
            }

            return redirect()->route('my-applications.index')
                ->with('status', 'success')
                ->with('title', 'Success!')
                ->with('message', 'You have successfully submitted your application');


        } catch (\Exception $e) {
            $conn->rollBack();

            Log::error('Error on submitting application: ' . $e->getMessage());

            return back()->with([
                'status'  => 'error',
                'title'   => 'Error',
                'message' => 'An error occurred while submitting application.',
            ]);
        }
    }

    public function getRequirements($hashedId, Request $request)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $vacancy = $conn2->table('vacancy')
        ->whereRaw("SHA1(vacancy.id) = ?", [$hashedId])
        ->first();

        if (!$vacancy) {
            abort(404, 'Job not found');
        }

        $user = auth()->user();

        $applicant = $conn->table('applicant')
        ->when(is_null($user->ipms_id), function ($query) {
            return $query->where('type', 'Applicant');
        }, function ($query) {
            return $query->where('type', 'Staff');
        })
        ->where('user_id', $user->id)
        ->first();

        if (!$applicant) {
            abort(404, 'Applicant not found');
        }

        $application = $conn->table('application as a')
        ->select('a.*')
        ->leftJoin('applicant as ap', 'a.applicant_id', '=', 'ap.id')
        ->where('vacancy_id', $vacancy->id)
        ->where('a.user_id', $user->id)
        ->when(is_null($user->ipms_id), function ($query) {
            return $query->where('ap.type', 'Applicant');
        }, function ($query) {
            return $query->where('ap.type', 'Staff');
        })
        ->first();

        if(!$application) {
            abort(404, 'Job not found');
        }

        $educationReq = $conn2->table('recruitment_requirements')
        ->where('connected_to', 'Educational Background')
        ->first();

        $eligibilityReq = $conn2->table('recruitment_requirements')
        ->where('connected_to', 'Civil Service Eligibility')
        ->first();

        $learningReq = $conn2->table('recruitment_requirements')
        ->where('connected_to', 'Learning and Development')
        ->first();

        $workReq = $conn2->table('recruitment_requirements')
        ->where('connected_to', 'Work Experience')
        ->first();

        $applicationType = $request->input('type', $application->type ?? 'manual');

        $educations = $this->fetchEducationalBackgroundFiles($applicant, $vacancy->id);
        $eligibilities = $this->fetchCivilServiceEligibilityFiles($applicant, $vacancy->id, $applicationType);
        $learnings = $this->fetchLearningAndDevelopmentFiles($applicant, $vacancy->id);
        $works = $this->fetchWorkExperienceFiles($applicant, $vacancy->id, $applicationType);

        $requirements = $conn2->table('vacancy_requirements')
        ->select([
            'vacancy_requirements.*',
            'recruitment_requirements.connected_to'
        ])
        ->leftJoin(
            'recruitment_requirements',
            'recruitment_requirements.id',
            '=',
            'vacancy_requirements.requirement_id'
        )
        ->whereRaw("SHA1(vacancy_id) = ?", [$hashedId])
        ->get()
        ->map(function ($req) use (
            $applicant,
            $vacancy,
            $application,
            $educationReq,
            $educations,
            $eligibilityReq,
            $eligibilities,
            $learningReq,
            $learnings,
            $workReq,
            $works,
        ) {
            $req->files = $this->fetchRequirementFiles($applicant->id, $vacancy->id, $req, $applicationType);

            $req->subItems = [];

            if ($educationReq && $req->requirement_id == $educationReq->id) {
                $req->subItems = $educations;
            }

            if ($eligibilityReq && $req->requirement_id == $eligibilityReq->id) {
                $req->subItems = $eligibilities;
            }

            if ($learningReq && $req->requirement_id == $learningReq->id) {
                $req->subItems = $learnings;
            }

            if ($workReq && $req->requirement_id == $workReq->id) {
                $req->subItems = $works;
            }

            return $req;
        });

        return response()->json($requirements);
    }

    public function storeRequirement($hashedId, Request $request)
    {
        $conn = DB::connection('mysql');  
        $conn2 = DB::connection('mysql2'); 

        $request->validate([
            'newFiles'   => 'required|array|min:1',
            'newFiles.*' => 'required|file|mimes:pdf|max:5120',
        ], [
            'newFiles.required'      => 'A file must be uploaded.',
            'newFiles.array'         => 'Files must be an array.',
            'newFiles.min'           => 'You must upload at least one file.',
            'newFiles.*.required'    => 'A file is required.',
            'newFiles.*.file'        => 'Uploaded file must be valid.',
            'newFiles.*.mimes'       => 'File must be a PDF.',
            'newFiles.*.max'         => 'File may not be greater than 5 MB.',
        ]);

        try{
            $conn->beginTransaction();
            $conn2->beginTransaction();

            $userId     = auth()->user()->id;
            $applicantId = $request['applicant_id'];
            $vacancyId = $request['vacancy_id'];
            $requirementIdInput = $request['requirement_id'];
            $subRequirementIdInput = $request->input('sub_requirement_id');
            $requirementName    = $request['requirement'];
            $model    = $request['model'];

            $requirementIdInput = ($requirementIdInput === "null" || $requirementIdInput === "") ? null : $requirementIdInput;
            $subRequirementIdInput = ($subRequirementIdInput === "null" || $subRequirementIdInput === "") ? null : $subRequirementIdInput;

            $baseWhere = [
                'applicant_id'   => $applicantId,
                'requirement_id' => $requirementIdInput,
                'requirement'    => $requirementName,
            ];

            if ($subRequirementIdInput) {
                $baseWhere['sub_requirement_id'] = $subRequirementIdInput;
            }

            // ---------------------------
            // Applicant Requirement
            // ---------------------------
            $existingApplicantRequirement = $conn->table('applicant_requirement')
            ->where($baseWhere)
            ->first();

            if ($existingApplicantRequirement) {
                // delete old files
                $oldFiles = $conn->table('file')
                    ->where('model', $requirementName)
                    ->where('itemId', $existingApplicantRequirement->id)
                    ->get();

                foreach ($oldFiles as $oldFile) {
                    Storage::disk('public')->delete($oldFile->path);
                    $conn->table('file')->where('id', $oldFile->id)->delete();
                }

                $requirementId = $existingApplicantRequirement->id;

                $conn->table('applicant_requirement')
                    ->where('id', $requirementId)
                    ->update([
                        'updated_at' => now(),
                        'updated_by' => $userId,
                    ]);
            } else {
                $data = array_merge($baseWhere, [
                    'created_by' => $userId,
                    'created_at' => now(),
                ]);

                $requirementId = $conn->table('applicant_requirement')->insertGetId($data);
            }

            // ---------------------------
            // Application Requirement
            // ---------------------------
            $applicationWhere = array_merge($baseWhere, [
                'vacancy_id' => $vacancyId,
            ]);

            $existingApplicationRequirement = $conn->table('application_requirement')
            ->where($applicationWhere)
            ->first();

            if ($existingApplicationRequirement) {
                $oldFiles = $conn->table('file')
                    ->where('model', 'Vacancy_'.$vacancyId.'_'.$requirementName)
                    ->where('itemId', $existingApplicationRequirement->id)
                    ->get();

                foreach ($oldFiles as $oldFile) {
                    Storage::disk('public')->delete($oldFile->path);
                    $conn->table('file')->where('id', $oldFile->id)->delete();
                }

                $applicationRequirementId = $existingApplicationRequirement->id;

                $conn->table('application_requirement')
                    ->where('id', $applicationRequirementId)
                    ->update([
                        'updated_at' => now(),
                        'updated_by' => $userId,
                    ]);
            } else {
                $data = array_merge($applicationWhere, [
                    'created_by' => $userId,
                    'created_at' => now(),
                ]);

                $applicationRequirementId = $conn->table('application_requirement')->insertGetId($data);
            }

            // ---------------------------
            // File Upload
            // ---------------------------
            if ($request->hasFile('newFiles')) {
                $vacancy = $conn2->table('vacancy')->where('id', $vacancyId)->first();
                if (!$vacancy) {
                    abort(404, 'Job not found');
                }

                foreach ($request->file('newFiles') as $file) {
                    $filename = Str::random(20) . '_' . time() . '.' . $file->getClientOriginalExtension();

                    // Save to general folder
                    $generalFilePath = $file->storeAs(
                        'uploads/application/requirements/general/' . $requirementName,
                        $filename,
                        'public'
                    );

                    $conn->table('file')->insert([
                        'model'       => $requirementName,
                        'itemId'      => $requirementId,
                        'name'        => $file->getClientOriginalName(),
                        'path'        => $generalFilePath,
                        'size'        => $file->getSize(),
                        'mime'        => $file->getMimeType(),
                        'hash'        => $file->hashName(),
                        'type'        => $file->getClientOriginalExtension(),
                        'date_upload' => now()->timestamp,
                    ]);

                    // Save to application-specific folder
                    $applicationFilePath = $file->storeAs(
                        'uploads/application/requirements/' . $vacancy->reference_no . '/' . $requirementName,
                        $filename,
                        'public'
                    );

                    $conn->table('file')->insert([
                        'model'       => 'Vacancy_'.$vacancyId.'_'.$requirementName,
                        'itemId'      => $applicationRequirementId,
                        'name'        => $file->getClientOriginalName(),
                        'path'        => $applicationFilePath,
                        'size'        => $file->getSize(),
                        'mime'        => $file->getMimeType(),
                        'hash'        => $file->hashName(),
                        'type'        => $file->getClientOriginalExtension(),
                        'date_upload' => now()->timestamp,
                    ]);
                }
            }

            $conn->commit();
            $conn2->commit();

            return redirect()->back()->with([
                'status'  => 'success',
                'title'   => 'Success',
                'message' => 'File uploaded successfully!',
            ]);
        } catch (\Exception $e) {
            $conn->rollBack();
            $conn2->rollBack();
            Log::error('Error on attaching requirement: ' . $e->getMessage());

            return back()->with([
                'status'  => 'error',
                'title'   => 'Error',
                'message' => 'An error occurred while saving requirement.',
            ]);
        }
    }

    public function destroyRequirement($hashedId, $requirementId, $id)
    {
        $conn = DB::connection('mysql');  
        $conn2 = DB::connection('mysql2');  

        $vacancy = $conn2->table('vacancy')
        ->whereRaw("SHA1(id) = ?", [$hashedId])
        ->first();

        $file = $conn->table('file')->where('id', $id)->first();

        try{
            $conn->beginTransaction();

            if ($vacancy && $file) {

                $requirement = $conn2->table('vacancy_requirements')
                ->where('vacancy_id', $vacancy->id)
                ->where('requirement_id', $requirementId)
                ->first();

                if($requirement) {
                    $vacancyFile = $conn->table('file')
                    ->where('name', $file->name)
                    ->where('model', 'Vacancy_'.$vacancy->id.'_'.$requirement->requirement)
                    ->first();

                    $fileCount = $conn->table('file')
                    ->where('path', $file->path)
                    ->count();

                    if ($vacancyFile) {
                        $conn->table('application_requirement')
                            ->where('id', $vacancyFile->itemId)
                            ->delete();

                        if (!empty($vacancyFile->path) && $fileCount === 2) {
                            Storage::delete($vacancyFile->path);
                        }

                        $conn->table('file')
                        ->where('name', $file->name)
                        ->where('model', 'Vacancy_'.$vacancy->id.'_'.$requirement->requirement)
                        ->delete();
                    }

                    $conn->table('applicant_requirement')
                        ->where('id', $file->itemId)
                        ->delete();

                    
                }
            }

            $conn->commit();
        
        } catch (\Exception $e) {
            $conn->rollBack();
            Log::error('Error on deleting requirement: ' . $e->getMessage());

            return back()->with([
                'status'  => 'error',
                'title'   => 'Error',
                'message' => 'An error occurred while deleting requirement.',
            ]);
        }

        return back()->with('success', 'Attachment deleted successfully.');
    }
}
