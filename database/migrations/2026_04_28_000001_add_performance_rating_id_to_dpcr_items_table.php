<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->table('dpcr_items', function (Blueprint $table) {
            $table->integer('performance_rating_id')->nullable()->after('sub_activity_id');
            $table->index('performance_rating_id');
        });
    }

    public function down(): void
    {
        Schema::connection('mysql2')->table('dpcr_items', function (Blueprint $table) {
            $table->dropIndex(['performance_rating_id']);
            $table->dropColumn('performance_rating_id');
        });
    }
};
