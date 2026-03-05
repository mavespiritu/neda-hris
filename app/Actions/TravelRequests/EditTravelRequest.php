<?php

namespace App\Actions\TravelRequests;

use App\Services\TravelRequests\TravelRequestFormBuilder;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class EditTravelRequest
{
    use AsAction;

    public function authorize(ActionRequest $request): bool
    {
        $id = (int) $request->route('id');
        return Gate::forUser($request->user())->allows('tr.edit', $id);
    }

    public function asController(ActionRequest $request, TravelRequestFormBuilder $builder)
    {
        $id = (int) $request->route('id');
        return Inertia::render('TravelOrders/Edit', $builder->build($id));
    }
}
