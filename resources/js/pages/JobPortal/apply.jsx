import PageTitle from "@/components/PageTitle"
import useCrudTable from "@/hooks/useCrudTable"
import { usePage, router, Link } from '@inertiajs/react'
import { useState, useEffect, useMemo } from "react"
import axios from "axios"
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
import Review from '../MyProfile2/Pds/Review'
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

const getStoredStepKey = (hashedId) => `job-application-step:${hashedId}`

const normalizeValue = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")

const getArrayItemSignature = (section, item = {}) => {
  switch (section) {
    case "educationalBackground":
      return [
        normalizeValue(item.level),
        normalizeValue(item.school),
        normalizeValue(item.course),
        normalizeValue(item.from_year || item.from_date),
        normalizeValue(item.to_year || item.to_date),
        normalizeValue(item.year_graduated),
      ].join("|")
    case "civilServiceEligibility":
      return [
        normalizeValue(item.eligibility),
        normalizeValue(item.exam_date),
        normalizeValue(item.rating),
      ].join("|")
    case "workExperience":
      return [
        normalizeValue(item.agency),
        normalizeValue(item.position),
        normalizeValue(item.from_date),
        normalizeValue(item.to_date),
        normalizeValue(item.appointment),
      ].join("|")
    case "voluntaryWork":
      return [
        normalizeValue(item.org_name),
        normalizeValue(item.from_date),
        normalizeValue(item.to_date),
        normalizeValue(item.nature_of_work),
      ].join("|")
    case "learningAndDevelopment":
      return [
        normalizeValue(item.seminar_title),
        normalizeValue(item.from_date),
        normalizeValue(item.to_date),
        normalizeValue(item.hours),
      ].join("|")
    default:
      return JSON.stringify(item)
  }
}

const flattenEducationalBackground = (education = {}) => [
  ...(education.elementary || []),
  ...(education.secondary || []),
  ...(education.vocational || []),
  ...(education.college || []),
  ...(education.graduate || []),
]

const getNewArrayEntries = (section, submittedItems = [], liveItems = []) => {
  const submittedSignatures = new Set(submittedItems.map((item) => getArrayItemSignature(section, item)))
  return liveItems.filter((item) => !submittedSignatures.has(getArrayItemSignature(section, item)))
}

const getChangedPersonalInformation = (submitted = {}, live = {}) => {
  const fields = [
    ["Mobile No.", "mobile_no"],
    ["Email Address", "email_address"],
    ["Telephone No.", "telephone_no"],
    ["Residential Address", "residential_house_no"],
    ["Residential Street", "residential_street"],
    ["Residential Barangay", "residential_barangay_name"],
    ["Residential City", "residential_city_name"],
    ["Residential Province", "residential_province_name"],
    ["Permanent Address", "permanent_house_no"],
    ["Permanent Street", "permanent_street"],
    ["Permanent Barangay", "permanent_barangay_name"],
    ["Permanent City", "permanent_city_name"],
    ["Permanent Province", "permanent_province_name"],
  ]

  return fields
    .filter(([, key]) => normalizeValue(submitted?.[key]) !== normalizeValue(live?.[key]))
    .map(([label, key]) => ({
      label,
      submitted: submitted?.[key] || "-",
      current: live?.[key] || "-",
    }))
}

const formatChangeEntry = (section, item) => {
  switch (section) {
    case "educationalBackground":
      return `${item.level || "-"} - ${item.course || "-"} - ${item.school || "-"}`
    case "civilServiceEligibility":
      return `${item.eligibility || "-"} (${item.rating || "-"})`
    case "workExperience":
      return `${item.position || "-"} - ${item.agency || "-"}`
    case "voluntaryWork":
      return `${item.org_name || "-"} - ${item.nature_of_work || "-"}`
    case "learningAndDevelopment":
      return `${item.seminar_title || "-"}`
    default:
      return "-"
  }
}

const ProfileChangesPanel = ({ submittedReview, liveReview, isLoading }) => {
  const changes = useMemo(() => {
    if (!submittedReview || !liveReview) {
      return null
    }

    const personalChanges = getChangedPersonalInformation(
      submittedReview.personalInformation,
      liveReview.personalInformation
    )

    const sectionChanges = [
      {
        key: "educationalBackground",
        label: "Educational Background",
        items: getNewArrayEntries(
          "educationalBackground",
          flattenEducationalBackground(submittedReview.educationalBackground),
          flattenEducationalBackground(liveReview.educationalBackground)
        ),
      },
      {
        key: "civilServiceEligibility",
        label: "Civil Service Eligibility",
        items: getNewArrayEntries(
          "civilServiceEligibility",
          submittedReview.civilServiceEligibility || [],
          liveReview.civilServiceEligibility || []
        ),
      },
      {
        key: "workExperience",
        label: "Work Experience",
        items: getNewArrayEntries(
          "workExperience",
          submittedReview.workExperience || [],
          liveReview.workExperience || []
        ),
      },
      {
        key: "voluntaryWork",
        label: "Voluntary Work",
        items: getNewArrayEntries(
          "voluntaryWork",
          submittedReview.voluntaryWork || [],
          liveReview.voluntaryWork || []
        ),
      },
      {
        key: "learningAndDevelopment",
        label: "Learning and Development",
        items: getNewArrayEntries(
          "learningAndDevelopment",
          submittedReview.learningAndDevelopment || [],
          liveReview.learningAndDevelopment || []
        ),
      },
    ].filter((section) => section.items.length > 0)

    return {
      personalChanges,
      sectionChanges,
      hasChanges: personalChanges.length > 0 || sectionChanges.length > 0,
    }
  }, [submittedReview, liveReview])

  if (isLoading) {
    return (
      <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700 flex items-center gap-2 border-l-4 border-blue-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <p className="font-medium">Checking current profile changes since your last submission...</p>
      </div>
    )
  }

  if (!changes?.hasChanges) {
    return (
      <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 flex items-start gap-2 border-l-4 border-green-400">
        <CircleCheck className="w-4 h-4 mt-0.5" />
        <p className="font-medium">No new profile changes detected since your last submission.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800 flex flex-col gap-3 border-l-4 border-blue-400">
      <div className="flex items-start gap-2">
        <CircleCheck className="w-4 h-4 mt-0.5" />
        <div>
          <p className="font-semibold">Current Profile Changes Since Last Submission</p>
          <p className="text-blue-700">
            The profile below is still your last submitted snapshot. These are the new or changed live profile details that will be included once you re-submit.
          </p>
        </div>
      </div>

      {changes.personalChanges.length > 0 && (
        <div className="rounded-md border border-blue-200 bg-white/70 p-3">
          <p className="font-medium mb-2">Updated Personal Information</p>
          <div className="space-y-2">
            {changes.personalChanges.map((change) => (
              <div key={change.label} className="text-xs">
                <span className="font-semibold">{change.label}:</span> {change.submitted} &gt {change.current}
              </div>
            ))}
          </div>
        </div>
      )}

      {changes.sectionChanges.map((section) => (
        <div key={section.key} className="rounded-md border border-blue-200 bg-white/70 p-3">
          <p className="font-medium mb-2">
            {section.label}: {section.items.length} new entr{section.items.length === 1 ? "y" : "ies"}
          </p>
          <div className="space-y-1">
            {section.items.map((item, index) => (
              <div key={`${section.key}-${index}`} className="text-xs">
                {formatChangeEntry(section.key, item)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

const StepProfile = ({ job, handlePrevious, handleNext, currentStep, progressPercent, reviewDataOverride, isReopenedSubmission, liveReviewData, liveReviewLoading }) => (
  <div className="flex flex-col gap-4">
    {isReopenedSubmission && (
      <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 flex flex-col gap-2 border-l-4 border-amber-400">
        <div className="flex items-start gap-2">
          <TriangleAlert className="w-4 h-4 mt-0.5" />
          <p className="font-semibold">Reopened Submission</p>
        </div>
        <p className="pl-6">
          You are viewing the profile details from your last submitted application copy. Any new edits you make before re-submitting will replace that submitted snapshot.
        </p>
      </div>
    )}
    {isReopenedSubmission && (
      <ProfileChangesPanel
        submittedReview={reviewDataOverride}
        liveReview={liveReviewData}
        isLoading={liveReviewLoading}
      />
    )}
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
        href={route("profile.index", {
            redirect: route("jobs.apply", job.hashed_id),
        })}
        >
        <Button className="text-sm mt-2 bg-blue-800 hover:bg-blue-700 text-white ml-6">
            Edit My Profile
        </Button>
        </Link>
    </div>)}
    <Review reviewDataOverride={reviewDataOverride} />
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

const StepDocument = ({job, applicant, handlePrevious, handleNext, currentStep, reviewDataOverride, isReopenedSubmission}) => (
  <div className="flex flex-col gap-4">
    <ChooseDocuments
      job={job}
      applicant={applicant}
      submittedProfileReview={reviewDataOverride}
      isReopenedSubmission={isReopenedSubmission}
    />
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

const StepReview = ({job, applicant, handlePrevious, handleNext, currentStep, isReopenedSubmission}) => (
  <div className="flex flex-col gap-4">
    <ReviewAndSubmit job={job} applicant={applicant} isReopenedSubmission={isReopenedSubmission} />
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

    const { job, applicant, progress, isReopenedSubmission = false, submittedProfileReview = null } = usePage().props

    const progressPercent = progress
        ? parseFloat(progress).toFixed(2)
        : "0.00"
    const resolvedSteps = useMemo(
        () => steps.map((step) =>
            step.id === "complete"
                ? {
                    ...step,
                    title: isReopenedSubmission ? "Re-submit Application" : "Submit Application",
                }
                : step
        ),
        [isReopenedSubmission]
    )

    const [currentStep, setCurrentStep] = useState(0)
    const [liveReviewData, setLiveReviewData] = useState(null)
    const [liveReviewLoading, setLiveReviewLoading] = useState(false)
    const storedStepKey = useMemo(() => getStoredStepKey(job?.hashed_id), [job?.hashed_id])

    useEffect(() => {
        if (!storedStepKey || typeof window === "undefined") return

        const navigationEntry = window.performance?.getEntriesByType?.("navigation")?.[0]
        const isReload = navigationEntry?.type === "reload"

        if (!isReload) {
            setCurrentStep(0)
            window.sessionStorage.removeItem(storedStepKey)
            return
        }

        const storedStep = window.sessionStorage.getItem(storedStepKey)
        const parsedStep = Number.parseInt(storedStep ?? "", 10)

        if (!Number.isNaN(parsedStep) && parsedStep >= 0 && parsedStep < steps.length) {
            setCurrentStep(parsedStep)
        }
    }, [storedStepKey])

    useEffect(() => {
        if (!storedStepKey || typeof window === "undefined") return

        window.sessionStorage.setItem(storedStepKey, String(currentStep))
    }, [currentStep, storedStepKey])

    useEffect(() => {
        if (!isReopenedSubmission) {
            setLiveReviewData(null)
            return
        }

        let isMounted = true

        const fetchLiveReview = async () => {
            try {
                setLiveReviewLoading(true)
                const { data } = await axios.get(route("profile.review"))

                if (isMounted) {
                    setLiveReviewData(data)
                }
            } catch (error) {
                console.error("Failed to load current profile review:", error)
            } finally {
                if (isMounted) {
                    setLiveReviewLoading(false)
                }
            }
        }

        fetchLiveReview()

        return () => {
            isMounted = false
        }
    }, [isReopenedSubmission])

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
            return <StepProfile job={job} handlePrevious={handlePrevious} handleNext={handleNext} currentStep={currentStep} progressPercent={progressPercent} reviewDataOverride={submittedProfileReview} isReopenedSubmission={isReopenedSubmission} liveReviewData={liveReviewData} liveReviewLoading={liveReviewLoading} />
        case 1:
            return <StepDocument job={job} applicant={applicant} handlePrevious={handlePrevious} handleNext={handleNext} currentStep={currentStep} reviewDataOverride={submittedProfileReview} isReopenedSubmission={isReopenedSubmission} />
        case 2:
            return <StepReview job={job} applicant={applicant} handlePrevious={handlePrevious} handleNext={handleNext} currentStep={currentStep} isReopenedSubmission={isReopenedSubmission} />
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
                    <Stepper steps={resolvedSteps} currentStep={currentStep} onStepClick={handleStepClick} />
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
                    href={route("profile.index", {
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
