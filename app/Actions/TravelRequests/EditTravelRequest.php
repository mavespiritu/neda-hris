<?php

namespace App\Actions\TravelRequests;

use App\Services\TravelRequests\TravelRequestFormBuilder;

use Inertia\Inertia;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use App\Traits\AuthorizesTravelRequests;

class EditTravelRequest
{
    use AsAction, AuthorizesTravelRequests;

    public function authorize(ActionRequest $request): bool
    {
        $id = (int) $request->route('id');
        return $this->canEditTravelRequest($request->user(), $id);
    }

    public function asController(ActionRequest $request, TravelRequestFormBuilder $builder)
    {
        $id = (int) $request->route('id');
        return Inertia::render('TravelOrders/Edit', $builder->build($id));
    }
}
