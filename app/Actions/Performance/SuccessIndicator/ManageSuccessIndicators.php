<?php

namespace App\Actions\Performance\SuccessIndicator;

use App\Models\PerformanceLibraryItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Lorisleiva\Actions\Concerns\AsAction;

class ManageSuccessIndicators
{
    use AsAction;

    private const ITEM_TYPE = 'Success Indicator';

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
                'scope as level',
                'target',
                'created_at',
                'updated_at',
            ])
            ->where('item_type', self::ITEM_TYPE)
            ->latest('id');

        if ($search = trim((string) $request->input('search', ''))) {
            $query->where(function ($builder) use ($search) {
                $builder->where('scope', 'like', "%{$search}%")
                    ->orWhere('target', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate($perPage)->withQueryString());
    }

    public function store(Request $request)
    {
        Gate::forUser($request->user())->authorize('libraries', 'performance');

        $data = $request->validate([
            'level' => ['required', 'string', 'max:100'],
            'target' => ['required', 'string'],
        ]);

        $exists = PerformanceLibraryItem::query()
            ->where('item_type', self::ITEM_TYPE)
            ->whereRaw('LOWER(TRIM(scope)) = ?', [strtolower(trim($data['level']))])
            ->whereRaw('LOWER(TRIM(target)) = ?', [strtolower(trim($data['target']))])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'This success indicator already exists.',
                'errors' => [
                    'target' => ['This success indicator already exists.'],
                ],
            ], 422);
        }

        PerformanceLibraryItem::create([
            'item_type' => self::ITEM_TYPE,
            'scope' => $data['level'],
            'target' => $data['target'],
        ]);

        return response()->json(['message' => 'Success indicator saved successfully.']);
    }

    public function update(Request $request, int $id)
    {
        Gate::forUser($request->user())->authorize('libraries', 'performance');

        $data = $request->validate([
            'level' => ['required', 'string', 'max:100'],
            'target' => ['required', 'string'],
        ]);

        $record = PerformanceLibraryItem::query()
            ->where('item_type', self::ITEM_TYPE)
            ->findOrFail($id);

        $exists = PerformanceLibraryItem::query()
            ->where('item_type', self::ITEM_TYPE)
            ->where('id', '!=', $id)
            ->whereRaw('LOWER(TRIM(scope)) = ?', [strtolower(trim($data['level']))])
            ->whereRaw('LOWER(TRIM(target)) = ?', [strtolower(trim($data['target']))])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'This success indicator already exists.',
                'errors' => [
                    'target' => ['This success indicator already exists.'],
                ],
            ], 422);
        }

        $record->update([
            'scope' => $data['level'],
            'target' => $data['target'],
        ]);

        return response()->json(['message' => 'Success indicator updated successfully.']);
    }

    public function destroy(int $id)
    {
        Gate::authorize('libraries', 'performance');

        PerformanceLibraryItem::query()
            ->where('item_type', self::ITEM_TYPE)
            ->where('id', $id)
            ->delete();

        return response()->json(['message' => 'Success indicator deleted successfully.']);
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

        return response()->json(['message' => 'Selected success indicators deleted successfully.']);
    }
}
