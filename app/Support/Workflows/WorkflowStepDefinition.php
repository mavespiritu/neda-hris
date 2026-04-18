<?php

namespace App\Support\Workflows;

use Closure;

final class WorkflowStepDefinition
{
    public function __construct(
        public readonly string $key,
        public readonly string $state,
        public readonly string $title,
        public readonly string $actorLabel,
        public readonly ?string $expectedActorLabel = null,
        public readonly bool $required = true,
        public readonly bool $optional = false,
        public readonly bool $technical = false,
        public readonly ?Closure $visibleWhen = null,
    ) {
    }

    public function isVisible(array $context = []): bool
    {
        if ($this->visibleWhen === null) {
            return true;
        }

        return (bool) ($this->visibleWhen)($context);
    }
}
