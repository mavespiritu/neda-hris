import { useState, useEffect, useMemo } from "react"
import axios from "axios"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"
import clsx from "clsx"
import { formatDateRange } from "@/lib/utils.jsx" 

const createDefaultForm = () => ({
  remarks: "",
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
}

const AssessApplicantForm = ({ open, onClose, applicant, vacancy }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [profileData, setProfileData] = useState(emptyProfileData)
  const [form, setForm] = useState(createDefaultForm())

  useEffect(() => {
    if (!open || !applicant?.id) return

    const fetchQualifications = async () => {
      try {
        setIsLoadingProfile(true)
        const { data } = await axios.get(
          route("vacancies.applicants.qualifications", applicant.id)
        )

        setProfileData({
          education: data.educations || [],
          training: data.learnings || [],
          experience: data.workExperiences || [],
          eligibility: data.eligibilities || [],
        })
      } catch (error) {
        console.error("Error fetching qualifications:", error)
        setProfileData(emptyProfileData)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    fetchQualifications()
  }, [open, applicant?.id])

  useEffect(() => {
    if (!open) return

    setForm(createDefaultForm())
  }, [open, applicant?.id])

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      console.log("Assessment saved for:", applicant?.name, form)
      onClose()
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

  const overallStatus =
    prescribedStatus === "Passed" && preferredStatus === "Passed" ? "Passed" : "Failed"

  const renderProfileColumn = (key) => {
    if (isLoadingProfile) return <span className="text-gray-400 text-xs italic">Loading...</span>

    const items = profileData[key] || []
    if (!items.length) return <span className="text-gray-400 text-xs italic">No record</span>

    switch (key) {
      case "education":
        return (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead>Education</TableHead>
                  <TableHead className="w-[90px]">Year</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((edu, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs">
                      {[edu.course, edu.school].filter(Boolean).join(" - ") || "No details"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {edu.to_year || edu.year_graduated || "-"}
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
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead>Training</TableHead>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead className="w-[90px] text-right">Hours</TableHead>
                </TableRow>
              </TableHeader>
            </Table>

            <div className="max-h-48 overflow-y-auto">
              <Table>
                <TableBody>
                  {items.map((training, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs">
                        {training.title || "Untitled training"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {training.from_date || training.to_date
                          ? formatDateRange(training.from_date, training.to_date)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {training.hours_no || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

        )
      case "experience":
      return (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead>Position and Agency</TableHead>
                <TableHead className="w-[140px]">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((experience, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs">
                    {[experience.position_title, experience.company_name]
                      .filter(Boolean)
                      .join(" - ") || "No details"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {experience.from_date || experience.to_date
                      ? formatDateRange(experience.from_date, experience.to_date)
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )
      case "eligibility":
        return (
          <ul className="text-xs list-disc ml-4">
            {items.map((eligibility, i) => (
              <li key={i}>
                {eligibility.eligibility || "Untitled eligibility"}
                {` (${eligibility.rating || "No rating"})`}
              </li>
            ))}
          </ul>
        )
      default:
        return null
    }
  }

  const renderQualificationTable = (sectionName, sectionLabel, qualifications, status) => (
    <div className="flex flex-col gap-2">
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

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead className="w-[20%]">Qualification</TableHead>
              <TableHead className="w-[50%]">From Profile</TableHead>
              <TableHead className="w-[10%] text-center">Status</TableHead>
              <TableHead className="w-[25%]">Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {qualifications.map((qualification) => (
              <TableRow
                key={`${sectionName}-${qualification.key}`}
                className="hover:bg-transparent data-[state=selected]:bg-transparent"
              >
                <TableCell className="font-medium align-top pt-3">
                  <span>{qualification.label}</span>
                  <div className="text-xs mt-1">
                    {qualification.required ? (
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: qualification.required }}
                      />
                    ) : (
                      <span className="text-gray-400 italic">-</span>
                    )}
                  </div>
                </TableCell>

                <TableCell className="align-top pt-3">{renderProfileColumn(qualification.key)}</TableCell>

                <TableCell className="text-center align-top pt-3">
                  <Switch
                    checked={form[sectionName][qualification.key].status}
                    onCheckedChange={(value) =>
                      handleQualificationChange(sectionName, qualification.key, "status", value)
                    }
                  />
                </TableCell>

                <TableCell className="align-top pt-3">
                  <Textarea
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
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Assess Applicant for {vacancy.position_description}{" "}
            {vacancy.appointment_status === "Permanent" && `(${vacancy.item_no})`}
          </DialogTitle>

          <DialogDescription className="text-gray-800 pt-4">
            <div className="flex justify-between items-center gap-4 border-b pb-4">
              <div className="flex flex-col">
                <span>You are assessing:</span>
                <span className="font-medium text-base">{applicant?.name}</span>
              </div>

              <div className="flex flex-col text-right">
                <span>Overall Status:</span>
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
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <form id="assessment-form" onSubmit={handleSubmit} className="flex flex-col gap-6 pb-4">
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

        <DialogFooter className="mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || prescribedStatus !== "Passed"}
            form="assessment-form"
            className="gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Assessment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AssessApplicantForm
