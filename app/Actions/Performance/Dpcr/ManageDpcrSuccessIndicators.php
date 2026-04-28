<?php

namespace App\Actions\Performance\Dpcr;

use App\Models\DpcrAssignment;
use App\Models\DpcrItem;
use App\Models\DpcrRecord;
use App\Models\PerformanceRating;
use App\Models\Ppmp\Activity;
use App\Models\Ppmp\SubActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Lorisleiva\Actions\Concerns\AsAction;

class ManageDpcrSuccessIndicators
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user()?->can('HRIS_performance.dpcr.edit') ?? false;
    }

    public function store(Request $request, int $recordId)
    {
        abort_unless($request->user()?->can('HRIS_performance.dpcr.edit'), 403);

        $record = DpcrRecord::query()->findOrFail($recordId);

        $data = $request->validate([
            'source_opcr_item_id' => ['nullable', 'integer', 'exists:mysql2.opcr_items,id'],
            'activity_id' => ['required', 'integer', 'exists:mysql5.ppmp_activity,id'],
            'sub_activity_id' => ['required', 'integer', 'exists:mysql5.ppmp_sub_activity,id'],
            'performance_rating_id' => ['nullable', 'integer', 'exists:mysql2.performance_ratings,id'],
            'success_indicator_title' => ['required', 'string', 'max:2000'],
            'weight' => ['nullable', 'numeric'],
            'allocated_budget' => ['nullable', 'numeric'],
            'assignment_values' => ['nullable', 'array'],
            'assignment_values.*' => ['string'],
            'matrix_payload' => ['nullable', 'array'],
        ]);

        $subActivityMatches = SubActivity::query()
            ->where('id', $data['sub_activity_id'])
            ->where('activity_id', $data['activity_id'])
            ->exists();

        if (! $subActivityMatches) {
            throw ValidationException::withMessages([
                'sub_activity_id' => ['The selected sub-activity does not belong to the selected activity.'],
            ]);
        }

        $activity = Activity::query()->findOrFail($data['activity_id']);
        $subActivity = SubActivity::query()->findOrFail($data['sub_activity_id']);
        $rating = !empty($data['performance_rating_id'])
            ? PerformanceRating::query()->findOrFail((int) $data['performance_rating_id'])
            : null;
        $sortOrder = ((int) (DpcrItem::query()
            ->where('dpcr_record_id', $record->id)
            ->where('item_type', 'success_indicator')
            ->max('sort_order') ?? 0)) + 1;

        $successIndicator = DB::connection('mysql2')->transaction(function () use ($record, $data, $activity, $subActivity, $rating, $sortOrder, $request) {
            $item = DpcrItem::create([
                'dpcr_record_id' => $record->id,
                'source_opcr_item_id' => $data['source_opcr_item_id'] ?? null,
                'item_type' => 'success_indicator',
                'category_id' => null,
                'category_sort_order' => 0,
                'parent_item_id' => null,
                'item_level' => 1,
                'activity_id' => $activity->id,
                'sub_activity_id' => $subActivity->id,
                'performance_rating_id' => $rating?->id,
                'pap_id' => null,
                'pap_sort_order' => 0,
                'success_indicator_id' => null,
                'success_indicator_sort_order' => 0,
                'parent_pap_id' => null,
                'pap_title' => null,
                'success_indicator_title' => trim((string) $data['success_indicator_title']),
                'weight' => $this->nullableDecimal($data['weight'] ?? null),
                'allocated_budget' => $this->nullableDecimal($data['allocated_budget'] ?? null),
                'remarks' => null,
                'sort_order' => $sortOrder,
                'created_by' => $request->user()?->ipms_id,
                'updated_by' => $request->user()?->ipms_id,
            ]);

            $this->syncMatrixRows($item, $data['matrix_payload'] ?? [], $rating);

            $assignmentValues = collect($data['assignment_values'] ?? [])
                ->map(fn ($value) => trim((string) $value))
                ->filter()
                ->unique()
                ->values();

            $assignmentRows = [[
                'dpcr_record_id' => $record->id,
                'dpcr_item_id' => $item->id,
                'division_id' => $record->division_id,
                'group_id' => null,
                'emp_id' => null,
            ]];

            foreach ($assignmentValues as $assignmentValue) {
                [$kind, $rawId] = array_pad(explode(':', $assignmentValue, 2), 2, null);
                if (! $rawId) {
                    continue;
                }

                if ($kind === 'group') {
                    $assignmentRows[] = [
                        'dpcr_record_id' => $record->id,
                        'dpcr_item_id' => $item->id,
                        'division_id' => $record->division_id,
                        'group_id' => (int) $rawId,
                        'emp_id' => null,
                    ];
                } elseif ($kind === 'employee') {
                    $assignmentRows[] = [
                        'dpcr_record_id' => $record->id,
                        'dpcr_item_id' => $item->id,
                        'division_id' => $record->division_id,
                        'group_id' => null,
                        'emp_id' => (int) $rawId,
                    ];
                }
            }

            DB::connection('mysql2')
                ->table('dpcr_assignments')
                ->insert($assignmentRows);

            return $item->loadMissing(['activity:id,title', 'subActivity:id,title', 'assignments', 'rating:id,name,category']);
        });

        return response()->json([
            'message' => 'Success indicator saved successfully.',
            'record' => $this->formatItem($successIndicator),
        ]);
    }

    private function nullableDecimal($value): ?string
    {
        $text = trim((string) $value);
        return $text === '' ? null : $text;
    }

    private function syncMatrixRows(DpcrItem $item, array $payload, ?PerformanceRating $rating): void
    {
        DB::connection('mysql2')->table('dpcr_item_rating_rows')
            ->where('dpcr_item_id', $item->id)
            ->delete();

        if ($rating) {
            return;
        }

        $matrixRows = $this->flattenMatrixPayload($payload);
        if ($matrixRows === []) {
            return;
        }

        foreach ($matrixRows as $row) {
            DB::connection('mysql2')->table('dpcr_item_rating_rows')->insert([
                'dpcr_item_id' => $item->id,
                'success_indicator_id' => null,
                'rating_dimension' => $row['rating_dimension'],
                'score' => $row['score'],
                'enabled' => $row['enabled'],
                'condition_type' => $row['condition_type'],
                'condition_text' => $row['condition_text'],
                'meaning' => $row['meaning'],
                'value_from' => $row['value_from'],
                'value_to' => $row['value_to'],
                'unit' => $row['unit'],
                'timing' => $row['timing'],
                'sort_order' => $row['sort_order'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function flattenMatrixPayload(array $payload): array
    {
        $matrix = $payload[0] ?? null;
        if (! is_array($matrix) || ! isset($matrix['sections']) || ! is_array($matrix['sections'])) {
            return [];
        }

        $rows = [];

        foreach (array_values($matrix['sections']) as $sectionIndex => $section) {
            $dimension = strtoupper((string) ($section['rating_dimension'] ?? 'Q'));
            foreach (array_values($section['rows'] ?? []) as $rowIndex => $row) {
                $rows[] = [
                    'rating_dimension' => $dimension,
                    'score' => (int) ($row['score'] ?? (5 - $rowIndex)),
                    'enabled' => (bool) ($section['enabled'] ?? true),
                    'condition_type' => $row['condition_type'] ?? null,
                    'condition_text' => $row['condition_text'] ?? null,
                    'meaning' => $row['meaning'] ?? null,
                    'value_from' => $row['value_from'] ?? null,
                    'value_to' => $row['value_to'] ?? null,
                    'unit' => $row['unit'] ?? null,
                    'timing' => $row['timing'] ?? null,
                    'sort_order' => (($sectionIndex + 1) * 10) + $rowIndex,
                ];
            }
        }

        return $rows;
    }

    private function formatItem(DpcrItem $item): array
    {
        return [
            'id' => $item->id,
            'dpcr_record_id' => $item->dpcr_record_id,
            'item_type' => $item->item_type,
            'activity_id' => $item->activity_id,
            'activity_title' => $item->activity?->title,
            'sub_activity_id' => $item->sub_activity_id,
            'sub_activity_title' => $item->subActivity?->title,
            'performance_rating_id' => $item->performance_rating_id,
            'rating_rows' => $this->loadMatrixPayload($item),
            'success_indicator_title' => $item->success_indicator_title,
            'weight' => $item->weight,
            'allocated_budget' => $item->allocated_budget,
            'group_assignments' => $item->assignments->pluck('group_id')->filter()->map(fn ($value) => (string) $value)->values()->all(),
            'employee_assignments' => $item->assignments->pluck('emp_id')->filter()->map(fn ($value) => (string) $value)->values()->all(),
            'division_assignments' => $item->assignments->pluck('division_id')->filter()->map(fn ($value) => (string) $value)->values()->all(),
            'sort_order' => $item->sort_order,
        ];
    }

    private function loadMatrixPayload(DpcrItem $item): array
    {
        if ($item->performance_rating_id) {
            $ratingRows = DB::connection('mysql2')
                ->table('performance_rating_rows')
                ->where('performance_rating_id', $item->performance_rating_id)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get();

            if ($ratingRows->isNotEmpty()) {
                return $this->buildMatrixPayloadFromRows($ratingRows);
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

        return $this->buildMatrixPayloadFromRows($rows);
    }

    private function buildMatrixPayloadFromRows($rows): array
    {
        $sections = collect(['Q', 'E', 'T'])->map(function ($dimension) use ($rows) {
            $dimensionRows = $rows->where('rating_dimension', $dimension)->values();

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
}
