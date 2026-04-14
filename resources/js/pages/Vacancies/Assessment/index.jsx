import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { router, usePage } from "@inertiajs/react"
import { Loader2, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatFullName, formatDate } from "@/lib/utils.jsx"
import { useToast } from "@/hooks/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { store } from "../Applicants/store"
import { useHasPermission } from "@/hooks/useAuth"
import ExamResultDialog from "./ExamResultDialog"
import RankResultDialog from "./RankResultDialog"
import AttachmentPreviewDialog from "@/components/AttachmentPreviewDialog"

const statusClassName = (status) => {
  if (status === "Passed") return "text-green-600"
  if (status === "Failed") return "text-red-600"

  return "text-muted-foreground"
}

const statusLabel = (status) => status || "Not Started"

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
    attachment: null,
    removeFiles: [],
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
  const [previewAttachment, setPreviewAttachment] = useState(null)
  const [previewTitle, setPreviewTitle] = useState("")

  const canViewSecretariatAssessment = useHasPermission("HRIS_recruitment.vacancies.assessment.secretariat.view")
  const canViewHRMPSBAssessment = useHasPermission("HRIS_recruitment.vacancies.assessment.hrmpsb.view")
  const canLogSkillsTestResult = useHasPermission("HRIS_recruitment.vacancies.assessment.skills-test.log")
  const canLogDpeTestResult = useHasPermission("HRIS_recruitment.vacancies.assessment.dpe-test.log")
  const canRankApplicants = useHasPermission("HRIS_recruitment.vacancies.assessment.applicants.rank")

  useEffect(() => {
    fetchApplicants(vacancy.id)
  }, [vacancy.id])

  const rows = sortApplicantsByRank(applicants.data?.data || [])

  const selectedExamAttachment = useMemo(() => {
    if (!examDialog.applicant || !examDialog.testType) return null

    return examDialog.testType === "Skill Test"
      ? examDialog.applicant.skill_test_attachment
      : examDialog.applicant.dpe_attachment
  }, [examDialog.applicant, examDialog.testType])

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
      attachment: null,
      removeFiles: [],
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
      attachment: null,
      removeFiles: [],
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

  const openAttachmentPreview = (attachment, title) => {
    if (!attachment) return

    setPreviewAttachment(attachment)
    setPreviewTitle(title || attachment.filename || attachment.name || "Attachment")
  }

  const saveExamResult = async () => {
    if (!examDialog.applicant || !examDialog.testType) return

    setIsSavingExam(true)
    setExamErrors({})

    try {
      const submission = new FormData()
      submission.append("test_type", examDialog.testType)
      submission.append("date_conducted", examForm.date_conducted)
      submission.append("status", examForm.status)
      submission.append("score", examForm.score === "" ? "" : examForm.score)

      examForm.removeFiles.forEach((fileId) => {
        submission.append("removeFiles[]", fileId)
      })

      if (examForm.attachment) {
        submission.append("attachment", examForm.attachment)
      }

      await axios.post(
        route("vacancies.applicants.exam-result.store", {
          vacancy: vacancy.id,
          application: examDialog.applicant.id,
        }),
        submission
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

      <div className="overflow-hidden rounded-lg border">
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
                    {canViewSecretariatAssessment ? (
                      <Button
                        variant="ghost"
                        type="button"
                        className="w-fit rounded-md px-2 py-1 text-left transition-colors hover:bg-muted"
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
                      </Button>
                    ) : (
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
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      type="button"
                      className="w-fit rounded-md px-2 py-1 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
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
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start">
                      {canViewHRMPSBAssessment ? (
                        <Button
                          variant="ghost"
                          type="button"
                          className="w-fit rounded-md px-2 py-1 text-left transition-colors hover:bg-muted"
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
                        </Button>
                      ) : (
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
                      )}
                      {applicant.skill_test_attachment && (
                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            type="button"
                            variant="link"
                            className="h-auto p-0 text-xs text-primary"
                            onClick={() =>
                              openAttachmentPreview(
                                applicant.skill_test_attachment,
                                applicant.skill_test_attachment.name || "Skill Test Attachment"
                              )
                            }
                          >
                            <Paperclip className="h-3 w-3" />
                            {applicant.skill_test_attachment.name || "Attachment"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start">
                      {canLogDpeTestResult || canLogSkillsTestResult ? (
                        <Button
                          variant="ghost"
                          type="button"
                          className="w-fit rounded-md px-2 py-1 text-left transition-colors hover:bg-muted"
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
                        </Button>
                      ) : (
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
                      )}
                      {applicant.dpe_attachment && (
                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            type="button"
                            variant="link"
                            className="h-auto p-0 text-xs text-primary"
                            onClick={() =>
                              openAttachmentPreview(
                                applicant.dpe_attachment,
                                applicant.dpe_attachment.name || "DPE Attachment"
                              )
                            }
                          >
                            <Paperclip className="h-3 w-3" />
                            {applicant.dpe_attachment.name || "Attachment"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {canRankApplicants ? (
                      <Button
                        variant="ghost"
                        type="button"
                        className="inline-flex w-fit rounded-md px-2 py-1 text-left transition-colors hover:bg-muted"
                        onClick={() => openRankDialog(applicant)}
                      >
                        <div className="flex flex-col">
                          <span className={applicant.rank ? "text-foreground" : "text-muted-foreground"}>
                            {applicant.rank || "Not Set"}
                          </span>
                        </div>
                      </Button>
                    ) : (
                      <div className="flex flex-col">
                        <span className={applicant.rank ? "text-foreground" : "text-muted-foreground"}>
                          {applicant.rank || "Not Set"}
                        </span>
                      </div>
                    )}
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
      <ExamResultDialog
        open={examDialog.open}
        onOpenChange={closeExamDialog}
        applicant={examDialog.applicant}
        testType={examDialog.testType}
        form={examForm}
        existingAttachment={selectedExamAttachment}
        errors={examErrors}
        isSaving={isSavingExam}
        onSave={saveExamResult}
        onChange={(field, value) => setExamForm((prev) => ({ ...prev, [field]: value }))}
        onAttachmentChange={(file) =>
          setExamForm((prev) => ({
            ...prev,
            attachment: file,
            removeFiles: [],
          }))
        }
        onRemoveAttachment={(fileId) =>
          setExamForm((prev) => ({
            ...prev,
            removeFiles: fileId ? [fileId] : [],
            attachment: null,
          }))
        }
      />
      <RankResultDialog
        open={rankDialog.open}
        onOpenChange={closeRankDialog}
        applicant={rankDialog.applicant}
        form={rankForm}
        errors={rankErrors}
        isSaving={isSavingRank}
        onSave={saveRankResult}
        onChange={(field, value) => setRankForm((prev) => ({ ...prev, [field]: value }))}
      />
      <AttachmentPreviewDialog
        open={Boolean(previewAttachment)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewAttachment(null)
            setPreviewTitle("")
          }
        }}
        file={previewAttachment}
        title={previewTitle}
      />
    </div>
  )
}

export default AssessmentTab
