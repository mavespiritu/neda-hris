<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->create('performance_success_indicator_matrix_sections', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('performance_success_indicator_matrix_id');
            $table->string('rating_dimension', 10);
            $table->boolean('enabled')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('performance_success_indicator_matrix_id')
                ->references('id')
                ->on('performance_success_indicator_matrices')
                ->onDelete('cascade');

            $table->unique(['performance_success_indicator_matrix_id', 'rating_dimension'], 'psi_matrix_sections_unique');
        });
    }

    public function down(): void
    {
        Schema::connection('mysql2')->dropIfExists('performance_success_indicator_matrix_sections');
    }
};
