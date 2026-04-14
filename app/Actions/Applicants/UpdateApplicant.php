<?php

namespace App\Actions\Applicants;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;
use Lorisleiva\Actions\Concerns\AsAction;

class UpdateApplicant
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.applicants.update');
    }

    public function asController(Request $request, int $id)
    {
        $step = $request->input('step');

        return match ($step) {
            'personalInformation' => $this->runStepAction(StorePersonalInformation::class, $request, $id, true),
            'familyBackground' => $this->runStepAction(StoreFamilyBackground::class, $request, $id),
            'educationalBackground' => $this->runStepAction(StoreEducationalBackground::class, $request, $id, true),
            'civilServiceEligibility' => $this->runStepAction(StoreCivilServiceEligibilitySection::class, $request, $id),
            'workExperience' => $this->runStepAction(StoreWorkExperienceSection::class, $request, $id, true),
            'voluntaryWork' => $this->runStepAction(StoreVoluntaryWorkSection::class, $request, $id, true),
            'learningAndDevelopment' => $this->runStepAction(StoreLearningAndDevelopmentSection::class, $request, $id, true),
            'otherInformation' => $this->runStepAction(StoreOtherInformation::class, $request, $id, true),
            default => throw new \Exception("Invalid step: {$step}"),
        };
    }

    private function runStepAction(string $actionClass, Request $request, int $id, bool $useWithValidator = false)
    {
        $action = app($actionClass);
        $validator = Validator::make(
            $request->all(),
            $action->rules(),
            $action->getValidationMessages()
        );

        if ($useWithValidator && method_exists($action, 'withValidator')) {
            $action->withValidator($validator, \Lorisleiva\Actions\ActionRequest::createFromBase($request));
        }

        return $action->handle($validator->validate(), $id);
    }
}
