<?php

namespace App\Actions\Profile;

use App\Services\Profile\FamilyBackgroundFormBuilder;
use App\Services\Profile\ProfileContextResolver;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use Illuminate\Support\Facades\Gate;

class ShowFamilyBackground
{
    use AsAction;

    public function __construct(
        protected ProfileContextResolver $contextResolver,
        protected FamilyBackgroundFormBuilder $builder
    ) {
    }

    public function authorize(ActionRequest $request): bool
    {
        $applicantId = $request->filled('applicantId')
            ? (int) $request->input('applicantId')
            : null;

        return Gate::forUser($request->user())->allows('profile.view', $applicantId);
    }

    public function asController(ActionRequest $request)
    {
        try {
            $context = $this->contextResolver->resolve();
            $payload = $this->builder->build($context);
            return response()->json($payload);
        } catch (\Throwable $e) {
            Log::error('Failed to fetch family background: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while fetching family background. Please try again.',
            ], 500);
        }
    }
}
