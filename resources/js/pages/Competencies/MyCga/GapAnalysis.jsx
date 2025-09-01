import { useState, useEffect, useMemo } from 'react'
import { usePage, useForm } from '@inertiajs/react'
import { store } from './store'
import CompetenciesLoading from "@/components/skeletons/CompetenciesLoading"
import PaginationControls from "@/components/PaginationControls"
import ProposedTrainingForm from "./ProposedTrainingForm"
import ProposedTrainingFilter from "./ProposedTrainingFilter"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

import { 
    Search, 
    ThumbsUp, 
    Plus, 
    ThumbsDown, 
    Trash2, 
    Pencil, 
    Send, 
    Undo2,
    ChevronDown,
    Loader2,
    SlidersHorizontal,
    CheckCircle
} from 'lucide-react'

import { parse, format, isValid } from 'date-fns'
import { flexRender } from "@tanstack/react-table"
import { cn } from "@/lib/utils"
import { useTable } from '@/hooks/useTable'
import { formatDateWithTime } from "@/lib/utils.jsx"

const GapAnalysis = ({setCurrentTab}) => {
  
  const { toast } = useToast()

  const {
      selectedStaff,
      fetchGapAnalysis,
      gapAnalysis,
      submitGapAnalysis
  } = store()

  const emp_id = selectedStaff?.value ?? null
  const item_no = selectedStaff?.designation?.item_no ?? selectedStaff?.item_no ?? null
  const position = selectedStaff?.designation?.position ?? selectedStaff?.position ?? null

  const { data, setData, post, processing, reset } = useForm({
    emp_id: emp_id ?? null,
    position_id: item_no ?? null
  })

  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        await fetchGapAnalysis({
          id: emp_id,
          filters: { item_no }
        })

        setData({
          emp_id: emp_id ?? null,
          position_id: item_no ?? null
        })

      } finally {
        setLoading(false)
      }
    }

    if (emp_id) {
      fetchData()
    }
  }, [emp_id])

  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => setSubmitted(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [submitted])

  const handleSubmit = async () => {
    submitGapAnalysis({
      form: { data, setData, post, processing, reset }, 
      toast, 
      setCurrentTab, 
      setSubmitted 
    })
  }

  return (
    <div className="flex flex-col flex-grow gap-4">
      <div>
        <h3 className="font-bold text-lg">Review Submission</h3>
        <p className="text-muted-foreground text-sm">
          Review the competencies and proposed trainings before submitting.
        </p>
        {submitted && (
          <Alert variant="default" className="bg-green-50 border-green-300 text-green-800 mt-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div className="flex flex-col gap-1">
              <AlertTitle className="text-sm">Gap Analysis Submitted Successfully</AlertTitle>
              <AlertDescription className="text-sm">
                The gap analysis has been submitted. You may now review other items or return later.
              </AlertDescription>
            </div>
          </Alert>
        )}
        <p className="text-sm mt-4">You are submitting the competency gap analysis for this position:</p>
        <h5 className="font-semibold">{position} ({item_no})</h5>
      </div>

      {loading ? (
        <CompetenciesLoading />
      ) : (
        gapAnalysis &&
        Object.keys(gapAnalysis).map((type) => (
          <div key={type}>
            <div className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2 mt-2">
              {type}
            </div>
            <div className="border rounded-lg">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead className="text-black w-[40%]">Competency</TableHead>
                    <TableHead className="text-black w-[10%]">Progress</TableHead>
                    <TableHead className="text-black">Proposed Trainings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gapAnalysis[type].map((competency) => (
                    <TableRow key={competency.id}>
                      <TableCell>{competency.competency}</TableCell>
                      <TableCell>{competency.percentage}%</TableCell>
                      <TableCell>
                        {competency.trainings.length > 0 ? (
                          <ul className="list-decimal pl-5 space-y-2">
                            {competency.trainings.map((training, index) => (
                              <li key={index}>{training.title}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="italic text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))
      )}

      {!loading && (
        <>
          <div className="mt-2 flex items-start gap-2">
            <Checkbox id="agree" checked={agreed} onCheckedChange={setAgreed} />
            <label htmlFor="agree" className="text-sm leading-tight">
              I certify that I have reviewed the listed competencies and proposed trainings and agree to submit them for evaluation.
            </label>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!agreed || processing}
            className="w-fit"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Gap Analysis'
            )}
          </Button>
        </>
      )}
    </div>
  )
}

export default GapAnalysis