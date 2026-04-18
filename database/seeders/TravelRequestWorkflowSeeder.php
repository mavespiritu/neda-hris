<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TravelRequestWorkflowSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        DB::connection('mysql2')->table('workflow_process_transitions')->upsert([
            [
                'process_key' => 'travel_request',
                'from_state' => 'Draft',
                'to_state' => 'Submitted',
                'expected_actor_type' => 'Creator',
                'actor_scope_type' => 'creator',
                'actor_scope_source' => 'creator',
                'actor_scope_value' => null,
                'actor_scope_match' => 'exact',
                'multiple_assignees' => false,
                'expected_action' => 'submit',
                'notification_label' => 'Workflow notification sent to the reviewer.',
                'recipient_role' => 'next_actor',
                'recipient_scope_type' => 'global',
                'recipient_scope_source' => 'fixed',
                'recipient_scope_value' => null,
                'is_return_step' => false,
                'is_terminal' => false,
                'is_active' => true,
                'sort_order' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'process_key' => 'travel_request',
                'from_state' => 'Submitted',
                'to_state' => 'Returned',
                'expected_actor_type' => 'Reviewer_VR',
                'actor_scope_type' => 'global',
                'actor_scope_source' => 'fixed',
                'actor_scope_value' => null,
                'actor_scope_match' => 'exact',
                'multiple_assignees' => false,
                'expected_action' => 'return',
                'notification_label' => 'Requester notified to revise the request.',
                'recipient_role' => 'creator',
                'recipient_scope_type' => 'creator',
                'recipient_scope_source' => 'creator',
                'recipient_scope_value' => null,
                'is_return_step' => true,
                'is_terminal' => false,
                'is_active' => true,
                'sort_order' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'process_key' => 'travel_request',
                'from_state' => 'Returned',
                'to_state' => 'Resubmitted',
                'expected_actor_type' => 'Creator',
                'actor_scope_type' => 'creator',
                'actor_scope_source' => 'creator',
                'actor_scope_value' => null,
                'actor_scope_match' => 'exact',
                'multiple_assignees' => false,
                'expected_action' => 'resubmit',
                'notification_label' => 'Workflow notification sent to the reviewer.',
                'recipient_role' => 'next_actor',
                'recipient_scope_type' => 'global',
                'recipient_scope_source' => 'fixed',
                'recipient_scope_value' => null,
                'is_return_step' => false,
                'is_terminal' => false,
                'is_active' => true,
                'sort_order' => 3,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'process_key' => 'travel_request',
                'from_state' => 'Resubmitted',
                'to_state' => 'Submitted',
                'expected_actor_type' => 'Reviewer_VR',
                'actor_scope_type' => 'global',
                'actor_scope_source' => 'fixed',
                'actor_scope_value' => null,
                'actor_scope_match' => 'exact',
                'multiple_assignees' => false,
                'expected_action' => 'review',
                'notification_label' => 'Workflow notification sent to the reviewer.',
                'recipient_role' => 'next_actor',
                'recipient_scope_type' => 'global',
                'recipient_scope_source' => 'fixed',
                'recipient_scope_value' => null,
                'is_return_step' => false,
                'is_terminal' => false,
                'is_active' => true,
                'sort_order' => 4,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ], ['process_key', 'from_state', 'to_state']);
    }
}
