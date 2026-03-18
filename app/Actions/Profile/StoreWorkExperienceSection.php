<?php

namespace App\Actions\Profile;

use App\Services\Profile\ProfileContextResolver;
use App\Services\Profile\ProfileStepUpdater;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use Illuminate\Support\Facades\Gate;

class StoreWorkExperienceSection
{
    use AsAction;

    public function __construct(
        protected ProfileContextResolver $contextResolver,
        protected ProfileStepUpdater $stepUpdater
    ) {
    }

    public function authorize(ActionRequest $request): bool
    {
        return $request->user() !== null;
    }

    public function asController(ActionRequest $request)
    {
        try {
            $context = $this->contextResolver->resolve();
            $user = $context['user'];
            $type = $context['type'];
            $conn = $context['appConn'];

            $conn->table('applicant')->updateOrInsert(
                [
                    'user_id' => $user->id,
                    'type' => $type,
                ],
                [
                    'user_id' => $user->id,
                    'type' => $type,
                    'emp_id' => $user->ipms_id ?? null,
                ]
            );

            $applicantId = $conn->table('applicant')
                ->where('user_id', $user->id)
                ->where('type', $type)
                ->value('id');

            $this->stepUpdater->markComplete($conn, (int) $applicantId, 'workExperience');

            return response()->json([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Work experience saved successfully.',
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to save work experience section: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving work experience.',
            ], 500);
        }
    }
}
