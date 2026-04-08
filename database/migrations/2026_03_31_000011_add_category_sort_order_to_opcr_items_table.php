<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->table('opcr_items', function (Blueprint $table) {
            $table->unsignedInteger('category_sort_order')->default(0)->after('category_id');
            $table->index('category_sort_order');
        });

        DB::connection('mysql2')->statement(
            'UPDATE opcr_items oi
             LEFT JOIN performance_categories pc ON pc.id = oi.category_id
             SET oi.category_sort_order = COALESCE(pc.sort_order, 0)'
        );
    }

    public function down(): void
    {
        Schema::connection('mysql2')->table('opcr_items', function (Blueprint $table) {
            $table->dropIndex(['category_sort_order']);
            $table->dropColumn('category_sort_order');
        });
    }
};
