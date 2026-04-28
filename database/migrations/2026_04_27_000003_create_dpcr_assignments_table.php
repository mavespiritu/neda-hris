<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->create('dpcr_assignments', function (Blueprint $table) {
            $table->integer('id', true, false);
            $table->integer('dpcr_record_id');
            $table->integer('dpcr_item_id');
            $table->integer('source_opcr_assignment_id')->nullable();
            $table->string('division_id')->nullable();
            $table->integer('group_id')->nullable();
            $table->string('emp_id', 10)->nullable();
            $table->timestamps();

            $table->index('dpcr_record_id');
            $table->index('dpcr_item_id');
            $table->index('source_opcr_assignment_id');
            $table->index('division_id');
            $table->index('group_id');
            $table->index('emp_id');
            $table->unique(['dpcr_item_id', 'division_id', 'group_id', 'emp_id'], 'dpcr_assignments_unique');
        });
    }

    public function down(): void
    {
        Schema::connection('mysql2')->dropIfExists('dpcr_assignments');
    }
};
