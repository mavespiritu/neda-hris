import React, { useState, useEffect } from "react"
import { Files, Upload, Paperclip, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { store } from "./store"
import { formatDate, formatDateRange } from "@/lib/utils.jsx"
import Attachment from "@/components/Attachment"
import AttachEducationForm from "./AttachEducationForm"
import { usePage } from '@inertiajs/react'
import { router } from "@inertiajs/react"
import { useToast } from "@/hooks/use-toast"

const EducationFiles = ({req}) => {

    const { toast } = useToast()

    const [selectedRequirement, setSelectedRequirement] = useState(null)
    const [open, setOpen] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const { job, applicant } = usePage().props
    const { fetchRequirements } = store()

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

  return (
    <>
    <TableRow>
        <TableCell colSpan={3} className="p-0">
            <div className="ml-8">
                <Table>
                    <TableHeader className="border-b">
                        <TableRow className="bg-muted">
                            <TableHead className="w-[40%] border-l">
                                <div className="flex flex-col">
                                    <span>(a) Level</span>
                                    <span>(b) Name of School</span>
                                    <span>(c) Basic Education/Degree/Course</span>
                                </div>
                            </TableHead>
                            <TableHead className="w-[20%]">Year Graduated</TableHead>
                            <TableHead className="w-[30%]">Attachment</TableHead>
                            <TableHead className="w-[10%]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {req.subItems.map((sub, i) => (
                        <TableRow key={i}>
                        <TableCell className="border-l">
                            <div className="flex flex-col font-medium">
                                <span>(a) {sub.level}</span>
                                <span>(b) {sub.school}</span>
                                <span>(c) {sub.course}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                        {sub.year_graduated}
                        </TableCell>
                        <TableCell>
                        {sub.files?.length > 0 ? (
                            <div className="flex flex-col gap-2">
                            {sub.files.map((file, fIndex) => (
                                <div
                                key={fIndex}
                                className="flex items-center justify-between"
                                >
                                <Attachment file={file} />
                                {file.source === "new" ? (
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
                                ) : (
                                    <button
                                    className="invisible"
                                    title="Remove"
                                    >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                    </button>
                                )}
                                </div>
                            ))}
                            </div>
                        ) : (
                            <span className="text-xs text-muted-foreground"></span>
                        )}
                        </TableCell>
                        <TableCell>
                            <div className="flex justify-end">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    setSelectedRequirement({
                                    req: req,  
                                    subReq: sub
                                    })
                                    setOpen(true)
                                }}
                            >
                                <Upload className="h-4 w-4" /> Upload
                            </Button>
                            </div>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>
        </TableCell>
    </TableRow>
    <AttachEducationForm
        jobId={job?.id}
        applicantId={applicant?.id}
        requirement={selectedRequirement}
        open={open}
        onClose={(submitted) => {
          setOpen(false)
          if(submitted) fetchRequirements(job.hashed_id)
        }}
    />
    </>
  )
}

export default EducationFiles