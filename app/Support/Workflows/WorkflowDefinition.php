<?php

namespace App\Support\Workflows;

use Illuminate\Support\Collection;

final class WorkflowDefinition
{
    /**
     * @param array<int, WorkflowStepDefinition> $steps
     */
    public function __construct(
        public readonly string $processKey,
        private readonly array $steps,
    ) {
    }

    /**
     * @return Collection<int, WorkflowStepDefinition>
     */
    public function steps(): Collection
    {
        return collect($this->steps)->values();
    }

    public function stepByKey(string $key): ?WorkflowStepDefinition
    {
        return $this->steps()
            ->first(fn (WorkflowStepDefinition $step) => $step->key === $key);
    }

    public function stepByState(string $state): ?WorkflowStepDefinition
    {
        return $this->steps()
            ->first(fn (WorkflowStepDefinition $step) => $step->state === $state);
    }
}
