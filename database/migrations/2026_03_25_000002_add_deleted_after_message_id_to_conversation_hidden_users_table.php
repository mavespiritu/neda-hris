<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql4')->table('conversation_hidden_users', function (Blueprint $table) {
            $table->unsignedBigInteger('deleted_after_message_id')->nullable()->after('user_id');
            $table->index(['conversation_id', 'user_id', 'deleted_after_message_id'], 'conversation_hidden_users_cutoff_idx');
        });
    }

    public function down(): void
    {
        Schema::connection('mysql4')->table('conversation_hidden_users', function (Blueprint $table) {
            $table->dropIndex('conversation_hidden_users_cutoff_idx');
            $table->dropColumn('deleted_after_message_id');
        });
    }
};
