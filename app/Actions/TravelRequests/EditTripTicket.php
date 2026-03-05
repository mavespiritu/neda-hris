<?php

namespace App\Actions\TravelRequests;

use App\Services\TripTickets\TripTicketFormBuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class EditTripTicket
{
    use AsAction;

    public function authorize(ActionRequest $request): bool
    {
        $tripTicketId = (int) $request->route('id');

        $vehicleRequestId = (int) DB::connection('mysql2')
            ->table('trip_tickets')
            ->where('id', $tripTicketId)
            ->value('travel_order_id');

        if (! $vehicleRequestId) {
            return false;
        }

        return Gate::forUser($request->user())->allows('tt.editByVehicleRequest', $vehicleRequestId);
    }

    public function asController(ActionRequest $request, TripTicketFormBuilder $builder): JsonResponse
    {
        $tripTicketId = (int) $request->route('id');

        $lockTravelRequest = $request->boolean('lock_travel_request', true);

        $payload = $builder->build(
            tripTicketId: $tripTicketId,
            lockTravelRequest: $lockTravelRequest
        );

        return response()->json($payload);
    }
}
