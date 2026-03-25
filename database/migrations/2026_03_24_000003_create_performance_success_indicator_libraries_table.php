<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('performance_success_indicator_libraries', function (Blueprint $table) {
            $table->id();
            $table->string('level');
            $table->text('target');
            $table->string('weight')->nullable();
            $table->string('budget')->nullable();
            $table->string('accountable')->nullable();
            $table->timestamps();
        });

        $now = now();

        DB::table('performance_success_indicator_libraries')->insert([
            [
                'level' => 'OPCR',
                'target' => '80% of proposed advocacy activities on NEDA supported policies and plans (RDP, AmbisYon Natin, SDG, NIASD) conducted on schedule',
                'weight' => '1.5',
                'budget' => '98,500',
                'accountable' => 'DRCAD',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'level' => 'OPCR',
                'target' => 'At least 4.35/5 or 87% (Very Satisfactory) average client satisfaction rating of the Regional Development Council Full Council',
                'weight' => '10',
                'budget' => '245,631.7',
                'accountable' => 'DRCAD',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'level' => 'OPCR',
                'target' => 'At least 4.35/5 or 87% (Very Satisfactory) average client satisfaction rating of RDC Sectoral Committees - EDSecom',
                'weight' => '2',
                'budget' => '42,250',
                'accountable' => 'PDIPBD',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'level' => 'OPCR',
                'target' => 'At least 4.35/5 or 87% (Very Satisfactory) average client satisfaction rating of RDC Sectoral Committees - RSDC',
                'weight' => '2',
                'budget' => '24,800.5',
                'accountable' => 'PFPD',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'level' => 'OPCR',
                'target' => '1 annual/midterm public investment program documents prepared, updated, and submitted by every end of the year to the concerned inter-agency bodies for appropriate action',
                'weight' => '1',
                'budget' => '',
                'accountable' => 'All Technical Divisions',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'level' => 'OPCR',
                'target' => 'At least 90% of projects appraised within target 4 deadline',
                'weight' => '',
                'budget' => '',
                'accountable' => 'All Technical Divisions',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'level' => 'OPCR',
                'target' => '80% of proposed advocacy activities on NEDA supported policies and plans (RDP, AmbisYon Natin, SDG, NIASD) conducted on schedule',
                'weight' => '',
                'budget' => '',
                'accountable' => 'All Technical Divisions',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'level' => 'OPCR',
                'target' => '100% of requests for monitoring and evaluation information of policy and decision-making made readily available within prescribed period',
                'weight' => '',
                'budget' => '',
                'accountable' => 'All Technical Divisions',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'level' => 'OPCR',
                'target' => 'Percentage of agencies with problematic projects alerted/assisted to hasten or put project on track and/or to address implementation issues',
                'weight' => '',
                'budget' => '',
                'accountable' => 'All Technical Divisions',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'level' => 'OPCR',
                'target' => '80% of business processes automated within schedule/plan',
                'weight' => '0.25',
                'budget' => '',
                'accountable' => 'FAD',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'level' => 'OPCR',
                'target' => '100% of ICT hardware infrastructure enhancements implemented within schedule',
                'weight' => '0.25',
                'budget' => '',
                'accountable' => 'FAD',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'level' => 'DPCR',
                'target' => '100% of planned IS dev\'t and request for updating acted upon with all aspects of work well covered',
                'weight' => '0.25',
                'budget' => '0',
                'accountable' => 'ICT Unit',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'level' => 'DPCR',
                'target' => '100% of servers and network devices maintained with every aspect of work well-covered',
                'weight' => '0.25',
                'budget' => '0',
                'accountable' => 'ICT Unit',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'level' => 'DPCR',
                'target' => '100% of required assessment on data privacy and security conducted',
                'weight' => '0.25',
                'budget' => '0',
                'accountable' => 'ICT Unit',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'level' => 'DPCR',
                'target' => '100% of requested ICT support and services provided',
                'weight' => '0.25',
                'budget' => '0',
                'accountable' => 'ICT Unit',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('performance_success_indicator_libraries');
    }
};
