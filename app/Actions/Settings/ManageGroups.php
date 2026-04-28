<?php

namespace App\Actions\Settings;

use App\Models\PerformanceGroup;
use App\Models\PerformanceGroupMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Lorisleiva\Actions\Concerns\AsAction;

class ManageGroups
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

        $query = PerformanceGroup::query()
            ->select([
                'id',
                'name',
                'description',
                'sort_order',
                'created_by',
                'updated_by',
                'created_at',
                'updated_at',
            ])
            ->with([
                'members' => fn ($builder) => $builder->select([
                    'id',
                    'group_id',
                    'emp_id',
                    'sort_order',
                ]),
            ])
            ->withCount('members')
            ->orderBy('sort_order')
            ->orderBy('id');

        if ($search = trim((string) $request->input('search', ''))) {
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate($perPage)->withQueryString());
    }

    public function store(Request $request)
    {
        Gate::forUser($request->user())->authorize('libraries', 'performance');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'members' => ['nullable', 'array'],
            'members.*' => ['string', 'max:10', Rule::exists('mysql3.tblemployee', 'emp_id')],
        ]);

        $exists = PerformanceGroup::query()
            ->whereRaw('LOWER(TRIM(name)) = ?', [strtolower(trim($data['name']))])
            ->exists();

        if ($exists) {
            return redirect()->back()->withErrors([
                'name' => 'This group already exists.',
            ]);
        }

        $record = PerformanceGroup::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'sort_order' => ((int) (PerformanceGroup::query()->max('sort_order') ?? 0)) + 1,
            'created_by' => $request->user()?->ipms_id,
            'updated_by' => $request->user()?->ipms_id,
        ]);

        $this->syncMembers($record, $data['members'] ?? []);
        $record->load('members');

        return redirect()->back()->with([
            'status' => 'success',
            'title' => 'Success!',
            'message' => 'Group saved successfully.',
        ]);
    }

    public function update(Request $request, int $id)
    {
        Gate::forUser($request->user())->authorize('libraries', 'performance');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'members' => ['nullable', 'array'],
            'members.*' => ['string', 'max:10', Rule::exists('mysql3.tblemployee', 'emp_id')],
        ]);

        $record = PerformanceGroup::query()->findOrFail($id);

        $exists = PerformanceGroup::query()
            ->where('id', '!=', $id)
            ->whereRaw('LOWER(TRIM(name)) = ?', [strtolower(trim($data['name']))])
            ->exists();

        if ($exists) {
            return redirect()->back()->withErrors([
                'name' => 'This group already exists.',
            ]);
        }

        $record->update([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'updated_by' => $request->user()?->ipms_id,
        ]);

        $this->syncMembers($record, $data['members'] ?? []);

        return redirect()->back()->with([
            'status' => 'success',
            'title' => 'Success!',
            'message' => 'Group updated successfully.',
        ]);
    }

    public function destroy(int $id)
    {
        Gate::authorize('libraries', 'performance');

        PerformanceGroup::query()->where('id', $id)->delete();

        return response()->json(['message' => 'Group deleted successfully.']);
    }

    public function bulkDestroy(Request $request)
    {
        Gate::forUser($request->user())->authorize('libraries', 'performance');

        $ids = collect($request->input('ids', []))
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        PerformanceGroup::query()
            ->whereIn('id', $ids)
            ->delete();

        return response()->json(['message' => 'Selected groups deleted successfully.']);
    }

    protected function syncMembers(PerformanceGroup $group, array $members): void
    {
        $memberIds = collect($members)
            ->filter()
            ->map(fn ($member) => trim((string) $member))
            ->unique()
            ->values();

        DB::connection('mysql2')->transaction(function () use ($group, $memberIds) {
            PerformanceGroupMember::query()
                ->where('group_id', $group->id)
                ->delete();

            if ($memberIds->isEmpty()) {
                return;
            }

            PerformanceGroupMember::query()->insert(
                $memberIds->map(fn ($memberId, $index) => [
                    'group_id' => $group->id,
                    'emp_id' => $memberId,
                    'sort_order' => $index + 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ])->all()
            );
        });
    }
}
