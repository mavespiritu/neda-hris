<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::connection('mysql2')->hasColumn('dpcr_items', 'unit_of_measure')) {
            Schema::connection('mysql2')->table('dpcr_items', function (Blueprint $table) {
                $table->string('unit_of_measure', 255)->nullable()->after('specific_activity_output');
            });
        }
    }

    public function down(): void
    {
        if (Schema::connection('mysql2')->hasColumn('dpcr_items', 'unit_of_measure')) {
            Schema::connection('mysql2')->table('dpcr_items', function (Blueprint $table) {
                $table->dropColumn('unit_of_measure');
            });
        }
    }
};
