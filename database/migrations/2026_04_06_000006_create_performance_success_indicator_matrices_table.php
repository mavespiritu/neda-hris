<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->create('performance_success_indicator_matrices', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('performance_success_indicator_id')->unique();
            $table->timestamps();

            $table->foreign('performance_success_indicator_id')
                ->references('id')
                ->on('performance_success_indicators')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::connection('mysql2')->dropIfExists('performance_success_indicator_matrices');
    }
};
