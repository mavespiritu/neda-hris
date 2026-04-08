<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->table('performance_success_indicators', function (Blueprint $table) {
            $table->string('category', 50)->default('Common')->after('level');
        });
    }

    public function down(): void
    {
        Schema::connection('mysql2')->table('performance_success_indicators', function (Blueprint $table) {
            $table->dropColumn('category');
        });
    }
};
