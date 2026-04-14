<?php

namespace App\Actions\Vacancies;

use App\Traits\FetchCivilServiceEligibilityFiles;
use App\Traits\FetchEducationalBackgroundFiles;
use App\Traits\FetchLearningAndDevelopmentFiles;
use App\Traits\FetchRequirementFiles;
use App\Traits\FetchWorkExperienceFiles;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ApplicantDataSupport
{
    use FetchCivilServiceEligibilityFiles;
    use FetchEducationalBackgroundFiles;
    use FetchLearningAndDevelopmentFiles;
    use FetchRequirementFiles;
    use FetchWorkExperienceFiles;

    public function addBusinessDays(Carbon $date, int $days): Carbon
    {
        $current = $date->copy()->startOfDay();
        $addedDays = 0;

        while ($addedDays < $days) {
            $current->addDay();

            if ($current->isWeekend()) {
                continue;
            }

            $addedDays++;
        }

        return $current->endOfDay();
    }

    public function normalizeFilenamePart(?string $value): string
    {
        $value = strtoupper((string) $value);
        $value = preg_replace('/[^A-Z0-9]+/', '_', $value) ?? '';

        return trim($value, '_') ?: 'APPLICANT';
    }

    public function buildRequirementsData(object $application): array
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

        return $this->replaceRequirementSubItemsWithSubmittedApplicationData($application, $requirements);
    }
    public function extractFilePaths(array $requirements): array
    {
        return collect($requirements)
            ->flatMap(function ($requirement) {
                $files = [];

                if (is_array($requirement)) {
                    $files = $requirement['files'] ?? [];
                } elseif (is_object($requirement)) {
                    $files = $requirement->files ?? [];
                }

                if (! is_array($files) && ! $files instanceof \Traversable) {
                    $files = [];
                }

                return collect($files);
            })
            ->map(function ($file) {
                if (is_array($file)) {
                    return $file['filepath'] ?? $file['path'] ?? null;
                }

                return $file->filepath ?? $file->path ?? null;
            })
            ->filter(fn ($path) => ! empty($path))
            ->unique()
            ->values()
            ->toArray();
    }
    public function getPersonalInformationData(int $id): array
    {
        $conn = DB::connection('mysql');

        $applicant = $conn->table('application_applicant')->where('application_id', $id)->first();

        if (! $applicant) {
            abort(404, 'Applicant not found');
        }

        return [
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
            'umid_no' => $applicant->umid_no ?? '',
            'pag_ibig_no' => $applicant->pag_ibig_no ?? '',
            'philhealth_no' => $applicant->philhealth_no ?? '',
            'philsys_no' => $applicant->philsys_no ?? '',
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
            'permanent_barangay_name' => $applicant->permanent_barangay_name ?? '',
            'permanent_city' => $applicant->permanent_city ?? '',
            'permanent_city_name' => $applicant->permanent_city_name ?? '',
            'permanent_province' => $applicant->permanent_province ?? '',
            'permanent_province_name' => $applicant->permanent_province_name ?? '',
            'permanent_district' => $applicant->permanent_district ?? '',
            'permanent_district_name' => $applicant->permanent_district_name ?? '',
            'permanent_zip' => $applicant->permanent_zip ?? '',
            'residential_house_no' => $applicant->residential_house_no ?? '',
            'residential_street' => $applicant->residential_street ?? '',
            'residential_subdivision' => $applicant->residential_subdivision ?? '',
            'residential_barangay' => $applicant->residential_barangay ?? '',
            'residential_barangay_name' => $applicant->residential_barangay_name ?? '',
            'residential_city' => $applicant->residential_city ?? '',
            'residential_city_name' => $applicant->residential_city_name ?? '',
            'residential_province' => $applicant->residential_province ?? '',
            'residential_province_name' => $applicant->residential_province_name ?? '',
            'residential_district' => $applicant->residential_district ?? '',
            'residential_district_name' => $applicant->residential_district_name ?? '',
            'residential_zip' => $applicant->residential_zip ?? '',
            'telephone_no' => $applicant->telephone_no ?? '',
            'mobile_no' => $applicant->mobile_no ?? '',
        ];
    }

    public function getFamilyBackgroundData(int $id): array
    {
        $conn = DB::connection('mysql');

        $children = $conn->table('application_child')->where('application_id', $id)->get();
        $spouse = $conn->table('application_spouse')->where('application_id', $id)->first();
        $mother = $conn->table('application_mother')->where('application_id', $id)->first();
        $father = $conn->table('application_father')->where('application_id', $id)->first();

        return [
            'isThereSpouse' => $spouse && $spouse->hasSpouse ? (bool) $spouse->hasSpouse : false,
            'spouse' => $spouse ? [
                'last_name' => $spouse->last_name ?? '',
                'first_name' => $spouse->first_name ?? '',
                'middle_name' => $spouse->middle_name ?? '',
                'ext_name' => $spouse->ext_name ?? '',
                'occupation' => $spouse->occupation ?? '',
                'employer' => $spouse->employer ?? '',
                'business_address' => $spouse->business_address ?? '',
                'telephone_no' => $spouse->telephone_no ?? '',
            ] : [],
            'father' => $father ? [
                'last_name' => $father->last_name ?? '',
                'first_name' => $father->first_name ?? '',
                'middle_name' => $father->middle_name ?? '',
                'ext_name' => $father->ext_name ?? '',
            ] : [],
            'mother' => $mother ? [
                'last_name' => $mother->last_name ?? '',
                'first_name' => $mother->first_name ?? '',
                'middle_name' => $mother->middle_name ?? '',
                'maiden_name' => $mother->maiden_name ?? '',
            ] : [],
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
    }

    public function getEducationalBackgroundData(int $id): array
    {
        $conn = DB::connection('mysql');
        $educations = $conn->table('application_education')->where('application_id', $id)->get();

        $educationalBackground = (object) [
            'elementary' => [],
            'secondary' => [],
            'vocational' => [],
            'college' => [],
            'graduate' => [],
        ];

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

        return (array) $educationalBackground;
    }

    public function getCivilServiceEligibilityData(int $id): array
    {
        $conn = DB::connection('mysql');
        $eligibilities = $conn->table('application_eligibility')->where('application_id', $id)->get();

        $civilServiceEligibilities = [];
        foreach ($eligibilities as $item) {
            $civilServiceEligibilities[] = self::mapEligibility($item);
        }

        return $civilServiceEligibilities;
    }

    public function getWorkExperienceData(int $id): array
    {
        $conn = DB::connection('mysql');
        $works = $conn->table('application_work_experience')->where('application_id', $id)->orderBy('from_date', 'desc')->get();

        $workExperiences = [];
        foreach ($works as $item) {
            $workExperiences[] = self::mapWorkExperience($item);
        }

        return $workExperiences;
    }

    public function getVoluntaryWorkData(int $id): array
    {
        $conn = DB::connection('mysql');
        $works = $conn->table('application_voluntary_work')->where('application_id', $id)->orderBy('from_date', 'desc')->get();

        $voluntaryWorks = [];
        foreach ($works as $item) {
            $voluntaryWorks[] = self::mapVoluntaryWork($item);
        }

        return $voluntaryWorks;
    }

    public function getLearningAndDevelopmentData(int $id): array
    {
        $conn = DB::connection('mysql');
        $learnings = $conn->table('application_learning')->where('application_id', $id)->orderBy('from_date', 'desc')->get();

        $learningAndDevelopments = [];
        foreach ($learnings as $item) {
            $learningAndDevelopments[] = self::mapLearningAndDevelopment($item);
        }

        return $learningAndDevelopments;
    }

    public function getOtherInformationData(int $id): array
    {
        $conn = DB::connection('mysql');

        $otherInfos = $conn->table('application_other_info')->where('application_id', $id)->get();
        $questions = $conn->table('application_question')->where('application_id', $id)->get();
        $references = $conn->table('application_reference')->where('application_id', $id)->get();

        $otherInformation = (object) [
            'skills' => [],
            'recognitions' => [],
            'memberships' => [],
            'questions' => [],
            'references' => [],
        ];

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

        $defaultQuestions = $this->getDefaultQuestionsData();

        $answered = [];
        foreach ($questions as $q) {
            $key = $q->item_no . ($q->list ? '-' . $q->list : '');
            $answered[$key] = [
                'answer' => strtolower($q->answer ?? 'no'),
                'details' => $q->details ?? '',
            ];
        }

        foreach ($defaultQuestions as $question) {
            if (! empty($question['subQuestions'])) {
                foreach ($question['subQuestions'] as &$subQ) {
                    $key = $subQ['item_no'] . ($subQ['list'] ? '-' . $subQ['list'] : '');
                    if (isset($answered[$key])) {
                        $subQ['answer'] = $answered[$key]['answer'];
                        $subQ['details'] = $answered[$key]['details'];
                    }
                }
            } else {
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

        return (array) $otherInformation;
    }

    public function getDefaultQuestionsData(): array
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
                        'answer' => 'no',
                        'question_details' => 'If YES, give details',
                        'details' => '',
                    ],
                    [
                        'item_no' => '34',
                        'list' => 'B',
                        'question' => "within the fourth degree (for Local Government Unit - Career Employees)?",
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
                'question' => 'Pursuant to: (a) Indigenous People\'s Act (RA 8371) (b) Magna Carta for Disabled Persons (RA 7277) and (c) Solo Parents Welfare Act of 2000 (RA 8972), please answer the following items:',
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
    }

    private static function mapEducation($item): array
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

    private static function mapEligibility($item): array
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

    private static function mapWorkExperience($item): array
    {
        return [
            'agency' => $item->agency ?? '',
            'position' => $item->position ?? '',
            'appointment' => $item->appointment ?? '',
            'from_date' => $item->from_date ?? '',
            'to_date' => $item->to_date ?? '',
            'isGovtService' => $item->isGovtService ?? false,
            'isPresent' => $item->isPresent ?? false,
        ];
    }

    private static function mapVoluntaryWork($item): array
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

    private static function mapLearningAndDevelopment($item): array
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

    private static function mapOtherInformation($item): array
    {
        return [
            'type' => $item->type ?? '',
            'description' => $item->description ?? '',
            'year' => $item->year ?? '',
        ];
    }

    private static function mapReference($item): array
    {
        return [
            'name' => $item->name ?? '',
            'address' => $item->address ?? '',
            'contact_no' => $item->contact_no ?? '',
        ];
    }

    public function buildRequirementTreeData(object $application): array
    {
        return $this->buildRequirementsData($application);
    }

    private function replaceRequirementSubItemsWithSubmittedApplicationData($application, $requirements)
    {
        $conn = DB::connection('mysql');
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

        $submittedEducations = $conn->table('application_education')
            ->where('application_id', $application->id)
            ->whereNotIn('level', ['Elementary', 'Secondary'])
            ->orderByDesc('to_year')
            ->get()
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
            ->values();

        $submittedEligibilities = $conn->table('application_eligibility')
            ->where('application_id', $application->id)
            ->orderByDesc('id')
            ->get()
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

        $submittedLearnings = $conn->table('application_learning')
            ->where('application_id', $application->id)
            ->orderByDesc('from_date')
            ->get()
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
            ->values();

        $submittedWorks = $conn->table('application_work_experience')
            ->where('application_id', $application->id)
            ->orderByDesc('from_date')
            ->get()
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
        })->values()->all();
    }
}
