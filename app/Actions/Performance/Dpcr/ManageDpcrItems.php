<?php

namespace App\Actions\Performance\Dpcr;

use App\Models\DpcrItem;
use App\Models\DpcrRecord;
use App\Models\DpcrItem as DpcrSuccessIndicatorItem;
use App\Models\Ppmp\Activity;
use App\Models\Ppmp\SubActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Lorisleiva\Actions\Concerns\AsAction;

class ManageDpcrItems
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user()?->can('HRIS_performance.dpcr.edit') ?? false;
    }

    public function store(Request $request, int $recordId, int $parentItemId)
    {
        abort_unless($request->user()?->can('HRIS_performance.dpcr.edit'), 403);

        $record = DpcrRecord::query()->findOrFail($recordId);
        $parentItem = DpcrSuccessIndicatorItem::query()
            ->where('id', $parentItemId)
            ->where('dpcr_record_id', $record->id)
            ->where('item_type', 'success_indicator')
            ->firstOrFail();

        $data = $request->validate([
            'activity_id' => ['required', 'integer', 'exists:mysql5.ppmp_activity,id'],
            'sub_activity_id' => ['required', 'integer', 'exists:mysql5.ppmp_sub_activity,id'],
            'specific_activity_output' => ['required', 'string', 'max:2000'],
            'assignment_values' => ['nullable', 'array'],
            'assignment_values.*' => ['string'],
            'target_jan' => ['nullable', 'numeric'],
            'target_feb' => ['nullable', 'numeric'],
            'target_mar' => ['nullable', 'numeric'],
            'target_apr' => ['nullable', 'numeric'],
            'target_may' => ['nullable', 'numeric'],
            'target_jun' => ['nullable', 'numeric'],
            'target_jul' => ['nullable', 'numeric'],
            'target_aug' => ['nullable', 'numeric'],
            'target_sep' => ['nullable', 'numeric'],
            'target_oct' => ['nullable', 'numeric'],
            'target_nov' => ['nullable', 'numeric'],
            'target_dec' => ['nullable', 'numeric'],
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
        $sortOrder = ((int) (DpcrItem::query()
            ->where('dpcr_record_id', $record->id)
            ->where('parent_item_id', $parentItem->id)
            ->max('sort_order') ?? 0)) + 1;

        $specificItem = DB::connection('mysql2')->transaction(function () use ($record, $parentItem, $data, $activity, $subActivity, $sortOrder, $request) {
            $item = DpcrItem::create([
                'dpcr_record_id' => $record->id,
                'source_opcr_item_id' => $parentItem->source_opcr_item_id,
                'item_type' => 'specific_activity',
                'category_id' => $parentItem->category_id,
                'category_sort_order' => $parentItem->category_sort_order,
                'parent_item_id' => $parentItem->id,
                'item_level' => ((int) $parentItem->item_level) + 1,
                'activity_id' => $activity->id,
                'sub_activity_id' => $subActivity->id,
                'specific_activity_output' => trim((string) $data['specific_activity_output']),
                'pap_id' => $parentItem->pap_id,
                'pap_sort_order' => $parentItem->pap_sort_order,
                'success_indicator_id' => $parentItem->success_indicator_id,
                'success_indicator_sort_order' => $parentItem->success_indicator_sort_order,
                'pap_title' => $parentItem->pap_title,
                'success_indicator_title' => $parentItem->success_indicator_title,
                'target_jan' => $this->nullableDecimal($data['target_jan'] ?? null),
                'target_feb' => $this->nullableDecimal($data['target_feb'] ?? null),
                'target_mar' => $this->nullableDecimal($data['target_mar'] ?? null),
                'target_apr' => $this->nullableDecimal($data['target_apr'] ?? null),
                'target_may' => $this->nullableDecimal($data['target_may'] ?? null),
                'target_jun' => $this->nullableDecimal($data['target_jun'] ?? null),
                'target_jul' => $this->nullableDecimal($data['target_jul'] ?? null),
                'target_aug' => $this->nullableDecimal($data['target_aug'] ?? null),
                'target_sep' => $this->nullableDecimal($data['target_sep'] ?? null),
                'target_oct' => $this->nullableDecimal($data['target_oct'] ?? null),
                'target_nov' => $this->nullableDecimal($data['target_nov'] ?? null),
                'target_dec' => $this->nullableDecimal($data['target_dec'] ?? null),
                'weight' => null,
                'allocated_budget' => null,
                'remarks' => null,
                'sort_order' => $sortOrder,
                'created_by' => $request->user()?->ipms_id,
                'updated_by' => $request->user()?->ipms_id,
            ]);

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

            return $item->loadMissing(['activity:id,title', 'subActivity:id,title', 'assignments']);
        });

        return response()->json([
            'message' => 'Specific activity/output saved successfully.',
            'record' => $this->formatItem($specificItem),
        ]);
    }

    private function nullableDecimal($value): ?string
    {
        $text = trim((string) $value);
        return $text === '' ? null : $text;
    }

    private function formatItem(DpcrItem $item): array
    {
        return [
            'id' => $item->id,
            'dpcr_record_id' => $item->dpcr_record_id,
            'parent_item_id' => $item->parent_item_id,
            'activity_id' => $item->activity_id,
            'activity_title' => $item->activity?->title,
            'sub_activity_id' => $item->sub_activity_id,
            'sub_activity_title' => $item->subActivity?->title,
            'specific_activity_output' => $item->specific_activity_output,
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
            'group_assignments' => $item->assignments->pluck('group_id')->filter()->map(fn ($value) => (string) $value)->values()->all(),
            'employee_assignments' => $item->assignments->pluck('emp_id')->filter()->map(fn ($value) => (string) $value)->values()->all(),
            'division_assignments' => $item->assignments->pluck('division_id')->filter()->map(fn ($value) => (string) $value)->values()->all(),
            'sort_order' => $item->sort_order,
        ];
    }
}
