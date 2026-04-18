<?php

namespace App\Support\Workflows;

use Illuminate\Support\Collection;

final class WorkflowProgressResolver
{
    /**
     * @param callable(string|null):?string $actorNameResolver
     * @param callable(WorkflowStepDefinition, array):array<int, array{emp_id:string,name:?string,source:string}>|null $actorResolver
     */
    public function resolve(
        WorkflowDefinition $definition,
        string $currentState,
        Collection $historyRows,
        callable $actorNameResolver,
        ?callable $actorResolver = null,
        array $context = [],
    ): array {
        $historyRows = $historyRows->values();
        $branchTaken = $historyRows->contains(function ($row) {
            $status = trim((string) ($row->status ?? ''));

            return in_array($status, ['Returned', 'Resubmitted'], true);
        });

        $context = array_merge($context, [
            'current_state' => $currentState,
            'branch_taken' => $branchTaken,
            'history_rows' => $historyRows,
        ]);

        $historyByState = $historyRows
            ->groupBy(fn ($row) => trim((string) ($row->status ?? '')))
            ->map(fn (Collection $rows) => $rows->sortByDesc('id')->values());

        $steps = [];
        foreach ($definition->steps() as $step) {
            if ($step->technical) {
                continue;
            }

            if (! $step->isVisible($context)) {
                continue;
            }

            $historyRow = $historyByState->get($step->state)?->first();
            $historyState = trim((string) ($historyRow->status ?? ''));
            $isCurrent = $currentState === $step->state;
            $isDone = ! $isCurrent && $historyState === $step->state;

            $status = $isCurrent
                ? 'current'
                : ($isDone ? 'done' : ($step->optional ? 'conditional' : 'upcoming'));

            $actorName = $actorNameResolver($historyRow->acted_by ?? null);
            $expectedActors = $actorResolver ? $actorResolver($step, $context) : [];
            $expectedActorNames = collect($expectedActors)->pluck('name')->filter()->values()->all();
            $subtitle = $this->subtitleFor($step, $status, $actorName, $context);

            $steps[] = [
                'key' => $step->key,
                'state' => $step->state,
                'title' => $step->title,
                'subtitle' => $subtitle,
                'status' => $status,
                'required' => $step->required,
                'optional' => $step->optional,
                'actor_label' => $step->actorLabel,
                'expected_actor_label' => $step->expectedActorLabel,
                'expected_actors' => $expectedActors,
                'expected_actor_names' => $expectedActorNames,
                'expected_actor_text' => count($expectedActorNames) ? implode(', ', $expectedActorNames) : ($step->expectedActorLabel ?? null),
                'acted_by' => $historyRow?->acted_by ? (string) $historyRow->acted_by : null,
                'acted_by_name' => $actorName,
                'acted_at' => $historyRow?->date_acted ?? null,
                'remarks' => $historyRow?->remarks ?? null,
                'visible' => true,
            ];
        }

        $currentStep = collect($steps)->first(fn (array $step) => $step['state'] === $currentState);

        return [
            'process_key' => $definition->processKey,
            'current_state' => $currentState,
            'branch_taken' => $branchTaken,
            'current_step' => $currentStep,
            'steps' => $steps,
        ];
    }

    /**
     * @param array<string, mixed> $context
     */
    private function subtitleFor(
        WorkflowStepDefinition $step,
        string $status,
        ?string $actorName,
        array $context = [],
    ): ?string {
        $actorName = trim((string) ($actorName ?? ''));

        return match ($step->state) {
            'Draft' => $actorName !== '' ? "Created by {$actorName}" : 'Created',
            'Submitted' => $this->submittedSubtitle($status, $actorName, $context),
            'Returned' => $actorName !== '' ? "Returned by {$actorName}" : 'Returned for editing',
            'Resubmitted' => $actorName !== '' ? "Resubmitted by {$actorName}" : 'Resubmitted after return',
            default => null,
        };
    }

    /**
     * @param array<string, mixed> $context
     */
    private function submittedSubtitle(string $status, ?string $actorName, array $context = []): string
    {
        $actorName = trim((string) ($actorName ?? ''));
        $branchTaken = (bool) ($context['branch_taken'] ?? false);

        if ($branchTaken && $status === 'current') {
            return $actorName !== ''
                ? "Submitted again after return by {$actorName}"
                : 'Submitted again after return';
        }

        return $actorName !== ''
            ? "Submitted by {$actorName}"
            : 'Submitted';
    }
}
