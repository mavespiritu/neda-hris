<?php

namespace App\Actions\TravelRequests;

use App\Services\TripTickets\TripTicketFormBuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class CreateTripTicket
{
    use AsAction;

    public function authorize(ActionRequest $request): bool
    {
        $vehicleRequestId = $request->route('id') ?? $request->input('travel_order_id');

        if (blank($vehicleRequestId)) {
            return Gate::forUser($request->user())->allows('tt.create');
        }

        return Gate::forUser($request->user())
            ->allows('tt.createByVehicleRequest', (int) $vehicleRequestId);
    }

    public function asController(ActionRequest $request, TripTicketFormBuilder $builder): JsonResponse
    {
        $routeId = $request->route('id');
        $vehicleRequestId = $request->filled('travel_order_id')
            ? (int) $request->input('travel_order_id')
            : ($routeId !== null ? (int) $routeId : null);

        $lockTravelRequest = $routeId !== null;

        $payload = $builder->build(
            vehicleRequestId: $vehicleRequestId,
            lockTravelRequest: $lockTravelRequest
        );

        return response()->json($payload);
    }
}
