<?php

namespace App\Actions\TripTickets;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use App\Support\DateRange;

class CheckDriverSchedule
{
    use AsAction;

    public function authorize(ActionRequest $request): bool
    {
        return (bool) $request->user();
    }

    public function rules(): array
    {
        return [
            'driver_id' => ['required', 'string'],
            'travel_order_id' => ['required', 'integer'],
            'trip_ticket_id' => ['nullable', 'integer'],
        ];
    }

    public function asController(ActionRequest $request): JsonResponse
    {
        $data = $request->validated();
        $conn2 = DB::connection('mysql2');

        $currentOrder = $conn2->table('travel_order')
            ->select(['id', 'start_date', 'end_date', 'reference_no'])
            ->where('id', (int) $data['travel_order_id'])
            ->first();

        if (! $currentOrder) {
            return response()->json([
                'has_conflict' => false,
                'message' => 'Travel request not found.',
                'conflicts' => [],
            ]);
        }

        $conflicts = $conn2->table('trip_tickets as tt')
            ->join('travel_order as to', 'to.id', '=', 'tt.travel_order_id')
            ->select([
                'tt.id as trip_ticket_id',
                'tt.reference_no as trip_ticket_reference_no',
                'to.id as travel_order_id',
                'to.reference_no as travel_order_reference_no',
                'to.start_date',
                'to.end_date',
            ])
            ->where('tt.driver_id', (string) $data['driver_id'])
            ->when(! empty($data['trip_ticket_id']), fn ($q) => $q->where('tt.id', '!=', (int) $data['trip_ticket_id']))
            ->whereDate('to.start_date', '<=', $currentOrder->end_date)
            ->whereDate('to.end_date', '>=', $currentOrder->start_date)
            ->orderBy('to.start_date')
            ->get();

        $hasConflict = $conflicts->isNotEmpty();

        $conflict_lines = $conflicts->map(function ($c, $i) {
            $purpose = DB::connection('mysql2')
                ->table('travel_order')
                ->where('id', $c->travel_order_id)
                ->value('purpose');

            $start = \Carbon\Carbon::parse($c->start_date)->format('F j, Y');
            $end = \Carbon\Carbon::parse($c->end_date)->format('F j, Y');
            $dateLabel = $start === $end ? $start : DateRange::display($start, $end);

            return sprintf(
                '%d. TR %s - %s (%s)',
                $i + 1,
                $c->travel_order_reference_no ?? '-',
                $purpose ?: 'No purpose',
                $dateLabel
            );
        })->values();

        return response()->json([
            'has_conflict' => $hasConflict,
            'message' => $hasConflict
                ? 'Selected driver has conflicting trip schedule on the same travel date range.'
                : 'No conflict found for selected driver.',
            'conflicts' => $conflicts,
            'conflict_lines' => $conflict_lines,
        ]);
    }
}
