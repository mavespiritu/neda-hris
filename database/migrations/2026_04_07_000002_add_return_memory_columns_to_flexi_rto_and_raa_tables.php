<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->table('flexi_rto', function (Blueprint $table) {
            $table->string('rto_return_to_state')->nullable()->after('rto_state');
            $table->string('rto_return_to_user')->nullable()->after('rto_return_to_state');
            $table->text('rto_status_remarks')->nullable()->after('rto_return_to_user');
        });

        Schema::connection('mysql2')->table('flexi_raa', function (Blueprint $table) {
            $table->string('raa_return_to_state')->nullable()->after('raa_state');
            $table->string('raa_return_to_user')->nullable()->after('raa_return_to_state');
            $table->text('raa_status_remarks')->nullable()->after('raa_return_to_user');
        });
    }

    public function down(): void
    {
        Schema::connection('mysql2')->table('flexi_rto', function (Blueprint $table) {
            $table->dropColumn(['rto_return_to_state', 'rto_return_to_user', 'rto_status_remarks']);
        });

        Schema::connection('mysql2')->table('flexi_raa', function (Blueprint $table) {
            $table->dropColumn(['raa_return_to_state', 'raa_return_to_user', 'raa_status_remarks']);
        });
    }
};
