import React, { useEffect, useMemo, useState } from "react"
import {
  ChevronsLeft,
  Check,
  ChevronDown,
  ArrowRight,
  CircleAlert,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Link } from "@inertiajs/react"
import { steps } from "./steps"
import store from "./store"

export default function Pds({
  redirect,
  initialProgress = {},
  applicantId = null,
  profileType = "Applicant",
}) {
  const { toast } = useToast()
  const savePdsSection = store((state) => state.savePdsSection)
  const validationErrors = store((state) => state.validationErrors)

  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState([])
  const [progress, setProgress] = useState(initialProgress || {})
  const [saving, setSaving] = useState(false)
  const [activeApplicantId, setActiveApplicantId] = useState(applicantId)

  const currentSection = steps[currentStep].id
  const totalSteps = steps.length

  useEffect(() => {
    setProgress(initialProgress || {})
  }, [initialProgress])

  useEffect(() => {
    setActiveApplicantId(applicantId)
  }, [applicantId])

  useEffect(() => {
    if (!progress) return

    const completed = steps
      .map((step, index) => (progress[step.id] === 1 ? index : null))
      .filter((index) => index !== null)

    setCompletedSteps(completed)

    if (completed.length === 0) {
      setCurrentStep(0)
      return
    }

    if (completed.length < steps.length - 1) {
      const firstIncomplete = steps.findIndex((step, index) => !completed.includes(index))
      setCurrentStep(firstIncomplete)
      return
    }

    setCurrentStep(steps.length - 1)
  }, [progress])

  const progressPercent = useMemo(() => {
    if (totalSteps <= 1) return 0
    return Math.min(
      parseFloat(((completedSteps.length / (totalSteps - 1)) * 100).toFixed(2)),
      100
    )
  }, [completedSteps, totalSteps])

  const handleSaved = (sectionId, responseData = {}) => {
    if (responseData.applicantId) {
      setActiveApplicantId(responseData.applicantId)
    }

    setProgress((prev) => ({
      ...prev,
      [sectionId]: 1,
    }))

    toast({
      title: responseData.title || "Success!",
      description: responseData.message || "Section saved successfully.",
      variant: responseData.status === "error" ? "destructive" : "default",
    })
  }

  const handleSaveError = (responseData = {}) => {
    toast({
      title: responseData.title || "Validation failed!",
      description: responseData.message || "Please check the fields highlighted in red.",
      variant: "destructive",
    })
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleNext = async () => {
    if (currentStep >= steps.length - 1 || saving) return

    setSaving(true)

    const result = await savePdsSection(currentSection, {
      applicantId: activeApplicantId,
      profileType,
    })

    if (!result.ok) {
      handleSaveError(result.error?.response?.data)
      setSaving(false)
      return
    }

    handleSaved(currentSection, result.response?.data)
    setCurrentStep((prev) => prev + 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
    setSaving(false)
  }

  return (
    <div className="p-4 border rounded-lg">
      <div className="mb-2 justify-between items-center hidden lg:flex">
        <h3 className="tracking-tight font-semibold text-lg text-black">
          Completed {completedSteps.length} of {totalSteps} sections
        </h3>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div>
          <div className="lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full flex justify-between items-center">
                  {(() => {
                    const stepValue = steps[currentStep]
                    return (
                      <div className="flex items-center">
                        <span className="mr-2">{stepValue.icon}</span>
                        <span>{stepValue.label}</span>
                      </div>
                    )
                  })()}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-full max-h-[100px] overflow-y-auto">
                {steps.map((step, index) => {
                  const isCompleted = completedSteps.includes(index)
                  const isCurrent = index === currentStep
                  const canSelect = isCompleted || isCurrent

                  return (
                    <DropdownMenuItem
                      key={step.id}
                      onSelect={(e) => {
                        if (!canSelect) {
                          e.preventDefault()
                          return
                        }
                        setCurrentStep(index)
                      }}
                      disabled={!canSelect}
                      className={`flex items-center ${!canSelect ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span className="mr-2">{step.icon}</span>
                      {step.label}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="hidden lg:flex w-64 flex-col border-r pr-2 gap-2">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.includes(index)
              const isCurrent = index === currentStep
              const canSelect = isCompleted || isCurrent

              return (
                <button
                  type="button"
                  key={step.id}
                  onClick={() => canSelect && setCurrentStep(index)}
                  disabled={!canSelect}
                  className={`flex items-center gap-2 px-3 py-2 text-left rounded-md transition
                    ${isCurrent ? "bg-muted border-gray-200 border" : "hover:bg-accent"}
                    ${!canSelect ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  {step.icon}
                  <span className="text-sm font-medium flex-1">{step.label}</span>
                  {isCompleted && <Check className="h-4 w-4 text-green-500" />}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 min-h-[300px]">
          <div
            className={`rounded-md px-4 py-2 text-sm flex flex-col gap-3 mb-4 border-l-4 transition-colors duration-300
              ${
                progressPercent < 50
                  ? "bg-red-50 text-red-700 border-red-400"
                  : progressPercent < 80
                  ? "bg-yellow-50 text-yellow-700 border-yellow-400"
                  : "bg-green-50 text-green-700 border-green-400"
              }`}
          >
            <div className="flex items-center gap-2">
              <CircleAlert className="w-4 h-4 mt-0.5" />
              <p className="font-medium">
                Applicant profile is{" "}
                <span
                  className={`font-bold text-lg ${
                    progressPercent < 50
                      ? "text-red-600"
                      : progressPercent < 80
                      ? "text-yellow-600"
                      : "text-green-600"
                  }`}
                >
                  {progressPercent}%
                </span>{" "}
                completed.
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {React.createElement(steps[currentStep].component, {
                applicantId: activeApplicantId,
                profileType,
                section: currentSection,
                errors: validationErrors,
                onSaved: () => handleSaved(currentSection),
                onSaveError: handleSaveError,
                setCurrentStep,
              })}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-6 items-center">
            <Button
              variant="outline"
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 0 || saving}
            >
              <ChevronsLeft className="h-4 w-4 mr-1" /> Previous
            </Button>

            <div className="flex items-center gap-2">
              {currentStep < steps.length - 1 && (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Next"}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}

              {currentStep === steps.length - 1 ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        Go to Section
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {steps.slice(0, -1).map((step, index) => (
                        <DropdownMenuItem
                          key={step.id}
                          onSelect={() => setCurrentStep(index)}
                        >
                          <div className="flex items-center gap-4">
                            {step.icon}
                            <span>{step.label}</span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {redirect ? (
                    <Link href={redirect}>
                      <Button type="button">
                        Proceed
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Link href={route("applicants.index")}>
                      <Button type="button">Back to Applicants</Button>
                    </Link>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
