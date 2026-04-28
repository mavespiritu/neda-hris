<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->table('dpcr_records', function (Blueprint $table) {
            $table->string('division_id', 50)->nullable()->after('source_opcr_record_id');
            $table->index('division_id');
        });

        Schema::connection('mysql2')->table('dpcr_items', function (Blueprint $table) {
            $table->integer('activity_id')->nullable()->after('source_opcr_item_id');
            $table->integer('sub_activity_id')->nullable()->after('activity_id');
            $table->text('specific_activity_output')->nullable()->after('sub_activity_id');
            $table->decimal('target_jan', 14, 2)->nullable()->after('remarks');
            $table->decimal('target_feb', 14, 2)->nullable()->after('target_jan');
            $table->decimal('target_mar', 14, 2)->nullable()->after('target_feb');
            $table->decimal('target_apr', 14, 2)->nullable()->after('target_mar');
            $table->decimal('target_may', 14, 2)->nullable()->after('target_apr');
            $table->decimal('target_jun', 14, 2)->nullable()->after('target_may');
            $table->decimal('target_jul', 14, 2)->nullable()->after('target_jun');
            $table->decimal('target_aug', 14, 2)->nullable()->after('target_jul');
            $table->decimal('target_sep', 14, 2)->nullable()->after('target_aug');
            $table->decimal('target_oct', 14, 2)->nullable()->after('target_sep');
            $table->decimal('target_nov', 14, 2)->nullable()->after('target_oct');
            $table->decimal('target_dec', 14, 2)->nullable()->after('target_nov');
            $table->index('activity_id');
            $table->index('sub_activity_id');
        });
    }

    public function down(): void
    {
        Schema::connection('mysql2')->table('dpcr_items', function (Blueprint $table) {
            $table->dropIndex(['activity_id']);
            $table->dropIndex(['sub_activity_id']);
            $table->dropColumn([
                'activity_id',
                'sub_activity_id',
                'specific_activity_output',
                'target_jan',
                'target_feb',
                'target_mar',
                'target_apr',
                'target_may',
                'target_jun',
                'target_jul',
                'target_aug',
                'target_sep',
                'target_oct',
                'target_nov',
                'target_dec',
            ]);
        });

        Schema::connection('mysql2')->table('dpcr_records', function (Blueprint $table) {
            $table->dropIndex(['division_id']);
            $table->dropColumn('division_id');
        });
    }
};
