<?php

namespace App\Actions\Profile;

use App\Services\Profile\LearningAndDevelopmentFormBuilder;
use App\Services\Profile\ProfileContextResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use Illuminate\Support\Facades\Gate;

class EditLearningAndDevelopment
{
    use AsAction;

    public function __construct(
        protected ProfileContextResolver $contextResolver,
        protected LearningAndDevelopmentFormBuilder $builder
    ) {
    }

    public function authorize(ActionRequest $request): bool
    {
        return $request->user() !== null;
    }

    public function asController(ActionRequest $request, int $id): JsonResponse
    {
        try {
            $context = $this->contextResolver->resolve();

            return response()->json(
                $this->builder->build($context, $id)
            );
        } catch (\Throwable $e) {
            Log::error('Failed to fetch learning and development record: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while fetching the record.',
            ], 500);
        }
    }
}
