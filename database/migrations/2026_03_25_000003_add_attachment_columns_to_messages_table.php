<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql4')->table('messages', function (Blueprint $table) {
            if (! Schema::connection('mysql4')->hasColumn('messages', 'attachment_path')) {
                $table->string('attachment_path')->nullable()->after('body');
            }

            if (! Schema::connection('mysql4')->hasColumn('messages', 'attachment_name')) {
                $table->string('attachment_name')->nullable()->after('attachment_path');
            }

            if (! Schema::connection('mysql4')->hasColumn('messages', 'attachment_type')) {
                $table->string('attachment_type')->nullable()->after('attachment_name');
            }

            if (! Schema::connection('mysql4')->hasColumn('messages', 'attachment_size')) {
                $table->unsignedBigInteger('attachment_size')->nullable()->after('attachment_type');
            }
        });
    }

    public function down(): void
    {
        Schema::connection('mysql4')->table('messages', function (Blueprint $table) {
            if (Schema::connection('mysql4')->hasColumn('messages', 'attachment_size')) {
                $table->dropColumn('attachment_size');
            }

            if (Schema::connection('mysql4')->hasColumn('messages', 'attachment_type')) {
                $table->dropColumn('attachment_type');
            }

            if (Schema::connection('mysql4')->hasColumn('messages', 'attachment_name')) {
                $table->dropColumn('attachment_name');
            }

            if (Schema::connection('mysql4')->hasColumn('messages', 'attachment_path')) {
                $table->dropColumn('attachment_path');
            }
        });
    }
};
