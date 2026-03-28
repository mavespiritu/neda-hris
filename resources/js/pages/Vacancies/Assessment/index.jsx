import { useEffect, useState } from "react"
import axios from "axios"
import { router, usePage } from "@inertiajs/react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatFullName, formatDate } from "@/lib/utils.jsx"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import DatePicker from "@/components/DatePicker"
import TextInput from "@/components/TextInput"
import SingleComboBox from "@/components/SingleComboBox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { store } from "../Applicants/store"

const statusClassName = (status) => {
  if (status === "Passed") return "text-green-600"
  if (status === "Failed") return "text-red-600"

  return "text-muted-foreground"
}

const statusLabel = (status) => status || "Not Started"

const resultStatuses = [
  { label: "Passed", value: "Passed" },
  { label: "Failed", value: "Failed" },
  { label: "Did Not Attend", value: "Did Not Attend" },
  { label: "Pending", value: "Pending" },
]

const sortApplicantsByRank = (rows) => {
  return [...rows].sort((a, b) => {
    const rankA = String(a?.rank ?? "").trim()
    const rankB = String(b?.rank ?? "").trim()

    if (!rankA && !rankB) return 0
    if (!rankA) return 1
    if (!rankB) return -1

    const numericA = Number(rankA)
    const numericB = Number(rankB)
    const isNumericA = Number.isFinite(numericA) && rankA !== ""
    const isNumericB = Number.isFinite(numericB) && rankB !== ""

    if (isNumericA && isNumericB) {
      return numericA - numericB
    }

    if (isNumericA) return -1
    if (isNumericB) return 1

    return rankA.localeCompare(rankB, undefined, { numeric: true, sensitivity: "base" })
  })
}

const AssessmentTab = () => {
  const { vacancy } = usePage().props
  const { applicants, fetchApplicants } = store()
  const { toast } = useToast()
  const [examDialog, setExamDialog] = useState({
    open: false,
    applicant: null,
    testType: null,
  })
  const [examForm, setExamForm] = useState({
    date_conducted: "",
    status: "",
    score: "",
  })
  const [examErrors, setExamErrors] = useState({})
  const [isSavingExam, setIsSavingExam] = useState(false)
  const [rankDialog, setRankDialog] = useState({
    open: false,
    applicant: null,
  })
  const [rankForm, setRankForm] = useState({
    rank: "",
    date_ranked: "",
  })
  const [rankErrors, setRankErrors] = useState({})
  const [isSavingRank, setIsSavingRank] = useState(false)

  useEffect(() => {
    fetchApplicants(vacancy.id)
  }, [vacancy.id])

  const rows = sortApplicantsByRank(applicants.data?.data || [])

  const openExamDialog = (applicant, testType) => {
    const isSkillTest = testType === "Skill Test"

    setExamErrors({})
    setExamForm({
      date_conducted: isSkillTest
        ? applicant.skill_test_date_conducted || ""
        : applicant.dpe_date_conducted || "",
      status: isSkillTest
        ? applicant.skill_test_result || ""
        : applicant.dpe_result || "",
      score: isSkillTest
        ? (applicant.skill_test_score ?? "")
        : (applicant.dpe_score ?? ""),
    })
    setExamDialog({
      open: true,
      applicant,
      testType,
    })
  }

  const closeExamDialog = (open) => {
    if (open) return

    setExamDialog({
      open: false,
      applicant: null,
      testType: null,
    })
    setExamErrors({})
    setExamForm({
      date_conducted: "",
      status: "",
      score: "",
    })
  }

  const openRankDialog = (applicant) => {
    setRankErrors({})
    setRankForm({
      rank: applicant.rank || "",
      date_ranked: applicant.date_ranked || "",
    })
    setRankDialog({
      open: true,
      applicant,
    })
  }

  const closeRankDialog = (open) => {
    if (open) return

    setRankDialog({
      open: false,
      applicant: null,
    })
    setRankErrors({})
    setRankForm({
      rank: "",
      date_ranked: "",
    })
  }

  const saveExamResult = async () => {
    if (!examDialog.applicant || !examDialog.testType) return

    setIsSavingExam(true)
    setExamErrors({})

    try {
      await axios.post(
        route("vacancies.applicants.exam-result.store", {
          vacancy: vacancy.id,
          application: examDialog.applicant.id,
        }),
        {
          test_type: examDialog.testType,
          date_conducted: examForm.date_conducted,
          status: examForm.status,
          score: examForm.score === "" ? null : examForm.score,
        }
      )

      toast({
        title: "Success!",
        description: `${examDialog.testType} result saved successfully.`,
      })

      await fetchApplicants(vacancy.id)
      closeExamDialog(false)
    } catch (error) {
      setExamErrors(error.response?.data?.errors || {})
      toast({
        title: error.response?.data?.title || "Save failed",
        description: error.response?.data?.message || "Please check the form and try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingExam(false)
    }
  }

  const saveRankResult = async () => {
    if (!rankDialog.applicant) return

    setIsSavingRank(true)
    setRankErrors({})

    try {
      await axios.post(
        route("vacancies.applicants.ranking-result.store", {
          vacancy: vacancy.id,
          application: rankDialog.applicant.id,
        }),
        {
          rank: rankForm.rank,
          date_ranked: rankForm.date_ranked,
        }
      )

      toast({
        title: "Success!",
        description: "Rank saved successfully.",
      })

      await fetchApplicants(vacancy.id)
      closeRankDialog(false)
    } catch (error) {
      setRankErrors(error.response?.data?.errors || {})
      toast({
        title: error.response?.data?.title || "Save failed",
        description: error.response?.data?.message || "Please check the form and try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingRank(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Assessment</h2>
        <p className="text-sm text-muted-foreground">
          Review applicant assessment progress.
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead className="w-[4%]">#</TableHead>
              <TableHead className="w-[20%]">Applicant</TableHead>
              <TableHead className="w-[13%]">Secretariat Assessment</TableHead>
              <TableHead className="w-[13%]">HRMPSB Assessment</TableHead>
              <TableHead className="w-[14%]">Skill Test Result</TableHead>
              <TableHead className="w-[14%]">DPE Result</TableHead>
              <TableHead className="w-[8%]">Rank</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applicants.isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading applicants...
                  </div>
                </TableCell>
              </TableRow>
            ) : rows.length ? (
              rows.map((applicant, index) => (
                <TableRow key={applicant.id} className="hover:bg-transparent">
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{formatFullName(applicant.name)}</span>
                      <span className="text-xs">{applicant.email_address || "-"}</span>
                    </div>
                    </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className="w-full rounded-md px-2 py-1 text-left transition-colors hover:bg-muted"
                      onClick={() =>
                        router.visit(
                          route("vacancies.applicants.secretariat-assessment", {
                            vacancy: vacancy.id,
                            application: applicant.id,
                          })
                        )
                      }
                    >
                      <div className="flex flex-col">
                        <span className={statusClassName(applicant.secretariat_assessment_status)}>
                          {statusLabel(applicant.secretariat_assessment_status)}
                        </span>
                        {applicant.secretariat_assessed_at && (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(applicant.secretariat_assessed_at)}
                          </span>
                        )}
                      </div>
                    </button>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className="w-full rounded-md px-2 py-1 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() =>
                        router.visit(
                          route("vacancies.applicants.hrmpsb-assessment", {
                            vacancy: vacancy.id,
                            application: applicant.id,
                          })
                        )
                      }
                      disabled={!applicant.secretariat_assessment_status}
                    >
                      <div className="flex flex-col">
                        <span className={statusClassName(applicant.hrmpsb_assessment_status)}>
                          {statusLabel(applicant.hrmpsb_assessment_status)}
                        </span>
                        {applicant.hrmpsb_assessed_at && (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(applicant.hrmpsb_assessed_at)}
                          </span>
                        )}
                      </div>
                    </button>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className="w-full rounded-md px-2 py-1 text-left transition-colors hover:bg-muted"
                      onClick={() => openExamDialog(applicant, "Skill Test")}
                    >
                      <div className="flex flex-col">
                        <span className={statusClassName(applicant.skill_test_result)}>
                          {statusLabel(applicant.skill_test_result)}
                        </span>
                        {applicant.skill_test_score && (
                          <span className="text-xs text-muted-foreground">
                            Score: {applicant.skill_test_score}
                          </span>
                        )}
                        {applicant.skill_test_date_conducted && (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(applicant.skill_test_date_conducted)}
                          </span>
                        )}
                      </div>
                    </button>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className="w-full rounded-md px-2 py-1 text-left transition-colors hover:bg-muted"
                      onClick={() => openExamDialog(applicant, "DPE")}
                    >
                      <div className="flex flex-col">
                        <span className={statusClassName(applicant.dpe_result)}>
                          {statusLabel(applicant.dpe_result)}
                        </span>
                        {applicant.dpe_score && (
                          <span className="text-xs text-muted-foreground">
                            Score: {applicant.dpe_score}
                          </span>
                        )}
                        {applicant.dpe_date_conducted && (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(applicant.dpe_date_conducted)}
                          </span>
                        )}
                      </div>
                    </button>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className="inline-flex rounded-md px-2 py-1 text-left transition-colors hover:bg-muted"
                      onClick={() => openRankDialog(applicant)}
                    >
                      <div className="flex flex-col">
                        <span className={applicant.rank ? "text-foreground" : "text-muted-foreground"}>
                          {applicant.rank || "Not Set"}
                        </span>
                      </div>
                    </button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  No applicants found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={examDialog.open} onOpenChange={closeExamDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {examDialog.testType || "Exam"} Result
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div>
              <Label>Applicant</Label>
              <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
                {formatFullName(examDialog.applicant?.name) || "-"}
              </div>
            </div>

            <div>
              <Label>Date Conducted</Label>
              <DatePicker
                value={examForm.date_conducted}
                onDateChange={(value) => setExamForm((prev) => ({ ...prev, date_conducted: value || "" }))}
                invalidMessage={examErrors.date_conducted}
              />
            </div>

            <div>
              <Label>Status</Label>
              <SingleComboBox
                items={resultStatuses}
                name="status"
                value={examForm.status}
                onChange={(value) => setExamForm((prev) => ({ ...prev, status: value || "" }))}
                placeholder="Select status"
                width="w-full"
                className="w-full"
                labelWidth="w-full"
                invalidMessage={examErrors.status}
              />
              {examErrors.status && (
                <p className="mt-1 text-xs text-red-500">{examErrors.status}</p>
              )}
            </div>

            <div>
              <Label>Score</Label>
              <TextInput
                value={examForm.score}
                onChange={(e) => setExamForm((prev) => ({ ...prev, score: e.target.value }))}
                isInvalid={!!examErrors.score}
              />
              {examErrors.score && (
                <p className="mt-1 text-xs text-red-500">{examErrors.score}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => closeExamDialog(false)} disabled={isSavingExam}>
              Cancel
            </Button>
            <Button type="button" onClick={saveExamResult} disabled={isSavingExam}>
              {isSavingExam && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Result
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rankDialog.open} onOpenChange={closeRankDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rank Result</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div>
              <Label>Applicant</Label>
              <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
                {formatFullName(rankDialog.applicant?.name) || "-"}
              </div>
            </div>

            <div>
              <Label>Rank</Label>
              <TextInput
                value={rankForm.rank}
                onChange={(e) => setRankForm((prev) => ({ ...prev, rank: e.target.value }))}
                isInvalid={!!rankErrors.rank}
              />
              {rankErrors.rank && (
                <p className="mt-1 text-xs text-red-500">{rankErrors.rank}</p>
              )}
            </div>

            <div>
              <Label>Date Ranked</Label>
              <DatePicker
                value={rankForm.date_ranked}
                onDateChange={(value) => setRankForm((prev) => ({ ...prev, date_ranked: value || "" }))}
                invalidMessage={rankErrors.date_ranked}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => closeRankDialog(false)} disabled={isSavingRank}>
              Cancel
            </Button>
            <Button type="button" onClick={saveRankResult} disabled={isSavingRank}>
              {isSavingRank && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Rank
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AssessmentTab
