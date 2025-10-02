import React, { useState, useEffect } from "react"
import { Files, Upload, Paperclip, Trash2, Loader2 } from "lucide-react"
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

const ChooseDocuments = ({ job, applicant }) => {

  const { toast } = useToast()

  const [selectedRequirement, setSelectedRequirement] = useState(null)
  const [open, setOpen] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const { requirements, fetchRequirements } = store()

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

  return (
    <div className="border rounded-lg p-4 flex flex-col gap-4">
      <div>
        <h3 className="tracking-tight font-semibold text-lg flex items-center text-black">
          <Upload className="mr-2 h-4 w-4" />
          Upload Requirements
        </h3>
        <div className="text-muted-foreground text-sm">
          <div className="space-y-2 text-sm text-muted-foreground mt-4">
          <p className="font-semibold text-red-600 flex items-center gap-1">
            📣 IMPORTANT REMINDERS IN UPLOADING YOUR DOCUMENTS
          </p>
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
                href="https://web.csc.gov.ph/2014-02-21-08-28-23/pdf-files/category/184-click-here-to-download-attached-guide-to-filling-up-the-pds"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                CSC Guide
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

      <div className="border rounded-lg">
        <Table>
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
            ) : requirements.data?.length > 0 ? (
              requirements.data.map((req, index) => (
                <React.Fragment key={index}>
                  <TableRow>
                    <TableCell className="font-semibold">{req.requirement}</TableCell>
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
