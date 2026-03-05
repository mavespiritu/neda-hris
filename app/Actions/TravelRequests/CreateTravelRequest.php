<?php

namespace App\Actions\TravelRequests;

use App\Services\TravelRequests\TravelRequestFormBuilder;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class CreateTravelRequest
{
    use AsAction;

    public function authorize(ActionRequest $request): bool
    {
        return Gate::forUser($request->user())->allows('tr.create');
    }

    public function asController(ActionRequest $request, TravelRequestFormBuilder $builder)
    {
        return Inertia::render('TravelOrders/Create', $builder->build());
    }
}
