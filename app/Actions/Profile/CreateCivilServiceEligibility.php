<?php

namespace App\Actions\Profile;

use App\Services\Profile\CivilServiceEligibilityFormBuilder;
use App\Services\Profile\ProfileContextResolver;
use Illuminate\Http\JsonResponse;
use Lorisleiva\Actions\Concerns\AsAction;
use Lorisleiva\Actions\ActionRequest;

class CreateCivilServiceEligibility
{
    use AsAction;

    public function __construct(
        protected ProfileContextResolver $contextResolver,
        protected CivilServiceEligibilityFormBuilder $builder
    ) {
    }
    
    public function authorize(ActionRequest $request): bool
    {
        return $request->user() !== null;
    }

    public function asController(): JsonResponse
    {
        $context = $this->contextResolver->resolve();

        return response()->json(
            $this->builder->build($context)
        );
    }
}
