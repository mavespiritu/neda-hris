<?php

namespace App\Actions\TravelRequests;

use App\Services\TravelRequests\TravelRequestFormBuilder;

use Inertia\Inertia;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use App\Traits\AuthorizesTravelRequests;

class CreateTravelRequest
{
    use AsAction, AuthorizesTravelRequests;

    public function authorize(ActionRequest $request): bool
    {
        return $this->canCreateTravelRequest($request->user());
    }

    public function asController(ActionRequest $request, TravelRequestFormBuilder $builder)
    {
        return Inertia::render('TravelOrders/Create', $builder->build());
    }
}
