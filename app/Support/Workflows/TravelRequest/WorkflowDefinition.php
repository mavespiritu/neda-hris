<?php

namespace App\Support\Workflows\TravelRequest;

use App\Support\Workflows\WorkflowDefinition as BaseWorkflowDefinition;
use App\Support\Workflows\WorkflowStepDefinition;

final class WorkflowDefinition
{
    public static function make(): BaseWorkflowDefinition
    {
        return new BaseWorkflowDefinition(
            processKey: 'travel_request',
            steps: [
                new WorkflowStepDefinition(
                    key: 'draft',
                    state: 'Draft',
                    title: 'Request created',
                    actorLabel: 'Creator',
                    expectedActorLabel: 'Creator',
                    required: true,
                ),
                new WorkflowStepDefinition(
                    key: 'submitted',
                    state: 'Submitted',
                    title: 'Request submitted',
                    actorLabel: 'Creator',
                    expectedActorLabel: 'Reviewer_VR',
                    required: true,
                ),
                new WorkflowStepDefinition(
                    key: 'returned',
                    state: 'Returned',
                    title: 'Request returned',
                    actorLabel: 'Reviewer_VR',
                    expectedActorLabel: 'Creator',
                    required: false,
                    optional: true,
                    visibleWhen: fn (array $context): bool => (bool) ($context['branch_taken'] ?? false),
                ),
                new WorkflowStepDefinition(
                    key: 'resubmitted',
                    state: 'Resubmitted',
                    title: 'Request resubmitted',
                    actorLabel: 'Creator',
                    expectedActorLabel: 'Reviewer_VR',
                    required: false,
                    optional: true,
                    visibleWhen: fn (array $context): bool => (bool) ($context['branch_taken'] ?? false),
                ),
            ]
        );
    }
}
