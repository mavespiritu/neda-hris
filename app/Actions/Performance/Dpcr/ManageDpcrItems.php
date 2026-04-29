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

    private const MONTH_ORDER = [
        'jan' => 0,
        'feb' => 1,
        'mar' => 2,
        'apr' => 3,
        'may' => 4,
        'jun' => 5,
        'jul' => 6,
        'aug' => 7,
        'sep' => 8,
        'oct' => 9,
        'nov' => 10,
        'dec' => 11,
    ];

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
            'target_plan' => ['required', 'array', 'min:1'],
            'target_plan.*.months' => ['required', 'array', 'min:1'],
            'target_plan.*.months.*' => ['string', 'in:jan,feb,mar,apr,may,jun,jul,aug,sep,oct,nov,dec'],
            'target_plan.*.target_mode' => ['required', 'string', 'in:group,individual'],
            'target_plan.*.target_value' => ['nullable', 'string', 'max:2000'],
            'target_plan.*.target_frequency' => ['nullable', 'string', 'in:every_minute,every_hour,daily,weekly,bi_monthly,monthly,semestral'],
            'target_plan.*.unit_of_measure' => ['nullable', 'string', 'max:255'],
            'target_plan.*.as_need_arises' => ['sometimes', 'boolean'],
            'assignment_values' => ['nullable', 'array'],
            'assignment_values.*' => ['string'],
        ]);

        foreach (($data['target_plan'] ?? []) as $index => $row) {
            $months = $this->normalizeMonths($row['months'] ?? []);
            $startIndex = $this->monthIndex($months[0] ?? null);
            $endIndex = $this->monthIndex($months[count($months) - 1] ?? null);
            $targetMode = (string) ($row['target_mode'] ?? 'group');

            if (! $months || $startIndex === null || $endIndex === null || $endIndex < $startIndex) {
                throw ValidationException::withMessages([
                    "target_plan.$index.months" => ['The month range must be contiguous and ordered from left to right.'],
                ]);
            }

            if ($targetMode === 'group' && ! $this->isContiguousMonths($months)) {
                throw ValidationException::withMessages([
                    "target_plan.$index.months" => ['The month range must be contiguous and ordered from left to right.'],
                ]);
            }

            if (! (bool) ($row['as_need_arises'] ?? false)) {
                if (trim((string) ($row['target_value'] ?? '')) === '') {
                    throw ValidationException::withMessages([
                        "target_plan.$index.target_value" => ['The target value is required when the target is not marked as need arises.'],
                    ]);
                }

                if (trim((string) ($row['unit_of_measure'] ?? '')) === '') {
                    throw ValidationException::withMessages([
                        "target_plan.$index.unit_of_measure" => ['The unit of measure is required when the target is not marked as need arises.'],
                    ]);
                }
            }
        }

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
                'target_plan' => array_values(array_map(function (array $row) {
                    $months = $this->normalizeMonths($row['months'] ?? []);
                    $startMonth = $months[0] ?? null;
                    $endMonth = $months[count($months) - 1] ?? null;
                    $rowTargetMode = (string) ($row['target_mode'] ?? 'group');

                    return [
                        'months' => $months,
                        'start_month' => $startMonth,
                        'end_month' => $endMonth,
                        'target_mode' => $rowTargetMode === 'individual' ? 'individual' : 'group',
                        'target_value' => trim((string) $row['target_value']),
                        'target_frequency' => trim((string) ($row['target_frequency'] ?? '')),
                        'unit_of_measure' => trim((string) $row['unit_of_measure']),
                        'as_need_arises' => (bool) ($row['as_need_arises'] ?? false),
                    ];
                }, $data['target_plan'] ?? [])),
                'pap_id' => $parentItem->pap_id,
                'pap_sort_order' => $parentItem->pap_sort_order,
                'success_indicator_id' => $parentItem->success_indicator_id,
                'success_indicator_sort_order' => $parentItem->success_indicator_sort_order,
                'pap_title' => $parentItem->pap_title,
                'success_indicator_title' => $parentItem->success_indicator_title,
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
            'target_plan' => $item->target_plan,
            'group_assignments' => $item->assignments->pluck('group_id')->filter()->map(fn ($value) => (string) $value)->values()->all(),
            'employee_assignments' => $item->assignments->pluck('emp_id')->filter()->map(fn ($value) => (string) $value)->values()->all(),
            'division_assignments' => $item->assignments->pluck('division_id')->filter()->map(fn ($value) => (string) $value)->values()->all(),
            'sort_order' => $item->sort_order,
        ];
    }

    private function monthIndex($value): ?int
    {
        $month = strtolower(trim((string) $value));
        return self::MONTH_ORDER[$month] ?? null;
    }

    private function normalizeMonths(array $months): array
    {
        return collect($months)
            ->map(fn ($value) => strtolower(trim((string) $value)))
            ->filter(fn ($value) => array_key_exists($value, self::MONTH_ORDER))
            ->unique()
            ->sortBy(fn ($value) => self::MONTH_ORDER[$value])
            ->values()
            ->all();
    }

    private function isContiguousMonths(array $months): bool
    {
        $normalized = $this->normalizeMonths($months);

        for ($index = 1; $index < count($normalized); $index += 1) {
            if (($this->monthIndex($normalized[$index]) ?? -1) !== (($this->monthIndex($normalized[$index - 1]) ?? -2) + 1)) {
                return false;
            }
        }

        return ! empty($normalized);
    }
}
