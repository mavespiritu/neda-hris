<?php

namespace App\Actions\Performance\Program;

use App\Models\PerformanceLibraryItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Lorisleiva\Actions\Concerns\AsAction;

class ManagePrograms
{
    use AsAction;

    private const ITEM_TYPE = 'Program';

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
                'title as program',
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
            'program' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $exists = PerformanceLibraryItem::query()
            ->where('item_type', self::ITEM_TYPE)
            ->whereRaw('LOWER(TRIM(title)) = ?', [strtolower(trim($data['program']))])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'This Program already exists.',
                'errors' => [
                    'program' => ['This Program already exists.'],
                ],
            ], 422);
        }

        PerformanceLibraryItem::create([
            'item_type' => self::ITEM_TYPE,
            'title' => $data['program'],
            'description' => $data['description'] ?? null,
        ]);

        return response()->json(['message' => 'Program saved successfully.']);
    }

    public function update(Request $request, int $id)
    {
        Gate::forUser($request->user())->authorize('libraries', 'performance');

        $data = $request->validate([
            'program' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $record = PerformanceLibraryItem::query()
            ->where('item_type', self::ITEM_TYPE)
            ->findOrFail($id);

        $exists = PerformanceLibraryItem::query()
            ->where('item_type', self::ITEM_TYPE)
            ->where('id', '!=', $id)
            ->whereRaw('LOWER(TRIM(title)) = ?', [strtolower(trim($data['program']))])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'This Program already exists.','errors' => [
                    'program' => ['This Program already exists.'],
                ],
            ], 422);
        }

        $record->update([
            'title' => $data['program'],
            'description' => $data['description'] ?? null,
        ]);

        return response()->json(['message' => 'Program updated successfully.']);
    }

    public function destroy(int $id)
    {
        Gate::authorize('libraries', 'performance');

        PerformanceLibraryItem::query()
            ->where('item_type', self::ITEM_TYPE)
            ->where('id', $id)
            ->delete();

        return response()->json(['message' => 'Program deleted successfully.']);
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

        return response()->json(['message' => 'Selected Programs deleted successfully.']);
    }
}
