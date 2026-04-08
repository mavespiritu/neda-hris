<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->create('performance_success_indicator_matrix_rows', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('performance_success_indicator_matrix_section_id');
            $table->tinyInteger('score');
            $table->string('condition_type', 20)->nullable();
            $table->text('condition_text')->nullable();
            $table->text('meaning')->nullable();
            $table->decimal('value_from', 14, 4)->nullable();
            $table->decimal('value_to', 14, 4)->nullable();
            $table->string('unit', 50)->nullable();
            $table->string('timing', 20)->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('performance_success_indicator_matrix_section_id')
                ->references('id')
                ->on('performance_success_indicator_matrix_sections')
                ->onDelete('cascade');

            $table->unique(['performance_success_indicator_matrix_section_id', 'score'], 'psi_matrix_rows_unique');
        });
    }

    public function down(): void
    {
        Schema::connection('mysql2')->dropIfExists('performance_success_indicator_matrix_rows');
    }
};
