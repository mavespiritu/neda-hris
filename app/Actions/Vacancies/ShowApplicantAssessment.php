<?php

namespace App\Actions\Vacancies;

use App\Models\AppAssessment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowApplicantAssessment
{
    use AsAction;

    private function formatAssessment(?AppAssessment $assessment): ?array
    {
        if (! $assessment) {
            return null;
        }

        $reviews = $assessment->qualificationReviews
            ->keyBy(fn ($review) => "{$review->section}.{$review->qualification}");

        $relevantItems = $assessment->relevantItems
            ->groupBy('qualification')
            ->map(fn ($items) => $items->pluck('source_id')->values()->all());
        $itemOverrides = $assessment->itemOverrides
            ->groupBy('qualification')
            ->map(function ($items) {
                return $items->mapWithKeys(function ($item) {
                    return [$item->source_id => $item->override_data ?? []];
                })->all();
            });

        return [
            'id' => $assessment->id,
            'stage' => $assessment->stage,
            'general_remarks' => $assessment->general_remarks,
            'prescribed_status' => $assessment->prescribed_status,
            'preferred_status' => $assessment->preferred_status,
            'overall_status' => $assessment->overall_status,
            'screening' => [
                'requirements_completion' => [
                    'status' => (bool) optional($reviews->get('screening.requirements_completion'))->status,
                    'remarks' => optional($reviews->get('screening.requirements_completion'))->remarks ?? '',
                ],
                'offense_check' => [
                    'status' => (bool) optional($reviews->get('screening.offense_check'))->status,
                    'remarks' => optional($reviews->get('screening.offense_check'))->remarks ?? '',
                ],
            ],
            'prescribed' => [
                'education' => [
                    'status' => (bool) optional($reviews->get('prescribed.education'))->status,
                    'remarks' => optional($reviews->get('prescribed.education'))->remarks ?? '',
                ],
                'training' => [
                    'status' => (bool) optional($reviews->get('prescribed.training'))->status,
                    'remarks' => optional($reviews->get('prescribed.training'))->remarks ?? '',
                ],
                'experience' => [
                    'status' => (bool) optional($reviews->get('prescribed.experience'))->status,
                    'remarks' => optional($reviews->get('prescribed.experience'))->remarks ?? '',
                ],
                'eligibility' => [
                    'status' => (bool) optional($reviews->get('prescribed.eligibility'))->status,
                    'remarks' => optional($reviews->get('prescribed.eligibility'))->remarks ?? '',
                ],
            ],
            'preferred' => [
                'education' => [
                    'status' => (bool) optional($reviews->get('preferred.education'))->status,
                    'remarks' => optional($reviews->get('preferred.education'))->remarks ?? '',
                ],
                'training' => [
                    'status' => (bool) optional($reviews->get('preferred.training'))->status,
                    'remarks' => optional($reviews->get('preferred.training'))->remarks ?? '',
                ],
                'experience' => [
                    'status' => (bool) optional($reviews->get('preferred.experience'))->status,
                    'remarks' => optional($reviews->get('preferred.experience'))->remarks ?? '',
                ],
                'eligibility' => [
                    'status' => (bool) optional($reviews->get('preferred.eligibility'))->status,
                    'remarks' => optional($reviews->get('preferred.eligibility'))->remarks ?? '',
                ],
            ],
            'relevant_item_ids' => [
                'education' => $relevantItems->get('education', []),
                'training' => $relevantItems->get('training', []),
                'experience' => $relevantItems->get('experience', []),
                'eligibility' => $relevantItems->get('eligibility', []),
            ],
            'item_overrides' => [
                'education' => $itemOverrides->get('education', []),
                'training' => $itemOverrides->get('training', []),
                'experience' => $itemOverrides->get('experience', []),
                'eligibility' => $itemOverrides->get('eligibility', []),
                'offenseQuestions' => $itemOverrides->get('offenseQuestions', []),
                'specialStatusQuestions' => $itemOverrides->get('specialStatusQuestions', []),
            ],
            'totals' => $assessment->totals ? [
                'relevant_training_hours' => $assessment->totals->relevant_training_hours,
                'relevant_experience_days' => $assessment->totals->relevant_experience_days,
                'relevant_experience_years' => $assessment->totals->relevant_experience_years,
                'relevant_experience_months' => $assessment->totals->relevant_experience_months,
                'relevant_experience_display' => $assessment->totals->relevant_experience_display,
                'cutoff_date' => optional($assessment->totals->cutoff_date)->format('Y-m-d'),
            ] : null,
        ];
    }

    public function authorize(Request $request): bool
    {
        $user = $request->user();

        if (! $user) {
            return false;
        }

        $allowedRoles = ['HRIS_HR', 'HRIS_RD', 'HRIS_ARD'];
        $userRoles = $user->roles->pluck('name')->toArray();

        return (bool) array_intersect($allowedRoles, $userRoles);
    }

    public function asController(int $vacancy, int $application)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');

        $vacancyRecord = $conn2->table('vacancy')->where('id', $vacancy)->first();
        if (! $vacancyRecord) {
            abort(404, 'Vacancy not found.');
        }

        $applicationRecord = $conn->table('application as a')
            ->join('application_applicant as aa', 'aa.application_id', '=', 'a.id')
            ->select(
                'a.id',
                'a.vacancy_id',
                'a.date_submitted',
                'aa.last_name as lastname',
                'aa.first_name as firstname',
                'aa.middle_name as middlename',
                DB::raw("CONCAT(
                    aa.last_name,
                    ', ',
                    aa.first_name,
                    IF(
                        aa.middle_name IS NULL OR aa.middle_name = '',
                        '',
                        CONCAT(' ', UPPER(LEFT(aa.middle_name, 1)), '.')
                    )
                ) AS name"),
                'aa.email_address',
                'aa.mobile_no'
            )
            ->where('a.id', $application)
            ->first();

        if (! $applicationRecord || (int) $applicationRecord->vacancy_id !== $vacancy) {
            abort(404, 'Applicant not found for this vacancy.');
        }

        $publication = $conn2->table('publication_vacancies as pv')
            ->join('publication as p', 'p.id', '=', 'pv.publication_id')
            ->where('pv.vacancy_id', $vacancy)
            ->select('p.date_closed')
            ->first();

        $vacancyRecord->application_due_date = $publication->date_closed ?? null;

        $assessment = AppAssessment::query()
            ->with(['qualificationReviews', 'relevantItems', 'itemOverrides', 'totals'])
            ->where('application_id', $application)
            ->where('stage', 'secretariat')
            ->first();

        return Inertia::render('Vacancies/Assessment/ApplicantAssessment', [
            'vacancy' => $vacancyRecord,
            'applicant' => $applicationRecord,
            'assessmentStage' => 'secretariat',
            'existingAssessment' => $this->formatAssessment($assessment),
            'backUrl' => route('vacancies.show', ['id' => $vacancy]) . '?tab=Assessment',
            'previousStageUrl' => null,
            'nextStageUrl' => route('vacancies.applicants.hrmpsb-assessment', [
                'vacancy' => $vacancy,
                'application' => $application,
            ]),
        ]);
    }
}
