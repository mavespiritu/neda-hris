<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->create('opcr_assignments', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('opcr_record_id');
            $table->integer('opcr_item_id');
            $table->string('division_id')->nullable();
            $table->unsignedBigInteger('group_id')->nullable();
            $table->string('emp_id', 10)->nullable();
            $table->timestamps();

            $table->index('opcr_record_id');
            $table->index('opcr_item_id');
            $table->index('division_id');
            $table->index('group_id');
            $table->index('emp_id');
            $table->unique(['opcr_item_id', 'division_id', 'group_id', 'emp_id'], 'opcr_assignments_unique');
        });
    }

    public function down(): void
    {
        Schema::connection('mysql2')->dropIfExists('opcr_assignments');
    }
};
