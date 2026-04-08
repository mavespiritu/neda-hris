<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('mysql2')->create('performance_success_indicators', function (Blueprint $table) {
            $table->id();
            $table->string('level', 100);
            $table->text('target');
            $table->text('measurement')->nullable();
            $table->decimal('weight', 14, 2)->nullable();
            $table->decimal('budget', 14, 2)->nullable();
            $table->string('accountable')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->string('created_by', 10)->nullable();
            $table->string('updated_by', 10)->nullable();
            $table->timestamps();
        });

        $rows = collect();

        if (Schema::connection('mysql2')->hasTable('performance_library_items')) {
            $rows = $rows->concat(
                DB::connection('mysql2')
                    ->table('performance_library_items')
                    ->where('item_type', 'Success Indicator')
                    ->orderBy('id')
                    ->get()
                    ->map(function ($row) {
                        return [
                            'level' => $row->scope ?? 'OPCR',
                            'target' => $row->target,
                            'measurement' => $row->measurement ?? null,
                            'weight' => $row->weight === null || $row->weight === '' ? null : (float) str_replace(',', '', (string) $row->weight),
                            'budget' => $row->budget === null || $row->budget === '' ? null : (float) str_replace(',', '', (string) $row->budget),
                            'accountable' => $row->accountable ?? null,
                            'created_at' => $row->created_at ?? now(),
                            'updated_at' => $row->updated_at ?? now(),
                        ];
                    })
            );
        }

        if (Schema::connection('mysql2')->hasTable('performance_success_indicator_libraries')) {
            $rows = $rows->concat(
                DB::connection('mysql2')
                    ->table('performance_success_indicator_libraries')
                    ->orderBy('id')
                    ->get()
                    ->map(function ($row) {
                        return [
                            'level' => $row->level,
                            'target' => $row->target,
                            'measurement' => null,
                            'weight' => $row->weight === null || $row->weight === '' ? null : (float) str_replace(',', '', (string) $row->weight),
                            'budget' => $row->budget === null || $row->budget === '' ? null : (float) str_replace(',', '', (string) $row->budget),
                            'accountable' => $row->accountable ?? null,
                            'created_at' => $row->created_at ?? now(),
                            'updated_at' => $row->updated_at ?? now(),
                        ];
                    })
            );
        }

        $rows = $rows
            ->unique(function ($row) {
                return strtolower(trim((string) ($row['level'] ?? '')))
                    . '|'
                    . strtolower(trim((string) ($row['target'] ?? '')))
                    . '|'
                    . strtolower(trim((string) ($row['measurement'] ?? '')));
            })
            ->values()
            ->map(function ($row, $index) {
                $row['sort_order'] = $index + 1;
                $row['created_by'] = null;
                $row['updated_by'] = null;

                return $row;
            });

        if ($rows->isNotEmpty()) {
            DB::connection('mysql2')->table('performance_success_indicators')->insert($rows->all());
        }
    }

    public function down(): void
    {
        Schema::connection('mysql2')->dropIfExists('performance_success_indicators');
    }
};
