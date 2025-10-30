import PageTitle from "@/components/PageTitle"
import useCrudTable from "@/hooks/useCrudTable"
import { usePage, router, Link } from '@inertiajs/react'
import { useState, useEffect, useMemo } from "react"
import { useHasRole } from "@/hooks/useAuth"
import { Loader2, Search, Filter, ChevronRight, MapPin, Banknote, FileCog, Building, ChevronLeft, Pencil, ArrowRight, Send, Upload, User, CircleCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { store } from "./store"
import { formatDate } from "@/lib/utils.jsx"
import JobTypeBadge from "./JobTypeBadge"
import JobDescription from "./JobDescription"
import PaginationControls from '@/components/PaginationControls'
import { Stepper } from '@/components/Stepper'
import Review from '../MyProfile/Pds/Review'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { TriangleAlert } from "lucide-react"
import ChooseDocuments from "./ChooseDocuments"
import ReviewAndSubmit from "./ReviewAndSubmit"

const steps = [
  {
    id: "profile",
    title: "Update Profile",
    icon: <User className="w-4 h-4 mr-2" />,
  },
  {
    id: "document",
    title: "Upload Requirements",
    icon: <Upload className="w-4 h-4 mr-2" />,
  },
  {
    id: "complete",
    title: "Submit Application",
    icon: <Send className="w-4 h-4 mr-2" />,
  },
]

const StepProfile = ({ job, handlePrevious, handleNext, currentStep, progressPercent}) => (
  <div className="flex flex-col gap-4">
    {progressPercent >= 100 && (
    <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 flex flex-col gap-2 border-l-4 border-green-400">
        <div className="flex items-start gap-2">
        <CircleCheck className="w-4 h-4 mt-0.5" />
        <p className="font-semibold">Profile Complete</p>
        </div>
        <p className="pl-6">
        Your profile is <span className="font-bold">100%</span> complete.  
        Make sure your information is <span className="font-semibold">up to date</span> before continuing to the next step.
        </p>
        <Link
        href={route("applicant.index", {
            redirect: route("jobs.apply", job.hashed_id),
        })}
        >
        <Button className="text-sm mt-2 bg-blue-800 hover:bg-blue-700 text-white ml-6">
            Edit My Profile
        </Button>
        </Link>
    </div>)}
    <Review />
    <div className="flex justify-end gap-4">
        {progressPercent >= 100 && (
            <Button onClick={handleNext} disabled={currentStep === steps.length - 1} className="bg-blue-600 hover:bg-blue-700 text-white">
                {currentStep === steps.length - 1 ? (
                    "Submit Application"
                ) : (
                    <>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                    </>
                )}
            </Button>
        )}
    </div>
  </div>
)

const StepDocument = ({job, applicant, handlePrevious, handleNext, currentStep}) => (
  <div className="flex flex-col gap-4">
    <ChooseDocuments job={job} applicant={applicant} />
    <div className="flex justify-between gap-4">
        <Button 
          variant="outline" 
          onClick={handlePrevious} 
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button onClick={handleNext} disabled={currentStep === steps.length - 1} className="bg-blue-600 hover:bg-blue-700 text-white">
            {currentStep === steps.length - 1 ? (
                "Submit Application"
            ) : (
                <>
                Continue
                <ArrowRight className="h-4 w-4" />
                </>
            )}
        </Button>
    </div>
  </div>
)

const StepReview = ({job, applicant, handlePrevious, handleNext, currentStep}) => (
  <div className="flex flex-col gap-4">
    <ReviewAndSubmit job={job} applicant={applicant} />
    <div className="flex justify-between gap-4">
        <Button 
          variant="outline" 
          onClick={handlePrevious} 
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
    </div>
  </div>
)

const apply = () => {

    const { job, applicant, progress } = usePage().props

    const progressPercent = progress
        ? parseFloat(progress).toFixed(2)
        : "0.00"

    const [currentStep, setCurrentStep] = useState(0)

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1)
        }
    }

    const handlePrevious = () => {
        if (currentStep > 0) {
        setCurrentStep(currentStep - 1)
        }
    }

    const handleStepClick = (stepIndex) => {
        setCurrentStep(stepIndex)
    }

    const StepContent = () => {
        switch (currentStep) {
        case 0:
            return <StepProfile job={job} handlePrevious={handlePrevious} handleNext={handleNext} currentStep={currentStep} progressPercent={progressPercent} />
        case 1:
            return <StepDocument job={job} applicant={applicant} handlePrevious={handlePrevious} handleNext={handleNext} currentStep={currentStep} />
        case 2:
            return <StepReview job={job} applicant={applicant} handlePrevious={handlePrevious} handleNext={handleNext} currentStep={currentStep} />
        default:
            return null
        }
    }

    return (
        <div className="flex flex-col gap-2 h-full">
            <div className="flex items-center justify-between">
                <Link
                    href={route('jobs.index')}
                    className="hidden md:block"
                >
                    <Button
                        variant="ghost"
                        className="flex items-center rounded-md disabled:opacity-50"
                        size="sm"
                    >
                        <ChevronLeft className="h-8 w-8" />
                        <span className="sr-only sm:not-sr-only">Go to Job Search</span>
                    </Button>
                </Link>
                <Link
                    href={route('my-applications.index')}
                    className="hidden md:block"
                >
                    <Button
                        variant="ghost"
                        className="flex items-center rounded-md disabled:opacity-50"
                        size="sm"
                    >
                        <span className="sr-only sm:not-sr-only">Go to Applications</span>
                        <ChevronRight className="h-8 w-8" />

                    </Button>
                </Link>
            </div>
            
            <div className="border rounded-lg p-8">
                <div className="space-y-1">
                    <p className="text-sm font-medium">Applying for</p>
                    <div>
                        <h3 className="text-2xl font-semibold">
                        {job.position_description}{" "}
                        {job.appointment_status === "Permanent" && `(${job.item_no})`}
                        </h3>
                        <p className="text-lg mb-4 font-medium">{job.division_name}</p>
                        <Sheet key={job.id}>
                            <SheetTrigger>
                                <span className="text-sm underline font-semibold">View Job Description</span>
                            </SheetTrigger>
                            <JobDescription action="view" job={job} />
                        </Sheet>
                    </div>
                </div>
                <div className="w-full lg:w-[75%] mt-8 mb-4">
                    <Stepper steps={steps} currentStep={currentStep} onStepClick={handleStepClick} />
                </div>

                {progressPercent < 100 && (
                // 🔴 Incomplete profile alert
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 flex flex-col gap-2 border-l-4 border-red-400 mb-4">
                    <div className="flex items-start gap-2">
                    <TriangleAlert className="w-4 h-4 mt-0.5" />
                    <p className="font-semibold">Incomplete Profile</p>
                    </div>
                    <p className="pl-6">
                    Your profile is only{" "}
                    <span className="font-bold">{progressPercent}%</span> complete.  
                    Please update your profile by clicking the button below before continuing.
                    </p>
                    <Link
                    href={route("applicant.index", {
                        redirect: route("jobs.apply", job.hashed_id),
                    })}
                    >
                    <Button className="text-sm mt-2 bg-blue-800 hover:bg-blue-700 text-white ml-6">
                        Edit My Profile
                    </Button>
                    </Link>
                </div>
                )}
                <StepContent />
            </div>
        </div>
    )
}

export default apply