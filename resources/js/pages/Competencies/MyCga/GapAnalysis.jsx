import { useState, useEffect, useMemo } from 'react'
import { useForm } from '@inertiajs/react'
import axios from 'axios'
import { store } from './store'
import CompetenciesLoading from "@/components/skeletons/CompetenciesLoading"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  Table,
  TableBody,
  TableCell,
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
  Loader2,
  CheckCircle
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { isWithinInterval, parseISO } from "date-fns"

const GapAnalysis = ({ setCurrentTab }) => {
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
    position_id: item_no ?? null,
    year: "",
  })

  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [years, setYears] = useState([])

  // Fetch gap analysis for selected staff
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

    if (emp_id) fetchData()
  }, [emp_id])

  // Fetch year options from backend
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await axios.get(route("settings.cga.submission-schedules.list"))
        // backend may return { data: [ ... ] } or { data: { schedules: [...] } }
        const payload = res?.data?.data
        const items = Array.isArray(payload)
          ? payload
          : (payload?.schedules && Array.isArray(payload.schedules) ? payload.schedules : [])
        setYears(items)
      } catch (error) {
        console.error(error)
      }
    }
    fetchYears()
  }, [])

  // Hide success alert after 5 seconds
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

  // Normalize find: use strings for comparison to avoid number/string mismatch from Select
  const selectedYearWindow = useMemo(() => {
    if (!data.year && data.year !== 0) return null
    return years.find((y) => String(y.year) === String(data.year)) || null
  }, [years, data.year])

  // Determine if today is within the selected year's submission window
  const isWithinSubmissionWindow = useMemo(() => {
    if (!selectedYearWindow) return false
    // backend provides from_date and end_date as 'YYYY-MM-DD' (strings)
    const { from_date, end_date } = selectedYearWindow
    if (!from_date || !end_date) return false
    try {
      const now = new Date()
      return isWithinInterval(now, {
        start: parseISO(from_date),
        end: parseISO(end_date),
      })
    } catch (e) {
      // parsing failed
      console.error("Date parse error", e)
      return false
    }
  }, [selectedYearWindow])

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
              <div className="text-sm font-semibold">Gap Analysis Submitted Successfully</div>
              <AlertDescription className="text-sm">
                The gap analysis has been submitted. You may now review other items or return later.
              </AlertDescription>
            </div>
          </Alert>
        )}

        <p className="text-sm mt-4">You are submitting the competency gap analysis for this position:</p>
        <h5 className="font-semibold">{position} ({item_no})</h5>
      </div>

      {/* Year Selection */}
      <div>
        <Label className="font-medium">Select Year</Label>
        <Select
          value={data.year !== "" && data.year != null ? String(data.year) : ""}
          onValueChange={(value) => {
            const num = Number(value)
            setData("year", Number.isNaN(num) ? value : num)
          }}
        >
          <SelectTrigger className="font-medium">
            <SelectValue placeholder="Select a year" />
          </SelectTrigger>

          <SelectContent>
            {years.length > 0 ? (
              years.map((y) => (
                <SelectItem
                  key={y.id ?? y.year}
                  value={String(y.year)}
                  className="font-medium"
                >
                  {y.year}{" "}
                  {y.from_date_formatted && y.end_date_formatted
                    ? `(${y.from_date_formatted} to ${y.end_date_formatted})`
                    : (y.from_date && y.end_date
                      ? `(${y.from_date} to ${y.end_date})`
                      : "(No submission window set)")}
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-1 text-sm text-muted-foreground">
                No years available
              </div>
            )}
          </SelectContent>
        </Select>
      </div>


      {/* Gap Analysis Table */}
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

      {/* Submit or Alert */}
      {!loading && (
        <div>
          {data.year ? (
            isWithinSubmissionWindow ? (
              // ✅ Year selected AND within window → Show button
              <div className="flex flex-col gap-4">
                <div className="mt-2 flex items-start gap-2">
                  <Checkbox id="agree" checked={agreed} onCheckedChange={setAgreed} />
                  <label htmlFor="agree" className="text-sm leading-tight">
                    I certify that I have reviewed the listed competencies and proposed trainings and agree to submit them for evaluation.
                  </label>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!agreed || processing || !data.year}
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
              </div>
            ) : (
              // ❌ Year selected but NOT in window → Show alert
              <Alert variant="destructive" className="mt-2">
                <AlertTitle>Submission Not Available</AlertTitle>
                <AlertDescription>
                  {selectedYearWindow
                    ? `The submission for ${selectedYearWindow.year} was due on ${selectedYearWindow.from_date_formatted ?? selectedYearWindow.from_date} to ${selectedYearWindow.end_date_formatted ?? selectedYearWindow.end_date}.`
                    : "The selected year has no submission schedule."}
                </AlertDescription>
              </Alert>
            )
          ) : (
            // 🔹 No year selected → Show nothing or a message
            <p className="text-sm text-muted-foreground mt-2">
              Please select a year to see submission options.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default GapAnalysis
