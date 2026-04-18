<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->create('workflow_notification_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workflow_process_transition_id')->nullable();
            $table->string('process_key', 100);
            $table->string('model_type', 150);
            $table->unsignedBigInteger('model_id');
            $table->string('recipient_emp_id', 20)->nullable();
            $table->string('recipient_email')->nullable();
            $table->string('notification_channel', 50)->default('mail');
            $table->string('template_key', 100)->nullable();
            $table->string('status', 30)->default('queued');
            $table->unsignedInteger('attempt_count')->default(1);
            $table->text('last_error')->nullable();
            $table->string('provider_message_id')->nullable();
            $table->json('payload')->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('queued_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamp('resent_at')->nullable();
            $table->unsignedBigInteger('resend_of_log_id')->nullable();
            $table->timestamps();

            $table->index(['process_key', 'model_type', 'model_id'], 'wflog_model_index');
            $table->index(['status', 'notification_channel'], 'wflog_status_channel_index');
            $table->index(['recipient_emp_id'], 'wflog_recipient_index');
            $table->index(['resend_of_log_id'], 'wflog_resend_of_index');
            $table->unique(['workflow_process_transition_id', 'model_type', 'model_id', 'recipient_emp_id', 'notification_channel', 'attempt_count'], 'wflog_unique_attempt');
        });

        Schema::connection('mysql2')->table('workflow_notification_logs', function (Blueprint $table) {
            $table->foreign('workflow_process_transition_id', 'wflog_transition_fk')
                ->references('id')
                ->on('workflow_process_transitions')
                ->nullOnDelete();

            $table->foreign('resend_of_log_id', 'wflog_resend_of_fk')
                ->references('id')
                ->on('workflow_notification_logs')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::connection('mysql2')->dropIfExists('workflow_notification_logs');
    }
};
