<?php

namespace App\Actions\Feedbacks;

use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Lorisleiva\Actions\Concerns\AsAction;

class ListFeedbacks
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.feedbacks.page.view');
    }

    public function asController(Request $request)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');

        $search = Str::lower(trim((string) $request->input('search', '')));
        $sort = (string) $request->input('sort', 'date_submitted');
        $direction = strtolower((string) $request->input('direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        $perPage = max((int) $request->input('per_page', 20), 1);
        $currentPage = max((int) $request->input('page', 1), 1);

        $feedbackRows = $conn->table('application_feedback as af')
            ->join('application as a', 'a.id', '=', 'af.application_id')
            ->join('applicant as ap', 'ap.id', '=', 'a.applicant_id')
            ->select([
                'af.id',
                'af.application_id',
                'a.vacancy_id',
                'af.rating',
                'af.feedback',
                'af.created_at as date_submitted',
                DB::raw("TRIM(CONCAT(
                    COALESCE(ap.last_name, ''),
                    ', ',
                    COALESCE(ap.first_name, ''),
                    IF(ap.middle_name IS NULL OR ap.middle_name = '', '', CONCAT(' ', UPPER(LEFT(ap.middle_name, 1)), '.')),
                    IF(ap.ext_name IS NULL OR ap.ext_name = '', '', CONCAT(' ', ap.ext_name))
                )) as applicant_name"),
            ])
            ->get();

        $vacancyIds = $feedbackRows
            ->pluck('vacancy_id')
            ->filter()
            ->unique()
            ->values();

        $vacancies = $vacancyIds->isNotEmpty()
            ? $conn2->table('vacancy')
                ->whereIn('id', $vacancyIds)
                ->select(['id', 'position', 'position_description', 'item_no'])
                ->get()
                ->keyBy('id')
            : collect();

        $items = $feedbackRows->map(function ($row) use ($vacancies) {
            $vacancy = $vacancies->get($row->vacancy_id);

            return (object) [
                'id' => (int) $row->id,
                'application_id' => (int) $row->application_id,
                'position_applied' => trim((string) ($vacancy->position_description ?? $vacancy->position ?? '')) ?: '-',
                'date_submitted' => $row->date_submitted,
                'applicant_name' => trim((string) ($row->applicant_name ?? '')) ?: '-',
                'rating' => (int) $row->rating,
                'feedback' => trim((string) ($row->feedback ?? '')),
            ];
        });

        if ($search !== '') {
            $items = $items->filter(function ($item) use ($search) {
                $haystacks = [
                    Str::lower((string) ($item->position_applied ?? '')),
                    Str::lower((string) ($item->applicant_name ?? '')),
                    Str::lower((string) ($item->feedback ?? '')),
                    (string) ($item->rating ?? ''),
                    Str::lower((string) ($item->date_submitted ?? '')),
                ];

                foreach ($haystacks as $haystack) {
                    if ($search !== '' && str_contains($haystack, $search)) {
                        return true;
                    }
                }

                return false;
            })->values();
        }

        $items = $this->sortItems($items, $sort, $direction);

        $total = $items->count();
        $currentPage = min($currentPage, max((int) ceil($total / $perPage), 1));
        $pageItems = $items->forPage($currentPage, $perPage)->values();

        $feedbacks = new LengthAwarePaginator(
            $pageItems,
            $total,
            $perPage,
            $currentPage,
            [
                'path' => $request->url(),
                'query' => $request->query(),
            ]
        );

        return Inertia::render('Feedbacks/index', [
            'data' => [
                'feedbacks' => $feedbacks,
            ],
        ]);
    }

    private function sortItems(Collection $items, string $sort, string $direction): Collection
    {
        $descending = $direction === 'desc';

        return match ($sort) {
            'position_applied' => $items->sortBy(
                fn ($item) => Str::lower((string) ($item->position_applied ?? '')),
                SORT_REGULAR,
                $descending
            )->values(),
            'applicant_name' => $items->sortBy(
                fn ($item) => Str::lower((string) ($item->applicant_name ?? '')),
                SORT_REGULAR,
                $descending
            )->values(),
            'rating' => $items->sortBy(
                fn ($item) => (int) ($item->rating ?? 0),
                SORT_NUMERIC,
                $descending
            )->values(),
            default => $items->sortBy(
                fn ($item) => strtotime((string) ($item->date_submitted ?? '')) ?: 0,
                SORT_NUMERIC,
                $descending
            )->values(),
        };
    }

    private function hasPermission(object $user, string $permission): bool
    {
        if (method_exists($user, 'hasPermissionTo') && $user->hasPermissionTo($permission)) {
            return true;
        }

        $permissions = collect();

        if (method_exists($user, 'getAllPermissionsRecursive')) {
            $permissions = $permissions->merge($user->getAllPermissionsRecursive());
        } elseif (isset($user->permissions)) {
            $permissions = $permissions->merge($user->permissions);
        }

        if ($permissions->contains('name', $permission)) {
            return true;
        }

        $roles = collect();

        if (method_exists($user, 'getAllRolesRecursive')) {
            $roles = $roles->merge($user->getAllRolesRecursive());
        } elseif (isset($user->roles)) {
            $roles = $roles->merge($user->roles);
        }

        foreach ($roles as $role) {
            if (method_exists($role, 'allPermissionsRecursive')) {
                if ($role->allPermissionsRecursive()->contains('name', $permission)) {
                    return true;
                }
                continue;
            }

            if (isset($role->permissions) && collect($role->permissions)->contains('name', $permission)) {
                return true;
            }
        }

        return false;
    }
}
