<?php

namespace App\Actions\Profile;

use App\Services\Profile\ProfileContextResolver;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use Illuminate\Support\Facades\Gate;

class ShowProfile
{
    use AsAction;

    public function __construct(
        protected ProfileContextResolver $contextResolver
    ) {}

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

            $progress = [];

            if ($context['applicant']) {
                $progress = $context['appConn']->table('applicant_pds')
                    ->where('applicant_id', $context['applicant']->id)
                    ->pluck('status', 'step')
                    ->toArray();
            }

            return Inertia::render('MyProfile2/index', [
                'applicantId' => $context['applicant']->id ?? null,
                'profileType' => $context['type'],
                'progress' => $progress,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to render profile page: ' . $e->getMessage());

            abort(500, 'Unable to load profile page.');
        }
    }
}
