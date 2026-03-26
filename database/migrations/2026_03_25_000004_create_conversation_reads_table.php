<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql4')->create('conversation_reads', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('conversation_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('last_read_message_id')->nullable();
            $table->dateTime('last_read_at')->nullable();
            $table->timestamps();

            $table->unique(['conversation_id', 'user_id'], 'conversation_reads_unique');
            $table->index('conversation_id', 'conversation_reads_conversation_idx');
            $table->index('user_id', 'conversation_reads_user_idx');
        });
    }

    public function down(): void
    {
        Schema::connection('mysql4')->dropIfExists('conversation_reads');
    }
};
