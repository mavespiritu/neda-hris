<?php

namespace App\Actions\Performance\Rating;

use App\Models\PerformanceRating;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Lorisleiva\Actions\Concerns\AsAction;

class ManageRatings
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

        $query = PerformanceRating::query()
            ->withCount('rows')
            ->select([
                'id',
                'name',
                'category',
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
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%");
            });
        }

        $pagination = $query->paginate($perPage)->withQueryString();
        $pagination->setCollection(
            $pagination->getCollection()->map(fn (PerformanceRating $record) => $this->formatRecord($record))
        );

        return response()->json($pagination);
    }

    public function store(Request $request)
    {
        Gate::forUser($request->user())->authorize('libraries', 'performance');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:50'],
            'matrix_payload' => ['nullable', 'array'],
        ]);

        $exists = PerformanceRating::query()
            ->whereRaw('LOWER(TRIM(name)) = ?', [strtolower(trim($data['name']))])
            ->exists();

        if ($exists) {
            return $this->errorResponse($request, 'This rating already exists.', 'name');
        }

        $record = PerformanceRating::create([
            'name' => $data['name'],
            'category' => $data['category'] ?? 'Common',
            'sort_order' => ((int) (PerformanceRating::query()->max('sort_order') ?? 0)) + 1,
            'created_by' => $request->user()?->ipms_id,
            'updated_by' => $request->user()?->ipms_id,
        ]);

        $this->syncRows($record, $data['matrix_payload'] ?? []);

        return $this->successResponse($request, 'Rating saved successfully.', [
            'record' => $this->formatRecord($record),
        ]);
    }

    public function update(Request $request, int $id)
    {
        Gate::forUser($request->user())->authorize('libraries', 'performance');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:50'],
            'matrix_payload' => ['nullable', 'array'],
        ]);

        $record = PerformanceRating::query()->findOrFail($id);

        $exists = PerformanceRating::query()
            ->where('id', '!=', $id)
            ->whereRaw('LOWER(TRIM(name)) = ?', [strtolower(trim($data['name']))])
            ->exists();

        if ($exists) {
            return $this->errorResponse($request, 'This rating already exists.', 'name');
        }

        $record->update([
            'name' => $data['name'],
            'category' => $data['category'] ?? 'Common',
            'updated_by' => $request->user()?->ipms_id,
        ]);

        $this->syncRows($record, $data['matrix_payload'] ?? []);

        return $this->successResponse($request, 'Rating updated successfully.');
    }

    public function destroy(Request $request, int $id)
    {
        Gate::authorize('libraries', 'performance');
        PerformanceRating::query()->where('id', $id)->delete();
        return $this->successResponse($request, 'Rating deleted successfully.');
    }

    public function bulkDestroy(Request $request)
    {
        Gate::forUser($request->user())->authorize('libraries', 'performance');
        $ids = collect($request->input('ids', []))
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        PerformanceRating::query()->whereIn('id', $ids)->delete();
        return $this->successResponse($request, 'Selected ratings deleted successfully.');
    }

    private function syncRows(PerformanceRating $record, array $payload): void
    {
        DB::connection('mysql2')->transaction(function () use ($record, $payload) {
            DB::connection('mysql2')->table('performance_rating_rows')->where('performance_rating_id', $record->id)->delete();

            $matrix = $payload[0] ?? null;
            if (!is_array($matrix) || !isset($matrix['sections']) || !is_array($matrix['sections'])) {
                return;
            }

            foreach (array_values($matrix['sections']) as $sectionIndex => $section) {
                $dimension = strtoupper((string) ($section['rating_dimension'] ?? 'Q'));

                foreach (array_values($section['rows'] ?? []) as $rowIndex => $row) {
                    $valueFrom = array_key_exists('value_from', $row) ? $row['value_from'] : null;
                    $valueTo = array_key_exists('value_to', $row) ? $row['value_to'] : null;

                    DB::connection('mysql2')->table('performance_rating_rows')->insert([
                        'performance_rating_id' => $record->id,
                        'rating_dimension' => $dimension,
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

    private function loadMatrixRows(PerformanceRating $record): array
    {
        $rows = DB::connection('mysql2')
            ->table('performance_rating_rows')
            ->where('performance_rating_id', $record->id)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

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

        return [[ 'sections' => $sections ]];
    }

    private function formatRecord(PerformanceRating $record): array
    {
        return [
            'id' => $record->id,
            'name' => $record->name,
            'category' => $record->category,
            'rows_count' => $record->rows_count ?? 0,
            'matrix_rows' => $this->loadMatrixRows($record),
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
            'errors' => [$field => [$message]],
        ], 422);
    }
}
