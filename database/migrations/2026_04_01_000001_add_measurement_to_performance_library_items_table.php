<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->table('performance_library_items', function (Blueprint $table) {
            $table->text('measurement')->nullable()->after('target');
        });
    }

    public function down(): void
    {
        Schema::connection('mysql2')->table('performance_library_items', function (Blueprint $table) {
            $table->dropColumn('measurement');
        });
    }
};
