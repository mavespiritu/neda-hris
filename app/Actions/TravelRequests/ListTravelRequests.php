<?php

namespace App\Actions\TravelRequests;

use App\Support\IndexTableQuery;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use App\Traits\BuildsEmployeeNameMap;

class ListTravelRequests
{
    use AsAction, BuildsEmployeeNameMap;

    public function authorize(ActionRequest $request): bool
    {
        return Gate::forUser($request->user())->allows('tr.viewAny');
    }

    public function asController(ActionRequest $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');
        $user = $request->user();

        $canReview = Gate::forUser($user)->allows('tr.filterAny');

        $allowedFilters = [
            'start_date' => fn ($q, $v) => $q->whereDate('start_date', Carbon::parse($v)->format('Y-m-d')),
            'travel_type' => fn ($q, $v) => $q->where('travel_type', (string) $v),
            'travel_category_id' => fn ($q, $v) => $q->where('travel_category_id', (int) $v),
        ];

        if ($canReview) {
            $allowedFilters['employee_id'] = function ($q, $v) {
                $empId = (string) $v;
                $q->where(function ($qq) use ($empId) {
                    $qq->where('travel_order.created_by', $empId)
                        ->orWhereExists(function ($sq) use ($empId) {
                            $sq->select(DB::raw(1))
                                ->from('travel_order_staffs as s')
                                ->whereColumn('s.travel_order_id', 'travel_order.id')
                                ->where('s.emp_id', $empId);
                        });
                });
            };
        }

        $query = IndexTableQuery::for($this->baseQuery($conn2, (string) $user->ipms_id, $canReview))
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
                'create' => Gate::forUser($user)->inspect('tr.create')->allowed(),
                'review' => $canReview,
            ],
        ]);
    }

    private function baseQuery($conn2, string $userEmpId, bool $canReview)
    {
        $q = $conn2->table('travel_order')->where('request_type', 'TO');

        if ($canReview) return $q;

        return $q->where(function ($w) use ($userEmpId) {
            $w->where('travel_order.created_by', $userEmpId)
            ->orWhereExists(function ($sq) use ($userEmpId) {
                $sq->select(DB::raw(1))
                    ->from('travel_order_staffs as s')
                    ->whereColumn('s.travel_order_id', 'travel_order.id')
                    ->where('s.emp_id', $userEmpId);
            });
        });
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

        $gate = Gate::forUser($request->user());

        return $items->transform(function ($item) use ($employees, $histories, $gate) {
            $latest = $histories->get((int) $item->id);

            $item->creator = $this->employeeName($employees, $item->created_by);
            $item->status = $this->travelRequestStatusFromState($item->tr_state ?? null);

            $item->acted_by = $latest->acted_by ?? null;
            $item->acted_by_name = $this->employeeName($employees, $latest->acted_by ?? null);
            $item->remarks = $latest->remarks ?? null;
            $item->date_acted = $latest->date_acted ?? null;

            $item->can = [
                'edit' => $gate->inspect('tr.edit', $item->id)->allowed(),
                'delete' => $gate->inspect('tr.delete', $item->id)->allowed(),
                'view' => $gate->inspect('tr.view', $item->id)->allowed(),
                'submit' => $gate->inspect('tr.submit', $item->id)->allowed(),
                'return' => $gate->inspect('tr.return', $item->id)->allowed(),
                'resubmit' => $gate->inspect('tr.resubmit', $item->id)->allowed(),
                'vrSubmit' => $gate->inspect('vr.submit', $item->id)->allowed(),
                'generate' => $gate->inspect('tr.generate', $item->id)->allowed(),
            ];

            return $item;
        });
    }

    private function filterOptions($conn2, bool $canReview): array
    {
        $employeeIds = collect();

        if ($canReview) {
            $creatorIds = $conn2->table('travel_order')
                ->where('request_type', 'TO')
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

    private function travelRequestStatusFromState($state): string
    {
        if (blank($state)) return 'Draft';

        $stateClass = is_object($state) ? get_class($state) : (string) $state;

        $map = [
            \App\States\TravelRequest\Draft::class => 'Draft',
            \App\States\TravelRequest\Submitted::class => 'Submitted',
            \App\States\TravelRequest\Returned::class => 'Returned',
            \App\States\TravelRequest\Resubmitted::class => 'Resubmitted',
        ];

        return $map[$stateClass] ?? class_basename($stateClass);
    }
}
