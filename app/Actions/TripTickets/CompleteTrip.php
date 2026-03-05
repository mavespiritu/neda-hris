<?php

namespace App\Actions\TripTickets;

use App\Services\TripTickets\CompleteTripFormBuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class CompleteTrip
{
    use AsAction;

    public function authorize(ActionRequest $request): bool
    {
        return Gate::forUser($request->user())->allows('tt.completeTrip');
    }

    public function asController(ActionRequest $request, CompleteTripFormBuilder $builder): JsonResponse
    {
        return response()->json($builder->build((int) $request->route('id')));
    }
}
