<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->create('workflow_process_transitions', function (Blueprint $table) {
            $table->id();
            $table->string('process_key', 100);
            $table->string('from_state', 100);
            $table->string('to_state', 100);
            $table->string('expected_actor_type', 100);
            $table->string('actor_scope_type', 50)->nullable();
            $table->string('actor_scope_source', 50)->nullable();
            $table->string('actor_scope_value', 100)->nullable();
            $table->string('actor_scope_match', 30)->default('exact');
            $table->boolean('multiple_assignees')->default(false);
            $table->string('expected_action', 100);
            $table->string('notification_label')->nullable();
            $table->string('recipient_role', 100)->nullable();
            $table->string('recipient_scope_type', 50)->nullable();
            $table->string('recipient_scope_source', 50)->nullable();
            $table->string('recipient_scope_value', 100)->nullable();
            $table->boolean('is_return_step')->default(false);
            $table->boolean('is_terminal')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['process_key', 'from_state', 'to_state'], 'workflow_process_transitions_unique');
            $table->index(['process_key', 'sort_order'], 'workflow_process_transitions_process_sort_index');
            $table->index(['process_key', 'from_state'], 'workflow_process_transitions_process_from_index');
            $table->index(['process_key', 'actor_scope_type'], 'workflow_process_transitions_process_scope_index');
        });
    }

    public function down(): void
    {
        Schema::connection('mysql2')->dropIfExists('workflow_process_transitions');
    }
};
