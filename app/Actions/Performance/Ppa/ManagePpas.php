<?php

namespace App\Actions\Performance\Ppa;

use App\Models\PerformancePap;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Lorisleiva\Actions\Concerns\AsAction;

class ManagePpas
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

        $query = PerformancePap::query()
            ->with(['identifier.subProgram.program'])
            ->select(['id', 'identifier_id', 'short_code', 'title'])
            ->orderBy('title')
            ->orderBy('id');

        if ($search = trim((string) $request->input('search', ''))) {
            $query->where(function ($builder) use ($search) {
                $builder->where('short_code', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%");
            });
        }

        $pagination = $query->paginate($perPage)->withQueryString();
        $pagination->setCollection(
            $pagination->getCollection()->map(fn (PerformancePap $record) => $this->formatRecord($record))
        );

        return response()->json($pagination);
    }

    public function store(Request $request)
    {
        Gate::forUser($request->user())->authorize('libraries', 'performance');

        $data = $request->validate([
            'short_code' => ['nullable', 'string', 'max:100'],
            'title' => ['nullable', 'string', 'max:255'],
            'activity' => ['nullable', 'string', 'max:255'],
        ]);

        $shortCode = trim((string) ($data['short_code'] ?? ''));
        $title = trim((string) ($data['title'] ?? $data['activity'] ?? ''));

        if ($title === '') {
            return $this->errorResponse($request, 'Please provide a title for the MFO/PAP.', 'title');
        }

        $exists = PerformancePap::query()
            ->whereRaw("LOWER(TRIM(COALESCE(short_code, ''))) = ?", [strtolower($shortCode)])
            ->whereRaw('LOWER(TRIM(title)) = ?', [strtolower($title)])
            ->exists();

        if ($exists) {
            return $this->errorResponse($request, 'This MFO/PAP already exists.', 'title');
        }

        $record = PerformancePap::create([
            'short_code' => $shortCode !== '' ? $shortCode : null,
            'title' => $title,
        ]);

        return $this->successResponse($request, 'MFO/PAP saved successfully.', [
            'id' => $record->id,
            'short_code' => $record->short_code,
            'title' => $record->title,
            'label' => $record->label,
            'activity' => $record->activity,
            'program_title' => $record->program_title,
        ]);
    }

    public function update(Request $request, int $id)
    {
        Gate::forUser($request->user())->authorize('libraries', 'performance');

        $data = $request->validate([
            'short_code' => ['nullable', 'string', 'max:100'],
            'title' => ['nullable', 'string', 'max:255'],
            'activity' => ['nullable', 'string', 'max:255'],
        ]);

        $record = PerformancePap::query()->findOrFail($id);
        $shortCode = trim((string) ($data['short_code'] ?? ''));
        $title = trim((string) ($data['title'] ?? $data['activity'] ?? ''));

        if ($title === '') {
            return $this->errorResponse($request, 'Please provide a title for the MFO/PAP.', 'title');
        }

        $exists = PerformancePap::query()
            ->where('id', '!=', $id)
            ->whereRaw("LOWER(TRIM(COALESCE(short_code, ''))) = ?", [strtolower($shortCode)])
            ->whereRaw('LOWER(TRIM(title)) = ?', [strtolower($title)])
            ->exists();

        if ($exists) {
            return $this->errorResponse($request, 'This MFO/PAP already exists.', 'title');
        }

        $record->update([
            'short_code' => $shortCode !== '' ? $shortCode : null,
            'title' => $title,
        ]);

        return $this->successResponse($request, 'MFO/PAP updated successfully.');
    }

    public function destroy(Request $request, int $id)
    {
        Gate::authorize('libraries', 'performance');

        PerformancePap::query()->where('id', $id)->delete();

        return $this->successResponse($request, 'MFO/PAP deleted successfully.');
    }

    public function bulkDestroy(Request $request)
    {
        Gate::forUser($request->user())->authorize('libraries', 'performance');

        $ids = collect($request->input('ids', []))
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        PerformancePap::query()->whereIn('id', $ids)->delete();

        return $this->successResponse($request, 'Selected MFO/PAP items deleted successfully.');
    }

    private function formatRecord(PerformancePap $record): array
    {
        return [
            'id' => $record->id,
            'short_code' => $record->short_code,
            'title' => $record->title,
            'label' => $record->label,
            'activity' => $record->activity,
            'program_title' => $record->program_title,
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

