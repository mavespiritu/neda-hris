<?php

namespace App\Actions\TravelRequests;

use App\Models\TravelRequest;
use App\Support\IndexTableQuery;
use App\Traits\AuthorizesTravelRequests;
use App\Traits\BuildsEmployeeNameMap;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class ListTravelRequests
{
    use AsAction, BuildsEmployeeNameMap, AuthorizesTravelRequests;

    public function authorize(ActionRequest $request): bool
    {
        return $request->user() !== null
            && (
                $request->user()->can('HRIS_travels.travel-requests.page.view')
                || $this->canViewAnyTravelRequests($request->user())
                || $this->canSeeAllTravelRequests($request->user())
            );
    }

    public function asController(ActionRequest $request)
    {
        $conn2 = TravelRequest::query()->getConnection();
        $conn3 = DB::connection('mysql3');
        $user = $request->user();

        $canViewSome = $user->can('HRIS_travels.travel-requests.view.some');
        $canViewAny = $user->can('HRIS_travels.travel-requests.view.any');
        $canReview = $this->canSeeAllTravelRequests($user);

        $allowedFilters = [
            'start_date' => fn ($q, $v) => $q->whereDate('start_date', Carbon::parse($v)->format('Y-m-d')),
            'travel_type' => fn ($q, $v) => $q->where('travel_type', (string) $v),
            'travel_category_id' => fn ($q, $v) => $q->where('travel_category_id', (int) $v),
        ];

        if ($canReview) {
            $allowedFilters['employee_id'] = function ($q, $v) {
                $q->visibleToEmployee((string) $v);
            };
        }

        $query = IndexTableQuery::for($this->baseQuery($user, $canReview))
            ->allowedFilters($allowedFilters)
            ->search(function ($q, string $term) {
                $q->where(function ($qq) use ($term) {
                    $qq->where('reference_no', 'like', "%{$term}%")
                        ->orWhere('travel_type', 'like', "%{$term}%")
                        ->orWhere('purpose', 'like', "%{$term}%")
                        ->orWhere('division', 'like', "%{$term}%");
                });
            })
            ->allowedSorts([
                'start_date' => 'start_date',
                'reference_no' => 'reference_no',
                'creator' => fn ($items, $direction) => $direction === 'desc'
                    ? $items->sortBy(fn ($t) => mb_strtolower((string) ($t->creator ?? '')))->reverse()
                    : $items->sortBy(fn ($t) => mb_strtolower((string) ($t->creator ?? ''))),
                'status' => fn ($items, $direction) => $direction === 'desc'
                    ? $items->sortBy(fn ($t) => mb_strtolower((string) ($t->status ?? '')))->reverse()
                    : $items->sortBy(fn ($t) => mb_strtolower((string) ($t->status ?? ''))),
            ])
            ->decorate(fn ($items, $req) => $this->decorateItems($items, $req, $conn2, $conn3))
            ->defaultSort('reference_no', 'desc')
            ->apply($request)
            ->paginate($request, 20);

        return Inertia::render('TravelOrders/index', [
            'data' => [
                'travelOrders' => $query,
                'filters' => $request->only([
                    'employee_id',
                    'travel_type',
                    'travel_category_id',
                    'start_date',
                    'sort',
                    'direction',
                    'search',
                ]),
                'filterOptions' => $this->filterOptions($conn2, $canReview),
            ],
            'can' => [
                'create' => $this->canCreateTravelRequest($user),
                'viewSome' => $canViewSome,
                'viewAny' => $canViewAny,
                'review' => $canReview,
            ],
        ]);
    }

    private function baseQuery($user, bool $canReview)
    {
        $q = TravelRequest::query()->requestType('TO');

        if ($canReview) {
            return $q;
        }

        if ($this->canUsePermission($user, 'HRIS_travels.travel-requests.view.some')) {
            return $q->visibleToDivision((string) $user->division);
        }

        return $q->visibleToEmployee((string) $user->ipms_id);
    }

    private function decorateItems($items, ActionRequest $request, $conn2, $conn3)
    {
        $ids = $items->pluck('id')->map(fn ($id) => (int) $id)->all();

        if (empty($ids)) {
            return $items;
        }

        $latestIds = $conn2->table('submission_history')
            ->where('model', 'TO')
            ->whereIn('model_id', $ids)
            ->selectRaw('MAX(id) as id')
            ->groupBy('model_id')
            ->pluck('id');

        $histories = $conn2->table('submission_history')
            ->whereIn('id', $latestIds)
            ->get()
            ->keyBy('model_id');

        $actedByIds = $histories->flatten()->pluck('acted_by');
        $creatorIds = $items->pluck('created_by');

        $employees = $this->employeeNamesById([$actedByIds, $creatorIds]);

        return $items->transform(function ($item) use ($employees, $histories) {
            $latest = $histories->get((int) $item->id);

            $item->creator = $this->employeeName($employees, $item->created_by);
            $item->status = $item->statusLabel();
            $item->acted_by = $latest->acted_by ?? null;
            $item->acted_by_name = $this->employeeName($employees, $latest->acted_by ?? null);
            $item->remarks = $latest->remarks ?? null;
            $item->date_acted = $latest->date_acted ?? null;
            $item->can = [
                'edit' => $this->canEditTravelRequest(auth()->user(), $item->id),
                'delete' => $this->canDeleteTravelRequest(auth()->user(), $item->id),
                'view' => $this->canViewTravelRequest(auth()->user(), $item->id),
                'generate' => $this->canGenerateTravelRequest(auth()->user(), $item->id),
            ];

            return $item;
        });
    }

    private function filterOptions($conn2, bool $canReview): array
    {
        $employeeIds = collect();

        if ($canReview) {
            $creatorIds = TravelRequest::query()
                ->requestType('TO')
                ->pluck('created_by');

            $staffIds = $conn2->table('travel_order_staffs as s')
                ->join('travel_order as t', 't.id', '=', 's.travel_order_id')
                ->where('t.request_type', 'TO')
                ->pluck('s.emp_id');

            $employeeIds = $creatorIds->merge($staffIds)->filter()->unique()->values();
        }

        $employeesById = $this->employeeNamesById($employeeIds, 'mysql3');

        $employees = $employeeIds->map(fn ($id) => [
            'value' => (string) $id,
            'label' => $this->employeeName($employeesById, $id),
        ])->sortBy('label')->values();

        $travelTypes = collect([
            ['value' => 'Local', 'label' => 'Local'],
            ['value' => 'Foreign', 'label' => 'Foreign'],
        ]);

        $categories = $conn2->table('travel_order_categories as toc')
            ->select(['toc.id', 'toc.title'])
            ->whereIn('toc.id', function ($q) use ($conn2) {
                $q->from('travel_order')
                    ->where('request_type', 'TO')
                    ->whereNotNull('travel_category_id')
                    ->select('travel_category_id')
                    ->distinct();
            })
            ->orderBy('toc.title')
            ->get()
            ->map(fn ($c) => [
                'value' => (string) $c->id,
                'label' => (string) $c->title,
            ])
            ->values();

        return [
            'employees' => $employees,
            'travel_types' => $travelTypes,
            'travel_categories' => $categories,
        ];
    }
}