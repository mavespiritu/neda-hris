<?php

namespace App\Actions\Profile;

use App\Services\Profile\VoluntaryWorkTableBuilder;
use App\Services\Profile\ProfileContextResolver;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use Illuminate\Support\Facades\Gate;

class ShowVoluntaryWork
{
    use AsAction;

    public function __construct(
        protected ProfileContextResolver $contextResolver,
        protected VoluntaryWorkTableBuilder $builder
    ) {
    }

    public function asController(ActionRequest $request)
    {
        try {
            $context = $this->contextResolver->resolve();
            $payload = $this->builder->build($context);
            return response()->json($payload);
        } catch (\Throwable $e) {
            Log::error('Failed to fetch voluntary work: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while fetching voluntary work. Please try again.',
            ], 500);
        }
    }
}
