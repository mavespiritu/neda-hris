<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql4')->table('conversations', function (Blueprint $table) {
            if (! Schema::connection('mysql4')->hasColumn('conversations', 'is_title_custom')) {
                $table->boolean('is_title_custom')->default(false)->after('title');
            }
        });

        if (Schema::connection('mysql4')->hasColumn('conversations', 'is_title_custom')) {
            DB::connection('mysql4')
                ->table('conversations')
                ->where('type', 'group')
                ->whereNotNull('title')
                ->whereColumn('updated_at', '>', 'created_at')
                ->update(['is_title_custom' => true]);
        }
    }

    public function down(): void
    {
        Schema::connection('mysql4')->table('conversations', function (Blueprint $table) {
            if (Schema::connection('mysql4')->hasColumn('conversations', 'is_title_custom')) {
                $table->dropColumn('is_title_custom');
            }
        });
    }
};
