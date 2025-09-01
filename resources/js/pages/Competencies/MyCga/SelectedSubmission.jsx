import { useState, useEffect, useMemo } from 'react'
import { usePage } from '@inertiajs/react'
import { store } from './store'
import CompetenciesLoading from "@/components/skeletons/CompetenciesLoading"
import PaginationControls from "@/components/PaginationControls"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import StatusBadge from '@/components/StatusBadge'
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import SubmissionCompetencies from "./SubmissionCompetencies"
import SubmissionTrainings from "./SubmissionTrainings"

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

import { 
    Calendar,
    Clock,
    Briefcase,
    User
} from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDateWithTime } from "@/lib/utils.jsx"

const SelectedSubmission = () => {

    const { toast } = useToast()

    const {
        selectedSubmission,
        deleteSubmission,
    } = store()

    const formattedDateCreated = formatDateWithTime(selectedSubmission.date_created)
    const [datePart, timePart] = formattedDateCreated.split(/ (?=\d{2}:\d{2}:\d{2})/)

    const [currentTab, setCurrentTab] = useLocalStorage('HRIS_CGA_Submission_tab', 'Competencies')

  return (
    <div className="w-full md:w-[70%] flex flex-col gap-4">
        <div className="border rounded-lg p-4 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="flex flex-col gap-2">
                    <h3 className="font-semibold text-lg">
                    Submission Details
                    </h3>
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 flex-shrink-0" />
                        <div className="flex flex-col leading-normal font-medium">
                            <span className="text-sm leading-tight">{selectedSubmission?.position}</span>
                            <span className="text-xs"></span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{datePart}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{timePart}</span>
                        </div>
                    </div>
                    <StatusBadge status={selectedSubmission.status} />
                </div>
                {selectedSubmission.status === null && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete Submission</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                            <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the submission.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="border-0">Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                                className="bg-destructive text-white hover:bg-destructive/90"
                                onClick={() => deleteSubmission({id: selectedSubmission.id, toast})}
                            >Yes, remove it</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>)}
            </div>
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
                <TabsList className="w-full justify-start gap-4">
                    <TabsTrigger value="Competencies">Competencies</TabsTrigger>
                    <TabsTrigger value="Trainings">Proposed Trainings</TabsTrigger>
                </TabsList>
                <TabsContent value="Competencies">
                    {currentTab === 'Competencies' && <SubmissionCompetencies />}
                </TabsContent>
                <TabsContent value="Trainings">
                    {currentTab === 'Trainings' && <SubmissionTrainings 
                        submission={selectedSubmission}
                    />}
                </TabsContent>
            </Tabs>
        </div>
    </div>
  )
}

export default SelectedSubmission