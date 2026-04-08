<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->create('opcr_records', function (Blueprint $table) {
            $table->increments('id');
            $table->smallInteger('year');
            $table->enum('period_type', ['yearly', 'semestral'])->default('yearly');
            $table->unsignedTinyInteger('period_no')->nullable();
            $table->string('title')->nullable();
            $table->string('state')->default('Draft');
            $table->text('state_remarks')->nullable();
            $table->string('created_by', 10)->nullable();
            $table->string('updated_by', 10)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::connection('mysql2')->dropIfExists('opcr_records');
    }
};
