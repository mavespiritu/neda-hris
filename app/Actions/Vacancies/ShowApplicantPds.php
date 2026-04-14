<?php

namespace App\Actions\Vacancies;

use Illuminate\Http\Request;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowApplicantPds
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.vacancies.applicants.view');
    }

    public function asController(Request $request, int $id)
    {
        $support = app(ApplicantDataSupport::class);

        try {
            return response()->json([
                'personalInformation' => $support->getPersonalInformationData($id),
                'familyBackground' => $support->getFamilyBackgroundData($id),
                'educationalBackground' => $support->getEducationalBackgroundData($id),
                'civilServiceEligibility' => $support->getCivilServiceEligibilityData($id),
                'workExperience' => $support->getWorkExperienceData($id),
                'voluntaryWork' => $support->getVoluntaryWorkData($id),
                'learningAndDevelopment' => $support->getLearningAndDevelopmentData($id),
                'otherInformation' => $support->getOtherInformationData($id),
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to fetch full PDS: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while fetching the PDS. Please try again.',
            ], 500);
        }
    }
}
