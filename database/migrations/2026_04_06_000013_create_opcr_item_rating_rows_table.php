<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->create('opcr_item_rating_rows', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('opcr_item_id');
            $table->unsignedBigInteger('success_indicator_id')->nullable();
            $table->string('rating_dimension', 10);
            $table->tinyInteger('score');
            $table->boolean('enabled')->default(true);
            $table->string('condition_type', 20)->nullable();
            $table->text('condition_text')->nullable();
            $table->text('meaning')->nullable();
            $table->decimal('value_from', 14, 4)->nullable();
            $table->decimal('value_to', 14, 4)->nullable();
            $table->string('unit', 50)->nullable();
            $table->string('timing', 20)->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('opcr_item_id')
                ->references('id')
                ->on('opcr_items')
                ->onDelete('cascade');

            $table->foreign('success_indicator_id')
                ->references('id')
                ->on('performance_success_indicators')
                ->nullOnDelete();

            $table->unique(['opcr_item_id', 'rating_dimension', 'score'], 'opcr_item_rating_rows_unique');
            $table->index('success_indicator_id');
            $table->index('rating_dimension');
            $table->index('sort_order');
        });
    }

    public function down(): void
    {
        Schema::connection('mysql2')->dropIfExists('opcr_item_rating_rows');
    }
};
