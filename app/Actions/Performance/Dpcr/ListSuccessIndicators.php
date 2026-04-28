<?php

namespace App\Actions\Performance\Dpcr;

use App\Models\DpcrItem;
use App\Models\DpcrRecord;
use App\Models\Ppmp\Activity;
use App\Models\Ppmp\SubActivity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Lorisleiva\Actions\Concerns\AsAction;

class ListSuccessIndicators
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user()?->can('HRIS_performance.dpcr.page.view') ?? false;
    }

    public function asController(Request $request): JsonResponse
    {
        $recordId = (int) $request->query('recordId', 0);
        $search = trim((string) $request->query('search', ''));

        $record = DpcrRecord::query()->findOrFail($recordId);

        $query = DpcrItem::query()
            ->with(['activity:id,title', 'subActivity:id,title', 'assignments'])
            ->where('dpcr_record_id', $record->id)
            ->where('item_type', 'success_indicator')
            ->orderBy('sort_order')
            ->orderBy('id');

        if ($search !== '') {
            $activityIds = Activity::query()
                ->where('title', 'like', "%{$search}%")
                ->pluck('id')
                ->all();

            $subActivityIds = SubActivity::query()
                ->where('title', 'like', "%{$search}%")
                ->pluck('id')
                ->all();

            $query->where(function ($builder) use ($search, $activityIds, $subActivityIds) {
                $builder->where('success_indicator_title', 'like', "%{$search}%")
                    ->when(! empty($activityIds), fn ($subQuery) => $subQuery->orWhereIn('activity_id', $activityIds))
                    ->when(! empty($subActivityIds), fn ($subQuery) => $subQuery->orWhereIn('sub_activity_id', $subActivityIds));
            });
        }

        return response()->json(
            $query->get()->map(function (DpcrItem $item) {
                $activity = $item->activity?->title ?? '';
                $subActivity = $item->subActivity?->title ?? '';

                return [
                    'value' => (string) $item->id,
                    'label' => trim(implode(' - ', array_filter([
                        $item->success_indicator_title,
                        $activity,
                        $subActivity,
                    ]))) ?: ($item->success_indicator_title ?: 'Success Indicator'),
                    'id' => $item->id,
                    'source_opcr_item_id' => $item->source_opcr_item_id,
                    'activity_id' => $item->activity_id,
                    'activity_title' => $activity,
                    'sub_activity_id' => $item->sub_activity_id,
                    'sub_activity_title' => $subActivity,
                    'performance_rating_id' => $item->performance_rating_id,
                    'rating_rows' => $this->loadMatrixPayload($item),
                    'success_indicator_title' => $item->success_indicator_title,
                    'weight' => $item->weight,
                    'allocated_budget' => $item->allocated_budget,
                    'group_assignments' => $item->assignments->pluck('group_id')->filter()->map(fn ($value) => (string) $value)->values()->all(),
                    'employee_assignments' => $item->assignments->pluck('emp_id')->filter()->map(fn ($value) => (string) $value)->values()->all(),
                    'division_assignments' => $item->assignments->pluck('division_id')->filter()->map(fn ($value) => (string) $value)->values()->all(),
                ];
            })->values()
        );
    }

    private function loadMatrixPayload(DpcrItem $item): array
    {
        if ($item->performance_rating_id) {
            $ratingRows = \DB::connection('mysql2')
                ->table('performance_rating_rows')
                ->where('performance_rating_id', $item->performance_rating_id)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get();

            if ($ratingRows->isNotEmpty()) {
                return $this->buildMatrixPayloadFromRows($ratingRows);
            }
        }

        $rows = \DB::connection('mysql2')
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
