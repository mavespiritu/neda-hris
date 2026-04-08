<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->table('performance_paps', function (Blueprint $table) {
            $table->decimal('weight', 14, 2)->nullable()->after('description');
            $table->decimal('budget', 14, 2)->nullable()->after('weight');
        });
    }

    public function down(): void
    {
        Schema::connection('mysql2')->table('performance_paps', function (Blueprint $table) {
            $table->dropColumn(['weight', 'budget']);
        });
    }
};
