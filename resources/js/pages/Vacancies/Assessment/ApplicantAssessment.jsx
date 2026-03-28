import { useState, useEffect, useMemo } from "react"
import axios from "axios"
import { Head, Link, router, usePage } from "@inertiajs/react"
import { ChevronLeft, Loader2, Mail, Phone, Calendar, Pencil } from "lucide-react"
import PageTitle from "@/components/PageTitle"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import AttachmentPreviewDialog from "@/components/AttachmentPreviewDialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import clsx from "clsx"
import { formatDate, formatDateRange, formatDateWithTime, formatFullName } from "@/lib/utils.jsx"
import TextInput from "@/components/TextInput"
import { Label } from "@/components/ui/label"
import { YearPicker } from "@/components/YearPicker"
import SingleComboBox from "@/components/SingleComboBox"
import LearningAndDevelopmentForm from "@/pages/MyProfile2/Pds/LearningAndDevelopmentForm"
import WorkExperienceForm from "@/pages/MyProfile2/Pds/WorkExperienceForm"
import CivilServiceEligibilityForm from "@/pages/MyProfile2/Pds/CivilServiceEligibilityForm"

const createDefaultForm = () => ({
  remarks: "",
  screening: {
    requirements_completion: { status: false, remarks: "" },
    offense_check: { status: false, remarks: "" },
  },
  prescribed: {
    education: { status: false, remarks: "" },
    training: { status: false, remarks: "" },
    experience: { status: false, remarks: "" },
    eligibility: { status: false, remarks: "" },
  },
  preferred: {
    education: { status: false, remarks: "" },
    training: { status: false, remarks: "" },
    experience: { status: false, remarks: "" },
    eligibility: { status: false, remarks: "" },
  },
})

const emptyProfileData = {
  education: [],
  training: [],
  experience: [],
  eligibility: [],
  offenseQuestions: [],
  specialStatusQuestions: [],
  requirementsSummary: {
    is_complete: false,
    submitted_count: 0,
    total_count: 0,
    items: [],
    missing_items: [],
  },
}

const emptyRelevantSelections = {
  education: [],
  training: [],
  experience: [],
  eligibility: [],
}

const emptyItemOverrides = {
  education: {},
  training: {},
  experience: {},
  eligibility: {},
  offenseQuestions: {},
  specialStatusQuestions: {},
}

const emptyEditErrors = {}
const yesNoOptions = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
]

const createDefaultRelevantSelections = (profileData) => ({
  education: (profileData?.education || []).map(() => true),
  training: (profileData?.training || []).map(() => true),
  experience: (profileData?.experience || []).map(() => true),
  eligibility: (profileData?.eligibility || []).map(() => true),
})

const mergeItemOverrides = (baseAssessment, overridingAssessment) => ({
  education: {
    ...(baseAssessment?.item_overrides?.education || {}),
    ...(overridingAssessment?.item_overrides?.education || {}),
  },
  training: {
    ...(baseAssessment?.item_overrides?.training || {}),
    ...(overridingAssessment?.item_overrides?.training || {}),
  },
  experience: {
    ...(baseAssessment?.item_overrides?.experience || {}),
    ...(overridingAssessment?.item_overrides?.experience || {}),
  },
  eligibility: {
    ...(baseAssessment?.item_overrides?.eligibility || {}),
    ...(overridingAssessment?.item_overrides?.eligibility || {}),
  },
  offenseQuestions: {
    ...(baseAssessment?.item_overrides?.offenseQuestions || {}),
    ...(overridingAssessment?.item_overrides?.offenseQuestions || {}),
  },
  specialStatusQuestions: {
    ...(baseAssessment?.item_overrides?.specialStatusQuestions || {}),
    ...(overridingAssessment?.item_overrides?.specialStatusQuestions || {}),
  },
})

const applyItemOverrides = (profileData, itemOverrides) => ({
  ...profileData,
  education: (profileData.education || []).map((item) => ({
    ...item,
    ...(itemOverrides.education?.[item.id] || {}),
  })),
  training: (profileData.training || []).map((item) => ({
    ...item,
    ...(itemOverrides.training?.[item.id] || {}),
  })),
  experience: (profileData.experience || []).map((item) => ({
    ...item,
    ...(itemOverrides.experience?.[item.id] || {}),
  })),
  eligibility: (profileData.eligibility || []).map((item) => ({
    ...item,
    ...(itemOverrides.eligibility?.[item.id] || {}),
  })),
  offenseQuestions: (profileData.offenseQuestions || []).map((item) => ({
    ...item,
    ...(itemOverrides.offenseQuestions?.[item.id] || {}),
  })),
  specialStatusQuestions: (profileData.specialStatusQuestions || []).map((item) => ({
    ...item,
    ...(itemOverrides.specialStatusQuestions?.[item.id] || {}),
  })),
})

const createFormFromAssessment = (assessment) => {
  if (!assessment) {
    return createDefaultForm()
  }

  return {
    remarks: assessment.general_remarks || "",
    screening: {
      requirements_completion: {
        status: Boolean(assessment.screening?.requirements_completion?.status),
        remarks: assessment.screening?.requirements_completion?.remarks || "",
      },
      offense_check: {
        status: Boolean(assessment.screening?.offense_check?.status),
        remarks: assessment.screening?.offense_check?.remarks || "",
      },
    },
    prescribed: {
      education: {
        status: Boolean(assessment.prescribed?.education?.status),
        remarks: assessment.prescribed?.education?.remarks || "",
      },
      training: {
        status: Boolean(assessment.prescribed?.training?.status),
        remarks: assessment.prescribed?.training?.remarks || "",
      },
      experience: {
        status: Boolean(assessment.prescribed?.experience?.status),
        remarks: assessment.prescribed?.experience?.remarks || "",
      },
      eligibility: {
        status: Boolean(assessment.prescribed?.eligibility?.status),
        remarks: assessment.prescribed?.eligibility?.remarks || "",
      },
    },
    preferred: {
      education: {
        status: Boolean(assessment.preferred?.education?.status),
        remarks: assessment.preferred?.education?.remarks || "",
      },
      training: {
        status: Boolean(assessment.preferred?.training?.status),
        remarks: assessment.preferred?.training?.remarks || "",
      },
      experience: {
        status: Boolean(assessment.preferred?.experience?.status),
        remarks: assessment.preferred?.experience?.remarks || "",
      },
      eligibility: {
        status: Boolean(assessment.preferred?.eligibility?.status),
        remarks: assessment.preferred?.eligibility?.remarks || "",
      },
    },
  }
}

const createInitialFormFromProfileData = (profileData, assessment) => {
  if (assessment) {
    return createFormFromAssessment(assessment)
  }

  const normalizedOffenseAnswers = (profileData?.offenseQuestions || []).map((item) =>
    String(item?.answer || "").trim().toLowerCase()
  )
  const hasOffenseRecord = normalizedOffenseAnswers.some((answer) => answer === "yes")
  const noOffenseRecord = normalizedOffenseAnswers.length === 0 || normalizedOffenseAnswers.every((answer) => answer === "no")

  return {
    ...createDefaultForm(),
    screening: {
      requirements_completion: {
        status: Boolean(profileData?.requirementsSummary?.is_complete),
        remarks: "",
      },
      offense_check: {
        status: noOffenseRecord || !hasOffenseRecord,
        remarks: "",
      },
    },
  }
}

const createRelevantSelections = (profileData, relevantItemIds) => {
  if (!relevantItemIds) {
    return createDefaultRelevantSelections(profileData)
  }

  return {
    education: (profileData?.education || []).map((item) =>
      (relevantItemIds.education || []).includes(item.id)
    ),
    training: (profileData?.training || []).map((item) =>
      (relevantItemIds.training || []).includes(item.id)
    ),
    experience: (profileData?.experience || []).map((item) =>
      (relevantItemIds.experience || []).includes(item.id)
    ),
    eligibility: (profileData?.eligibility || []).map((item) =>
      (relevantItemIds.eligibility || []).includes(item.id)
    ),
  }
}

const parseDate = (value) => {
  if (!value) return null

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const toYmd = (date) => {
  if (!date) return ""

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

const formatDurationParts = (totalDays) => {
  if (!totalDays) return "0 years, 0 months, 0 days"

  const years = Math.floor(totalDays / 365)
  const remainingDays = totalDays % 365
  const months = Math.floor(remainingDays / 30)
  const days = remainingDays % 30

  return `${years} year${years === 1 ? "" : "s"}, ${months} month${months === 1 ? "" : "s"}, ${days} day${days === 1 ? "" : "s"}`
}

const decomposeDuration = (totalDays) => {
  const safeDays = Number(totalDays || 0)
  const years = Math.floor(safeDays / 365)
  const remainingDays = safeDays % 365
  const months = Math.floor(remainingDays / 30)

  return {
    years,
    months,
    days: remainingDays % 30,
  }
}

export default function Assessment() {
  const {
    vacancy,
    applicant,
    backUrl,
    assessmentStage = "secretariat",
    existingAssessment = null,
    initialAssessment = null,
    previousStageUrl = null,
    nextStageUrl = null,
  } = usePage().props
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [rawProfileData, setRawProfileData] = useState(emptyProfileData)
  const [profileData, setProfileData] = useState(emptyProfileData)
  const [relevantSelections, setRelevantSelections] = useState(emptyRelevantSelections)
  const isSecretariatStage = assessmentStage === "secretariat"
  const relevantSelectionsSource = useMemo(
    () => existingAssessment || (!isSecretariatStage ? initialAssessment : null),
    [existingAssessment, initialAssessment, isSecretariatStage]
  )
  const formSource = useMemo(
    () => existingAssessment || (!isSecretariatStage ? initialAssessment : null),
    [existingAssessment, initialAssessment, isSecretariatStage]
  )
  const itemOverridesSource = useMemo(
    () => (
      isSecretariatStage
        ? mergeItemOverrides(null, existingAssessment)
        : mergeItemOverrides(initialAssessment, existingAssessment)
    ),
    [existingAssessment, initialAssessment, isSecretariatStage]
  )
  const [form, setForm] = useState(createFormFromAssessment(formSource))
  const [itemOverrides, setItemOverrides] = useState(itemOverridesSource)
  const [previewFile, setPreviewFile] = useState(null)
  const [previewTitle, setPreviewTitle] = useState("")
  const [editErrors, setEditErrors] = useState(emptyEditErrors)
  const [isSavingOverride, setIsSavingOverride] = useState(false)
  const [editDialog, setEditDialog] = useState({
    open: false,
    qualification: null,
    sourceId: null,
    form: {},
  })

  useEffect(() => {
    if (!applicant?.id) return

    const fetchQualifications = async () => {
      try {
        setIsLoadingProfile(true)
        const { data } = await axios.get(
          route("vacancies.applicants.qualifications", applicant.id)
        )

        const nextProfileData = {
          education: data.educations || [],
          training: data.learnings || [],
          experience: data.workExperiences || [],
          eligibility: data.eligibilities || [],
          offenseQuestions: data.offenseQuestions || [],
          specialStatusQuestions: data.specialStatusQuestions || [],
          requirementsSummary: data.requirementsSummary || emptyProfileData.requirementsSummary,
        }
        const nextItemOverrides = itemOverridesSource

        setRawProfileData(nextProfileData)
        setItemOverrides(nextItemOverrides)
        setProfileData(applyItemOverrides(nextProfileData, nextItemOverrides))
        setForm(createInitialFormFromProfileData(nextProfileData, formSource))
        setRelevantSelections(
          createRelevantSelections(nextProfileData, relevantSelectionsSource?.relevant_item_ids || null)
        )
      } catch (error) {
        console.error("Error fetching qualifications:", error)
        setRawProfileData(emptyProfileData)
        setProfileData(emptyProfileData)
        setRelevantSelections(emptyRelevantSelections)
        setItemOverrides(emptyItemOverrides)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    fetchQualifications()
  }, [applicant?.id, formSource, relevantSelectionsSource, itemOverridesSource])

  const handleQualificationChange = (section, key, field, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: {
          ...prev[section][key],
          [field]: value,
        },
      },
    }))
  }

  const openOverrideDialog = (qualification, item) => {
    setEditErrors(emptyEditErrors)
    setEditDialog({
      open: true,
      qualification,
      sourceId: item?.id ?? null,
      form: { ...item },
    })
  }

  const updateOverrideField = (field, value) => {
    setEditErrors((prev) => {
      if (!prev[field]) return prev

      const next = { ...prev }
      delete next[field]
      return next
    })

    setEditDialog((prev) => ({
      ...prev,
      form: {
        ...prev.form,
        [field]: value,
      },
    }))
  }

  const saveOverrideDialog = () => {
    if (!editDialog.qualification || !editDialog.sourceId) return

    const persistOverride = async () => {
      setIsSavingOverride(true)

      try {
        await axios.post(
          route("vacancies.applicants.assessment.override.store", {
            vacancy: vacancy.id,
            application: applicant.id,
          }),
          {
            stage: assessmentStage,
            qualification: editDialog.qualification,
            source_id: editDialog.sourceId,
            override_data: editDialog.form,
          }
        )

        const nextOverrides = {
          ...itemOverrides,
          [editDialog.qualification]: {
            ...(itemOverrides[editDialog.qualification] || {}),
            [editDialog.sourceId]: { ...editDialog.form },
          },
        }

        setItemOverrides(nextOverrides)
        setProfileData(applyItemOverrides(rawProfileData, nextOverrides))
        setEditErrors(emptyEditErrors)
        toast({
          title: "Override saved",
          description: "The override was saved successfully.",
        })
        setEditDialog({
          open: false,
          qualification: null,
          sourceId: null,
          form: {},
        })
      } catch (error) {
        const backendErrors = error.response?.data?.errors || {}
        const overrideErrors = Object.entries(backendErrors).reduce((carry, [key, value]) => {
          if (!key.startsWith("override_data.")) {
            return carry
          }

          carry[key.replace("override_data.", "")] = Array.isArray(value) ? value[0] : value
          return carry
        }, {})

        if (Object.keys(overrideErrors).length) {
          setEditErrors(overrideErrors)
        }

        toast({
          title: error.response?.data?.title || "Override not saved",
          description: error.response?.data?.message || "Please check the highlighted fields and try again.",
          variant: "destructive",
        })
      } finally {
        setIsSavingOverride(false)
      }
    }

    persistOverride()
  }

  const closeOverrideDialog = (open) => {
    if (open) return

    setEditErrors(emptyEditErrors)
    setEditDialog({
      open: false,
      qualification: null,
      sourceId: null,
      form: {},
    })
  }

  const itemOverridesPayload = Object.entries(itemOverrides).flatMap(([qualification, values]) =>
    Object.entries(values || {}).map(([sourceId, overrideData]) => ({
      qualification,
      source_id: Number(sourceId),
      override_data: overrideData,
    }))
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
  
    try {
      await axios.post(
        route("vacancies.applicants.assessment.store", {
          vacancy: vacancy.id,
          application: applicant.id,
        }),
        {
          stage: assessmentStage,
          general_remarks: form.remarks,
          prescribed_status: prescribedStatus,
          preferred_status: preferredStatus,
          overall_status: overallStatus,
          screening: form.screening,
          prescribed: form.prescribed,
          preferred: form.preferred,
          relevant_item_ids: relevantItemIds,
          item_overrides: itemOverridesPayload,
          totals: {
            relevant_training_hours: relevantTrainingHours,
            relevant_experience_days: relevantExperienceDays,
            relevant_experience_years: relevantExperienceParts.years,
            relevant_experience_months: relevantExperienceParts.months,
            relevant_experience_display: relevantExperienceLabel,
            cutoff_date: applicationCutoffDate ? toYmd(applicationCutoffDate) : null,
          },
        }
      )

      toast({
        title: "Success!",
        description: `${assessmentTitle} saved successfully.`,
      })

      router.visit(backUrl, {
        preserveScroll: false,
      })
    } catch (error) {
      toast({
        title: error.response?.data?.title || "Validation failed",
        description: error.response?.data?.message || "Please check the assessment form and try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const prescribedQualifications = [
    { key: "education", label: "Education", required: vacancy?.prescribed_education || "" },
    { key: "training", label: "Training", required: vacancy?.prescribed_training || "" },
    { key: "experience", label: "Experience", required: vacancy?.prescribed_experience || "" },
    { key: "eligibility", label: "Eligibility", required: vacancy?.prescribed_eligibility || "" },
  ]

  const preferredQualifications = [
    { key: "education", label: "Education", required: vacancy?.preferred_education || "" },
    { key: "training", label: "Training", required: vacancy?.preferred_training || "" },
    { key: "experience", label: "Experience", required: vacancy?.preferred_experience || "" },
    { key: "eligibility", label: "Eligibility", required: vacancy?.preferred_eligibility || "" },
  ]

  const prescribedStatus = useMemo(() => {
    const allPassed = Object.values(form.prescribed).every((q) => q.status)
    return allPassed ? "Passed" : "Failed"
  }, [form.prescribed])

  const preferredStatus = useMemo(() => {
    const allPassed = Object.values(form.preferred).every((q) => q.status)
    return allPassed ? "Passed" : "Failed"
  }, [form.preferred])

  const screeningStatus = useMemo(() => {
    const allPassed = Object.values(form.screening).every((q) => q.status)
    return allPassed ? "Passed" : "Failed"
  }, [form.screening])

  const overallStatus =
    screeningStatus === "Passed" &&
    prescribedStatus === "Passed" &&
    preferredStatus === "Passed"
      ? "Passed"
      : "Failed"

  const applicationCutoffDate = useMemo(() => {
    return parseDate(vacancy?.application_due_date || applicant?.date_submitted)
  }, [vacancy?.application_due_date, applicant?.date_submitted])

  const toggleRelevant = (section, index, checked) => {
    setRelevantSelections((prev) => {
      const nextSection = [...(prev[section] || [])]
      nextSection[index] = checked

      return {
        ...prev,
        [section]: nextSection,
      }
    })
  }

  const setAllRelevant = (section, checked, count) => {
    setRelevantSelections((prev) => ({
      ...prev,
      [section]: Array.from({ length: count }, () => checked),
    }))
  }

  const isRelevant = (section, index) => Boolean(relevantSelections[section]?.[index])

  const areAllRelevant = (section, count) => {
    if (!count) return false

    return Array.from({ length: count }, (_, index) => Boolean(relevantSelections[section]?.[index]))
      .every(Boolean)
  }

  const relevantTrainingHours = useMemo(() => {
    return (profileData.training || []).reduce((sum, item, index) => {
      if (!isRelevant("training", index)) return sum

      const hours = Number(item.hours_no || 0)
      return sum + (Number.isFinite(hours) ? hours : 0)
    }, 0)
  }, [profileData.training, relevantSelections.training])

  const relevantExperienceDays = useMemo(() => {
    return (profileData.experience || []).reduce((sum, item, index) => {
      if (!isRelevant("experience", index)) return sum

      const startDate = parseDate(item.from_date)
      const rawEndDate = item.is_present ? applicationCutoffDate : parseDate(item.to_date)
      const endDate = rawEndDate && applicationCutoffDate && rawEndDate > applicationCutoffDate
        ? applicationCutoffDate
        : rawEndDate

      if (!startDate || !endDate || endDate < startDate) return sum

      const diffMs = endDate.getTime() - startDate.getTime()
      return sum + Math.floor(diffMs / 86400000) + 1
    }, 0)
  }, [profileData.experience, relevantSelections.experience, applicationCutoffDate])

  const relevantExperienceLabel = useMemo(
    () => formatDurationParts(relevantExperienceDays),
    [relevantExperienceDays]
  )

  const relevantExperienceParts = useMemo(
    () => decomposeDuration(relevantExperienceDays),
    [relevantExperienceDays]
  )

  const relevantItemIds = useMemo(() => ({
    education: (profileData.education || [])
      .filter((item, index) => isRelevant("education", index))
      .map((item) => item.id)
      .filter(Boolean),
    training: (profileData.training || [])
      .filter((item, index) => isRelevant("training", index))
      .map((item) => item.id)
      .filter(Boolean),
    experience: (profileData.experience || [])
      .filter((item, index) => isRelevant("experience", index))
      .map((item) => item.id)
      .filter(Boolean),
    eligibility: (profileData.eligibility || [])
      .filter((item, index) => isRelevant("eligibility", index))
      .map((item) => item.id)
      .filter(Boolean),
  }), [profileData, relevantSelections])

  const assessmentTitle = isSecretariatStage ? "Secretariat's Assessment" : "HRMPSB's Assessment"
  const assessmentDescription = isSecretariatStage
    ? "Review submitted qualifications and prepare the initial secretariat assessment."
    : "Validate the initial assessment from the secretariat against the applicant's submitted qualifications."
  const saveButtonLabel = isSecretariatStage ? "Save Secretariat Assessment" : "Save HRMPSB Assessment"
  const stageBadgeLabel = isSecretariatStage ? "Initial Assessment Stage" : "Validation Stage"
  const topBackLabel = previousStageUrl ? "Back to Secretariat Assessment" : "Back to Assessment"

  const openAttachmentPreview = (files, title) => {
    if (!files?.length) return

    setPreviewFile(files[0])
    setPreviewTitle(title)
  }

  const renderRequirementFiles = (files, requirement) => {
    if (!files?.length) {
      return <span className="text-xs text-muted-foreground">No file</span>
    }

    const fileCountLabel = `${files.length} File${files.length === 1 ? "" : "s"}`

    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center px-1 py-1 text-xs font-medium text-foreground transition-colors hover:text-blue-600"
          >
            {fileCountLabel}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 p-2">
          <div className="mb-2 border-b pb-2">
            <p className="text-xs font-semibold text-foreground">{requirement || "Uploaded Files"}</p>
            <p className="text-[11px] text-muted-foreground">{fileCountLabel}</p>
          </div>

          <div className="max-h-56 overflow-y-auto">
            <div className="flex flex-col gap-1">
              {files.map((file, index) => (
                <button
                  key={`${file.id ?? index}-${file.filepath ?? file.path ?? index}`}
                  type="button"
                  className="truncate rounded-sm px-2 py-1 text-left text-xs text-foreground hover:bg-muted"
                  onClick={() =>
                    openAttachmentPreview(
                      [file],
                      file.filename || `${requirement} Attachment ${index + 1}`
                    )
                  }
                  title={file.filename || `${requirement} Attachment ${index + 1}`}
                >
                  {file.filename || `${requirement} Attachment ${index + 1}`}
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  const renderLinkedTitle = (label, files, title, options = {}) => {
    const { scrollable = false, compactMultiple = false } = options

    if (!files?.length) {
      return label || "No details"
    }

    const fileCountLabel = `${files.length} File${files.length === 1 ? "" : "s"}`

    const links = (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          className="inline-flex items-center px-1 py-1 text-left text-xs font-medium text-foreground transition-colors hover:text-blue-600"
          onClick={() => openAttachmentPreview(files, title || label)}
        >
          {label || "No details"}
        </button>

        {files.length > 1 && (
          compactMultiple ? (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-fit px-1 py-1 text-left text-[11px] font-medium text-muted-foreground transition-colors hover:text-blue-600"
                >
                  More attachments ({fileCountLabel})
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-80 p-2">
                <div className="mb-2 border-b pb-2">
                  <p className="text-xs font-semibold text-foreground">{title || label || "Attachments"}</p>
                  <p className="text-[11px] text-muted-foreground">{fileCountLabel}</p>
                </div>

                <div className="max-h-56 overflow-y-auto">
                  <div className="flex flex-col gap-1">
                    {files.map((file, index) => (
                      <button
                        key={`${file.id ?? index}-${file.filepath ?? file.path ?? index}`}
                        type="button"
                        className="truncate rounded-sm px-2 py-1 text-left text-xs text-foreground hover:bg-muted"
                        onClick={() =>
                          openAttachmentPreview(
                            [file],
                            file.filename || `${title || label || "Attachment"} ${index + 1}`
                          )
                        }
                        title={file.filename || `${title || label || "Attachment"} ${index + 1}`}
                      >
                        {file.filename || `Attachment ${index + 1}`}
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <div className={scrollable ? "max-h-24 overflow-y-auto pr-1" : ""}>
              <div className="flex flex-col gap-1">
                {files.map((file, index) => (
                  <button
                    key={`${file.id ?? index}-${file.filepath ?? file.path ?? index}`}
                    type="button"
                    className="truncate rounded-sm px-2 py-1 text-left text-[11px] text-foreground hover:bg-muted"
                    onClick={() =>
                      openAttachmentPreview(
                        [file],
                        file.filename || `${title || label || "Attachment"} ${index + 1}`
                      )
                    }
                    title={file.filename || `${title || label || "Attachment"} ${index + 1}`}
                  >
                    {file.filename || `Attachment ${index + 1}`}
                  </button>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    )

    return links
  }

  const renderOverrideButton = (qualification, item) => (
    <button
      type="button"
      className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      onClick={() => openOverrideDialog(qualification, item)}
      title="Override displayed data"
    >
      <Pencil className="h-3.5 w-3.5" />
    </button>
  )

  const renderOverrideFields = () => {
    const qualification = editDialog.qualification
    const values = editDialog.form

    if (!qualification) return null

    switch (qualification) {
      case "education":
        return (
          <div className="grid gap-4">
            <div className="grid gap-1">
              <Label>Level</Label>
              <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
                {values.level || "-"}
              </div>
            </div>

            <div className="flex items-center space-x-2 rounded-md border bg-muted/20 px-3 py-2">
              <Switch
                checked={!!values.is_graduated}
                onCheckedChange={(checked) => updateOverrideField("is_graduated", checked)}
              />
              <span className="text-sm font-medium">I graduated here</span>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div>
                <Label htmlFor="override-school">Name of School</Label>
                <TextInput
                  id="override-school"
                  value={values.school || ""}
                  onChange={(e) => updateOverrideField("school", e.target.value)}
                  isInvalid={!!editErrors.school}
                />
                {editErrors.school && <p className="mt-1 text-xs text-red-500">{editErrors.school}</p>}
              </div>

              <div>
                <Label htmlFor="override-course">Basic Education/Degree/Course</Label>
                <TextInput
                  id="override-course"
                  value={values.course || ""}
                  onChange={(e) => updateOverrideField("course", e.target.value)}
                  isInvalid={!!editErrors.course}
                />
                {editErrors.course && <p className="mt-1 text-xs text-red-500">{editErrors.course}</p>}
              </div>

              <div>
                <Label htmlFor="override-highest-attainment">Highest Level/Units Earned</Label>
                <TextInput
                  id="override-highest-attainment"
                  value={values.highest_attainment || ""}
                  onChange={(e) => updateOverrideField("highest_attainment", e.target.value)}
                  isInvalid={!!editErrors.highest_attainment}
                />
                {editErrors.highest_attainment && <p className="mt-1 text-xs text-red-500">{editErrors.highest_attainment}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div>
                <Label htmlFor="override-from-year">Period of Attendance: From</Label>
                <YearPicker
                  value={values.from_year || ""}
                  onChange={(value) => updateOverrideField("from_year", value)}
                  startYear={1950}
                  placeholder="Select year"
                  isInvalid={!!editErrors.from_year}
                />
                {editErrors.from_year && <p className="mt-1 text-xs text-red-500">{editErrors.from_year}</p>}
              </div>

              <div>
                <Label htmlFor="override-to-year">Period of Attendance: To</Label>
                <YearPicker
                  value={values.to_year || ""}
                  onChange={(value) => updateOverrideField("to_year", value)}
                  startYear={1950}
                  placeholder="Select year"
                  isInvalid={!!editErrors.to_year}
                />
                {editErrors.to_year && <p className="mt-1 text-xs text-red-500">{editErrors.to_year}</p>}
              </div>

              <div>
                <Label htmlFor="override-year-graduated">Year Graduated</Label>
                <YearPicker
                  value={values.year_graduated || ""}
                  onChange={(value) => {
                    updateOverrideField("year_graduated", value)
                    if (!values.to_year) {
                      updateOverrideField("to_year", value)
                    }
                  }}
                  startYear={1950}
                  placeholder="Select year"
                  disabled={!values.is_graduated}
                  isInvalid={!!editErrors.year_graduated}
                />
                {editErrors.year_graduated && <p className="mt-1 text-xs text-red-500">{editErrors.year_graduated}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="override-award">Scholarship / Academic Honors</Label>
              <TextInput
                id="override-award"
                value={values.award || ""}
                onChange={(e) => updateOverrideField("award", e.target.value)}
                isInvalid={!!editErrors.award}
              />
              {editErrors.award && <p className="mt-1 text-xs text-red-500">{editErrors.award}</p>}
            </div>
          </div>
        )
      case "training":
        return (
          <LearningAndDevelopmentForm
            formData={{
              ...values,
              seminar_title: values.seminar_title || values.title || "",
              hours: values.hours || values.hours_no || "",
            }}
            setFormData={(updater) => {
              const nextValues = typeof updater === "function" ? updater({
                ...values,
                seminar_title: values.seminar_title || values.title || "",
                hours: values.hours || values.hours_no || "",
              }) : updater

              setEditDialog((prev) => ({
                ...prev,
                form: {
                  ...prev.form,
                  ...nextValues,
                  title: nextValues.seminar_title ?? nextValues.title ?? "",
                  hours_no: nextValues.hours ?? nextValues.hours_no ?? "",
                },
              }))
            }}
            formErrors={editErrors}
            formLoading={false}
          />
        )
      case "experience":
        return (
          <WorkExperienceForm
            formData={{
              ...values,
              agency: values.agency || values.company_name || "",
              position: values.position || values.position_title || "",
              isPresent: values.isPresent ?? values.is_present ?? false,
              isGovtService: values.isGovtService ?? values.is_govt_service ?? false,
            }}
            setFormData={(updater) => {
              const nextValues = typeof updater === "function" ? updater({
                ...values,
                agency: values.agency || values.company_name || "",
                position: values.position || values.position_title || "",
                isPresent: values.isPresent ?? values.is_present ?? false,
                isGovtService: values.isGovtService ?? values.is_govt_service ?? false,
              }) : updater

              setEditDialog((prev) => ({
                ...prev,
                form: {
                  ...prev.form,
                  ...nextValues,
                  company_name: nextValues.agency ?? nextValues.company_name ?? "",
                  position_title: nextValues.position ?? nextValues.position_title ?? "",
                  is_present: nextValues.isPresent ?? nextValues.is_present ?? false,
                },
              }))
            }}
            formErrors={editErrors}
            formLoading={false}
          />
        )
      case "eligibility":
        return (
          <CivilServiceEligibilityForm
            formData={values}
            setFormData={(updater) => {
              const nextValues = typeof updater === "function" ? updater(values) : updater
              setEditDialog((prev) => ({
                ...prev,
                form: {
                  ...prev.form,
                  ...nextValues,
                },
              }))
            }}
            formErrors={editErrors}
            formLoading={false}
          />
        )
      case "offenseQuestions":
      case "specialStatusQuestions":
        return (
          <div className="grid gap-4">
            <div className="grid gap-1">
              <Label>Question</Label>
              <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
                {values.label || "-"}
              </div>
            </div>

            <div>
              <Label htmlFor="override-answer">Answer</Label>
              <SingleComboBox
                name="answer"
                items={yesNoOptions}
                value={String(values.answer || "").toLowerCase() || null}
                onChange={(value) => updateOverrideField("answer", value || "")}
                placeholder="Select answer"
                className="mt-1"
                invalidMessage={editErrors.answer}
                width="w-[240px]"
                labelWidth="w-[160px]"
              />
              {editErrors.answer && <p className="mt-1 text-xs text-red-500">{editErrors.answer}</p>}
            </div>

            <div>
              <Label htmlFor="override-details">Details</Label>
              <Textarea
                id="override-details"
                className="mt-1 min-h-[120px]"
                value={values.details || ""}
                onChange={(e) => updateOverrideField("details", e.target.value)}
              />
              {editErrors.details && <p className="mt-1 text-xs text-red-500">{editErrors.details}</p>}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const renderProfileColumn = (key) => {
    if (isLoadingProfile) return <span className="text-gray-400 text-xs italic">Loading...</span>

    const items = profileData[key] || []
    if (!items.length) return <span className="text-gray-400 text-xs italic">No record</span>

    switch (key) {
      case "education":
        return (
          <div className="rounded-md border overflow-hidden">
            <div className="flex items-center justify-end gap-2 border-b bg-muted/30 px-3 py-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setAllRelevant("education", true, items.length)}
                disabled={areAllRelevant("education", items.length)}
              >
                Toggle All
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setAllRelevant("education", false, items.length)}
              >
                Untoggle All
              </Button>
            </div>
            <Table className="table-fixed w-full">
              <colgroup>
                <col />
                <col className="w-[90px]" />
                <col className="w-[120px]" />
              </colgroup>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead>Education</TableHead>
                  <TableHead className="w-[90px]">Year</TableHead>
                  <TableHead className="w-[120px] text-center">Relevant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {items.map((edu, i) => (
                    <TableRow key={i} className={isRelevant("education", i) ? "bg-green-50" : ""}>
                      <TableCell className="text-xs">
                        <div className="min-w-0 break-words whitespace-normal">
                          {renderLinkedTitle(
                            [edu.course, edu.school].filter(Boolean).join(" - "),
                            edu.files,
                            [edu.course, edu.school].filter(Boolean).join(" - "),
                            { compactMultiple: true }
                          )}
                        </div>
                      </TableCell>
                    <TableCell className="text-xs">
                      {edu.to_year || edu.year_graduated || "-"}
                    </TableCell>
                    <TableCell className="w-[120px] text-center">
                      <div className="flex items-center justify-center gap-2">
                        {renderOverrideButton("education", edu)}
                        <Switch
                          checked={isRelevant("education", i)}
                          onCheckedChange={(value) => toggleRelevant("education", i, value)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      case "training":
        return (
          <div className="rounded-md border overflow-hidden">
            <div className="flex items-center justify-end gap-2 border-b bg-muted/30 px-3 py-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setAllRelevant("training", true, items.length)}
                disabled={areAllRelevant("training", items.length)}
              >
                Toggle All
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setAllRelevant("training", false, items.length)}
              >
                Untoggle All
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead>Training</TableHead>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead className="w-[90px] text-right">Hours</TableHead>
                  <TableHead className="w-[90px] text-center">Relevant</TableHead>
                </TableRow>
              </TableHeader>
            </Table>

            <div className="max-h-72 overflow-y-auto">
              <Table>
                <TableBody>
                    {items.map((training, i) => (
                      <TableRow key={i} className={isRelevant("training", i) ? "bg-green-50" : ""}>
                        <TableCell className="text-xs">
                          <div className="min-w-0">
                            {renderLinkedTitle(
                              training.title || "Untitled training",
                              training.files,
                              training.title || "Untitled training",
                              { scrollable: true }
                            )}
                          </div>
                        </TableCell>
                      <TableCell className="text-xs">
                        {training.from_date || training.to_date
                          ? formatDateRange(training.from_date, training.to_date)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {training.hours_no || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {renderOverrideButton("training", training)}
                        <Switch
                          checked={isRelevant("training", i)}
                          onCheckedChange={(value) => toggleRelevant("training", i, value)}
                        />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="border-t bg-muted/30 px-3 py-2 text-xs font-medium text-foreground">
              <div className="grid grid-cols-[1fr_120px_90px_90px] items-center">
                <span />
                <span className="text-right">Total Relevant Training Hours</span>
                <span className="text-right text-green-700">{relevantTrainingHours}</span>
                <span />
              </div>
            </div>
          </div>
        )
      case "experience":
        return (
          <div className="rounded-md border overflow-hidden">
            <div className="flex items-center justify-end gap-2 border-b bg-muted/30 px-3 py-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setAllRelevant("experience", true, items.length)}
                disabled={areAllRelevant("experience", items.length)}
              >
                Toggle All
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setAllRelevant("experience", false, items.length)}
              >
                Untoggle All
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead>Position and Agency</TableHead>
                  <TableHead className="w-[140px]">Duration</TableHead>
                  <TableHead className="w-[90px] text-center">Relevant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {items.map((experience, i) => (
                    <TableRow key={i} className={isRelevant("experience", i) ? "bg-green-50" : ""}>
                      <TableCell className="text-xs">
                        <div className="min-w-0">
                          {renderLinkedTitle(
                            [experience.position_title, experience.company_name]
                              .filter(Boolean)
                              .join(" - "),
                            experience.files,
                            [experience.position_title, experience.company_name]
                              .filter(Boolean)
                              .join(" - ")
                          )}
                        </div>
                      </TableCell>
                    <TableCell className="text-xs">
                      {experience.from_date || experience.to_date
                        ? formatDateRange(experience.from_date, experience.to_date)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {renderOverrideButton("experience", experience)}
                      <Switch
                        checked={isRelevant("experience", i)}
                        onCheckedChange={(value) => toggleRelevant("experience", i, value)}
                      />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="border-t bg-muted/30 px-3 py-2 text-xs font-medium text-foreground">
              <div className="grid grid-cols-[1fr_140px_90px] items-center">
                  <span className="text-right">
                    Total Relevant Experience{applicationCutoffDate ? ` as of ${formatDate(applicationCutoffDate)}` : ""}
                  </span>
                  <span className="col-span-2 text-right text-green-700">{relevantExperienceLabel}</span>
                </div>
            </div>
          </div>
        )
      case "eligibility":
        return (
          <div className="rounded-md border overflow-hidden">
            <div className="flex items-center justify-end gap-2 border-b bg-muted/30 px-3 py-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setAllRelevant("eligibility", true, items.length)}
                disabled={areAllRelevant("eligibility", items.length)}
              >
                Toggle All
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setAllRelevant("eligibility", false, items.length)}
              >
                Untoggle All
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead>Eligibility</TableHead>
                  <TableHead className="w-[100px] text-right">Rating</TableHead>
                  <TableHead className="w-[140px]">Exam Date</TableHead>
                  <TableHead className="w-[90px] text-center">Relevant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {items.map((eligibility, i) => (
                    <TableRow key={i} className={isRelevant("eligibility", i) ? "bg-green-50" : ""}>
                      <TableCell className="text-xs">
                        <div className="min-w-0">
                          {renderLinkedTitle(
                            eligibility.eligibility || "Untitled eligibility",
                            eligibility.files,
                            eligibility.eligibility || "Untitled eligibility"
                          )}
                        </div>
                      </TableCell>
                    <TableCell className="text-xs text-right">
                      {eligibility.rating || "-"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDate(eligibility.exam_date) || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {renderOverrideButton("eligibility", eligibility)}
                      <Switch
                        checked={isRelevant("eligibility", i)}
                        onCheckedChange={(value) => toggleRelevant("eligibility", i, value)}
                      />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      default:
        return null
    }
  }

  const renderQualificationTable = (sectionName, sectionLabel, qualifications, status) => (
    <div
      className={clsx(
        "flex flex-col gap-2 rounded-lg border border-l-4 p-4",
        status === "Passed" ? "border-l-green-500" : "border-l-red-500"
      )}
    >
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">{sectionLabel}</h3>
        <div className="flex gap-2 items-center">
          <span className="text-xs">Status:</span>
          <div
            className={clsx(
              "font-semibold text-base",
              status === "Passed" ? "text-green-600" : "text-red-600"
            )}
          >
            {status}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table className="table-fixed">
          <colgroup>
            <col className="w-[20%]" />
            <col className="w-[45%]" />
            <col className="w-[10%]" />
            <col className="w-[25%]" />
          </colgroup>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead>Qualification</TableHead>
              <TableHead>
                {isSecretariatStage ? "From Profile" : "Secretariat's Assessment"}
              </TableHead>
              <TableHead className="text-center">Passed/Failed</TableHead>
              <TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>
        </Table>

        <div className="max-h-[36rem] overflow-y-auto">
          <Table className="table-fixed">
            <colgroup>
              <col className="w-[20%]" />
              <col className="w-[45%]" />
              <col className="w-[10%]" />
              <col className="w-[25%]" />
            </colgroup>
            <TableBody>
              {qualifications.map((qualification) => (
                <TableRow
                  key={`${sectionName}-${qualification.key}`}
                  className="hover:bg-transparent data-[state=selected]:bg-transparent"
                >
                  <TableCell className="font-medium align-top pt-3">
                    <span>{qualification.label}</span>
                    <div className="mt-1 text-xs">
                      {qualification.required ? (
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: qualification.required }}
                        />
                      ) : (
                        <span className="italic text-gray-400">-</span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="align-top pt-3">
                    {renderProfileColumn(qualification.key)}
                  </TableCell>

                  <TableCell className="text-center align-top pt-3">
                    <div className="flex flex-col items-center gap-2">
                      <span
                        className={clsx(
                          "text-xs font-semibold",
                          form[sectionName][qualification.key].status ? "text-green-600" : "text-red-600"
                        )}
                      >
                        {form[sectionName][qualification.key].status ? "Passed" : "Failed"}
                      </span>
                      <Switch
                        checked={form[sectionName][qualification.key].status}
                        onCheckedChange={(value) =>
                          handleQualificationChange(sectionName, qualification.key, "status", value)
                        }
                      />
                    </div>
                  </TableCell>

                  <TableCell className="align-top pt-3">
                    {!isSecretariatStage && initialAssessment?.[sectionName]?.[qualification.key]?.remarks && (
                      <div className="mb-2 rounded-md border bg-muted/30 px-3 py-2 text-xs">
                        <span className="font-medium text-muted-foreground">Secretariat remark:</span>{" "}
                        <span>{initialAssessment[sectionName][qualification.key].remarks}</span>
                      </div>
                    )}
                    <Textarea
                      className="min-h-[120px]"
                      value={form[sectionName][qualification.key].remarks}
                      onChange={(e) =>
                        handleQualificationChange(sectionName, qualification.key, "remarks", e.target.value)
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )

  const renderScreeningSection = (key, title, description, content) => (
    <div
      className={clsx(
        "rounded-lg border border-l-4 p-4",
        form.screening[key].status ? "border-l-green-500" : "border-l-red-500"
      )}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "text-xs font-semibold",
              form.screening[key].status ? "text-green-600" : "text-red-600"
            )}
          >
            {form.screening[key].status ? "Passed" : "Failed"}
          </span>
          <Switch
            checked={form.screening[key].status}
            onCheckedChange={(value) =>
              handleQualificationChange("screening", key, "status", value)
            }
          />
        </div>
      </div>

      <div className="space-y-3">
        {content}

        {!isSecretariatStage && initialAssessment?.screening?.[key]?.remarks && (
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs">
            <span className="font-medium text-muted-foreground">Secretariat remark:</span>{" "}
            <span>{initialAssessment.screening[key].remarks}</span>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Remarks
          </label>
          <Textarea
            value={form.screening[key].remarks}
            onChange={(e) =>
              handleQualificationChange("screening", key, "remarks", e.target.value)
            }
          />
        </div>
      </div>
    </div>
  )

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Recruitment", href: "#" },
    { label: "Vacancies", href: route("vacancies.index") },
    {
      label: `${vacancy.reference_no}: ${vacancy.position_description}${
        vacancy.appointment_status === "Permanent" && vacancy.item_no ? ` (${vacancy.item_no})` : ""
      }`,
      href: route("vacancies.show", vacancy.id),
    },
    { label: "Assessment", href: backUrl },
    {
      label: assessmentTitle,
      href: isSecretariatStage
        ? route("vacancies.applicants.secretariat-assessment", { vacancy: vacancy.id, application: applicant.id })
        : route("vacancies.applicants.hrmpsb-assessment", { vacancy: vacancy.id, application: applicant.id }),
    },
  ]

  return (
    <div className="h-full flex flex-col gap-4">
      <Head title={`${assessmentTitle} - ${formatFullName(applicant?.name) || "Applicant"}`} />

      <Link href={previousStageUrl || backUrl} className="w-fit">
        <Button variant="ghost" size="sm" className="flex items-center">
          <ChevronLeft className="h-4 w-4 mr-1" />
          {topBackLabel}
        </Button>
      </Link>

      <PageTitle
        pageTitle={`${assessmentTitle}: ${formatFullName(applicant?.name) || "Applicant"}`}
        description={assessmentDescription}
        breadcrumbItems={breadcrumbItems}
      />

      <div className="border rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap justify-between items-start gap-4 border-b pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">
              {vacancy.position_description} {vacancy.appointment_status === "Permanent" && `(${vacancy.item_no})`}
            </h2>
            <p className="text-sm text-muted-foreground">You are assessing: {formatFullName(applicant?.name)}</p>
          </div>

          <div className="flex flex-col items-end gap-2 text-right">
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              {stageBadgeLabel}
            </span>
            <div className="flex flex-col text-right">
              <span className="text-sm text-muted-foreground">Overall Status</span>
              <div
                className={clsx(
                  "font-semibold text-base",
                  overallStatus === "Passed" ? "text-green-600" : "text-red-600"
                )}
              >
                {overallStatus}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {applicant?.email_address || "No email"}
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            {applicant?.mobile_no || "No mobile number"}
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Submitted on {formatDateWithTime(applicant?.date_submitted)}
          </div>
        </div>

        {!isSecretariatStage && (
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-medium">Secretariat's Initial Assessment</h3>
                <p className="text-sm text-muted-foreground">
                  {initialAssessment
                    ? "Use this as the basis for the HRMPSB validation."
                    : "No saved secretariat assessment yet."}
                </p>
              </div>
              {initialAssessment && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Overall Status</p>
                  <p
                    className={clsx(
                      "font-semibold",
                      initialAssessment.overall_status === "Passed" ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {initialAssessment.overall_status}
                  </p>
                </div>
              )}
            </div>

            {initialAssessment?.general_remarks && (
              <div className="mt-3">
                <p className="text-xs font-medium text-muted-foreground">General Remarks</p>
                <p className="text-sm">{initialAssessment.general_remarks}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative flex-1 min-h-0 border rounded-lg p-4 overflow-hidden">
        {isLoadingProfile && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-white/50 backdrop-blur-[2px]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        <div className={isLoadingProfile ? "pointer-events-none blur-[1.5px] opacity-70 transition" : "transition"}>
        <ScrollArea className="h-[calc(100vh-340px)] pr-4">
          <form id="assessment-form" onSubmit={handleSubmit} className="flex flex-col gap-6 pb-4">
            {renderScreeningSection(
              "requirements_completion",
              "Complete Requirements",
              "Submitted requirements summary for this vacancy.",
              <>
                <div className="rounded-md border bg-muted/20 px-3 py-2">
                  <p
                    className={clsx(
                      "text-sm font-medium",
                      profileData.requirementsSummary?.is_complete ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {profileData.requirementsSummary?.is_complete ? "Yes" : "No"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {profileData.requirementsSummary?.submitted_count || 0} of{" "}
                    {profileData.requirementsSummary?.total_count || 0} vacancy requirements submitted.
                  </p>
                </div>

                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="h-8 w-[52%] px-2 py-1 text-xs">Requirement</TableHead>
                        <TableHead className="h-8 w-[28%] px-2 py-1 text-xs">Uploaded Files</TableHead>
                        <TableHead className="h-8 w-[96px] px-2 py-1 text-center text-xs">Submitted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(profileData.requirementsSummary?.items || []).length ? (
                        profileData.requirementsSummary.items.map((item) => (
                          <TableRow key={item.id ?? item.requirement} className="hover:bg-transparent">
                            <TableCell className="w-[52%] px-2 py-1 text-xs">{item.requirement || "-"}</TableCell>
                            <TableCell className="w-[28%] px-2 py-1">
                              {renderRequirementFiles(item.files, item.requirement)}
                            </TableCell>
                            <TableCell className="px-2 py-1 text-center">
                              <span
                                className={clsx(
                                  "text-sm font-medium",
                                  item.is_submitted ? "text-green-600" : "text-red-600"
                                )}
                              >
                                {item.is_submitted ? "Yes" : "No"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={3} className="px-2 py-2 text-center text-xs text-muted-foreground">
                            No vacancy requirements found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}

            {renderScreeningSection(
              "offense_check",
              "Charged or Found Guilty with Administrative or Criminal Offense",
              "From Other Information: item no. 35 A and B, and item no. 36.",
              <div className="space-y-3">
                {(profileData.offenseQuestions || []).length ? (
                  profileData.offenseQuestions.map((item) => (
                    <div key={`${item.item_no}-${item.list || "main"}`} className="rounded-md border bg-muted/20 px-3 py-2">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium">{item.label}</p>
                        {renderOverrideButton("offenseQuestions", item)}
                      </div>
                      {item.answer === "yes" ? (
                        <>
                          <p className="mt-1 text-sm font-medium text-red-600">Yes</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.details || "No details provided."}
                          </p>
                        </>
                      ) : (
                        <p className="mt-1 text-sm font-medium text-green-600">No</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No offense records found.</p>
                )}
              </div>
            )}

            <div className="rounded-lg border p-4">
              <div className="mb-3">
                <h3 className="font-semibold">Marginalized, Underprivileged or Vulnerable groups</h3>
                <p className="text-sm text-muted-foreground">
                  Indigenous group, person with disability, and solo parent declarations.
                </p>
              </div>

              <div className="space-y-3">
                {(profileData.specialStatusQuestions || []).length ? (
                  profileData.specialStatusQuestions.map((item) => (
                    <div key={`${item.item_no}-${item.list || "main"}`} className="rounded-md border bg-muted/20 px-3 py-2">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium">{item.label}</p>
                        {renderOverrideButton("specialStatusQuestions", item)}
                      </div>
                      {item.answer === "yes" ? (
                        <>
                          <p className="mt-1 text-sm font-medium text-red-600">Yes</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.details || "No details provided."}
                          </p>
                        </>
                      ) : (
                        <p className="mt-1 text-sm font-medium text-green-600">No</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No item 40 declarations found.</p>
                )}
              </div>
            </div>

            {renderQualificationTable(
              "prescribed",
              "CSC-Prescribed Qualifications",
              prescribedQualifications,
              prescribedStatus
            )}

            {prescribedStatus === "Passed" &&
              renderQualificationTable(
                "preferred",
                "Preferred Qualifications",
                preferredQualifications,
                preferredStatus
              )}

            {prescribedStatus === "Passed" && (
              <div>
                <label className="block text-sm font-medium mb-1">General Remarks</label>
                <Textarea
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  required
                />
              </div>
            )}
          </form>
        </ScrollArea>
        </div>
      </div>

      <div className="flex justify-between gap-2">
        <div>
          {nextStageUrl && (
            <Link href={nextStageUrl}>
              <Button type="button" variant="outline">Open HRMPSB Assessment</Button>
            </Link>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={previousStageUrl || backUrl}>
            <Button type="button" variant="ghost">Cancel</Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            form="assessment-form"
            className="gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {saveButtonLabel}
          </Button>
        </div>
      </div>

      <AttachmentPreviewDialog
        open={Boolean(previewFile)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewFile(null)
            setPreviewTitle("")
          }
        }}
        file={previewFile}
        title={previewTitle}
      />

      <Dialog open={editDialog.open} onOpenChange={closeOverrideDialog}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Apply Override</DialogTitle>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto pr-1">
            {renderOverrideFields()}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => closeOverrideDialog(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={saveOverrideDialog} disabled={isSavingOverride}>
              {isSavingOverride && <Loader2 className="h-4 w-4 animate-spin" />}
              Apply Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
