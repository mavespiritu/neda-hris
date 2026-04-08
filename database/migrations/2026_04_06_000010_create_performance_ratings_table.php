<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->create('performance_ratings', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category', 50)->default('Common');
            $table->integer('sort_order')->default(0);
            $table->string('created_by', 10)->nullable();
            $table->string('updated_by', 10)->nullable();
            $table->timestamps();
            $table->unique('name', 'performance_ratings_name_unique');
        });
    }

    public function down(): void
    {
        Schema::connection('mysql2')->dropIfExists('performance_ratings');
    }
};
