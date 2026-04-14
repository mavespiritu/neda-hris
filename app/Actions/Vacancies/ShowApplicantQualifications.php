<?php

namespace App\Actions\Vacancies;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowApplicantQualifications
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.vacancies.applicants.view');
    }

    public function asController(Request $request, int $id)
    {
        $application = DB::connection('mysql')->table('application')->where('id', $id)->first();

        if (! $application) {
            return response()->json(['message' => 'Application not found'], 404);
        }

        $support = app(ApplicantDataSupport::class);
        $requirements = collect($support->buildRequirementTreeData($application));

        $educationRequirement = $requirements->firstWhere('connected_to', 'Educational Background');
        $eligibilityRequirement = $requirements->firstWhere('connected_to', 'Civil Service Eligibility');
        $learningRequirement = $requirements->firstWhere('connected_to', 'Learning and Development');
        $workRequirement = $requirements->firstWhere('connected_to', 'Work Experience');

        $educations = collect($educationRequirement->subItems ?? [])
            ->map(function ($item) {
                return [
                    'id' => $item->id ?? null,
                    'level' => $item->level ?? '',
                    'course' => $item->course ?? '',
                    'school' => $item->school ?? '',
                    'highest_attainment' => $item->highest_attainment ?? '',
                    'from_year' => $item->from_year ?? '',
                    'to_year' => $item->to_year ?? '',
                    'year_graduated' => $item->year_graduated ?? '',
                    'files' => collect($item->files ?? [])->values()->all(),
                ];
            })
            ->values();

        $eligibilities = collect($eligibilityRequirement->subItems ?? [])
            ->map(function ($item) {
                return [
                    'id' => $item->id ?? null,
                    'eligibility' => $item->eligibility ?? '',
                    'rating' => $item->rating ?? '',
                    'exam_date' => $item->exam_date ?? '',
                    'exam_place' => $item->exam_place ?? '',
                    'license_no' => $item->license_no ?? '',
                    'validity_date' => $item->validity_date ?? '',
                    'files' => collect($item->files ?? [])->values()->all(),
                ];
            })
            ->values();

        $learnings = collect($learningRequirement->subItems ?? [])
            ->map(function ($item) {
                return [
                    'id' => $item->id ?? null,
                    'title' => $item->seminar_title ?? $item->title ?? '',
                    'hours_no' => $item->hours ?? $item->hours_ ?? $item->hours_no ?? '',
                    'from_date' => $item->from_date ?? '',
                    'to_date' => $item->to_date ?? '',
                    'participation' => $item->participation ?? '',
                    'conducted_by' => $item->conducted_by ?? '',
                    'files' => collect($item->files ?? [])->values()->all(),
                ];
            })
            ->values();

        $workExperiences = collect($workRequirement->subItems ?? [])
            ->map(function ($item) {
                return [
                    'id' => $item->id ?? null,
                    'position_title' => $item->position ?? $item->position_title ?? '',
                    'company_name' => $item->agency ?? $item->company_name ?? '',
                    'monthly_salary' => $item->monthly_salary ?? '',
                    'appointment' => $item->appointment ?? '',
                    'from_date' => $item->from_date ?? '',
                    'to_date' => $item->to_date ?? '',
                    'is_present' => (bool) ($item->isPresent ?? $item->is_present ?? false),
                    'files' => collect($item->files ?? [])->values()->all(),
                ];
            })
            ->values();

        $offenseQuestions = DB::connection('mysql')->table('application_question')
            ->where('application_id', $application->id)
            ->where(function ($query) {
                $query->where(function ($subQuery) {
                    $subQuery->where('item_no', '35')->whereIn('list', ['A', 'B']);
                })->orWhere(function ($subQuery) {
                    $subQuery->where('item_no', '36');
                });
            })
            ->get()
            ->map(function ($item) {
                $label = match (true) {
                    $item->item_no === '35' && $item->list === 'A' => 'Found Guilty with Administrative Offense',
                    $item->item_no === '35' && $item->list === 'B' => 'Criminally Charged Before Any Court',
                    $item->item_no === '36' => 'Convicted of Any Crime or Violation',
                    default => 'Offense Record',
                };

                return [
                    'id' => $item->id ?? null,
                    'item_no' => $item->item_no ?? '',
                    'list' => $item->list ?? '',
                    'label' => $label,
                    'answer' => strtolower($item->answer ?? 'no'),
                    'details' => $item->details ?? '',
                ];
            })
            ->values();

        $specialStatusQuestions = DB::connection('mysql')->table('application_question')
            ->where('application_id', $application->id)
            ->where('item_no', '40')
            ->whereIn('list', ['A', 'B', 'C'])
            ->get()
            ->map(function ($item) {
                $label = match ($item->list) {
                    'A' => 'Member of Any Indigenous Group',
                    'B' => 'Person with Disability',
                    'C' => 'Solo Parent',
                    default => 'Special Status',
                };

                return [
                    'id' => $item->id ?? null,
                    'item_no' => $item->item_no ?? '',
                    'list' => $item->list ?? '',
                    'label' => $label,
                    'answer' => strtolower($item->answer ?? 'no'),
                    'details' => $item->details ?? '',
                ];
            })
            ->values();

        $requirementsSummary = $requirements->map(function ($requirement) {
            $requirementFiles = collect($requirement->files ?? []);
            $hasSubItems = collect($requirement->subItems ?? [])->isNotEmpty();
            $subItemFiles = collect($requirement->subItems ?? [])->flatMap(function ($subItem) {
                return collect($subItem->files ?? []);
            });

            $allFiles = ($hasSubItems ? $subItemFiles : $requirementFiles)
                ->filter(fn ($file) => ! empty($file->filepath ?? $file->path ?? null))
                ->unique(function ($file) {
                    return ($file->filepath ?? $file->path ?? '') . '|' . ($file->filename ?? $file->name ?? '');
                })
                ->values();

            return [
                'id' => $requirement->id ?? null,
                'requirement' => $requirement->requirement ?? '',
                'connected_to' => $requirement->connected_to ?? null,
                'has_sub_items' => $hasSubItems,
                'is_submitted' => $allFiles->isNotEmpty(),
                'files' => $allFiles->map(function ($file) {
                    return [
                        'id' => $file->id ?? null,
                        'filename' => $file->filename ?? $file->name ?? null,
                        'filepath' => $file->filepath ?? $file->path ?? null,
                        'filetype' => $file->filetype ?? $file->type ?? null,
                        'filesize' => $file->filesize ?? $file->size ?? null,
                    ];
                })->all(),
            ];
        })->values();

        return response()->json([
            'educations' => $educations,
            'eligibilities' => $eligibilities,
            'learnings' => $learnings,
            'workExperiences' => $workExperiences,
            'offenseQuestions' => $offenseQuestions,
            'specialStatusQuestions' => $specialStatusQuestions,
            'requirementsSummary' => [
                'is_complete' => $requirementsSummary->every(fn ($item) => $item['is_submitted']),
                'submitted_count' => $requirementsSummary->where('is_submitted', true)->count(),
                'total_count' => $requirementsSummary->count(),
                'items' => $requirementsSummary->all(),
                'missing_items' => $requirementsSummary->where('is_submitted', false)->pluck('requirement')->filter()->values()->all(),
            ],
        ]);
    }
}
