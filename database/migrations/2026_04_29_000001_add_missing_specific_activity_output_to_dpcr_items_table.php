<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->table('dpcr_items', function (Blueprint $table) {
            if (! Schema::connection('mysql2')->hasColumn('dpcr_items', 'specific_activity_output')) {
                $table->text('specific_activity_output')->nullable()->after('sub_activity_id');
            }
        });
    }

    public function down(): void
    {
        if (Schema::connection('mysql2')->hasColumn('dpcr_items', 'specific_activity_output')) {
            Schema::connection('mysql2')->table('dpcr_items', function (Blueprint $table) {
                $table->dropColumn('specific_activity_output');
            });
        }
    }
};
