<?php

namespace App\Actions\Performance\SuccessIndicator;

use App\Models\PerformanceRating;
use App\Models\PerformanceSuccessIndicator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Lorisleiva\Actions\Concerns\AsAction;

class ManageSuccessIndicators
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('libraries', 'performance');
    }

    public function asController(Request $request)
    {
        Gate::forUser($request->user())->authorize('libraries', 'performance');
        $perPage = max(1, min(1000, (int) $request->input('per_page', 20)));

        $query = PerformanceSuccessIndicator::query()
            ->with(['activity:id,activity_output', 'rating:id,name,category'])
            ->select([
                'id',
                'level',
                'category',
                'performance_activity_id',
                'performance_rating_id',
                'target',
                'measurement',
                'weight',
                'budget',
                'accountable',
                'sort_order',
                'created_by',
                'updated_by',
                'created_at',
                'updated_at',
            ])
            ->orderBy('sort_order')
            ->orderBy('id');

        if ($search = trim((string) $request->input('search', ''))) {
            $query->where(function ($builder) use ($search) {
                $builder->where('level', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('target', 'like', "%{$search}%")
                    ->orWhere('measurement', 'like', "%{$search}%")
                    ->orWhere('accountable', 'like', "%{$search}%")
                    ->orWhereHas('activity', function ($activityQuery) use ($search) {
                        $activityQuery->where('activity_output', 'like', "%{$search}%");
                    })
                    ->orWhereHas('rating', function ($ratingQuery) use ($search) {
                        $ratingQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('category', 'like', "%{$search}%");
                    });
            });
        }

        $pagination = $query->paginate($perPage)->withQueryString();
        $pagination->setCollection(
            $pagination->getCollection()->map(fn (PerformanceSuccessIndicator $record) => $this->formatRecord($record))
        );

        return response()->json($pagination);
    }

    public function store(Request $request)
    {
        Gate::forUser($request->user())->authorize('libraries', 'performance');

        $data = $request->validate([
            'level' => ['required', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:50'],
            'performance_activity_id' => ['nullable', 'integer', 'exists:mysql2.performance_activities,id'],
            'performance_rating_id' => ['nullable', 'integer', 'exists:mysql2.performance_ratings,id'],
            'target' => ['required', 'string'],
            'measurement' => ['nullable', 'string'],
            'matrix_payload' => ['nullable', 'array'],
        ]);

        $exists = PerformanceSuccessIndicator::query()
            ->whereRaw('LOWER(TRIM(level)) = ?', [strtolower(trim($data['level']))])
            ->when(
                array_key_exists('performance_activity_id', $data) && $data['performance_activity_id'] !== null,
                fn ($query) => $query->where('performance_activity_id', $data['performance_activity_id']),
                fn ($query) => $query->whereNull('performance_activity_id')
            )
            ->whereRaw('LOWER(TRIM(target)) = ?', [strtolower(trim($data['target']))])
            ->whereRaw("LOWER(TRIM(COALESCE(measurement, ''))) = ?", [strtolower(trim((string) ($data['measurement'] ?? '')))])
            ->exists();

        if ($exists) {
            return $this->errorResponse($request, 'This success indicator already exists.', 'target');
        }

        $record = PerformanceSuccessIndicator::create([
            'level' => $data['level'],
            'category' => $data['category'] ?? 'Common',
            'performance_activity_id' => $data['performance_activity_id'] ?? null,
            'performance_rating_id' => $data['performance_rating_id'] ?? null,
            'target' => $data['target'],
            'measurement' => $data['measurement'] ?? null,
            'weight' => null,
            'budget' => null,
            'accountable' => null,
            'sort_order' => ((int) (PerformanceSuccessIndicator::query()->max('sort_order') ?? 0)) + 1,
            'created_by' => $request->user()?->ipms_id,
            'updated_by' => $request->user()?->ipms_id,
        ]);

        $this->syncMatrixRows($record, $data['matrix_payload'] ?? []);
        $record->loadMissing(['activity:id,activity_output', 'rating:id,name,category']);

        return $this->successResponse($request, 'Success indicator saved successfully.', [
            'record' => $this->formatRecord($record),
        ]);
    }

    public function update(Request $request, int $id)
    {
        Gate::forUser($request->user())->authorize('libraries', 'performance');

        $data = $request->validate([
            'level' => ['required', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:50'],
            'performance_activity_id' => ['nullable', 'integer', 'exists:mysql2.performance_activities,id'],
            'performance_rating_id' => ['nullable', 'integer', 'exists:mysql2.performance_ratings,id'],
            'target' => ['required', 'string'],
            'measurement' => ['nullable', 'string'],
            'matrix_payload' => ['nullable', 'array'],
        ]);

        $record = PerformanceSuccessIndicator::query()->findOrFail($id);

        $exists = PerformanceSuccessIndicator::query()
            ->where('id', '!=', $id)
            ->whereRaw('LOWER(TRIM(level)) = ?', [strtolower(trim($data['level']))])
            ->when(
                array_key_exists('performance_activity_id', $data) && $data['performance_activity_id'] !== null,
                fn ($query) => $query->where('performance_activity_id', $data['performance_activity_id']),
                fn ($query) => $query->whereNull('performance_activity_id')
            )
            ->whereRaw('LOWER(TRIM(target)) = ?', [strtolower(trim($data['target']))])
            ->whereRaw("LOWER(TRIM(COALESCE(measurement, ''))) = ?", [strtolower(trim((string) ($data['measurement'] ?? '')))])
            ->exists();

        if ($exists) {
            return $this->errorResponse($request, 'This success indicator already exists.', 'target');
        }

        $record->update([
            'level' => $data['level'],
            'category' => $data['category'] ?? 'Common',
            'performance_activity_id' => $data['performance_activity_id'] ?? null,
            'performance_rating_id' => $data['performance_rating_id'] ?? null,
            'target' => $data['target'],
            'measurement' => $data['measurement'] ?? null,
            'updated_by' => $request->user()?->ipms_id,
        ]);

        $this->syncMatrixRows($record, $data['matrix_payload'] ?? []);
        $record->loadMissing(['activity:id,activity_output', 'rating:id,name,category']);

        return $this->successResponse($request, 'Success indicator updated successfully.');
    }

    public function destroy(Request $request, int $id)
    {
        Gate::authorize('libraries', 'performance');

        PerformanceSuccessIndicator::query()->where('id', $id)->delete();

        return $this->successResponse($request, 'Success indicator deleted successfully.');
    }

    public function bulkDestroy(Request $request)
    {
        Gate::forUser($request->user())->authorize('libraries', 'performance');

        $ids = collect($request->input('ids', []))
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        PerformanceSuccessIndicator::query()
            ->whereIn('id', $ids)
            ->delete();

        return $this->successResponse($request, 'Selected success indicators deleted successfully.');
    }

    private function syncMatrixRows(PerformanceSuccessIndicator $record, array $payload): void
    {
        DB::connection('mysql2')->transaction(function () use ($record, $payload) {
            DB::connection('mysql2')
                ->table('performance_success_indicator_matrix_rows')
                ->where('performance_success_indicator_id', $record->id)
                ->delete();

            if ($record->performance_rating_id) {
                return;
            }

            $matrix = $payload[0] ?? null;
            if (!is_array($matrix) || !isset($matrix['sections']) || !is_array($matrix['sections'])) {
                return;
            }

            foreach (array_values($matrix['sections']) as $sectionIndex => $section) {
                $ratingDimension = strtoupper((string) ($section['rating_dimension'] ?? 'Q'));

                foreach (array_values($section['rows'] ?? []) as $rowIndex => $row) {
                    $valueFrom = array_key_exists('value_from', $row) ? $row['value_from'] : null;
                    $valueTo = array_key_exists('value_to', $row) ? $row['value_to'] : null;

                    DB::connection('mysql2')->table('performance_success_indicator_matrix_rows')->insert([
                        'performance_success_indicator_id' => $record->id,
                        'rating_dimension' => $ratingDimension,
                        'score' => (int) ($row['score'] ?? (5 - $rowIndex)),
                        'enabled' => (bool) ($section['enabled'] ?? true),
                        'condition_type' => $row['condition_type'] ?? null,
                        'condition_text' => $row['condition_text'] ?? null,
                        'meaning' => $row['meaning'] ?? null,
                        'value_from' => $valueFrom === '' ? null : $valueFrom,
                        'value_to' => $valueTo === '' ? null : $valueTo,
                        'unit' => $row['unit'] ?? null,
                        'timing' => $row['timing'] ?? null,
                        'sort_order' => (($sectionIndex + 1) * 10) + $rowIndex,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        });
    }

    private function loadMatrixPayload(PerformanceSuccessIndicator $record): array
    {
        if ($record->performance_rating_id) {
            $ratingRows = DB::connection('mysql2')
                ->table('performance_rating_rows')
                ->where('performance_rating_id', $record->performance_rating_id)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get();

            if ($ratingRows->isNotEmpty()) {
                return $this->buildMatrixPayloadFromRows($ratingRows);
            }
        }

        $rows = DB::connection('mysql2')
            ->table('performance_success_indicator_matrix_rows')
            ->where('performance_success_indicator_id', $record->id)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        if ($rows->isEmpty()) {
            return [];
        }

        return $this->buildMatrixPayloadFromRows($rows);
    }

    private function buildMatrixPayloadFromRows($rows): array
    {
        $sections = collect(['Q', 'E', 'T'])->map(function ($dimension) use ($rows) {
            $dimensionRows = $rows->where('rating_dimension', $dimension)->values();

            return [
                'rating_dimension' => $dimension,
                'enabled' => (bool) ($dimensionRows->first()?->enabled ?? true),
                'rows' => $dimensionRows->map(function ($row) {
                    return [
                        'score' => (int) $row->score,
                        'condition_type' => $row->condition_type,
                        'condition_text' => $row->condition_text,
                        'meaning' => $row->meaning,
                        'value_from' => $row->value_from,
                        'value_to' => $row->value_to,
                        'unit' => $row->unit,
                        'timing' => $row->timing,
                    ];
                })->all(),
            ];
        })->all();

        return [[
            'sections' => $sections,
        ]];
    }

    private function formatRecord(PerformanceSuccessIndicator $record): array
    {
        $record->loadMissing(['activity:id,activity_output', 'rating:id,name,category']);

        return [
            'id' => $record->id,
            'label' => implode(' - ', array_filter([
                $record->activity?->activity_output,
                $record->level,
                $record->category,
                $record->target,
                $record->measurement,
            ])),
            'level' => $record->level,
            'category' => $record->category,
            'performance_activity_id' => $record->performance_activity_id,
            'performance_rating_id' => $record->performance_rating_id,
            'activity_output' => $record->activity?->activity_output,
            'rating_name' => $record->rating?->name,
            'rating_category' => $record->rating?->category,
            'target' => $record->target,
            'measurement' => $record->measurement,
            'matrix_payload' => $this->loadMatrixPayload($record),
            'weight' => $record->weight,
            'budget' => $record->budget,
            'accountable' => $record->accountable,
            'sort_order' => $record->sort_order,
        ];
    }

    private function successResponse(Request $request, string $message, ?array $data = null)
    {
        if ($request->header('X-Inertia')) {
            return redirect()->back();
        }

        return response()->json(array_filter([
            'message' => $message,
            'data' => $data,
        ], fn ($value) => $value !== null));
    }

    private function errorResponse(Request $request, string $message, string $field)
    {
        if ($request->header('X-Inertia')) {
            return back()->withErrors([$field => $message]);
        }

        return response()->json([
            'message' => $message,
            'errors' => [
                $field => [$message],
            ],
        ], 422);
    }
}
