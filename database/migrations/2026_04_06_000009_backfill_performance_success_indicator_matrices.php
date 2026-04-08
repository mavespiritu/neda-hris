<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::connection('mysql2')->transaction(function () {
            $records = DB::connection('mysql2')
                ->table('performance_success_indicators')
                ->select(['id', 'matrix_payload'])
                ->whereNotNull('matrix_payload')
                ->get();

            foreach ($records as $record) {
                $exists = DB::connection('mysql2')
                    ->table('performance_success_indicator_matrices')
                    ->where('performance_success_indicator_id', $record->id)
                    ->exists();

                if ($exists) {
                    continue;
                }

                $payload = $record->matrix_payload;
                if (is_string($payload)) {
                    $payload = json_decode($payload, true);
                }

                if (!is_array($payload) || empty($payload)) {
                    continue;
                }

                $matrix = $payload[0] ?? null;
                if (!is_array($matrix) || !isset($matrix['sections']) || !is_array($matrix['sections'])) {
                    continue;
                }

                $matrixId = DB::connection('mysql2')->table('performance_success_indicator_matrices')->insertGetId([
                    'performance_success_indicator_id' => $record->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                foreach (array_values($matrix['sections']) as $sectionIndex => $section) {
                    $sectionId = DB::connection('mysql2')->table('performance_success_indicator_matrix_sections')->insertGetId([
                        'performance_success_indicator_matrix_id' => $matrixId,
                        'rating_dimension' => strtoupper((string) ($section['rating_dimension'] ?? 'Q')),
                        'enabled' => (bool) ($section['enabled'] ?? true),
                        'sort_order' => $sectionIndex + 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    foreach (array_values($section['rows'] ?? []) as $rowIndex => $row) {
                        $valueFrom = array_key_exists('value_from', $row) ? $row['value_from'] : null;
                        $valueTo = array_key_exists('value_to', $row) ? $row['value_to'] : null;

                        DB::connection('mysql2')->table('performance_success_indicator_matrix_rows')->insert([
                            'performance_success_indicator_matrix_section_id' => $sectionId,
                            'score' => (int) ($row['score'] ?? (5 - $rowIndex)),
                            'condition_type' => $row['condition_type'] ?? null,
                            'condition_text' => $row['condition_text'] ?? null,
                            'meaning' => $row['meaning'] ?? null,
                            'value_from' => $valueFrom === '' ? null : $valueFrom,
                            'value_to' => $valueTo === '' ? null : $valueTo,
                            'unit' => $row['unit'] ?? null,
                            'timing' => $row['timing'] ?? null,
                            'sort_order' => $rowIndex + 1,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }
        });
    }

    public function down(): void
    {
        DB::connection('mysql2')->transaction(function () {
            $records = DB::connection('mysql2')
                ->table('performance_success_indicators')
                ->select('id')
                ->get();

            foreach ($records as $record) {
                DB::connection('mysql2')
                    ->table('performance_success_indicator_matrices')
                    ->where('performance_success_indicator_id', $record->id)
                    ->delete();
            }
        });
    }
};
