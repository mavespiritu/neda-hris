<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('performance_ppa_libraries', function (Blueprint $table) {
            $table->id();
            $table->string('mfo');
            $table->string('program');
            $table->text('activity');
            $table->timestamps();
        });

        $now = now();

        DB::table('performance_ppa_libraries')->insert([
            [
                'mfo' => 'NEDA Programs/GAS/STO - 90%',
                'program' => '(P1) Program 1: Socioeconomic Policy and Planning Program',
                'activity' => '(P1-1) Coordination of the formulation and updating of national, inter-regional, regional and sectoral socioeconomic physical and development policies and plans',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'mfo' => 'NEDA Programs/GAS/STO - 90%',
                'program' => '(P1) Program 1: Socioeconomic Policy and Planning Program',
                'activity' => '(P1-3) Provision of technical and secretariat support services to Regional Development Councils and other inter-agency committees',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'mfo' => 'NEDA Programs/GAS/STO - 90%',
                'program' => '(P2) Program 2: National Investment Programming Program',
                'activity' => 'New list of IFPs updated on time',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'mfo' => 'NEDA Programs/GAS/STO - 90%',
                'program' => '(P3) Program 3: National Development Monitoring and Evaluation Program',
                'activity' => 'Monitoring and evaluation of plans, programs, policies and projects',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'mfo' => 'NEDA Programs/GAS/STO - 90%',
                'program' => '(STO) Support to Operations',
                'activity' => 'Internal Information and Communication Technology Services',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('performance_ppa_libraries');
    }
};
