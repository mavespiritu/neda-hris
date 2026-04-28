<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->table('performance_ratings', function (Blueprint $table) {
            $table->dropUnique('performance_ratings_name_unique');
            $table->unique(['name', 'category'], 'performance_ratings_name_category_unique');
        });
    }

    public function down(): void
    {
        Schema::connection('mysql2')->table('performance_ratings', function (Blueprint $table) {
            $table->dropUnique('performance_ratings_name_category_unique');
            $table->unique('name', 'performance_ratings_name_unique');
        });
    }
};
