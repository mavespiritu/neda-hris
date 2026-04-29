<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::connection('mysql2')->hasColumn('dpcr_items', 'target_plan')) {
            Schema::connection('mysql2')->table('dpcr_items', function (Blueprint $table) {
                $table->json('target_plan')->nullable()->after('unit_of_measure');
            });
        }
    }

    public function down(): void
    {
        if (Schema::connection('mysql2')->hasColumn('dpcr_items', 'target_plan')) {
            Schema::connection('mysql2')->table('dpcr_items', function (Blueprint $table) {
                $table->dropColumn('target_plan');
            });
        }
    }
};
