import { useState, useEffect, useMemo } from 'react'
import { store } from "./store"
import { User, Briefcase, Clock, CheckCircle, ThumbsDown, Repeat, ChevronLeft, Calendar } from "lucide-react"
import StatusBadge from '@/components/StatusBadge'
import { Button } from "@/components/ui/button"
import SubmissionCompetencies from "./SubmissionCompetencies"
import SubmissionTrainings from "../MyCga/SubmissionTrainings"
import SubmissionHistory from "./SubmissionHistory"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useLocalStorage } from "@/hooks/useLocalStorage"

const SelectedSubmission = () => {

  const [currentTab, setCurrentTab] = useLocalStorage('HRIS_Review_CGA_Submission_tab', 'Competencies')

  const { 
    selectedSubmission,
    setSelectedSubmission
  } = store()

  if (!selectedSubmission) {
    return (
      <div className="border rounded-lg h-full">
        <div className="h-full flex items-center justify-center">
          <p className="font-medium text-muted-foreground text-center text-sm">
            Choose from submissions to review competency gap analysis
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg h-full p-4 space-y-4">
      <Button
          variant="ghost"
          className="flex items-center rounded-md disabled:opacity-50"
          size="sm"
          onClick={() => setSelectedSubmission(null)}
      >
          <ChevronLeft className="h-8 w-8" />
          <span className="sr-only sm:not-sr-only">Back to Submission Summary</span>
      </Button>
      <div>
        <h3 className="font-bold text-lg">Submission Details</h3>
        <p className="text-muted-foreground text-sm">Review the submission and its competencies' ratings and proposed trainings here.</p>
      </div>
      <div className="flex flex-col md:flex-row justify-between w-full gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-base font-semibold">
            <User className="w-4 h-4 text-gray-500" />
            <span>{selectedSubmission.name ?? ""}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Briefcase className="w-4 h-4 text-gray-500" />
            <span>{selectedSubmission.position ?? ""}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>CY {selectedSubmission.year ?? ""}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-gray-500" />
            <span>{selectedSubmission.date_submitted}</span>
          </div>
        </div>
        <StatusBadge status={selectedSubmission.status ?? "Submitted"} />
      </div>
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="w-full justify-start gap-4">
              <TabsTrigger value="Competencies">Step 1: Review Competencies</TabsTrigger>
              <TabsTrigger value="Trainings">Step 2: Review Trainings</TabsTrigger>
              <TabsTrigger value="SubmissionHistory">Step 3: Take Action</TabsTrigger>
          </TabsList>
          <TabsContent value="Competencies">
              {currentTab === 'Competencies' && <SubmissionCompetencies />}
          </TabsContent>
          <TabsContent value="Trainings">
              {currentTab === 'Trainings' && <SubmissionTrainings 
                submission={selectedSubmission}
              />}
          </TabsContent>
          <TabsContent value="SubmissionHistory">
              {currentTab === 'SubmissionHistory' && <SubmissionHistory 
                submission={selectedSubmission}
              />}
          </TabsContent>
      </Tabs>
    </div>
  )
}

export default SelectedSubmission
