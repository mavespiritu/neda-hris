<?php

namespace App\Services\TravelRequests;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TravelRequestFormBuilder
{
    public function build(?int $travelOrderId = null): array
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $categories = $this->categories($conn2);
        $fundSources = $this->fundSources($conn2);

        $signatories = $this->signatories($conn2);
        $activeEmployees = $this->activeEmployees($conn3);

        [$employees, $approver] = $this->employeesWithRecommenders($activeEmployees, $signatories);

        $payload = [
            'data' => [
                'categories' => $categories,
                'fundSources' => $fundSources,
                'employees' => $employees,
                'approver' => $approver,
                'reference_no' => $this->nextReferenceNo($conn2),
            ],
        ];

        if ($travelOrderId !== null) {
            $payload['data'] = array_merge(
                $payload['data'],
                $this->editPayload($conn2, $travelOrderId)
            );
        }

        return $payload;
    }

    private function editPayload($conn2, int $id): array
    {
        $order = $conn2->table('travel_order')->where('id', $id)->first();
        if (!$order) {
            throw new \RuntimeException('Travel order not found.');
        }

        $staffs = $conn2->table('travel_order_staffs')
            ->select(['id', 'emp_id', 'recommender_id', 'approver_id'])
            ->where('travel_order_id', $id)
            ->get()
            ->map(fn ($s) => [
                'id' => (int) $s->id,
                'emp_id' => (string) $s->emp_id,
                'recommender_id' => $s->recommender_id ? (string) $s->recommender_id : null,
                'approver_id' => $s->approver_id ? (string) $s->approver_id : null,
            ])->values();

        $destinations = $conn2->table('travel_order_destinations')
            ->where('travel_order_id', $id)
            ->get()
            ->map(function ($d) {
                $isMetroManila = (bool) ($d->isMetroManila ?? false);
                return [
                    'id' => (int) $d->id,
                    'type' => $d->type,
                    'country' => $d->country,
                    'location' => $d->location,
                    'province' => $isMetroManila ? '' : ($d->province ?? ''),
                    'provinceName' => $isMetroManila ? 'Metro Manila' : ($d->provinceName ?? ''),
                    'isMetroManila' => $isMetroManila,
                    'district' => $isMetroManila ? ($d->district ?? '') : '',
                    'districtName' => $isMetroManila ? ($d->districtName ?? '') : '',
                    'citymun' => $d->citymun ?? '',
                    'citymunName' => $d->citymunName ?? '',
                ];
            })->values();

        $commutation = $conn2->table('travel_order_expenses')
            ->select(['id', 'particulars', 'amount'])
            ->where('travel_order_id', $id)
            ->get()
            ->map(fn ($e) => [
                'id' => (int) $e->id,
                'particulars' => $e->particulars,
                'amount' => (float) $e->amount,
            ])->values();

        return [
            'reference_no' => $order->reference_no,
            'data' => [
                'id' => $order->id,
                'reference_no' => $order->reference_no,
                'travel_category_id' => $order->travel_category_id,
                'start_date' => $order->start_date,
                'end_date' => $order->end_date,
                'purpose' => $order->purpose,
                'fund_source_id' => $order->fund_source_id,
                'other_passengers' => $order->other_passengers,
                'other_vehicles' => $order->other_vehicles,
                'other_drivers' => $order->other_drivers,
                'isRequestingVehicle' => (bool) $order->isRequestingVehicle,
                'date_created' => $order->date_created,
                'staffs' => $staffs,
                'destinations' => $destinations,
                'commutation_expenses' => $commutation,
                'est_distance' => $order->est_distance,
                'est_departure_time' => $order->est_departure_time,
                'est_arrival_time' => $order->est_arrival_time,
            ],
        ];
    }

    private function categories($conn2): Collection
    {
        return $conn2->table('travel_order_categories')
            ->select(['id as value', 'title as label'])
            ->orderBy('title')
            ->get();
    }

    private function fundSources($conn2): Collection
    {
        return $conn2->table('travel_order_fund_sources')
            ->select(['id as value', 'title as label'])
            ->orderBy('title')
            ->get();
    }

    private function signatories($conn2): Collection
    {
        return $conn2->table('travel_order_signatories')
            ->select(['id', 'type', 'signatory', 'designation', 'division'])
            ->whereIn('type', ['Recommending_Staff_TO', 'Recommending_DC_TO', 'Approver_TO'])
            ->whereNotNull('signatory')
            ->where('signatory', '!=', '')
            ->get();
    }

    private function activeEmployees($conn3): Collection
    {
        return $conn3->table('tblemployee')
            ->select([
                'emp_id',
                DB::raw("
                    CONCAT(
                        fname, ' ',
                        IF(mname IS NOT NULL AND mname != '', CONCAT(LEFT(mname,1), '. '), ''),
                        lname
                    ) as name
                "),
                'division_id',
            ])
            ->where('work_status', 'active')
            ->orderBy('lname')
            ->orderBy('fname')
            ->orderBy('mname')
            ->get();
    }

    private function employeesWithRecommenders(Collection $activeEmployees, Collection $signatories): array
    {
        $employeesById = $activeEmployees->keyBy(fn ($e) => (string) $e->emp_id);

        $staffIds = $signatories->where('type', 'Recommending_Staff_TO')
            ->pluck('signatory')
            ->map(fn ($v) => (string) $v)
            ->unique()
            ->values();

        $dcIds = $signatories->where('type', 'Recommending_DC_TO')
            ->pluck('signatory')
            ->map(fn ($v) => (string) $v)
            ->unique()
            ->values();

        $approverSignatory = $signatories->where('type', 'Approver_TO')->sortByDesc('id')->first();

        $toLite = function ($emp) {
            if (!$emp) return null;
            return [
                'emp_id' => (string) $emp->emp_id,
                'name' => (string) $emp->name,
                'division_id' => $emp->division_id,
            ];
        };

        $approver = null;
        if ($approverSignatory) {
            $approverEmp = $employeesById->get((string) $approverSignatory->signatory);
            if ($approverEmp) {
                $approver = $toLite($approverEmp);
                $approver['designation'] = $approverSignatory->designation;
            }
        }

        $staffByDivision = $activeEmployees
            ->filter(fn ($e) => $staffIds->contains((string) $e->emp_id))
            ->groupBy('division_id')
            ->map(fn ($group) => $group->first());

        $dcRecommender = $activeEmployees
            ->filter(fn ($e) => $dcIds->contains((string) $e->emp_id))
            ->sortBy(fn ($e) => mb_strtolower((string) $e->name))
            ->first();

        $dcLite = $toLite($dcRecommender);
        $isRecommendingStaff = $staffIds->flip();

        $employees = $activeEmployees
            ->map(function ($emp) use ($isRecommendingStaff, $staffByDivision, $dcLite, $toLite) {
                return [
                    'emp_id' => (string) $emp->emp_id,
                    'name' => (string) $emp->name,
                    'division_id' => $emp->division_id,
                    'recommending' => isset($isRecommendingStaff[(string) $emp->emp_id])
                        ? $dcLite
                        : $toLite($staffByDivision->get($emp->division_id)),
                ];
            })
            ->keyBy('emp_id');

        return [$employees, $approver];
    }

    private function nextReferenceNo($conn2): string
    {
        $year = now()->format('Y');

        $latestRef = $conn2->table('travel_order')
        ->where('request_type', 'TO')
        ->whereRaw('LEFT(reference_no, 4) = ?', [$year])
        ->whereRaw('CHAR_LENGTH(reference_no) = 8')
        ->whereRaw('reference_no REGEXP "^[0-9]{8}$"')
        ->orderByDesc('reference_no')
        ->value('reference_no');

        if (!$latestRef) return $year . '0001';

        $counter = (int) substr((string) $latestRef, 4);
        return $year . str_pad((string) ($counter + 1), 4, '0', STR_PAD_LEFT);
    }
}
