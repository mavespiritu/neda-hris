<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->table('opcr_items', function (Blueprint $table) {
            $table->unsignedBigInteger('pap_id')->nullable()->after('category_sort_order');
            $table->unsignedInteger('pap_sort_order')->default(0)->after('pap_id');
            $table->string('pap_title')->nullable()->after('pap_sort_order');

            $table->index('pap_id');
            $table->index('pap_sort_order');
            $table->foreign('pap_id')->references('id')->on('performance_paps')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::connection('mysql2')->table('opcr_items', function (Blueprint $table) {
            $table->dropForeign(['pap_id']);
            $table->dropIndex(['pap_id']);
            $table->dropIndex(['pap_sort_order']);
            $table->dropColumn(['pap_id', 'pap_sort_order', 'pap_title']);
        });
    }
};
