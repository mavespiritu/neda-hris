import React, { useState, useEffect, useMemo } from "react"
import { Files, Upload, Paperclip, Trash2, Loader2, CircleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import AttachRequirementForm from "./AttachRequirementForm"
import { store } from "./store"
import EducationFiles from "./EducationFiles"
import EligibilityFiles from "./EligibilityFiles"
import LearningFiles from "./LearningFiles"
import WorkExperienceFiles from "./WorkExperienceFiles"
import Attachment from "@/components/Attachment"
import { router } from "@inertiajs/react"
import { useToast } from "@/hooks/use-toast"

const ChooseDocuments = ({ job, applicant, submittedProfileReview = null, isReopenedSubmission = false }) => {

  const { toast } = useToast()

  const [selectedRequirement, setSelectedRequirement] = useState(null)
  const [open, setOpen] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const { requirements, fetchRequirements } = store()

  const normalizeText = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")

  const normalizeDate = (value) => String(value ?? "").trim().slice(0, 10)

  const normalizeAmount = (value) => {
    if (value === null || value === undefined || value === "") return ""

    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed.toFixed(2) : normalizeText(value)
  }

  const deleteAttachment = (fileId, requirementId) => {
    
    setDeletingId(fileId)

    router.delete(route("jobs.requirements.destroy", { hashedId: job.hashed_id, requirementId: requirementId, id: fileId}), {
      preserveScroll: true,
      onSuccess: () => {
        toast({
          title: "Success!",
          description: "The requirement has been deleted successfully",
        })
        fetchRequirements(job.hashed_id)
        setDeletingId(null)
        
      },
      onError: (errors) => {
        console.error(errors)
        setDeletingId(null)
      },
    })
  }

  useEffect(() => {
    fetchRequirements(job.hashed_id)
  }, [])

  const displayRequirements = useMemo(() => {
    if (!isReopenedSubmission || !submittedProfileReview) {
      return requirements.data || []
    }

    const snapshotEducation = [
      ...(submittedProfileReview?.educationalBackground?.vocational || []),
      ...(submittedProfileReview?.educationalBackground?.college || []),
      ...(submittedProfileReview?.educationalBackground?.graduate || []),
    ]

    const snapshotEligibility = submittedProfileReview?.civilServiceEligibility || []
    const snapshotLearning = submittedProfileReview?.learningAndDevelopment || []
    const snapshotWork = submittedProfileReview?.workExperience || []

    return (requirements.data || []).map((req) => {
      const liveSubItems = req.subItems || []

      if (req.connected_to === "Educational Background") {
        return {
          ...req,
          subItems: snapshotEducation.map((item) => {
            const matched = liveSubItems.find((sub) =>
              normalizeText(sub.level) === normalizeText(item.level) &&
              normalizeText(sub.school) === normalizeText(item.school) &&
              normalizeText(sub.course) === normalizeText(item.course) &&
              normalizeText(sub.year_graduated || sub.to_year) === normalizeText(item.year_graduated || item.to_year)
            ) || liveSubItems.find((sub) =>
              normalizeText(sub.school) === normalizeText(item.school) &&
              normalizeText(sub.course) === normalizeText(item.course)
            )

            return {
              ...item,
              id: matched?.id ?? item.id ?? null,
              files: matched?.files || [],
            }
          }),
        }
      }

      if (req.connected_to === "Civil Service Eligibility") {
        return {
          ...req,
          subItems: snapshotEligibility.map((item) => {
            const matched = liveSubItems.find((sub) =>
              normalizeText(sub.eligibility) === normalizeText(item.eligibility) &&
              normalizeDate(sub.exam_date) === normalizeDate(item.exam_date)
            ) || liveSubItems.find((sub) =>
              normalizeText(sub.eligibility) === normalizeText(item.eligibility)
            )

            return {
              ...item,
              id: matched?.id ?? item.id ?? null,
              files: matched?.files || [],
            }
          }),
        }
      }

      if (req.connected_to === "Learning and Development") {
        return {
          ...req,
          subItems: snapshotLearning.map((item) => {
            const matched = liveSubItems.find((sub) =>
              normalizeText(sub.seminar_title) === normalizeText(item.seminar_title) &&
              normalizeDate(sub.from_date) === normalizeDate(item.from_date)
            ) || liveSubItems.find((sub) =>
              normalizeText(sub.seminar_title) === normalizeText(item.seminar_title)
            )

            return {
              ...item,
              id: matched?.id ?? item.id ?? null,
              files: matched?.files || [],
            }
          }),
        }
      }

      if (req.connected_to === "Work Experience") {
        return {
          ...req,
          subItems: snapshotWork.map((item) => {
            const matched = liveSubItems.find((sub) =>
              normalizeText(sub.agency) === normalizeText(item.agency) &&
              normalizeText(sub.position) === normalizeText(item.position) &&
              normalizeDate(sub.from_date) === normalizeDate(item.from_date) &&
              normalizeDate(sub.to_date) === normalizeDate(item.to_date) &&
              normalizeAmount(sub.monthly_salary) === normalizeAmount(item.monthly_salary)
            ) || liveSubItems.find((sub) =>
              normalizeText(sub.agency) === normalizeText(item.agency) &&
              normalizeText(sub.position) === normalizeText(item.position) &&
              normalizeDate(sub.from_date) === normalizeDate(item.from_date)
            ) || liveSubItems.find((sub) =>
              normalizeText(sub.agency) === normalizeText(item.agency) &&
              normalizeText(sub.position) === normalizeText(item.position) &&
              normalizeDate(sub.to_date) === normalizeDate(item.to_date)
            ) || liveSubItems.find((sub) =>
              normalizeText(sub.agency) === normalizeText(item.agency) &&
              normalizeText(sub.position) === normalizeText(item.position)
            )

            return {
              ...item,
              id: matched?.id ?? item.id ?? null,
              files: matched?.files || [],
            }
          }),
        }
      }

      return req
    })
  }, [isReopenedSubmission, submittedProfileReview, requirements.data])

  return (
    <div className="border rounded-lg p-4 flex flex-col gap-4">
      <div>
        <h3 className="tracking-tight font-semibold text-lg flex items-center text-black">
          <Upload className="mr-2 h-4 w-4" />
          Upload Requirements
        </h3>
        <div className="text-muted-foreground text-sm">
          <div className="space-y-2 text-sm text-muted-foreground mt-4">
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2 border-l-4 border-red-400 mb-4">
            <CircleAlert className="w-4 h-4 mt-0.5" />
            <p className="font-semibold">
              IMPORTANT REMINDERS IN UPLOADING YOUR DOCUMENTS
            </p>
          </div>
          <ul className="list-disc list-inside">
            <li>
              Combine the PDF copies of your files per application requirement using this link:{" "}
              <a
                href="https://combinepdf.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                https://combinepdf.com
              </a>
            </li>
            <li>
              Files should be in <strong>PDF format</strong> and must not be compressed into archive formats such as RAR or ZIP.
            </li>
            <li>
              If applying for multiple positions, please make sure that your attached documents are updated.
            </li>
            <li>
              Read the CSC Guide to Filling-out the Personal Data Sheet:{" "}
              <a
                href="https://csc.gov.ph/phocadownload/userupload/hrpso/2025-ORAOHRA/ANNEX%20H-3%20-%20CS%20Form%20No.%20212%20Revised%202025%20-%20Attachment%20-%20%20Guide%20%20to%20Filling%20Up%20the%20Personal%20Data%20Sheet%20new.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                CSC Guide
              </a>
            </li>
            <li>Use the CSC-prescribed template of{" "} 
              <a
                href="https://csc.gov.ph/downloads/category/540-csc-form-212-revised-2025-personal-data-sheet?download=3404:cs-form-no-212-revised-2025-personal-data-sheet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                CS Form No. 212 Personal Data Sheet (PDS)
              </a>
              {" "}and{" "} 
              <a
                href="https://csc.gov.ph/downloads/category/540-csc-form-212-revised-2025-personal-data-sheet?download=3405:cs-form-no-212-attachment-work-experience-sheet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                CS Form No. 212 Work Experience Sheet (Attachment to PDS)
              </a>
            </li>
            <li>
              Requests for extension of submission and applications with incomplete documents will <strong>not</strong> be entertained.
            </li>
            <li>All notifications and updates regarding your application will be sent through email.</li>
          </ul>
        </div>
        </div>
      </div>

      <div className="border rounded-lg relative overflow-hidden">

        {requirements.isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-10 h-200">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mb-2" />
            <p className="text-xs font-medium text-muted-foreground">Loading Requirements...</p>
          </div>
        )}

        <Table className={requirements.isLoading ? "blur-[1px]" : ""}>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="w-[60%]">Requirement</TableHead>
              <TableHead className="w-[30%]">Attachment</TableHead>
              <TableHead className="w-[10%]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requirements.isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  Loading requirements...
                </TableCell>
              </TableRow>
            ) : requirements.error ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-red-500 py-4">
                  {requirements.error}
                </TableCell>
              </TableRow>
            ) : displayRequirements?.length > 0 ? (
              displayRequirements.map((req, index) => (
                <React.Fragment key={index}>
                  <TableRow>
                    <TableCell className="font-semibold">{index + 1}. {req.requirement}</TableCell>
                    <TableCell>
                      {req.subItems?.length > 0 ? (
                        <span className="text-xs text-muted-foreground"></span>
                      ) : req.files?.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {req.files.map((file, fIndex) => (
                            <div
                              key={fIndex}
                              className="flex justify-between"
                            >
                              <Attachment file={file} />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button
                                    className="ml-auto p-1 rounded hover:bg-gray-200 transition"
                                    title="Remove"
                                    disabled={deletingId === file.id}
                                  >
                                    {deletingId === file.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                                    ) : (
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    )}
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this file? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction asChild>
                                    <Button
                                      onClick={() => deleteAttachment(file.id, req.requirement_id)}
                                      className="bg-red-600 hover:bg-red-700"
                                      disabled={deletingId === file.id}
                                    >
                                      {deletingId === file.id ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          <span>Please wait</span>
                                        </>
                                      ) : (
                                        "Yes, delete it"
                                      )}
                                    </Button>
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground"></span>
                      )}
                    </TableCell>
                    <TableCell>
                      {req.subItems.length === 0 && (
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRequirement(req)
                              setOpen(true)
                            }}
                          >
                            <Upload className="h-4 w-4" /> Upload
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>

                  {req.connected_to === "Educational Background" && req.subItems?.length > 0 && <EducationFiles req={req} />}
                  {req.connected_to === "Civil Service Eligibility" && req.subItems?.length > 0 && <EligibilityFiles req={req} />}
                  {req.connected_to === "Learning and Development" && req.subItems?.length > 0 && <LearningFiles req={req} />}
                  {req.connected_to === "Work Experience" && req.subItems?.length > 0 && <WorkExperienceFiles req={req} />}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-16 text-center text-muted-foreground">
                  No requirements found for this job.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AttachRequirementForm
        jobId={job?.id}
        applicantId={applicant?.id}
        requirement={selectedRequirement}
        open={open}
        onClose={(submitted) => {
          setOpen(false)
          if(submitted) fetchRequirements(job.hashed_id)
        }}
      />
    </div>
  )
}

export default ChooseDocuments
