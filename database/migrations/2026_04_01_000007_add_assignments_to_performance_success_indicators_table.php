<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->table('performance_success_indicators', function (Blueprint $table) {
            $table->json('division_assignments')->nullable()->after('measurement');
            $table->json('group_assignments')->nullable()->after('division_assignments');
        });
    }

    public function down(): void
    {
        Schema::connection('mysql2')->table('performance_success_indicators', function (Blueprint $table) {
            $table->dropColumn(['division_assignments', 'group_assignments']);
        });
    }
};
