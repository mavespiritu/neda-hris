<?php

namespace App\Actions\Applicants;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowApplicantPds
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.applicants.create');
    }

    public function handle(?int $id = null): array
    {
        return [
            'personalInformation' => app(ShowPersonalInformation::class)->handle($id),
            'familyBackground' => app(ShowFamilyBackground::class)->handle($id),
            'educationalBackground' => app(ShowEducationalBackground::class)->handle($id),
            'civilServiceEligibility' => app(ShowCivilServiceEligibility::class)->handle($id),
            'workExperience' => app(ShowWorkExperience::class)->handle($id),
            'voluntaryWork' => app(ShowVoluntaryWork::class)->handle($id),
            'learningAndDevelopment' => app(ShowLearningAndDevelopment::class)->handle($id),
            'otherInformation' => app(ShowOtherInformation::class)->handle($id),
        ];
    }

    public function asController(Request $request, ?int $id = null)
    {
        $id = $id ?? ($request->filled('applicantId') ? (int) $request->input('applicantId') : null);

        try {
            return response()->json($this->handle($id));
        } catch (\Throwable $e) {
            Log::error('Failed to fetch full PDS: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while fetching the PDS. Please try again.'
            ], 500);
        }
    }
}
