<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->create('group_members', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('group_id');
            $table->string('employee_ipms_id', 10);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('sort_order');
            $table->index('employee_ipms_id');
            $table->unique(['group_id', 'employee_ipms_id']);
            $table->foreign('group_id')
                ->references('id')
                ->on('groups')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::connection('mysql2')->dropIfExists('group_members');
    }
};
