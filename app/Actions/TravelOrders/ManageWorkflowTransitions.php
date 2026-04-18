<?php

namespace App\Actions\TravelOrders;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\Concerns\AsAction;

class ManageWorkflowTransitions
{
    use AsAction;

    public function asController(Request $request)
    {
        return $this->index($request);
    }

    public function index(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $workflowTransitions = $conn2->table('workflow_process_transitions')
            ->orderBy('process_key')
            ->orderBy('sort_order')
            ->orderBy('from_state')
            ->paginate(10)
            ->through(fn ($item) => $this->decorateRow($item));

        return response()->json([
            'data' => [
                'workflowTransitions' => $workflowTransitions,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $validated = $this->validateRequest($request);

        try {
            $conn2->beginTransaction();

            $conn2->table('workflow_process_transitions')->insert($validated + [
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Workflow transition saved successfully.',
            ]);
        } catch (\Throwable $e) {
            $conn2->rollBack();
            Log::error('Failed to save workflow transition: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while saving workflow transition. Please try again.',
            ]);
        }
    }

    public function update(Request $request, int $id)
    {
        $conn2 = DB::connection('mysql2');
        $validated = $this->validateRequest($request);

        try {
            $conn2->beginTransaction();

            $conn2->table('workflow_process_transitions')
                ->where('id', $id)
                ->update($validated + [
                    'updated_at' => now(),
                ]);

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Workflow transition updated successfully.',
            ]);
        } catch (\Throwable $e) {
            $conn2->rollBack();
            Log::error('Failed to update workflow transition: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while updating workflow transition. Please try again.',
            ]);
        }
    }

    public function destroy(int $id)
    {
        $conn2 = DB::connection('mysql2');

        try {
            $conn2->beginTransaction();
            $deleted = $conn2->table('workflow_process_transitions')->where('id', $id)->delete();
            $conn2->commit();

            return redirect()->back()->with([
                'status' => $deleted ? 'success' : 'error',
                'title' => $deleted ? 'Deleted!' : 'Not Found',
                'message' => $deleted
                    ? 'Workflow transition deleted successfully.'
                    : 'Workflow transition not found or already deleted.',
            ]);
        } catch (\Throwable $e) {
            $conn2->rollBack();
            Log::error('Error deleting workflow transition: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while deleting workflow transition. Please try again.',
            ]);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $ids = $request->input('ids', []);

        try {
            $conn2->beginTransaction();
            $deleted = $conn2->table('workflow_process_transitions')->whereIn('id', $ids)->delete();
            $conn2->commit();

            return redirect()->back()->with([
                'status' => $deleted ? 'success' : 'error',
                'title' => $deleted ? 'Deleted!' : 'Not Found',
                'message' => $deleted
                    ? 'Selected workflow transitions have been deleted successfully.'
                    : 'Selected workflow transitions not found or already deleted.',
            ]);
        } catch (\Throwable $e) {
            $conn2->rollBack();
            Log::error('Error bulk deleting workflow transitions: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while deleting workflow transitions. Please try again.',
            ]);
        }
    }

    private function validateRequest(Request $request): array
    {
        $validated = $request->validate([
            'process_key' => ['required', 'string', 'max:100'],
            'from_state' => ['required', 'string', 'max:100'],
            'to_state' => ['required', 'string', 'max:100'],
            'expected_actor_type' => ['required', 'string', 'max:100'],
            'actor_scope_type' => ['nullable', 'string', 'max:50'],
            'actor_scope_source' => ['nullable', 'string', 'max:50'],
            'actor_scope_value' => ['nullable', 'string', 'max:100'],
            'actor_scope_match' => ['nullable', 'string', 'max:30'],
            'multiple_assignees' => ['nullable', 'boolean'],
            'expected_action' => ['required', 'string', 'max:100'],
            'notification_label' => ['nullable', 'string', 'max:255'],
            'recipient_role' => ['nullable', 'string', 'max:100'],
            'recipient_scope_type' => ['nullable', 'string', 'max:50'],
            'recipient_scope_source' => ['nullable', 'string', 'max:50'],
            'recipient_scope_value' => ['nullable', 'string', 'max:100'],
            'is_return_step' => ['nullable', 'boolean'],
            'is_terminal' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        return [
            'process_key' => trim((string) $validated['process_key']),
            'from_state' => trim((string) $validated['from_state']),
            'to_state' => trim((string) $validated['to_state']),
            'expected_actor_type' => trim((string) $validated['expected_actor_type']),
            'actor_scope_type' => $this->nullableString($validated['actor_scope_type'] ?? null),
            'actor_scope_source' => $this->nullableString($validated['actor_scope_source'] ?? null),
            'actor_scope_value' => $this->nullableString($validated['actor_scope_value'] ?? null),
            'actor_scope_match' => $this->nullableString($validated['actor_scope_match'] ?? null) ?? 'exact',
            'multiple_assignees' => (bool) ($validated['multiple_assignees'] ?? false),
            'expected_action' => trim((string) $validated['expected_action']),
            'notification_label' => $this->nullableString($validated['notification_label'] ?? null),
            'recipient_role' => $this->nullableString($validated['recipient_role'] ?? null),
            'recipient_scope_type' => $this->nullableString($validated['recipient_scope_type'] ?? null),
            'recipient_scope_source' => $this->nullableString($validated['recipient_scope_source'] ?? null),
            'recipient_scope_value' => $this->nullableString($validated['recipient_scope_value'] ?? null),
            'is_return_step' => (bool) ($validated['is_return_step'] ?? false),
            'is_terminal' => (bool) ($validated['is_terminal'] ?? false),
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'sort_order' => (int) ($validated['sort_order'] ?? 0),
        ];
    }

    private function nullableString($value): ?string
    {
        $value = is_string($value) ? trim($value) : $value;

        return $value === '' || $value === null ? null : (string) $value;
    }

    private function decorateRow(object $item): object
    {
        $item->transition_label = trim((string) $item->from_state) . ' -> ' . trim((string) $item->to_state);
        $item->actor_scope_label = $this->scopeLabel($item->actor_scope_type, $item->actor_scope_source, $item->actor_scope_value);
        $item->recipient_scope_label = $this->scopeLabel($item->recipient_scope_type, $item->recipient_scope_source, $item->recipient_scope_value);
        $item->flags_label = $this->flagsLabel($item);

        return $item;
    }

    private function scopeLabel($type, $source, $value): string
    {
        $parts = array_filter([
            $type ? ucwords(str_replace('_', ' ', (string) $type)) : null,
            $source ? 'from ' . ucwords(str_replace('_', ' ', (string) $source)) : null,
            $value ? '(' . $value . ')' : null,
        ]);

        return $parts ? implode(' ', $parts) : '-';
    }

    private function flagsLabel(object $item): string
    {
        $flags = [];

        if ($item->multiple_assignees) $flags[] = 'Multiple';
        if ($item->is_return_step) $flags[] = 'Return';
        if ($item->is_terminal) $flags[] = 'Terminal';
        if (! $item->is_active) $flags[] = 'Inactive';

        return $flags ? implode(', ', $flags) : 'Active';
    }
}



