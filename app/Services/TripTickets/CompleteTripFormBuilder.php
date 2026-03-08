<?php

namespace App\Services\TripTickets;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CompleteTripFormBuilder
{
    public function build(int $tripTicketId): array
    {
        $conn2 = DB::connection('mysql2');

        $ticket = $conn2->table('trip_tickets as tt')
             ->select([
                'tt.id',
                'tt.travel_order_id',
                'tt.reference_no',
                'tt.odo_start',
                'tt.odo_end',
                'tt.fuel_filled',
                'tt.fuel_price',
            ])
            ->where('tt.id', $tripTicketId)
            ->first();

        if (! $ticket) {
            throw new \RuntimeException('Trip ticket not found.');
        }

        $destinations = $this->fetchDestinations(
                $conn2, 
                (int) $ticket->id, 
                (int) $ticket->travel_order_id
            )
            ->map(function ($d) {
                $parts = array_filter([
                    $d->location ?? null,
                    $d->citymunName ?? null,
                    $d->provinceName ?? null,
                ], fn ($v) => filled($v));

                return [
                    'id' => (int) $d->id,
                    'type' => $d->type ?? null,
                    'location' => $d->location ?? null,
                    'country' => $d->country ?? null,
                    'citymun' => $d->citymun ?? null,
                    'citymunName' => $d->citymunName ?? null,
                    'province' => $d->province ?? null,
                    'provinceName' => $d->provinceName ?? null,

                    'destination_label' => implode(', ', $parts),

                    'departure_time' => ! empty($d->departure_time)
                        ? Carbon::parse($d->departure_time)->format('H:i')
                        : '',
                    'arrival_time' => ! empty($d->arrival_time)
                        ? Carbon::parse($d->arrival_time)->format('H:i')
                        : '',
                ];
            })
            ->values();

        return [
            'data' => [
                'trip_ticket' => [
                    'id' => (int) $ticket->id,
                    'travel_order_id' => (int) $ticket->travel_order_id,
                    'reference_no' => (string) $ticket->reference_no,
                    'odo_start' => $ticket->odo_start,
                    'odo_end' => $ticket->odo_end,
                    'fuel_filled' => $ticket->fuel_filled,
                    'fuel_price' => $ticket->fuel_price,
                ],
                'destinations' => $destinations,
            ],
        ];
    }

    private function fetchDestinations($conn2, int $tripTicketId, int $travelOrderId): Collection
    {
        $rows = $conn2->table('trip_ticket_destinations')
            ->where('trip_ticket_id', $tripTicketId)
            ->orderBy('id')
            ->get();

        if ($rows->isNotEmpty()) {
            return $rows;
        }

        // fallback for legacy records
        return $conn2->table('travel_order_destinations')
            ->where('travel_order_id', $travelOrderId)
            ->orderBy('id')
            ->get();
    }

}
