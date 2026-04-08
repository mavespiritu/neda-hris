<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->create('performance_activities', function (Blueprint $table) {
            $table->id();
            $table->string('activity_output');
            $table->text('description')->nullable();
            $table->integer('sort_order')->default(0);
            $table->string('created_by', 10)->nullable();
            $table->string('updated_by', 10)->nullable();
            $table->timestamps();

            $table->unique('activity_output');
            $table->index('sort_order');
        });
    }

    public function down(): void
    {
        Schema::connection('mysql2')->dropIfExists('performance_activities');
    }
};
