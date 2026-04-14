<?php

namespace App\Actions\Vacancies;

use App\Models\AppAssessment;
use App\Models\AppAssessmentTotal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Lorisleiva\Actions\Concerns\AsAction;

class StoreApplicantAssessment
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.vacancies.assessment.hrmpsb.assess');
    }

    public function asController(Request $request, int $vacancy, int $application)
    {
        $validated = Validator::make($request->all(), [
            'stage' => ['required', Rule::in(['secretariat', 'hrmpsb'])],
            'general_remarks' => ['nullable', 'string'],
            'prescribed_status' => ['required', Rule::in(['Passed', 'Failed'])],
            'preferred_status' => ['required', Rule::in(['Passed', 'Failed'])],
            'overall_status' => ['required', Rule::in(['Passed', 'Failed'])],
            'screening' => ['required', 'array'],
            'screening.requirements_completion.status' => ['required', 'boolean'],
            'screening.requirements_completion.remarks' => ['nullable', 'string'],
            'screening.offense_check.status' => ['required', 'boolean'],
            'screening.offense_check.remarks' => ['nullable', 'string'],
            'prescribed' => ['required', 'array'],
            'preferred' => ['required', 'array'],
            'prescribed.education.status' => ['required', 'boolean'],
            'prescribed.training.status' => ['required', 'boolean'],
            'prescribed.experience.status' => ['required', 'boolean'],
            'prescribed.eligibility.status' => ['required', 'boolean'],
            'preferred.education.status' => ['required', 'boolean'],
            'preferred.training.status' => ['required', 'boolean'],
            'preferred.experience.status' => ['required', 'boolean'],
            'preferred.eligibility.status' => ['required', 'boolean'],
            'prescribed.education.remarks' => ['nullable', 'string'],
            'prescribed.training.remarks' => ['nullable', 'string'],
            'prescribed.experience.remarks' => ['nullable', 'string'],
            'prescribed.eligibility.remarks' => ['nullable', 'string'],
            'preferred.education.remarks' => ['nullable', 'string'],
            'preferred.training.remarks' => ['nullable', 'string'],
            'preferred.experience.remarks' => ['nullable', 'string'],
            'preferred.eligibility.remarks' => ['nullable', 'string'],
            'relevant_item_ids' => ['required', 'array'],
            'relevant_item_ids.education' => ['nullable', 'array'],
            'relevant_item_ids.training' => ['nullable', 'array'],
            'relevant_item_ids.experience' => ['nullable', 'array'],
            'relevant_item_ids.eligibility' => ['nullable', 'array'],
            'relevant_item_ids.education.*' => ['integer'],
            'relevant_item_ids.training.*' => ['integer'],
            'relevant_item_ids.experience.*' => ['integer'],
            'relevant_item_ids.eligibility.*' => ['integer'],
            'item_overrides' => ['nullable', 'array'],
            'item_overrides.*' => ['array'],
            'item_overrides.*.qualification' => ['required', 'string', 'max:100'],
            'item_overrides.*.source_id' => ['required', 'integer'],
            'item_overrides.*.override_data' => ['required', 'array'],
            'totals' => ['nullable', 'array'],
            'totals.relevant_training_hours' => ['nullable', 'numeric'],
            'totals.relevant_experience_days' => ['nullable', 'integer'],
            'totals.relevant_experience_years' => ['nullable', 'integer'],
            'totals.relevant_experience_months' => ['nullable', 'integer'],
            'totals.relevant_experience_display' => ['nullable', 'string'],
            'totals.cutoff_date' => ['nullable', 'date'],
        ])
            ->after(function ($validator) use ($request) {
                foreach ($request->input('item_overrides', []) as $index => $override) {
                    $qualification = $override['qualification'] ?? null;
                    $data = $override['override_data'] ?? [];

                    if (! is_array($data)) {
                        continue;
                    }

                    $this->validateItemOverride($validator, $index, $qualification, $data);
                }
            })
            ->validate();

        $conn = DB::connection('mysql');

        $applicationRecord = $conn->table('application')
            ->where('id', $application)
            ->where('vacancy_id', $vacancy)
            ->first();

        if (! $applicationRecord) {
            abort(404, 'Applicant not found for this vacancy.');
        }

        $sourceTableMap = [
            'education' => 'application_education',
            'training' => 'application_learning',
            'experience' => 'application_work_experience',
            'eligibility' => 'application_eligibility',
            'offenseQuestions' => 'application_question',
            'specialStatusQuestions' => 'application_question',
        ];

        DB::connection('mysql')->transaction(function () use ($validated, $vacancy, $application, $request, $sourceTableMap) {
            $assessment = AppAssessment::query()->updateOrCreate(
                [
                    'application_id' => $application,
                    'stage' => $validated['stage'],
                ],
                [
                    'vacancy_id' => $vacancy,
                    'prescribed_status' => $validated['prescribed_status'],
                    'preferred_status' => $validated['preferred_status'],
                    'overall_status' => $validated['overall_status'],
                    'general_remarks' => $validated['general_remarks'] ?? null,
                    'assessed_by' => $request->user()->id,
                    'assessed_at' => now(),
                    'validated_from_assessment_id' => $validated['stage'] === 'hrmpsb'
                        ? AppAssessment::query()
                            ->where('application_id', $application)
                            ->where('stage', 'secretariat')
                            ->value('id')
                        : null,
                ]
            );

            $assessment->qualificationReviews()->delete();

            foreach ([
                'screening' => ['requirements_completion', 'offense_check'],
                'prescribed' => ['education', 'training', 'experience', 'eligibility'],
                'preferred' => ['education', 'training', 'experience', 'eligibility'],
            ] as $section => $qualifications) {
                foreach ($qualifications as $qualification) {
                    $assessment->qualificationReviews()->create([
                        'section' => $section,
                        'qualification' => $qualification,
                        'status' => (bool) data_get($validated, "{$section}.{$qualification}.status", false),
                        'remarks' => data_get($validated, "{$section}.{$qualification}.remarks"),
                    ]);
                }
            }

            $assessment->relevantItems()->delete();

            foreach ($sourceTableMap as $qualification => $sourceTable) {
                foreach (data_get($validated, "relevant_item_ids.{$qualification}", []) as $sourceId) {
                    $assessment->relevantItems()->create([
                        'qualification' => $qualification,
                        'source_table' => $sourceTable,
                        'source_id' => $sourceId,
                    ]);
                }
            }

            $assessment->itemOverrides()->delete();

            foreach ($validated['item_overrides'] ?? [] as $override) {
                $qualification = $override['qualification'];

                if (! isset($sourceTableMap[$qualification])) {
                    continue;
                }

                $assessment->itemOverrides()->create([
                    'qualification' => $qualification,
                    'source_table' => $sourceTableMap[$qualification],
                    'source_id' => $override['source_id'],
                    'override_data' => $override['override_data'],
                ]);
            }

            if (isset($validated['totals'])) {
                AppAssessmentTotal::query()->updateOrCreate(
                    ['app_assessment_id' => $assessment->id],
                    [
                        'relevant_training_hours' => data_get($validated, 'totals.relevant_training_hours', 0),
                        'relevant_experience_days' => data_get($validated, 'totals.relevant_experience_days', 0),
                        'relevant_experience_years' => data_get($validated, 'totals.relevant_experience_years', 0),
                        'relevant_experience_months' => data_get($validated, 'totals.relevant_experience_months', 0),
                        'relevant_experience_display' => data_get($validated, 'totals.relevant_experience_display'),
                        'cutoff_date' => data_get($validated, 'totals.cutoff_date'),
                    ]
                );
            }
        });

        return response()->json([
            'status' => 'success',
            'title' => 'Success!',
            'message' => 'Assessment saved successfully.',
        ]);
    }

    protected function validateItemOverride($validator, int $index, ?string $qualification, array $data): void
    {
        $prefix = "item_overrides.$index.override_data";

        if ($qualification === 'education') {
            $this->requireFilled($validator, $data, 'school', "$prefix.school", 'Name of school is required.');
            $this->requireFilled($validator, $data, 'course', "$prefix.course", 'Basic education/degree/course is required.');
            $this->requireFilled($validator, $data, 'highest_attainment', "$prefix.highest_attainment", 'Highest level/units earned is required.');
            $this->requireFilled($validator, $data, 'from_year', "$prefix.from_year", 'Start year is required.');
            $this->requireFilled($validator, $data, 'to_year', "$prefix.to_year", 'End year is required.');
            $this->requireFilled($validator, $data, 'award', "$prefix.award", 'Scholarship / academic honors is required.');

            $fromYear = $data['from_year'] ?? null;
            $toYear = $data['to_year'] ?? null;
            $yearGraduated = $data['year_graduated'] ?? null;

            if (filled($fromYear) && ! preg_match('/^\d{4}$/', (string) $fromYear)) {
                $validator->errors()->add("$prefix.from_year", 'Must be a 4-digit year.');
            }

            if (filled($toYear) && ! preg_match('/^\d{4}$/', (string) $toYear)) {
                $validator->errors()->add("$prefix.to_year", 'Must be a 4-digit year.');
            }

            if (! empty($data['is_graduated']) && blank($yearGraduated)) {
                $validator->errors()->add("$prefix.year_graduated", 'The year graduated is required when you have graduated.');
            }

            if (filled($yearGraduated) && ! preg_match('/^\d{4}$/', (string) $yearGraduated)) {
                $validator->errors()->add("$prefix.year_graduated", 'Year graduated must be a 4-digit year.');
            }

            if (
                preg_match('/^\d{4}$/', (string) $fromYear) &&
                preg_match('/^\d{4}$/', (string) $toYear) &&
                (int) $toYear < (int) $fromYear
            ) {
                $validator->errors()->add("$prefix.to_year", 'The end year must be after or equal to the start year.');
            }
        }

        if ($qualification === 'training') {
            $title = $data['seminar_title'] ?? $data['title'] ?? null;
            $hours = $data['hours'] ?? $data['hours_no'] ?? null;

            if (blank($title)) {
                $validator->errors()->add("$prefix.seminar_title", 'Title is required.');
            }

            $this->requireFilled($validator, $data, 'from_date', "$prefix.from_date", 'The start date is required.');
            $this->requireFilled($validator, $data, 'to_date', "$prefix.to_date", 'The end date is required.');
            $this->requireFilledValue($validator, $hours, "$prefix.hours", 'The number of hours is required.');
            $this->requireFilled($validator, $data, 'participation', "$prefix.participation", 'Participation is required.');
            $this->requireFilled($validator, $data, 'type', "$prefix.type", 'Type of L&D is required.');
            $this->requireFilled($validator, $data, 'conducted_by', "$prefix.conducted_by", 'Conducted / sponsored by is required.');

            $this->validateDate($validator, $data['from_date'] ?? null, "$prefix.from_date", 'The start date must be a valid date.');
            $this->validateDate($validator, $data['to_date'] ?? null, "$prefix.to_date", 'The end date must be a valid date.');

            if (filled($hours) && ! is_numeric($hours)) {
                $validator->errors()->add("$prefix.hours", 'The number of hours must be a valid number.');
            }

            if ($this->isValidDate($data['from_date'] ?? null) && $this->isValidDate($data['to_date'] ?? null)) {
                if (strtotime($data['to_date']) < strtotime($data['from_date'])) {
                    $validator->errors()->add("$prefix.to_date", 'The end date must be after or equal to the start date.');
                }
            }
        }

        if ($qualification === 'experience') {
            $agency = $data['agency'] ?? $data['company_name'] ?? null;
            $position = $data['position'] ?? $data['position_title'] ?? null;
            $isPresent = filter_var($data['isPresent'] ?? $data['is_present'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $isGovtService = $data['isGovtService'] ?? $data['is_govt_service'] ?? null;

            $this->requireFilledValue($validator, $agency, "$prefix.agency", 'Department/agency/office/company is required.');
            $this->requireFilledValue($validator, $position, "$prefix.position", 'Position title is required.');
            $this->requireFilled($validator, $data, 'appointment', "$prefix.appointment", 'Status of appointment is required.');
            $this->requireFilled($validator, $data, 'from_date', "$prefix.from_date", 'The start date is required.');

            if ($isGovtService === null || $isGovtService === '') {
                $validator->errors()->add("$prefix.isGovtService", 'Government service status is required.');
            }

            if (! $isPresent && blank($data['to_date'] ?? null)) {
                $validator->errors()->add("$prefix.to_date", 'The end date is required when this is not your present work.');
            }

            $this->validateDate($validator, $data['from_date'] ?? null, "$prefix.from_date", 'The start date must be a valid date.');
            $this->validateDate($validator, $data['to_date'] ?? null, "$prefix.to_date", 'The end date must be a valid date.');

            if ($this->isValidDate($data['from_date'] ?? null) && $this->isValidDate($data['to_date'] ?? null)) {
                if (strtotime($data['to_date']) < strtotime($data['from_date'])) {
                    $validator->errors()->add("$prefix.to_date", 'The end date must be after or equal to the start date.');
                }
            }
        }

        if ($qualification === 'eligibility') {
            $this->requireFilled($validator, $data, 'eligibility', "$prefix.eligibility", 'Eligibility is required.');
            $this->requireFilled($validator, $data, 'rating', "$prefix.rating", 'Rating is required.');
            $this->requireFilled($validator, $data, 'exam_date', "$prefix.exam_date", 'Date of examination / conferment is required.');
            $this->requireFilled($validator, $data, 'exam_place', "$prefix.exam_place", 'Place of examination / conferment is required.');
            $this->requireFilled($validator, $data, 'license_no', "$prefix.license_no", 'License no. is required.');
            $this->requireFilled($validator, $data, 'validity_date', "$prefix.validity_date", 'Date of validity is required.');

            $this->validateDate($validator, $data['exam_date'] ?? null, "$prefix.exam_date", 'Date of examination / conferment must be a valid date.');
            $this->validateDate($validator, $data['validity_date'] ?? null, "$prefix.validity_date", 'Date of validity must be a valid date.');
        }

        if (in_array($qualification, ['offenseQuestions', 'specialStatusQuestions'], true)) {
            if (! in_array(strtolower((string) ($data['answer'] ?? '')), ['yes', 'no'], true)) {
                $validator->errors()->add("$prefix.answer", 'Answer must be Yes or No.');
            }

            if (isset($data['details']) && ! is_string($data['details'])) {
                $validator->errors()->add("$prefix.details", 'Details must be a valid text value.');
            }
        }
    }

    protected function requireFilled($validator, array $data, string $key, string $errorKey, string $message): void
    {
        if (blank($data[$key] ?? null)) {
            $validator->errors()->add($errorKey, $message);
        }
    }

    protected function requireFilledValue($validator, mixed $value, string $errorKey, string $message): void
    {
        if (blank($value)) {
            $validator->errors()->add($errorKey, $message);
        }
    }

    protected function validateDate($validator, mixed $value, string $errorKey, string $message): void
    {
        if (filled($value) && ! $this->isValidDate($value)) {
            $validator->errors()->add($errorKey, $message);
        }
    }

    protected function isValidDate(mixed $value): bool
    {
        if (! filled($value)) {
            return false;
        }

        return strtotime((string) $value) !== false;
    }
}
