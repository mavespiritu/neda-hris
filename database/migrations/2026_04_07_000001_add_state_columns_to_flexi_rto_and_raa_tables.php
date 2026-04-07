<?php

use App\States\Raa\Draft as RaaDraft;
use App\States\Rto\Draft as RtoDraft;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->table('flexi_rto', function (Blueprint $table) {
            $table->string('rto_state')->nullable()->after('updated_at');
        });

        Schema::connection('mysql2')->table('flexi_raa', function (Blueprint $table) {
            $table->string('raa_state')->nullable()->after('created_at');
        });

        DB::connection('mysql2')->table('flexi_rto')
            ->whereNull('rto_state')
            ->update(['rto_state' => RtoDraft::class]);

        DB::connection('mysql2')->table('flexi_raa')
            ->whereNull('raa_state')
            ->update(['raa_state' => RaaDraft::class]);
    }

    public function down(): void
    {
        Schema::connection('mysql2')->table('flexi_rto', function (Blueprint $table) {
            $table->dropColumn('rto_state');
        });

        Schema::connection('mysql2')->table('flexi_raa', function (Blueprint $table) {
            $table->dropColumn('raa_state');
        });
    }
};
