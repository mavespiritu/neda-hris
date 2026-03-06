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

            'destinations' => ['nullable', 'array'],
            'destinations.*.id' => ['required_with:destinations', 'integer'],
            'destinations.*.departure_time' => ['nullable', 'date_format:H:i'],
            'destinations.*.arrival_time' => ['nullable', 'date_format:H:i'],
        ];
    }

    public function asController(ActionRequest $request)
    {
        $tripTicketId = (int) $request->route('id');
        $data = $request->validated();
        $destinations = collect($data['destinations'] ?? []);
        $conn2 = DB::connection('mysql2');

        $tripTicket = $conn2->table('trip_tickets')
            ->select(['id'])
            ->where('id', $tripTicketId)
            ->first();

        if (! $tripTicket) {
            throw ValidationException::withMessages([
                'trip_ticket' => 'Trip ticket not found.',
            ]);
        }

        $conn2->transaction(function () use ($conn2, $tripTicketId, $data, $destinations) {
            $conn2->table('trip_tickets')
                ->where('id', $tripTicketId)
                ->update([
                    'odo_start' => $data['odo_start'],
                    'odo_end' => $data['odo_end'],
                    'fuel_filled' => $data['fuel_filled'] ?? null,
                    'fuel_price' => $data['fuel_price'] ?? null,
                    'updated_at' => now(),
                ]);

            foreach ($destinations as $d) {
                $conn2->table('trip_ticket_destinations')
                    ->where('id', (int) $d['id'])
                    ->where('trip_ticket_id', $tripTicketId)
                    ->update([
                        'departure_time' => ($d['departure_time'] ?? null) ?: null,
                        'arrival_time' => ($d['arrival_time'] ?? null) ?: null,
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
