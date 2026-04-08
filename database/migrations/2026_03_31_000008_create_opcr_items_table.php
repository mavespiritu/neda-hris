<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->create('opcr_items', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('opcr_record_id');
            $table->string('item_type', 20)->default('category');
            $table->unsignedBigInteger('category_id')->nullable();
            $table->integer('parent_item_id')->nullable();
            $table->unsignedInteger('item_level')->default(1);
            $table->unsignedBigInteger('pap_id')->nullable();
            $table->unsignedInteger('pap_sort_order')->default(0);
            $table->unsignedBigInteger('success_indicator_id')->nullable();
            $table->unsignedInteger('success_indicator_sort_order')->default(0);
            $table->integer('parent_pap_id')->nullable();
            $table->string('pap_title')->nullable();
            $table->unsignedInteger('category_sort_order')->default(0);
            $table->text('success_indicator_title')->nullable();
            $table->decimal('weight', 8, 2)->nullable();
            $table->decimal('allocated_budget', 14, 2)->nullable();
            $table->text('remarks')->nullable();
            $table->string('created_by', 10)->nullable();
            $table->string('updated_by', 10)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('opcr_record_id');
            $table->index('item_type');
            $table->index('category_id');
            $table->index('parent_item_id');
            $table->index('item_level');
            $table->index('pap_id');
            $table->index('pap_sort_order');
            $table->index('success_indicator_id');
            $table->index('success_indicator_sort_order');
            $table->index('parent_pap_id');
            $table->index('category_sort_order');
            $table->index('sort_order');

            $table->foreign('opcr_record_id')->references('id')->on('opcr_records')->onDelete('cascade');
            $table->foreign('category_id')->references('id')->on('performance_categories')->nullOnDelete();
            $table->foreign('parent_item_id')->references('id')->on('opcr_items')->onDelete('cascade');
            $table->foreign('pap_id')->references('id')->on('performance_paps')->nullOnDelete();
            $table->foreign('success_indicator_id')->references('id')->on('performance_success_indicators')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::connection('mysql2')->dropIfExists('opcr_items');
    }
};
