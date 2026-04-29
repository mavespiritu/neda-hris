<?php

namespace App\Actions\Performance;

use App\Models\OpcrItem;
use App\Models\OpcrRecord;
use App\Models\DpcrItem;
use App\Models\DpcrRecord;
use App\Models\PerformanceCategory;
use App\Models\PerformancePap;
use App\Models\PerformanceRating;
use App\Models\PerformanceSuccessIndicator;
use App\States\Opcr\Draft;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowDpcr
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user()?->can('HRIS_performance.dpcr.page.view') ?? false;
    }

    public function asController(Request $request): Response
    {
        $connection = DB::connection('mysql2');
        $frequency = strtolower((string) ($connection->table('settings')
            ->where('title', 'OPCR Frequency')
            ->value('value') ?: 'yearly'));

        $latestPeriod = $this->latestAvailablePeriod();
        $selectedYear = (int) $request->query('year', $latestPeriod['year'] ?? now()->year);
        $selectedSemester = $frequency === 'semestral'
            ? max(1, min(2, (int) $request->query('semester', $latestPeriod['semester'] ?? 1)))
            : null;

        $canViewAny = $request->user()?->can('HRIS_performance.dpcr.view.any') ?? false;
        $activeDivisionIds = $this->activeDivisionIds();
        $selectedDivisionId = $this->resolveSelectedDivisionId($request, $canViewAny, $activeDivisionIds);
        $selectedDivisionName = $this->divisionNameById($selectedDivisionId) ?? 'Division';
        $divisionOptions = $this->divisionOptions($canViewAny, $selectedDivisionId, $activeDivisionIds);

        $sourceOpcrRecord = $this->ensureSelectedRecordExists($request, $selectedYear, $selectedSemester, $frequency);
        $dpcrRecord = $this->ensureDpcrRecordExists(
            $request,
            $sourceOpcrRecord,
            $selectedYear,
            $selectedSemester,
            $frequency,
            $selectedDivisionId,
            $selectedDivisionName
        );

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

        $serializedRecord = $this->serializeRecord(
            $sourceOpcrRecord->load([
                'items' => fn ($query) => $query->with(['pap.identifier.subProgram.program'])->orderBy('category_sort_order')->orderBy('pap_sort_order')->orderBy('sort_order')->orderBy('id'),
            ]),
            $categoryTitlesById,
            $activeDivisionIds
        );

        $filteredItems = $this->filterItemsForDivision($serializedRecord['items'], $selectedDivisionId);
        $filteredOpcrRecordPayload = [
            ...$serializedRecord,
            'source_opcr_record_id' => $sourceOpcrRecord->id,
            'title' => $sourceOpcrRecord->title,
            'items' => ! empty($filteredItems) ? $filteredItems : $serializedRecord['items'],
        ];
        $selectedSuccessIndicators = $this->serializeDpcrSuccessIndicators($dpcrRecord);
        $selectedRecordPayload = [
            ...$serializedRecord,
            'id' => $dpcrRecord->id,
            'source_opcr_record_id' => $sourceOpcrRecord->id,
            'division_id' => $selectedDivisionId,
            'title' => $this->buildDpcrTitle($selectedYear, $selectedSemester, $selectedDivisionName),
            'state' => $dpcrRecord->state?->label() ?: $dpcrRecord->getRawOriginal('state') ?: 'Draft',
            'state_remarks' => $dpcrRecord->state_remarks,
            'created_by' => $dpcrRecord->created_by,
            'updated_by' => $dpcrRecord->updated_by,
            'created_at' => optional($dpcrRecord->created_at)?->toDateTimeString(),
            'updated_at' => optional($dpcrRecord->updated_at)?->toDateTimeString(),
            'items' => $selectedSuccessIndicators,
            'specific_activities' => $this->serializeSpecificActivities($dpcrRecord),
        ];

        return Inertia::render('Performance/Dpcr/index', [
            'sourceRecord' => $filteredOpcrRecordPayload,
            'selectedRecord' => $selectedRecordPayload,
            'dpcrRecordId' => $dpcrRecord->id,
            'selectedYear' => $selectedYear,
            'selectedSemester' => $selectedSemester,
            'frequency' => $frequency === 'semestral' ? 'semestral' : 'yearly',
            'libraryOptions' => [
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
            ],
            'categories' => $categories,
            'selectedDivision' => $selectedDivisionId ? [
                'value' => (string) $selectedDivisionId,
                'label' => (string) $selectedDivisionId,
            ] : null,
            'selectedDivisionName' => $selectedDivisionName,
            'divisionOptions' => $divisionOptions,
            'canViewAny' => $canViewAny,
            'summary' => [
                'item_count' => count($selectedSuccessIndicators),
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
            ? sprintf('DPCR %d - %s', $year, $periodNo === 2 ? '2nd Semester' : '1st Semester')
            : sprintf('DPCR %d', $year);

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

    private function ensureDpcrRecordExists(
        Request $request,
        OpcrRecord $sourceOpcrRecord,
        int $year,
        ?int $semester,
        string $frequency,
        ?string $divisionId,
        string $divisionName
    ): DpcrRecord {
        $periodType = $frequency === 'semestral' ? 'semestral' : 'yearly';
        $periodNo = $periodType === 'semestral' ? max(1, min(2, (int) ($semester ?? 1))) : null;

        $query = DpcrRecord::query()
            ->where('year', $year)
            ->where('period_type', $periodType)
            ->where('source_opcr_record_id', $sourceOpcrRecord->id);

        if ($periodType === 'semestral') {
            $query->where('period_no', $periodNo);
        }

        if ($divisionId !== null && $divisionId !== '') {
            $query->where('division_id', $divisionId);
        }

        $record = $query->first();

        if ($record) {
            return $record;
        }

        $record = DpcrRecord::create([
            'source_opcr_record_id' => $sourceOpcrRecord->id,
            'division_id' => $divisionId,
            'year' => $year,
            'period_type' => $periodType,
            'period_no' => $periodNo,
            'title' => $this->buildDpcrTitle($year, $semester, $divisionName),
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

    private function resolveSelectedDivisionId(Request $request, bool $canViewAny, array $activeDivisionIds): ?string
    {
        $userDivision = $request->user()?->division ? (string) $request->user()->division : null;

        if (! $canViewAny) {
            return $userDivision;
        }

        $requestedDivision = trim((string) $request->query('division', $userDivision ?? ''));
        if ($requestedDivision !== '' && in_array($requestedDivision, $activeDivisionIds, true)) {
            return $requestedDivision;
        }

        if ($userDivision && in_array($userDivision, $activeDivisionIds, true)) {
            return $userDivision;
        }

        return $activeDivisionIds[0] ?? $userDivision;
    }

    private function divisionNameById(?string $divisionId): ?string
    {
        if (! $divisionId) {
            return null;
        }

        return DB::connection('mysql3')
            ->table('tbldivision')
            ->where('division_id', $divisionId)
            ->value('division_name');
    }

    private function divisionOptions(bool $canViewAny, ?string $selectedDivisionId, array $activeDivisionIds): array
    {
        $query = DB::connection('mysql3')
            ->table('tbldivision')
            ->select(['division_id', 'division_name', 'item_no'])
            ->whereNotNull('item_no')
            ->where('item_no', '<>', '');

        if (! $canViewAny && $selectedDivisionId) {
            $query->where('division_id', $selectedDivisionId);
        } elseif (! empty($activeDivisionIds)) {
            $query->whereIn('division_id', $activeDivisionIds);
        }

        return $query
            ->orderBy('division_name')
            ->get()
            ->map(fn ($division) => [
                'value' => (string) $division->division_id,
                'label' => (string) $division->division_id,
                'item_no' => $division->item_no,
            ])
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

    private function serializeSpecificActivities(DpcrRecord $record): array
    {
        return DpcrItem::query()
            ->with(['activity:id,title', 'subActivity:id,title', 'assignments'])
            ->where('dpcr_record_id', $record->id)
            ->where('item_type', 'specific_activity')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(function (DpcrItem $item) {
                return [
                    'id' => $item->id,
                    'parent_item_id' => $item->parent_item_id,
                    'activity_id' => $item->activity_id,
                    'activity_title' => $item->activity?->title,
                    'sub_activity_id' => $item->sub_activity_id,
                    'sub_activity_title' => $item->subActivity?->title,
                    'specific_activity_output' => $item->specific_activity_output,
                    'unit_of_measure' => $item->unit_of_measure,
                    'target_plan' => $item->target_plan,
                    'target_jan' => $item->target_jan,
                    'target_feb' => $item->target_feb,
                    'target_mar' => $item->target_mar,
                    'target_apr' => $item->target_apr,
                    'target_may' => $item->target_may,
                    'target_jun' => $item->target_jun,
                    'target_jul' => $item->target_jul,
                    'target_aug' => $item->target_aug,
                    'target_sep' => $item->target_sep,
                    'target_oct' => $item->target_oct,
                    'target_nov' => $item->target_nov,
                    'target_dec' => $item->target_dec,
                    'division_assignments' => $item->assignments->pluck('division_id')->filter()->map(fn ($value) => (string) $value)->values()->all(),
                    'group_assignments' => $item->assignments->pluck('group_id')->filter()->map(fn ($value) => (string) $value)->values()->all(),
                    'employee_assignments' => $item->assignments->pluck('emp_id')->filter()->map(fn ($value) => (string) $value)->values()->all(),
                    'sort_order' => $item->sort_order,
                ];
            })
            ->values()
            ->all();
    }

    private function serializeDpcrSuccessIndicators(DpcrRecord $record): array
    {
        return DpcrItem::query()
            ->with(['activity:id,title', 'subActivity:id,title', 'assignments'])
            ->where('dpcr_record_id', $record->id)
            ->where('item_type', 'success_indicator')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(function (DpcrItem $item) {
                return [
                    'id' => $item->id,
                    'source_opcr_item_id' => $item->source_opcr_item_id,
                    'item_type' => $item->item_type,
                    'activity_id' => $item->activity_id,
                    'activity_title' => $item->activity?->title,
                    'sub_activity_id' => $item->sub_activity_id,
                    'sub_activity_title' => $item->subActivity?->title,
                    'performance_rating_id' => $item->performance_rating_id,
                    'rating_rows' => $this->loadDpcrMatrixPayload($item),
                    'success_indicator_title' => $item->success_indicator_title,
                    'weight' => $item->weight,
                    'allocated_budget' => $item->allocated_budget,
                    'division_assignments' => $item->assignments->pluck('division_id')->filter()->map(fn ($value) => (string) $value)->values()->all(),
                    'group_assignments' => $item->assignments->pluck('group_id')->filter()->map(fn ($value) => (string) $value)->values()->all(),
                    'employee_assignments' => $item->assignments->pluck('emp_id')->filter()->map(fn ($value) => (string) $value)->values()->all(),
                    'sort_order' => $item->sort_order,
                ];
            })
            ->values()
            ->all();
    }

    private function loadDpcrMatrixPayload(DpcrItem $item): array
    {
        if ($item->performance_rating_id) {
            $ratingRows = DB::connection('mysql2')
                ->table('performance_rating_rows')
                ->where('performance_rating_id', $item->performance_rating_id)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get();

            if ($ratingRows->isNotEmpty()) {
                return $this->buildDpcrMatrixPayloadFromRows($ratingRows);
            }
        }

        $rows = DB::connection('mysql2')
            ->table('dpcr_item_rating_rows')
            ->where('dpcr_item_id', $item->id)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        if ($rows->isEmpty()) {
            return [];
        }

        return $this->buildDpcrMatrixPayloadFromRows($rows);
    }

    private function buildDpcrMatrixPayloadFromRows($rows): array
    {
        $sections = collect(['Q', 'E', 'T'])->map(function ($dimension) use ($rows) {
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

    private function filterItemsForDivision(iterable $items, ?string $divisionId): array
    {
        if (! $divisionId) {
            return [];
        }

        $flatItems = collect($items)->values();
        $itemsById = $flatItems->keyBy(fn ($item) => (string) ($item['id'] ?? ''));
        $requiredIds = [];

        foreach ($flatItems as $item) {
            if (! $this->itemMatchesDivision($item, $divisionId)) {
                continue;
            }

            $current = $item;

            while ($current) {
                $currentId = (string) ($current['id'] ?? '');
                if ($currentId === '' || isset($requiredIds[$currentId])) {
                    break;
                }

                $requiredIds[$currentId] = true;

                $parentId = $current['parent_item_id'] ?? null;
                if (! $parentId) {
                    break;
                }

                $current = $itemsById->get((string) $parentId);
            }
        }

        return $flatItems
            ->filter(fn ($item) => isset($requiredIds[(string) ($item['id'] ?? '')]))
            ->values()
            ->all();
    }

    private function itemMatchesDivision(array $item, string $divisionId): bool
    {
        $assignments = collect($item['division_assignments'] ?? [])
            ->map(fn ($value) => (string) $value)
            ->filter()
            ->values()
            ->all();

        return in_array('all', $assignments, true) || in_array((string) $divisionId, $assignments, true);
    }

    private function buildDpcrTitle(int $year, ?int $semester, string $divisionName): string
    {
        $base = $semester
            ? sprintf('DPCR %d - %s', $year, $semester === 2 ? '2nd Semester' : '1st Semester')
            : sprintf('DPCR %d', $year);

        return trim(sprintf('%s - %s', $base, $divisionName));
    }

    private function latestAvailablePeriod(): array
    {
        $record = OpcrRecord::query()
            ->select(['year', 'period_no'])
            ->orderByDesc('year')
            ->orderByRaw('COALESCE(period_no, 0) DESC')
            ->first();

        return [
            'year' => $record?->year ? (int) $record->year : now()->year,
            'semester' => $record?->period_no ? (int) $record->period_no : 1,
        ];
    }
}
