<?php

namespace App\Services\Profile;

class ProfileReviewBuilder
{
    public function __construct(
        protected PersonalInformationFormBuilder $personalInformationBuilder,
        protected FamilyBackgroundFormBuilder $familyBackgroundBuilder,
        protected EducationalBackgroundFormBuilder $educationalBackgroundBuilder,
        protected CivilServiceEligibilityTableBuilder $civilServiceEligibilityBuilder,
        protected WorkExperienceTableBuilder $workExperienceBuilder,
        protected VoluntaryWorkTableBuilder $voluntaryWorkBuilder,
        protected LearningAndDevelopmentTableBuilder $learningAndDevelopmentBuilder,
        protected OtherInformationFormBuilder $otherInformationBuilder,
    ) {
    }

    public function build(array $context): object
    {
        $civilServiceEligibility = $this->civilServiceEligibilityBuilder->build($context);
        $workExperience = $this->workExperienceBuilder->build($context);
        $voluntaryWork = $this->voluntaryWorkBuilder->build($context);
        $learningAndDevelopment = $this->learningAndDevelopmentBuilder->build($context);

        return (object) [
            'personalInformation' => $this->personalInformationBuilder->build($context),
            'familyBackground' => $this->familyBackgroundBuilder->build($context),
            'educationalBackground' => $this->educationalBackgroundBuilder->build($context),
            'civilServiceEligibility' => $civilServiceEligibility->rows ?? $civilServiceEligibility->data ?? $civilServiceEligibility,
            'workExperience' => $workExperience->rows ?? $workExperience->data ?? $workExperience,
            'voluntaryWork' => $voluntaryWork->rows ?? $voluntaryWork->data ?? $voluntaryWork,
            'learningAndDevelopment' => $learningAndDevelopment->rows ?? $learningAndDevelopment->data ?? $learningAndDevelopment,
            'otherInformation' => $this->otherInformationBuilder->build($context),
        ];
    }
}
