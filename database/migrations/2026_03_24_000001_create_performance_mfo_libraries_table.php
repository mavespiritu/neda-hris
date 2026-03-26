<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('performance_mfo_libraries', function (Blueprint $table) {
            $table->id();
            $table->string('mfo');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        DB::table('performance_mfo_libraries')->insert([
            [
                'mfo' => 'NEDA Programs/GAS/STO - 90%',
                'description' => 'Reference major final output for performance management.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('performance_mfo_libraries');
    }
};
