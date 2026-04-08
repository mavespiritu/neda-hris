<?php

namespace App\Actions\Performance\Categories;

use App\Models\PerformanceCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Lorisleiva\Actions\Concerns\AsAction;

class ManageCategories
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

        $query = PerformanceCategory::query()
            ->select([
                'id',
                'category',
                'description',
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
                $builder->where('category', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate($perPage)->withQueryString());
    }

    public function store(Request $request)
    {
        Gate::forUser($request->user())->authorize('libraries', 'performance');

        $data = $request->validate([
            'category' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $exists = PerformanceCategory::query()
            ->whereRaw('LOWER(TRIM(category)) = ?', [strtolower(trim($data['category']))])
            ->exists();

        if ($exists) {
            return $this->errorResponse($request, 'This Category already exists.', 'category');
        }

        $record = PerformanceCategory::create([
            'category' => $data['category'],
            'description' => $data['description'] ?? null,
            'sort_order' => (int) (PerformanceCategory::query()->max('sort_order') ?? 0) + 1,
            'created_by' => $request->user()?->ipms_id,
            'updated_by' => $request->user()?->ipms_id,
        ]);

        return $this->successResponse($request, 'Category saved successfully.', [
            'id' => $record->id,
            'category' => $record->category,
            'description' => $record->description,
            'sort_order' => $record->sort_order,
        ]);
    }

    public function update(Request $request, int $id)
    {
        Gate::forUser($request->user())->authorize('libraries', 'performance');

        $data = $request->validate([
            'category' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $record = PerformanceCategory::query()->findOrFail($id);

        $exists = PerformanceCategory::query()
            ->where('id', '!=', $id)
            ->whereRaw('LOWER(TRIM(category)) = ?', [strtolower(trim($data['category']))])
            ->exists();

        if ($exists) {
            return $this->errorResponse($request, 'This Category already exists.', 'category');
        }

        $record->update([
            'category' => $data['category'],
            'description' => $data['description'] ?? null,
            'updated_by' => $request->user()?->ipms_id,
        ]);

        return $this->successResponse($request, 'Category updated successfully.');
    }

    public function destroy(Request $request, int $id)
    {
        Gate::authorize('libraries', 'performance');

        PerformanceCategory::query()->where('id', $id)->delete();

        return $this->successResponse($request, 'Category deleted successfully.');
    }

    public function bulkDestroy(Request $request)
    {
        Gate::forUser($request->user())->authorize('libraries', 'performance');

        $ids = collect($request->input('ids', []))
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        PerformanceCategory::query()
            ->whereIn('id', $ids)
            ->delete();

        return $this->successResponse($request, 'Selected Categories deleted successfully.');
    }

    public function reorder(Request $request)
    {
        Gate::forUser($request->user())->authorize('libraries', 'performance');

        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
        ]);

        DB::connection('mysql2')->transaction(function () use ($data, $request) {
            foreach (array_values($data['ids']) as $index => $id) {
                PerformanceCategory::query()
                    ->where('id', (int) $id)
                    ->update([
                        'sort_order' => $index + 1,
                        'updated_by' => $request->user()?->ipms_id,
                    ]);
            }
        });

        return $this->successResponse($request, 'Categories reordered successfully.');
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



