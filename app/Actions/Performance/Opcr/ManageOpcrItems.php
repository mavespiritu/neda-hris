<?php

namespace App\Actions\Performance\Opcr;

use App\Models\OpcrAssignment;
use App\Models\OpcrItem;
use App\Models\OpcrRecord;
use App\Models\PerformanceCategory;
use App\Models\PerformancePap;
use App\Models\PerformanceSuccessIndicator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Lorisleiva\Actions\Concerns\AsAction;

class ManageOpcrItems
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('opcr', 'performance');
    }

    public function store(Request $request, int $recordId)
    {
        $record = OpcrRecord::query()->findOrFail($recordId);
        $data = $this->validatePayload($request);
        $payload = $this->buildPayload($data);

        $payload['opcr_record_id'] = $record->id;
        $payload['sort_order'] = $this->resolveSortOrder($record, $data['sort_order'] ?? null);
        $payload['created_by'] = $request->user()?->ipms_id;
        $payload['updated_by'] = $request->user()?->ipms_id;

        OpcrItem::create($payload);

        return redirect()->route('opcrs.index', $this->periodQuery($record))
            ->with([
                'status' => 'success',
                'title' => 'Saved',
                'message' => 'OPCR item added successfully.',
            ]);
    }

    public function update(Request $request, int $id)
    {
        $item = OpcrItem::query()->with('record')->findOrFail($id);
        $data = $this->validatePayload($request);
        $payload = $this->buildPayload($data);

        $payload['sort_order'] = $this->resolveSortOrder($item->record, $data['sort_order'] ?? null, $item->sort_order);
        $payload['updated_by'] = $request->user()?->ipms_id;

        $item->update($payload);

        return redirect()->route('opcrs.index', $this->periodQuery($item->record))
            ->with([
                'status' => 'success',
                'title' => 'Updated',
                'message' => 'OPCR item updated successfully.',
            ]);
    }

    public function reorder(Request $request, int $recordId)
    {
        $record = OpcrRecord::query()->findOrFail($recordId);
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:mysql2.opcr_items,id'],
        ]);

        $orderedIds = collect($data['ids'])->map(fn ($id) => (int) $id)->values();

        DB::connection('mysql2')->transaction(function () use ($record, $orderedIds, $request) {
            $items = $record->items()
                ->whereIn('id', $orderedIds)
                ->get()
                ->keyBy(fn (OpcrItem $item) => (int) $item->id);

            if ($items->count() !== $orderedIds->count()) {
                throw ValidationException::withMessages([
                    'ids' => ['The selected items must belong to the current OPCR record.'],
                ]);
            }

            foreach ($orderedIds as $index => $id) {
                $item = $items->get($id);

                if (! $item) {
                    continue;
                }

                $position = $index + 1;

                $item->update([
                    'category_sort_order' => $position,
                    'pap_sort_order' => $position,
                    'sort_order' => $position,
                    'updated_by' => $request->user()?->ipms_id,
                ]);
            }
        });

        return response()->json([
            'message' => 'OPCR items reordered successfully.',
        ]);
    }

    public function destroy(int $id)
    {
        $item = OpcrItem::query()->with('record')->findOrFail($id);
        $record = $item->record;

        DB::connection('mysql2')
            ->table('opcr_assignments')
            ->where('opcr_item_id', $item->id)
            ->delete();

        $item->delete();

        return redirect()->route('opcrs.index', $this->periodQuery($record))
            ->with([
                'status' => 'success',
                'title' => 'Deleted',
                'message' => 'OPCR item deleted successfully.',
            ]);
    }

    public function syncTree(Request $request, int $recordId)
    {
        $record = OpcrRecord::query()->findOrFail($recordId);
        $activeDivisionIds = $this->resolveActiveDivisionIds();

        $data = $request->validate([
            'nodes' => ['required', 'array', 'min:1'],
            'nodes.*.id' => ['required'],
            'nodes.*.weight' => ['nullable'],
            'nodes.*.amount' => ['nullable'],
            'nodes.*.allocated_budget' => ['nullable'],
            'nodes.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'nodes.*.paps' => ['nullable', 'array'],
        ]);

        $this->validateTreeCapacityNodes($data['nodes']);

        DB::connection('mysql2')->transaction(function () use ($record, $data, $request, $activeDivisionIds) {
            DB::connection('mysql2')
                ->table('opcr_assignments')
                ->where('opcr_record_id', $record->id)
                ->delete();

            $record->items()->delete();

            foreach (array_values($data['nodes']) as $index => $categoryNode) {
                $categoryItem = $this->createTreeCategoryItem($record, $categoryNode, $index + 1, $request);
                $this->syncTreePaps($record, $categoryNode, $categoryItem, $categoryNode['paps'] ?? [], $request, 2, $activeDivisionIds);
            }
        });

        return response()->json([
            'message' => 'OPCR tree saved successfully.',
        ]);
    }

    private function createTreeCategoryItem(OpcrRecord $record, array $categoryNode, int $position, Request $request): OpcrItem
    {
        return OpcrItem::create([
            'opcr_record_id' => $record->id,
            'item_type' => 'category',
            'category_id' => (int) $categoryNode['id'],
            'category_sort_order' => $position,
            'parent_item_id' => null,
            'item_level' => 1,
            'pap_id' => null,
            'pap_sort_order' => 0,
            'success_indicator_id' => null,
            'success_indicator_sort_order' => 0,
                'pap_title' => null,
            'success_indicator_title' => null,
            'weight' => $this->nullableDecimal($categoryNode['weight'] ?? null),
            'allocated_budget' => $this->nullableDecimal($categoryNode['amount'] ?? $categoryNode['allocated_budget'] ?? null),
            'remarks' => null,
            'sort_order' => $this->resolveNodeSortOrder($categoryNode, $position),
            'created_by' => $request->user()?->ipms_id,
            'updated_by' => $request->user()?->ipms_id,
        ]);
    }

    private function syncTreePaps(
        OpcrRecord $record,
        array $categoryNode,
        OpcrItem $parentItem,
        array $paps,
        Request $request,
        int $level,
        array $activeDivisionIds
    ): void {
        foreach (array_values($paps) as $index => $papNode) {
            $papItem = OpcrItem::create([
                'opcr_record_id' => $record->id,
                'item_type' => 'pap',
                'category_id' => (int) $categoryNode['id'],
                'category_sort_order' => $parentItem->category_sort_order,
                'parent_item_id' => $parentItem->id,
                'item_level' => $level,
                'pap_id' => $this->resolveNodeId($papNode),
                'pap_sort_order' => $index + 1,
                'success_indicator_id' => null,
                'success_indicator_sort_order' => 0,
                'pap_title' => $this->nullableString($papNode['label'] ?? $papNode['activity'] ?? $papNode['title'] ?? null),
                'success_indicator_title' => null,
                'weight' => $this->nullableDecimal($papNode['weight'] ?? null),
                'allocated_budget' => $this->nullableDecimal($papNode['amount'] ?? $papNode['allocated_budget'] ?? null),
                'remarks' => null,
                'sort_order' => $this->resolveNodeSortOrder($papNode, $index + 1),
                'created_by' => $request->user()?->ipms_id,
                'updated_by' => $request->user()?->ipms_id,
            ]);

            $this->syncTreeSuccessIndicators($record, $categoryNode, $papItem, $papNode['successIndicators'] ?? $papNode['success_indicators'] ?? [], $request, $level + 1, $activeDivisionIds);
        }
    }

    private function validateTreeCapacityNodes(array $nodes, string $pathPrefix = ''): void
    {
        foreach (array_values($nodes) as $index => $node) {
            if (! is_array($node)) {
                continue;
            }

            $path = $pathPrefix === '' ? (string) ($index + 1) : $pathPrefix . '.' . ($index + 1);
            $this->validateTreeNodeCapacity($node, $path);

            $children = $node['paps'] ?? $node['children'] ?? [];
            if (is_array($children) && ! empty($children)) {
                $this->validateTreeCapacityNodes($children, $path);
            }
        }
    }

    private function validateTreeNodeCapacity(array $node, string $path): void
    {
        $weightCap = $this->decimalValue($node['weight'] ?? null);
        $amountCap = $this->decimalValue($node['amount'] ?? $node['allocated_budget'] ?? null);

        if ($weightCap === null && $amountCap === null) {
            return;
        }

        $usage = $this->calculateTreeUsageTotals($node);
        $messages = [];

        if ($weightCap !== null && $usage['weight'] > $weightCap + 0.0001) {
            $messages[] = "Node {$path} exceeds its weight ceiling.";
        }

        if ($amountCap !== null && $usage['amount'] > $amountCap + 0.0001) {
            $messages[] = "Node {$path} exceeds its allocated budget ceiling.";
        }

        if (! empty($messages)) {
            throw ValidationException::withMessages([
                'nodes' => [implode(' ', $messages)],
            ]);
        }
    }

    private function calculateTreeUsageTotals(array $node): array
    {
        $weight = 0.0;
        $amount = 0.0;

        $children = $node['paps'] ?? $node['children'] ?? [];
        if (is_array($children)) {
            foreach ($children as $childNode) {
                if (! is_array($childNode)) {
                    continue;
                }

                $childWeight = $this->decimalValue($childNode['weight'] ?? null) ?? 0.0;
                $childAmount = $this->decimalValue($childNode['amount'] ?? $childNode['allocated_budget'] ?? null) ?? 0.0;
                $childUsage = $this->calculateTreeUsageTotals($childNode);

                $weight += $childWeight + $childUsage['weight'];
                $amount += $childAmount + $childUsage['amount'];
            }
        }

        $successIndicators = $node['successIndicators'] ?? $node['success_indicators'] ?? [];
        if (is_array($successIndicators)) {
            foreach ($successIndicators as $indicatorNode) {
                if (! is_array($indicatorNode)) {
                    continue;
                }

                $weight += $this->decimalValue($indicatorNode['weight'] ?? null) ?? 0.0;
                $amount += $this->decimalValue($indicatorNode['amount'] ?? $indicatorNode['allocated_budget'] ?? null) ?? 0.0;
            }
        }

        return [
            'weight' => $weight,
            'amount' => $amount,
        ];
    }

    private function syncTreeSuccessIndicators(
        OpcrRecord $record,
        array $categoryNode,
        OpcrItem $parentItem,
        array $successIndicators,
        Request $request,
        int $level,
        array $activeDivisionIds
    ): void {
        foreach (array_values($successIndicators) as $index => $indicatorNode) {
            $indicatorItem = OpcrItem::create([
                'opcr_record_id' => $record->id,
                'item_type' => 'success_indicator',
                'category_id' => (int) $categoryNode['id'],
                'category_sort_order' => $parentItem->category_sort_order,
                'parent_item_id' => $parentItem->id,
                'item_level' => $level,
                'pap_id' => $parentItem->pap_id,
                'pap_sort_order' => $parentItem->pap_sort_order,
                'success_indicator_id' => $this->resolveNullableNodeId($indicatorNode['id'] ?? $indicatorNode['value'] ?? null),
                'success_indicator_sort_order' => $index + 1,
                'pap_title' => $parentItem->pap_title,
                'success_indicator_title' => $this->nullableString($indicatorNode['target'] ?? $indicatorNode['title'] ?? $indicatorNode['label'] ?? null),
                'weight' => $this->nullableDecimal($indicatorNode['weight'] ?? null),
                'allocated_budget' => $this->nullableDecimal($indicatorNode['amount'] ?? $indicatorNode['allocated_budget'] ?? null),
                'remarks' => $this->nullableString($indicatorNode['measurement'] ?? null),
                'sort_order' => $this->resolveNodeSortOrder($indicatorNode, $index + 1),
                'created_by' => $request->user()?->ipms_id,
                'updated_by' => $request->user()?->ipms_id,
            ]);

            $this->syncTreeSuccessIndicatorAssignments($record, $indicatorItem, $indicatorNode, $activeDivisionIds);
            $this->syncTreeSuccessIndicatorRatingRows($record, $indicatorItem, $indicatorNode);
        }
    }

    private function syncTreeSuccessIndicatorAssignments(
        OpcrRecord $record,
        OpcrItem $item,
        array $indicatorNode,
        array $activeDivisionIds
    ): void {
        $divisionAssignments = $this->normalizeAssignmentValues($indicatorNode['division_assignments'] ?? []);
        $groupAssignments = $this->normalizeAssignmentValues($indicatorNode['group_assignments'] ?? []);
        $employeeAssignments = $this->normalizeAssignmentValues($indicatorNode['employee_assignments'] ?? []);

        if (in_array('all', $divisionAssignments, true)) {
            $divisionAssignments = $activeDivisionIds;
        }

        $rows = [];
        $timestamp = now()->toDateTimeString();

        foreach (array_values(array_unique($divisionAssignments)) as $divisionId) {
            if ($divisionId === '') {
                continue;
            }

            $rows[] = [
                'opcr_record_id' => $record->id,
                'opcr_item_id' => $item->id,
                'division_id' => (string) $divisionId,
                'group_id' => null,
                'emp_id' => null,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ];
        }

        foreach (array_values(array_unique($groupAssignments)) as $groupId) {
            if ($groupId === '') {
                continue;
            }

            $rows[] = [
                'opcr_record_id' => $record->id,
                'opcr_item_id' => $item->id,
                'division_id' => null,
                'group_id' => (int) $groupId,
                'emp_id' => null,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ];
        }

        foreach (array_values(array_unique($employeeAssignments)) as $empId) {
            if ($empId === '') {
                continue;
            }

            $rows[] = [
                'opcr_record_id' => $record->id,
                'opcr_item_id' => $item->id,
                'division_id' => null,
                'group_id' => null,
                'emp_id' => (string) $empId,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ];
        }

        if (! empty($rows)) {
            OpcrAssignment::query()->insert($rows);
        }
    }

    private function syncTreeSuccessIndicatorRatingRows(OpcrRecord $record, OpcrItem $item, array $indicatorNode): void
    {
        $rows = $this->resolveSuccessIndicatorMatrixRows($item, $indicatorNode);

        DB::connection('mysql2')->table('opcr_item_rating_rows')->where('opcr_item_id', $item->id)->delete();

        if (empty($rows)) {
            return;
        }

        DB::connection('mysql2')->table('opcr_item_rating_rows')->insert(array_map(function (array $row) use ($record, $item) {
            return [
                'opcr_item_id' => $item->id,
                'success_indicator_id' => $item->success_indicator_id,
                'rating_dimension' => $row['rating_dimension'] ?? 'Q',
                'score' => (int) ($row['score'] ?? 0),
                'enabled' => (bool) ($row['enabled'] ?? true),
                'condition_type' => $row['condition_type'] ?? null,
                'condition_text' => $row['condition_text'] ?? null,
                'meaning' => $row['meaning'] ?? null,
                'value_from' => $row['value_from'] ?? null,
                'value_to' => $row['value_to'] ?? null,
                'unit' => $row['unit'] ?? null,
                'timing' => $row['timing'] ?? null,
                'sort_order' => (int) ($row['sort_order'] ?? 0),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }, $rows));
    }

    private function resolveSuccessIndicatorMatrixRows(OpcrItem $item, array $indicatorNode): array
    {
        if (isset($indicatorNode['rating_rows']) && is_array($indicatorNode['rating_rows'])) {
            return $this->normalizeMatrixRows($indicatorNode['rating_rows']);
        }

        if (isset($indicatorNode['matrix_payload']) && is_array($indicatorNode['matrix_payload'])) {
            return $this->flattenMatrixPayload($indicatorNode['matrix_payload']);
        }

        if (! $item->success_indicator_id) {
            return [];
        }

        $indicator = PerformanceSuccessIndicator::query()
            ->select(['id', 'performance_rating_id'])
            ->find($item->success_indicator_id);

        if (! $indicator) {
            return [];
        }

        if ($indicator->performance_rating_id) {
            return DB::connection('mysql2')
                ->table('performance_rating_rows')
                ->where('performance_rating_id', $indicator->performance_rating_id)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get()
                ->map(fn ($row) => (array) $row)
                ->all();
        }

        return DB::connection('mysql2')
            ->table('performance_success_indicator_matrix_rows')
            ->where('performance_success_indicator_id', $indicator->id)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn ($row) => (array) $row)
            ->all();
    }

    private function normalizeMatrixRows(array $rows): array
    {
        return array_values(array_map(function (array $row): array {
            return [
                'rating_dimension' => strtoupper((string) ($row['rating_dimension'] ?? 'Q')),
                'score' => (int) ($row['score'] ?? 0),
                'enabled' => (bool) ($row['enabled'] ?? true),
                'condition_type' => $row['condition_type'] ?? null,
                'condition_text' => $row['condition_text'] ?? null,
                'meaning' => $row['meaning'] ?? null,
                'value_from' => $row['value_from'] ?? null,
                'value_to' => $row['value_to'] ?? null,
                'unit' => $row['unit'] ?? null,
                'timing' => $row['timing'] ?? null,
                'sort_order' => (int) ($row['sort_order'] ?? 0),
            ];
        }, $rows));
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

    private function validatePayload(Request $request): array
    {
        $data = $request->validate([
            'category_id' => ['required', 'integer', 'exists:mysql2.performance_categories,id'],
            'pap_id' => ['nullable', 'integer', 'exists:mysql5.ppmp_pap,id'],
            'success_indicator_id' => ['nullable', 'integer', 'exists:mysql2.performance_success_indicators,id'],
            'weight' => ['nullable', 'numeric'],
            'allocated_budget' => ['nullable', 'numeric'],
            'remarks' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $category = PerformanceCategory::query()->findOrFail((int) $data['category_id']);
        $pap = null;
        $successIndicator = null;

        if (! empty($data['pap_id'])) {
            $pap = PerformancePap::query()->findOrFail((int) $data['pap_id']);
        }

        if (! empty($data['success_indicator_id'])) {
            $successIndicator = PerformanceSuccessIndicator::query()->findOrFail((int) $data['success_indicator_id']);
        }

        $data['_category'] = $category;
        $data['_pap'] = $pap;
        $data['_success_indicator'] = $successIndicator;

        return $data;
    }

    private function buildPayload(array $data): array
    {
        /** @var PerformanceCategory $category */
        $category = $data['_category'];
        $pap = $data['_pap'];
        $successIndicator = $data['_success_indicator'];

        return [
            'item_type' => $successIndicator ? 'success_indicator' : ($pap ? 'pap' : 'category'),
            'category_id' => (int) $data['category_id'],
            'category_sort_order' => (int) $category->sort_order,
            'parent_item_id' => null,
            'item_level' => 1,
            'pap_id' => $pap?->id,
            'pap_sort_order' => (int) ($pap?->sort_order ?? 0),
            'success_indicator_id' => $successIndicator?->id,
            'success_indicator_sort_order' => 0,
                'pap_title' => $pap?->label ?? $pap?->title,
            'success_indicator_title' => $successIndicator ? $this->formatSuccessIndicatorTitle($successIndicator) : null,
            'weight' => $this->nullableDecimal($data['weight'] ?? null) ?? $this->nullableDecimal($successIndicator?->weight),
            'allocated_budget' => $this->nullableDecimal($data['allocated_budget'] ?? null) ?? $this->nullableDecimal($successIndicator?->budget),
            'remarks' => $this->nullableString($data['remarks'] ?? null),
        ];
    }

    private function periodQuery(OpcrRecord $record): array
    {
        $query = ['year' => $record->year];

        if ($record->period_type === 'semestral' && $record->period_no !== null) {
            $query['semester'] = $record->period_no;
        }

        return $query;
    }

    private function resolveSortOrder(OpcrRecord $record, mixed $sortOrder = null, ?int $fallback = null): int
    {
        if ($sortOrder !== null && $sortOrder !== '') {
            return (int) $sortOrder;
        }

        if ($fallback !== null) {
            return $fallback;
        }

        return ((int) $record->items()->max('sort_order')) + 1;
    }

    private function resolveNodeId(array $node): int
    {
        return (int) ($node['id'] ?? $node['value'] ?? 0);
    }

    private function resolveNullableNodeId(mixed $value): ?int
    {
        $value = trim((string) $value);

        return $value === '' ? null : (int) $value;
    }

    private function resolveNodeSortOrder(array $node, int $fallback): int
    {
        $sortOrder = $node['sort_order'] ?? null;

        return $sortOrder === null || $sortOrder === '' ? $fallback : (int) $sortOrder;
    }

    private function nullableString(mixed $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    private function nullableDecimal(mixed $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    private function decimalValue(mixed $value): ?float
    {
        $value = trim((string) $value);

        return $value === '' ? null : (float) $value;
    }

    private function normalizeAssignmentValues(mixed $values): array
    {
        return collect(is_array($values) ? $values : [])
            ->map(function ($value) {
                $value = trim((string) $value);

                if ($value === '') {
                    return null;
                }

                if (str_contains($value, ':')) {
                    [, $suffix] = array_pad(explode(':', $value, 2), 2, '');

                    return trim((string) $suffix);
                }

                return $value;
            })
            ->filter(fn ($value) => $value !== null && $value !== '')
            ->values()
            ->all();
    }

    private function resolveActiveDivisionIds(): array
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

    private function formatSuccessIndicatorTitle(PerformanceSuccessIndicator $item): string
    {
        $parts = array_filter([
            $item->scope,
            $item->target,
        ]);

        return implode(' - ', $parts) ?: ($item->target ?: $item->scope ?: 'Success Indicator');
    }
}







