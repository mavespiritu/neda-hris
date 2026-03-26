import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { usePage } from "@inertiajs/react"
import { Loader2, Mail, Phone, Calendar, Download } from "lucide-react"
import PageTitle from "@/components/PageTitle"
import { formatDate, formatDateWithTime, formatFullName } from "@/lib/utils.jsx"
import { store } from "./store"
import { Button } from "@/components/ui/button"
import SingleComboBox from "@/components/SingleComboBox"
import RichTextEditor from "@/components/RichTextEditor"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Profile from "./Profile"
import Documents from "./Documents"
import ShortlistingResult from "./ShortlistingResult"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

const Applicants = () => {
  const { vacancy } = usePage().props
  const { applicants, fetchApplicants } = store()
  const { toast } = useToast()
  const [selectedApplicant, setSelectedApplicant] = useState(null)
  const [activeTab, setActiveTab] = useState("profile")
  const [isDownloading, setIsDownloading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showEditRequestDialog, setShowEditRequestDialog] = useState(false)
  const [editRequestRemarks, setEditRequestRemarks] = useState("")
  const [isSavingEditRequest, setIsSavingEditRequest] = useState(false)

  const handleDownloadDocuments = () => {
    if (!selectedApplicant) return

    setIsDownloading(true)

    window.location.href = route(
      'vacancies.applicants.requirements.download',
      selectedApplicant.id
    )
    setTimeout(() => {
      setIsDownloading(false)
    }, 3000)

    setShowConfirm(false)
  }

  useEffect(() => {
    fetchApplicants(vacancy.id)
  }, [])

  useEffect(() => {
    const rows = applicants.data?.data || []

    if (!rows.length) {
      if (selectedApplicant) {
        setSelectedApplicant(null)
      }
      return
    }

    const latestSelectedApplicant = selectedApplicant
      ? rows.find((row) => row.id === selectedApplicant.id)
      : null

    if (!selectedApplicant || !latestSelectedApplicant) {
      setSelectedApplicant(rows[0])
      setActiveTab("profile")
      return
    }

    if (latestSelectedApplicant !== selectedApplicant) {
      setSelectedApplicant(latestSelectedApplicant)
    }
  }, [applicants.data, selectedApplicant])

  const applicantOptions = (applicants.data?.data || []).map((applicant) => ({
    value: applicant.id,
    label: formatFullName(applicant.name),
    email_address: applicant.email_address,
  }))

  useEffect(() => {
    if (!showEditRequestDialog) return

    setEditRequestRemarks(selectedApplicant?.edit_request_remarks || "")
  }, [showEditRequestDialog, selectedApplicant?.id, selectedApplicant?.edit_request_remarks])

  const canOpenEditRequest = Boolean(selectedApplicant?.can_open_edit_request)
  const editRequestDeadlineLabel = selectedApplicant?.edit_request_deadline
    ? formatDate(selectedApplicant.edit_request_deadline)
    : null
  const editRequestStatusLabel = selectedApplicant?.edit_request_status || "Not yet opened"
  const editRequestStatusClass = useMemo(() => {
    switch (selectedApplicant?.edit_request_status) {
      case "Open":
        return "text-green-600"
      case "Expired":
      case "Closed":
      case "Cancelled":
        return "text-red-600"
      default:
        return "text-muted-foreground"
    }
  }, [selectedApplicant?.edit_request_status])

  const handleSaveEditRequest = async () => {
    if (!selectedApplicant) return

    setIsSavingEditRequest(true)

    try {
      await axios.post(
        route("vacancies.applicants.edit-request.store", {
          vacancy: vacancy.id,
          application: selectedApplicant.id,
        }),
        {
          remarks: editRequestRemarks,
        }
      )

      toast({
        title: "Success!",
        description: "Applicant edit request saved and email notification sent.",
      })

      setShowEditRequestDialog(false)
      await fetchApplicants(vacancy.id)
    } catch (error) {
      toast({
        title: error.response?.data?.title || "Edit request not saved",
        description: error.response?.data?.message || "Please check the remarks and try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingEditRequest(false)
    }
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <PageTitle
        pageTitle="Applicants"
        description="View applicants' information for this vacancy."
      />

      {/* 🔍 Search Bar */}
      {/* <div className="flex items-center gap-2 w-full max-w-md">
        <Input
          placeholder="Search applicant by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch} className="gap-2">
          <Search className="h-4 w-4" /> Search
        </Button>
      </div> */}

      <div className="flex flex-col md:flex-row w-full gap-4 h-full min-h-0">
        <div className="hidden md:block md:w-[28%] border rounded-lg overflow-hidden">
          {!applicants.data?.data?.length ? (
            <div className="flex items-center justify-center min-h-[220px] text-sm text-gray-500">
              No applicants found.
            </div>
          ) : (
            <div className="flex h-full flex-col min-h-0">
              <div className="border-b bg-muted/40 px-4 py-3">
                <h2 className="font-medium">Applicant List</h2>
                <p className="text-sm text-muted-foreground">
                  Select an applicant to view profile and documents.
                </p>
              </div>

              <ScrollArea className="flex-1">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-8 w-[56px] text-xs">#</TableHead>
                      <TableHead className="h-8 text-xs">Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applicants.data.data.map((applicant, idx) => {
                      const isActive = selectedApplicant?.id === applicant.id

                      return (
                        <TableRow
                          key={applicant.id}
                          className={`cursor-pointer ${
                            isActive
                              ? "bg-muted hover:bg-muted"
                              : "hover:bg-muted/40"
                          }`}
                          onClick={() => {
                            setSelectedApplicant(applicant)
                            setActiveTab("profile")
                          }}
                        >
                          <TableCell className="text-sm text-muted-foreground">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="truncate">{formatFullName(applicant.name)}</div>
                            <div className="truncate text-xs text-muted-foreground">
                              {applicant.email_address || "No email"}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </div>

        <div className="md:w-[72%] w-full border rounded-lg p-4">
          <div className="mb-4 md:hidden">
            <SingleComboBox
              items={applicantOptions}
              name="applicant"
              placeholder="Select applicant"
              value={selectedApplicant?.id ?? null}
              onChange={(value) => {
                const applicant = (applicants.data?.data || []).find((item) => item.id === value)
                if (!applicant) return

                setSelectedApplicant(applicant)
                setActiveTab("profile")
              }}
            />
          </div>

          {!selectedApplicant ? <ShortlistingResult /> : (
            <>
              {/* Header */}
              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {formatFullName(selectedApplicant.name)}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isDownloading}
                    onClick={() => setShowConfirm(true)}
                    className="flex items-center gap-2"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Preparing ZIP…
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        {`Download ${
                          selectedApplicant?.lastname
                            ? selectedApplicant.lastname.charAt(0).toUpperCase() + selectedApplicant.lastname.slice(1).toLowerCase()
                            : "Applicant"
                        }'s Documents`}
                      </>
                    )}
                  </Button>
                </div>

                <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Download all documents?</DialogTitle>
                      <DialogDescription>
                        This will download all applicant documents as a ZIP file.
                      </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => setShowConfirm(false)}
                        disabled={isDownloading}
                      >
                        Cancel
                      </Button>

                      <Button
                        onClick={handleDownloadDocuments}
                        disabled={isDownloading}
                      >
                        {isDownloading ? "Downloading…" : "Confirm"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {selectedApplicant.email_address || "No email"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {selectedApplicant.mobile_no || "No mobile number"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Submitted on {formatDateWithTime(selectedApplicant.date_submitted)}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b mb-4 flex gap-4">
                <button
                  className={`pb-2 text-sm font-medium border-b-2
                    ${activeTab === "profile"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground"}
                  `}
                  onClick={() => setActiveTab("profile")}
                >
                  Applicant's Profile
                </button>

                <button
                  className={`pb-2 text-sm font-medium border-b-2
                    ${activeTab === "documents"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground"}
                  `}
                  onClick={() => setActiveTab("documents")}
                >
                  Submitted Documents
                </button>
              </div>

              {/* Tab Content */}
              <div className="space-y-8">
                {activeTab === "profile" && (
                  <Profile applicantId={selectedApplicant.id} />
                )}

                {activeTab === "documents" && (
                  <Documents applicant={selectedApplicant} />
                )}
              </div>

              <div className="mt-6 border-t pt-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold">Application Edit Window</h3>
                    <p className="text-sm text-muted-foreground">
                      Allow the applicant to revise the submitted application and notify them through email.
                    </p>
                    <p className={`text-sm font-medium ${editRequestStatusClass}`}>
                      Status: {editRequestStatusLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {editRequestDeadlineLabel
                        ? `Editing may only be opened until ${editRequestDeadlineLabel}.`
                        : "No publication due date found for this vacancy."}
                    </p>
                    {!selectedApplicant?.email_address && (
                      <p className="text-xs text-red-600">
                        This applicant cannot be notified because no email address is available.
                      </p>
                    )}
                    {selectedApplicant?.edit_request_expires_at && selectedApplicant?.edit_request_status === "Open" && (
                      <p className="text-xs text-muted-foreground">
                        Current window closes on {formatDate(selectedApplicant.edit_request_expires_at)}.
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={() => setShowEditRequestDialog(true)}
                    disabled={!canOpenEditRequest}
                  >
                    Allow Applicant to Edit Submission
                  </Button>
                </div>
              </div>

            </>
          )}
        </div>

      </div>

      <Dialog open={showEditRequestDialog} onOpenChange={setShowEditRequestDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Allow Applicant to Edit Submission</DialogTitle>
            <DialogDescription>
              Send remarks and instructions to the applicant. The edit window will close automatically
              {editRequestDeadlineLabel ? ` after ${editRequestDeadlineLabel}.` : "."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
              <p>
                Applicant: <span className="font-medium">{formatFullName(selectedApplicant?.name) || "Applicant"}</span>
              </p>
              <p>
                Email: <span className="font-medium">{selectedApplicant?.email_address || "No email"}</span>
              </p>
              {editRequestDeadlineLabel && (
                <p>
                  Edit request deadline: <span className="font-medium">{editRequestDeadlineLabel}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Remarks</Label>
              <RichTextEditor
                value={editRequestRemarks}
                onChange={setEditRequestRemarks}
                minHeight="180px"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowEditRequestDialog(false)}
              disabled={isSavingEditRequest}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveEditRequest}
              disabled={isSavingEditRequest}
              className="gap-2"
            >
              {isSavingEditRequest && <Loader2 className="h-4 w-4 animate-spin" />}
              Send Edit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* <div className="flex flex-1 flex-col min-h-0">
        {applicants.isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}

        {!applicants.data?.data?.length ? (
          <div className="flex flex-1 items-center justify-center text-gray-500 text-sm min-h-[200px]">
            No applicants found.
          </div>
        ) : (
          <Accordion
            type="single"
            collapsible
            className="w-full space-y-2"
            value={activeApplicantId ? `applicant-${activeApplicantId}` : undefined}
            onValueChange={handleAccordionChange}
          >
            {applicants.data.data.map((applicant, idx) => (
              <AccordionItem
                key={applicant.id}
                value={`applicant-${applicant.id}`}
                className="border rounded-lg"
              >
                <AccordionTrigger className="flex justify-between px-4 py-3 font-semibold text-left">
                  <div>
                    <span className="text-base">
                      {idx + 1}. {formatFullName(applicant.name)}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    For Assessment
                  </div>
                </AccordionTrigger>

                <AccordionContent>
                  <Card className="border-none shadow-none">
                    <CardContent className="p-4 flex flex-col gap-4">
                      {loadingApplicantId === applicant.id ? (
                        <div className="flex justify-center items-center py-2 text-gray-500">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span className="ml-2 text-sm">Loading applicant details...</span>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-gray-500" />
                              <span>{applicant.email_address || "No email"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-gray-500" />
                              <span>{applicant.mobile_no || "No mobile number"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span>Submitted on {formatDateWithTime(applicant.date_submitted)}</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-4">
                            <div className="space-y-2">
                              <h2 className="font-semibold text-base">Applicant's Profile</h2>
                              <Profile applicantId={applicant.id} />
                            </div>
                            <div className="space-y-2">
                              <h2 className="font-semibold text-base">Applicant's Documents</h2>
                              <Documents applicantId={applicant.id} />
                            </div>
                          </div>
                          <Button
                            onClick={() => {
                              setSelectedApplicant(applicant)
                              setIsAssessDialogOpen(true)
                            }}
                          >
                            Assess Applicant # {idx + 1}
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div> */}
    </div>
  )
}

export default Applicants
