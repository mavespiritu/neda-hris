import PageTitle from "@/components/PageTitle"
import useCrudTable from "@/hooks/useCrudTable"
import { usePage, router, Link } from '@inertiajs/react'
import { useState, useEffect, useMemo } from "react"
import { useHasRole } from "@/hooks/useAuth"
import { Loader2, Search, Filter, ChevronRight, MapPin, Banknote, FileCog, Building, ChevronLeft, Pencil, ArrowRight } from "lucide-react"
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
    title: "1. Update Profile",
  },
  {
    id: "document",
    title: "2. Upload Requirements",
  },
  {
    id: "complete",
    title: "3. Review Application",
  },
]

const StepProfile = ({ job, handlePrevious, handleNext, currentStep, progressPercent}) => (
  <div className="flex flex-col gap-4">
    <Review />
    <div className="flex justify-end gap-4">
        <Link href={route('applicant.index', {redirect: route('jobs.apply', job.hashed_id)})}>
            <Button variant="outline" className="text-sm">
                Edit My Profile
            </Button>
        </Link>
        {progressPercent >= 100 && (
            <Button onClick={handleNext} disabled={currentStep === steps.length - 1}>
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
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button onClick={handleNext} disabled={currentStep === steps.length - 1}>
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
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button onClick={handleNext} disabled={currentStep === steps.length - 1}>
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
                    <span className="sr-only sm:not-sr-only">Back to Job Search</span>
                </Button>
            </Link>
            <div className="border rounded-lg p-8">
                <div className="space-y-1">
                    <p className="text-sm">Applying for</p>
                    <div>
                        <h3 className="text-2xl font-semibold">
                        {job.position_description}{" "}
                        {job.appointment_status === "Permanent" && `(${job.item_no})`}
                        </h3>
                        <p className="text-lg mb-4">{job.division_name}</p>
                        <Sheet key={job.id}>
                            <SheetTrigger>
                                <span className="text-sm underline font-semibold">View Job Description</span>
                            </SheetTrigger>
                            <JobDescription action="view" job={job} />
                        </Sheet>
                    </div>
                </div>
                <div className="w-full lg:w-[50%] mt-8 mb-4">
                    <Stepper steps={steps} currentStep={currentStep} onStepClick={handleStepClick} />
                </div>

                {progressPercent < 100 && (
                    <Alert variant="destructive" className="my-4">
                        <TriangleAlert className="h-4 w-4" />
                        <AlertTitle className="font-semibold mb-2">Incomplete Profile</AlertTitle>
                        <AlertDescription className="mb-2">
                            Your profile is only{" "}
                            <span className="font-bold">
                                {progressPercent}%
                            </span>{" "}
                            complete. Please update your profile by clicking the button below before continuing. 
                        </AlertDescription>
                        <Link href={route('applicant.index', {redirect: route('jobs.apply', job.hashed_id)})}>
                            <Button variant="" size="sm" className="text-sm">
                                Edit My Profile
                            </Button>
                        </Link>
                    </Alert>
                )}
                <StepContent />
            </div>
        </div>
    )
}

export default apply