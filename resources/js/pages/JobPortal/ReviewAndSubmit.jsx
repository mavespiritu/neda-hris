import React, { useState, useEffect } from "react"
import { Files, Upload, Send, Trash2, Loader2 } from "lucide-react"
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
import Review from '../MyProfile/Pds/Review'

const ReviewAndSubmit = ({ job, applicant }) => {

  const { toast } = useToast()

  const { requirements, fetchRequirements } = store()

  useEffect(() => {
    fetchRequirements(job.hashed_id)
  }, [])

  return (
    <div className="border rounded-lg p-4 flex flex-col gap-4">
        <h3 className="tracking-tight font-semibold text-lg flex items-center text-black">
          <Send className="mr-2 h-4 w-4" />
          Review Application
        </h3>

        <Review />
    </div>
  )
}

export default ReviewAndSubmit
