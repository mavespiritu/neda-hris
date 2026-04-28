<?php

namespace App\Actions\Performance\Opcr;

use App\Models\OpcrItem;
use App\Models\OpcrRecord;
use App\Models\PerformanceCategory;
use App\Models\PerformancePap;
use App\Models\PerformanceRating;
use App\Models\PerformanceSuccessIndicator;
use App\States\Opcr\Draft;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowOpcr
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_performance.opcr.page.view');      
    }

    public function asController(Request $request): Response
    {
        $connection = DB::connection('mysql2');
        $frequency = strtolower((string) ($connection->table('settings')
            ->where('title', 'OPCR Frequency')
            ->value('value') ?: 'yearly'));

        $selectedYear = (int) $request->query('year', now()->year);
        $selectedSemester = $frequency === 'semestral'
            ? max(1, min(2, (int) $request->query('semester', 1)))
            : null;

        $selectedRecord = $this->ensureSelectedRecordExists($request, $selectedYear, $selectedSemester, $frequency);
        $activeDivisionIds = $this->activeDivisionIds();


        $paps = PerformancePap::query()
            ->with(['identifier.subProgram.program'])
            ->select(['id', 'identifier_id', 'short_code', 'title'])
            ->orderBy('title')
            ->orderBy('id')
            ->get()
            ->map(function (PerformancePap $pap) {
                return [
                    'id' => $pap->id,
                    'short_code' => $pap->short_code,
                    'title' => $pap->title,
                    'label' => $pap->label,
                    'activity' => $pap->activity,
                    'program_title' => $pap->program_title,
                    'program_id' => $pap->identifier?->subProgram?->program?->id,
                ];
            })
            ->values();

        $ratings = PerformanceRating::query()
            ->with(['rows' => fn ($query) => $query->orderBy('sort_order')->orderBy('id')])
            ->select(['id', 'name', 'category', 'sort_order', 'created_by', 'updated_by', 'created_at', 'updated_at'])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(function (PerformanceRating $rating) {
                return [
                    'id' => $rating->id,
                    'name' => $rating->name,
                    'category' => $rating->category,
                    'sort_order' => $rating->sort_order,
                    'matrix_rows' => $this->buildRatingMatrixPayload($rating->rows),
                ];
            })
            ->values();

        $categories = PerformanceCategory::query()
            ->select([
                'id',
                'category',
                'description',
                'sort_order',
                'created_by',
                'updated_by',
                'created_at',
                'updated_at',
            ])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->values();

        $categoryTitlesById = PerformanceCategory::query()
            ->pluck('category', 'id')
            ->map(fn ($value) => (string) $value)
            ->all();

        $records = OpcrRecord::query()
            ->with(['items' => fn ($query) => $query->with(['pap.identifier.subProgram.program'])->orderBy('category_sort_order')->orderBy('pap_sort_order')->orderBy('sort_order')->orderBy('id')])
            ->orderByDesc('year')
            ->orderByRaw('COALESCE(period_no, 0) DESC')
            ->get()
            ->map(fn (OpcrRecord $record) => $this->serializeRecord($record, $categoryTitlesById, $activeDivisionIds))
            ->values();

        $selectedRecord = $records->firstWhere('id', $selectedRecord->id)
            ?? $this->serializeRecord(
                $selectedRecord->load(['items' => fn ($query) => $query->with(['pap.identifier.subProgram.program'])->orderBy('category_sort_order')->orderBy('pap_sort_order')->orderBy('sort_order')->orderBy('id')]),
                $categoryTitlesById,
                $activeDivisionIds
            );

        $libraryOptions = [
            'ppas' => $paps,
            'paps' => $paps,
            'ratings' => $ratings,
            'success_indicators' => PerformanceSuccessIndicator::query()
                ->select(['id', 'level', 'target', 'measurement', 'weight', 'budget', 'accountable', 'sort_order'])
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get()
                ->map(function ($item) {
                    $parts = array_filter([
                        $item->level,
                        $item->target,
                        $item->measurement,
                    ]);

                    return [
                        'id' => $item->id,
                        'label' => implode(' - ', $parts) ?: ($item->target ?: $item->level ?: 'Success Indicator'),
                        'level' => $item->level,
                        'target' => $item->target,
                        'measurement' => $item->measurement,
                        'weight' => $item->weight,
                        'budget' => $item->budget,
                        'accountable' => $item->accountable,
                        'sort_order' => $item->sort_order,
                    ];
                })
                ->values(),
        ];
        $itemsCount = collect($selectedRecord['items'] ?? [])->count();

        return Inertia::render('Performance/Opcr/index', [
            'records' => $records,
            'selectedRecord' => $selectedRecord,
            'selectedYear' => $selectedYear,
            'selectedSemester' => $selectedSemester,
            'frequency' => $frequency === 'semestral' ? 'semestral' : 'yearly',
            'libraryOptions' => $libraryOptions,
            'categories' => $categories,
            'canManage' => $request->user()?->hasAnyRole(['HRIS_DC', 'HRIS_RD', 'HRIS_ARD']) ?? false,
            'summary' => [
                'record_count' => $records->count(),
                'item_count' => $itemsCount,
                'monitoring_link' => route('emails.index'),
            ],
        ]);
    }

    private function ensureSelectedRecordExists(Request $request, int $year, ?int $semester, string $frequency): OpcrRecord
    {
        $periodType = $frequency === 'semestral' ? 'semestral' : 'yearly';
        $periodNo = $periodType === 'semestral' ? max(1, min(2, (int) ($semester ?? 1))) : null;

        $query = OpcrRecord::query()->where('year', $year)->where('period_type', $periodType);

        if ($periodType === 'semestral') {
            $query->where('period_no', $periodNo);
        }

        $record = $query->first();

        if ($record) {
            return $record;
        }

        $title = $periodType === 'semestral'
            ? sprintf('OPCR %d - %s', $year, $periodNo === 2 ? '2nd Semester' : '1st Semester')
            : sprintf('OPCR %d', $year);

        $record = OpcrRecord::create([
            'year' => $year,
            'period_type' => $periodType,
            'period_no' => $periodNo,
            'title' => $title,
            'state_remarks' => null,
            'created_by' => $request->user()?->ipms_id,
            'updated_by' => $request->user()?->ipms_id,
        ]);

        if ($record->state instanceof Draft) {
            $record->state->transitionTo(
                Draft::class,
                (string) $request->user()?->ipms_id,
                null,
                false
            );
        } else {
            $record->state = new Draft($record);
            $record->save();
        }

        return $record;
    }



    private function serializeRecord(OpcrRecord $record, array $categoryTitlesById = [], array $activeDivisionIds = []): array
    {
        $record->loadMissing([
            'items' => fn ($query) => $query->with(['pap.identifier.subProgram.program'])->orderBy('category_sort_order')->orderBy('pap_sort_order')->orderBy('sort_order')->orderBy('id'),
            'items.assignments',
            'items.ratingRows',
            'items.successIndicator',
        ]);

        return [
            'id' => $record->id,
            'year' => $record->year,
            'period_type' => $record->period_type,
            'period_no' => $record->period_no,
            'title' => $record->title,
            'state' => $record->state?->label() ?: $record->getRawOriginal('state') ?: 'Draft',
            'state_remarks' => $record->state_remarks,
            'created_by' => $record->created_by,
            'updated_by' => $record->updated_by,
            'created_at' => optional($record->created_at)?->toDateTimeString(),
            'updated_at' => optional($record->updated_at)?->toDateTimeString(),
            'items' => $record->items->map(fn (OpcrItem $item) => [
                'id' => $item->id,
                'opcr_record_id' => $item->opcr_record_id,
                'category_id' => $item->category_id,
                'category_title' => $categoryTitlesById[(string) $item->category_id] ?? null,
                'category_sort_order' => $item->category_sort_order,
                'parent_item_id' => $item->parent_item_id,
                'item_level' => $item->item_level,
                'pap_id' => $item->pap_id,
                'pap_title' => $item->pap_title,
                'pap_program_id' => $item->pap?->identifier?->subProgram?->program?->id,
                'pap_program_title' => $item->pap?->program_title,
                'pap_sort_order' => $item->pap_sort_order,
                'success_indicator_id' => $item->success_indicator_id,
                'success_indicator_title' => $item->success_indicator_title,
                'performance_rating_id' => $item->successIndicator?->performance_rating_id,
                'rating_rows' => $item->ratingRows->map(fn ($row) => [
                    'id' => $row->id,
                    'opcr_item_id' => $row->opcr_item_id,
                    'success_indicator_id' => $row->success_indicator_id,
                    'rating_dimension' => $row->rating_dimension,
                    'score' => $row->score,
                    'enabled' => (bool) $row->enabled,
                    'condition_type' => $row->condition_type,
                    'condition_text' => $row->condition_text,
                    'meaning' => $row->meaning,
                    'value_from' => $row->value_from,
                    'value_to' => $row->value_to,
                    'unit' => $row->unit,
                    'timing' => $row->timing,
                    'sort_order' => $row->sort_order,
                ])->values(),
                'division_assignments' => $this->serializeDivisionAssignments($item, $activeDivisionIds),
                'group_assignments' => $this->serializeAssignedValues($item, 'group_id'),
                'employee_assignments' => $this->serializeAssignedValues($item, 'emp_id'),
                'weight' => $item->weight,
                'allocated_budget' => $item->allocated_budget ?? $item->budget,
                'budget' => $item->allocated_budget ?? $item->budget,
                'remarks' => $item->remarks,
                'sort_order' => $item->sort_order,
                'created_at' => optional($item->created_at)?->toDateTimeString(),
                'updated_at' => optional($item->updated_at)?->toDateTimeString(),
            ])->values(),
        ];
    }

    private function buildRatingMatrixPayload($rows): array
    {
        $sections = collect(['Q', 'E', 'T'])->map(function (string $dimension) use ($rows) {
            $dimensionRows = collect($rows)->where('rating_dimension', $dimension)->values();

            return [
                'rating_dimension' => $dimension,
                'enabled' => (bool) ($dimensionRows->first()?->enabled ?? true),
                'rows' => $dimensionRows->map(function ($row) {
                    return [
                        'score' => (int) $row->score,
                        'condition_type' => $row->condition_type,
                        'condition_text' => $row->condition_text,
                        'meaning' => $row->meaning,
                        'value_from' => $row->value_from,
                        'value_to' => $row->value_to,
                        'unit' => $row->unit,
                        'timing' => $row->timing,
                    ];
                })->all(),
            ];
        })->all();

        return [[
            'sections' => $sections,
        ]];
    }
    private function activeDivisionIds(): array
    {
        return DB::connection('mysql3')
            ->table('tbldivision')
            ->whereNotNull('item_no')
            ->where('item_no', '<>', '')
            ->orderBy('division_name')
            ->pluck('division_id')
            ->filter(fn ($value) => $value !== null && $value !== '')
            ->map(fn ($value) => (string) $value)
            ->values()
            ->all();
    }

    private function serializeDivisionAssignments(OpcrItem $item, array $activeDivisionIds): array
    {
        $assigned = $this->serializeAssignedValues($item, 'division_id');

        if (! empty($activeDivisionIds)) {
            $assignedLookup = array_flip($assigned);
            $coversAll = true;

            foreach ($activeDivisionIds as $divisionId) {
                if (! array_key_exists((string) $divisionId, $assignedLookup)) {
                    $coversAll = false;
                    break;
                }
            }

            if ($coversAll && count($assigned) === count($activeDivisionIds)) {
                return ['all'];
            }
        }

        return $assigned;
    }

    private function serializeAssignedValues(OpcrItem $item, string $column): array
    {
        $assignments = $item->relationLoaded('assignments')
            ? $item->assignments
            : collect();

        return $assignments
            ->pluck($column)
            ->filter(fn ($value) => $value !== null && $value !== '')
            ->map(fn ($value) => (string) $value)
            ->unique()
            ->values()
            ->all();
    }
}












