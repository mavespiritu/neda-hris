<?php

namespace App\Actions\Performance\Activity;

use App\Models\PerformanceActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Lorisleiva\Actions\Concerns\AsAction;

class ManageActivities
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

        $query = PerformanceActivity::query()
            ->select([
                'id',
                'activity_output',
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
                $builder->where('activity_output', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate($perPage)->withQueryString());
    }

    public function store(Request $request)
    {
        Gate::forUser($request->user())->authorize('libraries', 'performance');

        $data = $request->validate([
            'activity_output' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $exists = PerformanceActivity::query()
            ->whereRaw('LOWER(TRIM(activity_output)) = ?', [strtolower(trim($data['activity_output']))])
            ->exists();

        if ($exists) {
            return $this->errorResponse($request, 'This activity/output already exists.', 'activity_output');
        }

        $record = PerformanceActivity::create([
            'activity_output' => $data['activity_output'],
            'description' => $data['description'] ?? null,
            'sort_order' => ((int) (PerformanceActivity::query()->max('sort_order') ?? 0)) + 1,
            'created_by' => $request->user()?->ipms_id,
            'updated_by' => $request->user()?->ipms_id,
        ]);

        return $this->successResponse($request, 'Activity/output saved successfully.', [
            'id' => $record->id,
            'activity_output' => $record->activity_output,
            'description' => $record->description,
            'sort_order' => $record->sort_order,
        ]);
    }

    public function update(Request $request, int $id)
    {
        Gate::forUser($request->user())->authorize('libraries', 'performance');

        $data = $request->validate([
            'activity_output' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $record = PerformanceActivity::query()->findOrFail($id);

        $exists = PerformanceActivity::query()
            ->where('id', '!=', $id)
            ->whereRaw('LOWER(TRIM(activity_output)) = ?', [strtolower(trim($data['activity_output']))])
            ->exists();

        if ($exists) {
            return $this->errorResponse($request, 'This activity/output already exists.', 'activity_output');
        }

        $record->update([
            'activity_output' => $data['activity_output'],
            'description' => $data['description'] ?? null,
            'updated_by' => $request->user()?->ipms_id,
        ]);

        return $this->successResponse($request, 'Activity/output updated successfully.');
    }

    public function destroy(Request $request, int $id)
    {
        Gate::authorize('libraries', 'performance');

        PerformanceActivity::query()->where('id', $id)->delete();

        return $this->successResponse($request, 'Activity/output deleted successfully.');
    }

    public function bulkDestroy(Request $request)
    {
        Gate::forUser($request->user())->authorize('libraries', 'performance');

        $ids = collect($request->input('ids', []))
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        PerformanceActivity::query()->whereIn('id', $ids)->delete();

        return $this->successResponse($request, 'Selected activities/outputs deleted successfully.');
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
