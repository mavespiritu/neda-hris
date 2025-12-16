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
import { store } from "./store"
import EducationFiles from "./EducationFiles"
import EligibilityFiles from "./EligibilityFiles"
import LearningFiles from "./LearningFiles"
import WorkExperienceFiles from "./WorkExperienceFiles"
import Attachment from "@/components/Attachment"
import { getTimestamp } from "@/lib/utils.jsx"

const Documents = ({ applicant }) => {

  const { requirements, fetchRequirements } = store()

  useEffect(() => {
    fetchRequirements(applicant.id)
  }, [applicant.id])

  return (
    <div className="border rounded-lg p-4 flex flex-col gap-4">
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
              <TableHead className="w-[60%] uppercase font-semibold">Requirement</TableHead>
              <TableHead className="w-[30%] uppercase font-semibold">Attachment</TableHead>
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
                              <Attachment file={file} filename={`${applicant.lastname}_${applicant.firstname}_${applicant.middlename}_${req.requirement}_${fIndex}_${getTimestamp()}`} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground"></span>
                      )}
                    </TableCell>
                  </TableRow>

                  {req.connected_to === "Educational Background" && req.subItems?.length > 0 && <EducationFiles req={req} applicant={applicant} />}
                  {req.connected_to === "Civil Service Eligibility" && req.subItems?.length > 0 && <EligibilityFiles req={req} applicant={applicant} />}
                  {req.connected_to === "Learning and Development" && req.subItems?.length > 0 && <LearningFiles req={req} applicant={applicant} />}
                  {req.connected_to === "Work Experience" && req.subItems?.length > 0 && <WorkExperienceFiles req={req} applicant={applicant} />}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="h-16 text-center text-muted-foreground">
                  No requirements found for this job.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default Documents
