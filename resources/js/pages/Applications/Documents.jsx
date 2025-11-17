import React, { useState, useEffect } from "react"
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
import EducationFiles from "./EducationFiles"
import EligibilityFiles from "./EligibilityFiles"
import LearningFiles from "./LearningFiles"
import WorkExperienceFiles from "./WorkExperienceFiles"
import Attachment from "@/components/Attachment"
import { router } from "@inertiajs/react"
import { useToast } from "@/hooks/use-toast"

const Documents = ({ applicant, vacancy }) => {

  const { toast } = useToast()

  const [selectedRequirement, setSelectedRequirement] = useState(null)
  const [open, setOpen] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [requirements, setRequirements] = useState({
    isLoading: false,
    error: null,
    data: [],
  })

  const fetchRequirements = async (applicantId, vacancyId) => {
    if (!applicantId || !vacancyId) return

    setRequirements((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch(
        route("applications.requirements", {
          applicantId: applicantId,
          vacancyId: vacancyId,
        })
      )

      if (!response.ok) throw new Error("Failed to fetch requirements")

      const data = await response.json()
      setRequirements({ isLoading: false, error: null, data })
    } catch (error) {
      console.error(error)
      setRequirements({
        isLoading: false,
        error: error.message || "Something went wrong",
        data: [],
      })
    }
  }

  useEffect(() => {
    if (applicant?.value && vacancy?.value) {
      fetchRequirements(applicant.value, vacancy.value)
    }
  }, [applicant, vacancy])

  const deleteAttachment = (fileId, requirementId) => {
    
    setDeletingId(fileId)

    router.delete(route("jobs.requirements.destroy", { vacancyId: vacancy.value, requirementId, id: fileId}), {
      preserveScroll: true,
      onSuccess: () => {
        toast({
          title: "Success!",
          description: "The requirement has been deleted successfully",
        })
        fetchRequirements(applicant.id, vacancy.id)
        setDeletingId(null)
        
      },
      onError: (errors) => {
        console.error(errors)
        setDeletingId(null)
      },
    })
  }


  return (
    <>

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
            ) : requirements.data?.length > 0 ? (
              requirements.data.map((req, index) => (
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

                  {req.connected_to === "Educational Background" && req.subItems?.length > 0 && <EducationFiles req={req} onRefresh={() => fetchRequirements(applicant.value, vacancy.value)} applicant={applicant} vacancy={vacancy} />}
                  {req.connected_to === "Civil Service Eligibility" && req.subItems?.length > 0 && <EligibilityFiles req={req} onRefresh={() => fetchRequirements(applicant.value, vacancy.value)} applicant={applicant} vacancy={vacancy} />}
                  {req.connected_to === "Learning and Development" && req.subItems?.length > 0 && <LearningFiles req={req} onRefresh={() => fetchRequirements(applicant.value, vacancy.value)} applicant={applicant} vacancy={vacancy} />}
                  {req.connected_to === "Work Experience" && req.subItems?.length > 0 && <WorkExperienceFiles req={req} onRefresh={() => fetchRequirements(applicant.value, vacancy.value)} applicant={applicant} vacancy={vacancy} />}
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
        jobId={vacancy?.value}
        applicantId={applicant?.value}
        requirement={selectedRequirement}
        open={open}
        onClose={(submitted) => {
          setOpen(false)
          if(submitted) fetchRequirements(applicant.value, vacancy.value)
        }}
      />
    </>
  )
}

export default Documents
