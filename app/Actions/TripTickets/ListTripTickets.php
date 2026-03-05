<?php

namespace App\Actions\TripTickets;

use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use App\Actions\TravelRequests\ListTripTicketsData;

class ListTripTickets
{
    use AsAction;

    public function authorize(ActionRequest $request): bool
    {
        return Gate::forUser($request->user())->allows('tt.viewAny');
    }

    public function asController(ActionRequest $request, ListTripTicketsData $dataAction): Response
    {
        $payload = $dataAction->handle($request, null);

        return Inertia::render('TripTickets/index', [
            'initialTripTickets' => $payload,
        ]);
    }
}