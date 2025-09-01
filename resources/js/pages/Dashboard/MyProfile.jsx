"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import PersonalInformation from "./PersonalInformation"
import FamilyBackground from "./FamilyBackground"
import EducationalBackground from "./EducationalBackground"
import CivilServiceEligibility from "./CivilServiceEligibility"
import WorkExperience from "./WorkExperience"
import VoluntaryWork from "./VoluntaryWork"
import LearningAndDevelopment from "./LearningAndDevelopment"
import OtherInformation from "./OtherInformation"
import Review from "./Review"
import {
  HomeIcon as House,
  PenIcon as UserPen,
  GraduationCap,
  FileText,
  BriefcaseBusiness,
  Waypoints,
  Brain,
  SquareLibrary,
  ChevronsLeft,
  ChevronsRight,
  Save
} from "lucide-react"
import usePdsStore from "@/stores/usePdsStore"
import { useForm } from "@inertiajs/react"

const steps = [
  {
    id: "personalInformation",
    label: "Personal Information",
    component: PersonalInformation,
    icon: <UserPen className="w-5 h-5 mb-1" />,
  },
  {
    id: "familyBackground",
    label: "Family Background",
    component: FamilyBackground,
    icon: <House className="w-5 h-5 mb-1" />,
  },
  {
    id: "educationalBackground",
    label: "Educational Background",
    component: EducationalBackground,
    icon: <GraduationCap className="w-5 h-5 mb-1" />,
  },
  {
    id: "civilServiceEligibility",
    label: "Civil Service Eligibility",
    component: CivilServiceEligibility,
    icon: <FileText className="w-5 h-5 mb-1" />,
  },
  {
    id: "workExperience",
    label: "Work Experience",
    component: WorkExperience,
    icon: <BriefcaseBusiness className="w-5 h-5 mb-1" />,
  },
  {
    id: "voluntaryWork",
    label: "Voluntary Work",
    component: VoluntaryWork,
    icon: <Waypoints className="w-5 h-5 mb-1" />,
  },
  {
    id: "learningAndDevelopment",
    label: "Learning & Development",
    component: LearningAndDevelopment,
    icon: <Brain className="w-5 h-5 mb-1" />,
  },
  {
    id: "otherInformation",
    label: "Other Information",
    component: OtherInformation,
    icon: <SquareLibrary className="w-5 h-5 mb-1" />,
  },
  {
    id: "review",
    label: "Review and Submit",
    component: Review,
    icon: <Save className="w-5 h-5 mb-1" />,
  },
]

const toKebabCase = (str) => {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()
}

const StepWizardForm = () => {
  const { pdsState, fetchPds } = usePdsStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState([])
  const [activeTabsView, setActiveTabsView] = useState("desktop")
  const [visibleSteps, setVisibleSteps] = useState(steps)

  // Use the `useForm` hook to manage form data
  const { data, setData, post, processing, errors, clearErrors, reset, progress } = useForm(pdsState)

  const getCurrentStepName = () => steps[currentStep].id

  const updateFormData = (stepData) => {
    // Update the form data using `setData` from `useForm`
    setData((prevData) => ({
      ...prevData,
      [stepData.section]: {
        ...prevData[stepData.section],
        ...stepData.values,
      },
    }))
  }

  const handleNext = () => {
    const currentStepName = getCurrentStepName()
    const currentStepData = data[currentStepName]

    try {
      // Send the POST request with the latest data
      post(`/applicant/${toKebabCase(currentStepName)}`, currentStepData)

      // Mark current step as completed
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep])
      }

      // Move to the next step if the save is successful
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1)
      }
    } catch (error) {
      console.error("Error saving step data:", error)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (index) => {
    if (completedSteps.includes(index) || index <= Math.max(...completedSteps, 0)) {
      setCurrentStep(index)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    try {
      // Send the final form data
      post("/submit-form", {
        data,
      })

      console.log("Form submitted successfully!")
    } catch (error) {
      console.error("Error submitting form:", error)
    }
  }

  // Update visible steps based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // Mobile view: show current step and adjacent steps
        const start = Math.max(0, currentStep - 1)
        const end = Math.min(steps.length, currentStep + 2)
        setVisibleSteps(steps.slice(start, end))
        setActiveTabsView("mobile")
      } else if (window.innerWidth < 1024) {
        // Tablet view: show more steps
        const start = Math.max(0, currentStep - 2)
        const end = Math.min(steps.length, currentStep + 3)
        setVisibleSteps(steps.slice(start, end))
        setActiveTabsView("tablet")
      } else {
        // Desktop view: show all steps
        setVisibleSteps(steps)
        setActiveTabsView("desktop")
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [currentStep])

  useEffect(() => {
    fetchPds()
  }, [fetchPds, getCurrentStepName()])

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex justify-between mb-4">
        <Button type="button" onClick={handlePrevious} disabled={currentStep === 0} className="flex">
          <ChevronsLeft className="h-4 w-4" />
          Previous
        </Button>
        {currentStep === steps.length - 1 ? (
          <Button type="submit" disabled={processing}>
            {processing ? "Submitting..." : "Submit"}
          </Button>
        ) : (
          <Button type="button" onClick={handleNext} disabled={processing} className="flex">
            {processing ? "Saving..." : "Next"}
            <ChevronsRight className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Tabs value={steps[currentStep].id} className="w-full mb-4">
        <div className="w-full">
          <TabsList
            className="h-16 border w-full grid"
            style={{
              gridTemplateColumns: `repeat(${visibleSteps.length}, 1fr)`,
            }}
          >
            {visibleSteps.map((step, viewIndex) => {
              // Find the actual index in the full steps array
              const index = steps.findIndex((s) => s.id === step.id)
              const isCompleted = completedSteps.includes(index)
              const isClickable = isCompleted || index <= Math.max(...completedSteps, 0)

              return (
                <TabsTrigger
                  key={step.id}
                  value={step.id}
                  className={`h-12 relative ${
                    index === currentStep ? "bg-muted" : ""
                  } ${isCompleted ? "text-primary" : ""} ${isCompleted ? "pl-8" : "px-2"}`}
                  disabled={!isClickable && index !== currentStep}
                  onClick={() => handleStepClick(index)}
                >
                  {isCompleted && (
                    <Check className="h-4 w-4 text-green-500 absolute left-2 top-1/2 transform -translate-y-1/2" />
                  )}
                  <div className="flex items-center flex-col justify-center max-w-full">
                    {step.icon}
                    <span className="text-xs text-center break-words hyphens-auto" style={{ wordBreak: "break-word" }}>
                      {step.label}
                    </span>
                  </div>
                </TabsTrigger>
              )
            })}
          </TabsList>
          {activeTabsView !== "desktop" && (
            <div className="flex justify-center mt-2">
              <div className="flex gap-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 w-1.5 rounded-full ${index === currentStep ? "bg-primary" : "bg-muted"}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 mt-4">
          {steps.map((step, index) => (
            <TabsContent key={step.id} value={step.id} className={index === currentStep ? "block mt-0" : "hidden"}>
              <step.component
                updateFormData={(data) => updateFormData({ section: getCurrentStepName(), values: data })}
              />
            </TabsContent>
          ))}
        </div>
      </Tabs>
      <div className="flex justify-between mb-4">
        <Button type="button" onClick={handlePrevious} disabled={currentStep === 0} className="flex">
          <ChevronsLeft className="h-4 w-4" />
          Previous
        </Button>
        {currentStep === steps.length - 1 ? (
          <Button type="submit" disabled={processing}>
            {processing ? "Submitting..." : "Submit"}
          </Button>
        ) : (
          <Button type="button" onClick={handleNext} disabled={processing} className="flex">
            {processing ? "Saving..." : "Next"}
            <ChevronsRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  )
}

export default StepWizardForm

