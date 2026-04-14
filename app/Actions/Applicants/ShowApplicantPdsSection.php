<?php

namespace App\Actions\Applicants;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowApplicantPdsSection
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.applicants.create');
    }

    public function asController(Request $request, string $section)
    {
        $applicantId = $request->filled('applicantId')
            ? (int) $request->input('applicantId')
            : null;

        try {
            return match ($section) {
                'personalInformation' => response()->json(app(ShowPersonalInformation::class)->handle($applicantId)),
                'familyBackground' => response()->json(app(ShowFamilyBackground::class)->handle($applicantId)),
                'educationalBackground' => response()->json(app(ShowEducationalBackground::class)->handle($applicantId)),
                'civilServiceEligibility' => response()->json(app(ShowCivilServiceEligibility::class)->handle($applicantId)),
                'workExperience' => response()->json(app(ShowWorkExperience::class)->handle($applicantId)),
                'voluntaryWork' => response()->json(app(ShowVoluntaryWork::class)->handle($applicantId)),
                'learningAndDevelopment' => response()->json(app(ShowLearningAndDevelopment::class)->handle($applicantId)),
                'otherInformation' => response()->json(app(ShowOtherInformation::class)->handle($applicantId)),
                'review' => response()->json(app(ShowApplicantPds::class)->handle($applicantId)),
                default => response()->json([
                    'status' => 'error',
                    'title' => 'Section Not Found',
                    'message' => "Unknown PDS section: {$section}",
                ], 404),
            };
        } catch (\Throwable $e) {
            Log::error('Failed to fetch applicant PDS section: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while fetching the PDS section. Please try again.',
            ], 500);
        }
    }
}
