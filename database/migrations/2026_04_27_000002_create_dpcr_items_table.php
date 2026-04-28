<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->create('dpcr_items', function (Blueprint $table) {
            $table->integer('id', true, false);
            $table->integer('dpcr_record_id');
            $table->integer('source_opcr_item_id')->nullable();
            $table->string('item_type', 20)->default('category');
            $table->integer('category_id')->nullable();
            $table->integer('parent_item_id')->nullable();
            $table->integer('item_level')->default(1);
            $table->integer('pap_id')->nullable();
            $table->integer('pap_sort_order')->default(0);
            $table->integer('success_indicator_id')->nullable();
            $table->integer('success_indicator_sort_order')->default(0);
            $table->integer('parent_pap_id')->nullable();
            $table->string('pap_title')->nullable();
            $table->integer('category_sort_order')->default(0);
            $table->text('success_indicator_title')->nullable();
            $table->decimal('weight', 8, 2)->nullable();
            $table->decimal('allocated_budget', 14, 2)->nullable();
            $table->text('remarks')->nullable();
            $table->string('created_by', 10)->nullable();
            $table->string('updated_by', 10)->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('dpcr_record_id');
            $table->index('source_opcr_item_id');
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
        });
    }

    public function down(): void
    {
        Schema::connection('mysql2')->dropIfExists('dpcr_items');
    }
};
