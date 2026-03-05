<?php

namespace App\Actions\TripTickets;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class StoreCompleteTrip
{
    use AsAction;

    public function authorize(ActionRequest $request): bool
    {
        return Gate::forUser($request->user())->allows('tt.completeTrip');
    }

    public function rules(): array
    {
        return [
            'odo_start' => ['required', 'numeric'],
            'odo_end' => ['required', 'numeric', 'gte:odo_start'],
            'fuel_filled' => ['nullable', 'numeric', 'min:0'],
            'fuel_price' => ['nullable', 'numeric', 'min:0'],

            'destinations' => ['required', 'array', 'min:1'],
            'destinations.*.id' => ['required', 'integer'],
            'destinations.*.departure_time' => ['nullable', 'date_format:H:i'],
            'destinations.*.arrival_time' => ['nullable', 'date_format:H:i'],
        ];
    }

    public function asController(ActionRequest $request)
    {
        $tripTicketId = (int) $request->route('id');
        $data = $request->validated();
        $conn2 = DB::connection('mysql2');

        $tripTicket = $conn2->table('trip_tickets')
            ->select(['id', 'travel_order_id'])
            ->where('id', $tripTicketId)
            ->first();

        if (! $tripTicket) {
            throw ValidationException::withMessages([
                'trip_ticket' => 'Trip ticket not found.',
            ]);
        }

        $travelOrderId = (int) $tripTicket->travel_order_id;

        $inputDestinationIds = collect($data['destinations'])->pluck('id')->map(fn ($v) => (int) $v)->values();

        $validDestinationIds = $conn2->table('travel_order_destinations')
            ->where('travel_order_id', $travelOrderId)
            ->whereIn('id', $inputDestinationIds)
            ->pluck('id')
            ->map(fn ($v) => (int) $v)
            ->values();

        if ($validDestinationIds->count() !== $inputDestinationIds->count()) {
            throw ValidationException::withMessages([
                'destinations' => 'One or more destinations are invalid for this trip ticket.',
            ]);
        }

        $conn2->transaction(function () use ($conn2, $tripTicketId, $travelOrderId, $data) {
            $conn2->table('trip_tickets')
                ->where('id', $tripTicketId)
                ->update([
                    'odo_start' => $data['odo_start'],
                    'odo_end' => $data['odo_end'],
                    'fuel_filled' => $data['fuel_filled'] ?? null,
                    'fuel_price' => $data['fuel_price'] ?? null,
                    'updated_at' => now(),
                ]);

            foreach ($data['destinations'] as $d) {
                $conn2->table('travel_order_destinations')
                    ->where('id', (int) $d['id'])
                    ->where('travel_order_id', $travelOrderId)
                    ->update([
                        'departure_time' => $d['departure_time'] ?: null,
                        'arrival_time' => $d['arrival_time'] ?: null,
                    ]);
            }
        });

        return back()->with([
            'status' => 'success',
            'title' => 'Saved',
            'message' => 'Trip completed successfully.',
        ]);
    }
}
