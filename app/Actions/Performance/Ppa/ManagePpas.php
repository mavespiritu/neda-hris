<?php

namespace App\Actions\Performance\Ppa;

use App\Models\PerformanceLibraryItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Lorisleiva\Actions\Concerns\AsAction;

class ManagePpas
{
    use AsAction;

    private const ITEM_TYPE = 'PAP';

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('libraries', 'performance');
    }

    public function asController(Request $request)
    {
        Gate::forUser($request->user())->authorize('libraries', 'performance');
        $perPage = max(1, min(1000, (int) $request->input('per_page', 20)));

        $query = PerformanceLibraryItem::query()
            ->select([
                'id',
                'title as activity',
                'description',
                'created_at',
                'updated_at',
            ])
            ->where('item_type', self::ITEM_TYPE)
            ->latest('id');

        if ($search = trim((string) $request->input('search', ''))) {
            $query->where(function ($builder) use ($search) {
                $builder->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate($perPage)->withQueryString());
    }

    public function store(Request $request)
    {
        Gate::forUser($request->user())->authorize('libraries', 'performance');

        $data = $request->validate([
            'activity' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $exists = PerformanceLibraryItem::query()
            ->where('item_type', self::ITEM_TYPE)
            ->whereRaw('LOWER(TRIM(title)) = ?', [strtolower(trim($data['activity']))])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'This PAP already exists.',
                'errors' => [
                    'activity' => ['This PAP already exists.'],
                ],
            ], 422);
        }

        PerformanceLibraryItem::create([
            'item_type' => self::ITEM_TYPE,
            'title' => $data['activity'],
            'description' => $data['description'] ?? null,
        ]);

        return response()->json(['message' => 'PAP saved successfully.']);
    }

    public function update(Request $request, int $id)
    {
        Gate::forUser($request->user())->authorize('libraries', 'performance');

        $data = $request->validate([
            'activity' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $record = PerformanceLibraryItem::query()
            ->where('item_type', self::ITEM_TYPE)
            ->findOrFail($id);

        $exists = PerformanceLibraryItem::query()
            ->where('item_type', self::ITEM_TYPE)
            ->where('id', '!=', $id)
            ->whereRaw('LOWER(TRIM(title)) = ?', [strtolower(trim($data['activity']))])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'This PAP already exists.',
                'errors' => [
                    'activity' => ['This PAP already exists.'],
                ],
            ], 422);
        }

        $record->update([
            'title' => $data['activity'],
            'description' => $data['description'] ?? null,
        ]);

        return response()->json(['message' => 'PAP updated successfully.']);
    }

    public function destroy(int $id)
    {
        Gate::authorize('libraries', 'performance');

        PerformanceLibraryItem::query()
            ->where('item_type', self::ITEM_TYPE)
            ->where('id', $id)
            ->delete();

        return response()->json(['message' => 'PAP deleted successfully.']);
    }

    public function bulkDestroy(Request $request)
    {
        Gate::forUser($request->user())->authorize('libraries', 'performance');

        $ids = collect($request->input('ids', []))
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        PerformanceLibraryItem::query()
            ->where('item_type', self::ITEM_TYPE)
            ->whereIn('id', $ids)
            ->delete();

        return response()->json(['message' => 'Selected PAPs deleted successfully.']);
    }
}
