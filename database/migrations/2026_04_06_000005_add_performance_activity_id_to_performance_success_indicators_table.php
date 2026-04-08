<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->table('performance_success_indicators', function (Blueprint $table) {
            $table->foreignId('performance_activity_id')
                ->nullable()
                ->after('category')
                ->constrained('performance_activities')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::connection('mysql2')->table('performance_success_indicators', function (Blueprint $table) {
            $table->dropConstrainedForeignId('performance_activity_id');
        });
    }
};
