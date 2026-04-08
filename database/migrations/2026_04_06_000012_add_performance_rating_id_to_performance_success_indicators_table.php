<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->table('performance_success_indicators', function (Blueprint $table) {
            $table->unsignedBigInteger('performance_rating_id')->nullable()->after('performance_activity_id');
            $table->foreign('performance_rating_id')
                ->references('id')
                ->on('performance_ratings')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::connection('mysql2')->table('performance_success_indicators', function (Blueprint $table) {
            $table->dropForeign(['performance_rating_id']);
            $table->dropColumn('performance_rating_id');
        });
    }
};
