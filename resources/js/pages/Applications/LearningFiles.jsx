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
import { formatDate, formatDateRange } from "@/lib/utils.jsx"
import Attachment from "@/components/Attachment"
import AttachLearningForm from "./AttachLearningForm"
import { usePage } from '@inertiajs/react'
import { router } from "@inertiajs/react"
import { useToast } from "@/hooks/use-toast"

const LearningFiles = ({ req, onRefresh, applicant, vacancy }) => {
    const [selectedRequirement, setSelectedRequirement] = useState(null)
    const [open, setOpen] = useState(false)
    const [deletingId, setDeletingId] = useState(null)

    const deleteAttachment = (fileId, requirementId) => {
            
        setDeletingId(fileId)
    
        router.delete(route("applications.requirements.destroy", { vacancyId: vacancy.value, requirementId, id: fileId}), {
            preserveScroll: true,
            onSuccess: () => {
            toast({
                title: "Success!",
                description: "The requirement has been deleted successfully",
            })
            if (onRefresh) onRefresh()
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
                        <TableRow className="bg-muted text-xs">
                            <TableHead className="w-[40%] border-l">Title of Learning and Development Interventions / Training Programs</TableHead>
                            <TableHead className="w-[20%]">Date</TableHead>
                            <TableHead className="w-[30%]">Attachment</TableHead>
                            <TableHead className="w-[10%]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {req.subItems.map((sub, i) => (
                        <TableRow key={i}>
                        <TableCell className="border-l">{sub.seminar_title}</TableCell>
                        <TableCell>
                            {formatDateRange(sub.from_date, sub.to_date)}
                        </TableCell>
                        <TableCell>
                        {sub.files?.length > 0 ? (
                            <div className="flex flex-col gap-1">
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
    <AttachLearningForm
        jobId={vacancy?.value}
        applicantId={applicant?.value}
        requirement={selectedRequirement}
        open={open}
        onClose={(submitted) => {
          setOpen(false)
          if (submitted && onRefresh) onRefresh()
        }}
    />
    </>
  )
}

export default LearningFiles