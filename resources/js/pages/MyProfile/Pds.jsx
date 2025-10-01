import React, { useState, useEffect } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  ChevronsLeft,
  ChevronsRight,
  Check,
  HomeIcon as House,
  ChevronDown,
  ArrowRight
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useForm } from "@inertiajs/react"
import usePdsStore from "@/stores/usePdsStore"

import { useToast } from "@/hooks/use-toast"
import { Link } from '@inertiajs/react'
import { steps } from "./steps"

const normalizeData = (data) => {
  if (!data) return {}
  
  if (Array.isArray(data)) {
    return data.map(item =>
      typeof item === "object" && item !== null
        ? Object.fromEntries(Object.entries(item).map(([k, v]) => [k, v ?? ""]))
        : item
    )
  }

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, value ?? ""])
  )
}

const toKebabCase = (str) => str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()

export default function Pds({redirect}) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState([])

  const { pdsState, fetchPdsSection, fetchProgress, progress } = usePdsStore()
  const { data, setData, post, processing, errors } = useForm(pdsState)
  
  const currentSection = steps[currentStep].id

  useEffect(() => {
    fetchPdsSection(currentSection)
  }, [currentSection])

  useEffect(() => {
    fetchProgress()
  }, [])

  useEffect(() => {
    if (progress) {
      const completed = steps
        .map((step, index) => progress[step.id] === 1 ? index : null)
        .filter(index => index !== null)
      setCompletedSteps(completed)

      if (completed.length > 0) {
        setCurrentStep(0)
      }
    }
  }, [progress])

  useEffect(() => {

    let normalizedSection = normalizeData(pdsState[currentSection])

    if (currentSection === "otherInformation") {
      if (Array.isArray(normalizedSection.references)) {
        while (normalizedSection.references.length < 3) {
          normalizedSection.references.push({
            name: "",
            address: "",
            contact_no: ""
          })
        }
      }
    }

    setData(prev => ({
      ...prev,
      [currentSection]: normalizeData(pdsState[currentSection])
    }))
  }, [pdsState[currentSection]])

  const totalSteps = steps.length // exclude last submit step
  const progressPercent = totalSteps > 0 
  ? Math.min(
      parseFloat(((completedSteps.length / (totalSteps - 1)) * 100).toFixed(2)),
      100
    )
  : 0.00

  const handleNext = () => {
    post(
      route(`applicant.store-${toKebabCase(currentSection)}`),
      {
        preserveScroll: true,
        onSuccess: () => {
          toast({
            title: "Success!",
            description: `${steps[currentStep].label} saved successfully.`,
          })

          if (!completedSteps.includes(currentStep)) {
            setCompletedSteps(prev => [...prev, currentStep])
          }
          if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1)
            window.scrollTo({ top: 0, behavior: "smooth" })
          }
        },
        onError: () => {
          toast({
            title: "Validation failed!",
            description: `Please check the fields highlighted in red.`,
            variant: "destructive",
          })
        },
      }
    )
  }

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    post("/submit-form", data)
    console.log("Form submitted with:", data)
  }

  return (
    <div className="p-4 border rounded-lg">
      <div className="mb-2 justify-between items-center hidden lg:flex">
        <div className="w-full text-lg font-semibold">
          Completed {completedSteps.length} of {totalSteps} sections
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-4">
        <div>
          {/* Mobile Menu */}
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
                        className={`flex items-center ${!canSelect ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className="mr-2">{step.icon}</span>
                        {step.label}
                      </DropdownMenuItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop Menu */}
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
                  {/* Step icon */}
                  {step.icon}

                  {/* Label */}
                  <span className="text-sm font-medium flex-1">{step.label}</span>

                  {/* Checkmark for completed */}
                  {isCompleted && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
        <div className="flex-1 min-h-[300px]">
          <div className="w-full border rounded-lg p-4 mb-4">
            <p className="text-base font-semibold">
              Your profile is{" "}
              <span
                className={`font-bold text-lg ${
                  progressPercent === 100 ? "text-green-600" : "text-red-600"
                }`}
              >
                {progressPercent}%
              </span>{" "}
              completed.
            </p>
            <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  progressPercent === 100 ? "bg-green-600" : "bg-red-600"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
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
                data: currentSection === 'review' ? data : data[currentSection],
                errors,
                setData: (key, value) => {
                  setData(prev => {
                    const section = prev[currentSection]

                    if (Array.isArray(section)) {
                      return {
                        ...prev,
                        [currentSection]: section.map((item, idx) =>
                          idx === key ? value : item
                        )
                      }
                    } else if (typeof section === "object" && section !== null) {
                      return {
                        ...prev,
                        [currentSection]: {
                          ...section,
                          [key]: value
                        }
                      }
                    } else {
                      return {
                        ...prev,
                        [currentSection]: value
                      }
                    }
                  })
                },
                setCurrentStep,
              })}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-6 items-center">
            <Button variant="outline" type="button" onClick={handlePrevious} disabled={currentStep === 0}>
              <ChevronsLeft className="h-4 w-4 mr-1" /> Previous
            </Button>

            <div className="flex items-center gap-2">
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
                        Proceed to the application
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/jobs">
                      <Button type="button">
                        Apply Now
                      </Button>
                    </Link>
                  )}    
                  
                </>
              ) : (
                <Button type="button" onClick={handleNext} disabled={processing}>
                  {processing ? "Please wait..." : "Next"}
                  <ChevronsRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>

        </div>
      </form>
    </div>
  )
}
