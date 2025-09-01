import { useState, useEffect, useMemo } from 'react'
import { store } from "./store"
import { User, Briefcase, Clock, CheckCircle, ThumbsDown, Repeat, Send } from "lucide-react"
import StatusBadge from '@/components/StatusBadge'
import { Button } from "@/components/ui/button"
import SubmissionCompetencies from "./SubmissionCompetencies"
import SubmissionTrainings from "../MyCga/SubmissionTrainings"
import SubmissionHistory from "./SubmissionHistory"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useLocalStorage } from "@/hooks/useLocalStorage"

const Summary = () => {

  return (
    <div className="border rounded-lg h-full p-4 space-y-4">
        <div>
            <h3 className="font-bold text-lg">Submission Summary</h3>
            <p className="text-muted-foreground text-sm">View the submission status of each staff.</p>
        </div>
    </div>
  )
}

export default Summary
