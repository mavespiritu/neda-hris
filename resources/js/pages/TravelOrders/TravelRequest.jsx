import { useMemo, useState } from "react"
import { useForm, usePage } from "@inertiajs/react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import StatusInfoBox from "@/components/StatusInfoBox"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { formatDateRange, formatDate } from "@/lib/utils.jsx"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Printer, Loader2 } from "lucide-react"
import RichTextEditor from "@/components/RichTextEditor"
import { travelRequestActionMap as actionMap } from "./actions"

const TravelRequest = ({ travelOrder, can, user }) => {
  const { toast } = useToast()
  const [confirmAction, setConfirmAction] = useState(null)
  const confirmForm = useForm({ remarks: "" })

  const openConfirm = (action) => {
    setConfirmAction(action)
    confirmForm.setData("remarks", "")
    confirmForm.clearErrors()
  }

  const closeConfirm = () => {
    setConfirmAction(null)
    confirmForm.reset()
    confirmForm.clearErrors()
  }

  const performConfirmAction = (e) => {
    e.preventDefault()
    if (!confirmAction) return

    const cfg = actionMap[confirmAction]
    if (!cfg) return

    confirmForm.post(route(cfg.route, travelOrder.id), {
      preserveScroll: true,
      onSuccess: (page) => {
        const flash = page?.props?.flash ?? {}

        const isError =
          flash.status === "error" ||
          flash.type === "error" ||
          !!flash.error

        toast({
          title: flash.title || (isError ? "Action failed" : "Success"),
          description:
            flash.message ||
            (isError
              ? "Unable to process request."
              : `${confirmAction} successful!`),
          variant: isError ? "destructive" : "default",
        })

        if (!isError) {
          closeConfirm()
        }
      },
      onError: () => {
        toast({
          title: "Please check the form",
          description: "Fix the errors and try again.",
          variant: "destructive",
        })
      },
    })
  }

  const currentActionConfig = actionMap[confirmAction] || {}
  const dialogTitle = currentActionConfig.title || `Confirm ${confirmAction}`
  const dialogDescription =
    currentActionConfig.description ||
    `Are you sure you want to ${confirmAction} this travel request?`
  const actionNote = currentActionConfig.note
  const needsRemarks = !!currentActionConfig.needsRemarks

  const destinations = useMemo(
    () => (Array.isArray(travelOrder?.destinations) ? travelOrder.destinations : []),
    [travelOrder?.destinations]
  )

  const formatDestination = (d) => {
    if (!d) return ""
    if (d.type === "Local" || d.country === "Philippines") {
      const city = (d.citymunName || d.citymun || "").toString().trim()
      const prov = (d.provinceName || d.province || "").toString().trim()
      return [d.location, city, prov].filter(Boolean).join(", ")
    }
    return [d.location, d.country].filter(Boolean).join(", ")
  }

  const destinationsText = useMemo(() => {
    const cleaned = destinations
      .map(formatDestination)
      .map((s) => (s || "").trim())
      .filter(Boolean)

    if (cleaned.length === 0) return <span>&nbsp;</span>
    if (cleaned.length === 1) return <span>{cleaned[0]}</span>
    return cleaned.map((txt, idx) => (
      <span key={idx} className="block">
        {idx + 1}. {txt}
      </span>
    ))
  }, [destinations])

  const personnelText = useMemo(() => {
    const list = Array.isArray(travelOrder?.staffs) ? travelOrder.staffs : []
    const cleaned = list.map((s) => (s?.name ?? "").toString().trim()).filter(Boolean)
    if (cleaned.length === 0) return <span>&nbsp;</span>
    if (cleaned.length === 1) return <span>{cleaned[0]}</span>
    return cleaned.map((name, idx) => (
      <span key={idx} className="block">
        {idx + 1}. {name}
      </span>
    ))
  }, [travelOrder?.staffs])

  const recommendingText = useMemo(() => {
    const list = Array.isArray(travelOrder?.staffs) ? travelOrder.staffs : []
    const names = list.map((s) => (s?.recommender_name ?? "").toString().trim()).filter(Boolean)
    const unique = [...new Set(names)]

    if (unique.length === 0) return <span>&nbsp;</span>
    if (unique.length === 1) return <span>{unique[0]}</span>
    return unique.map((name, idx) => (
      <span key={idx} className="block">
        {idx + 1}. {name}
      </span>
    ))
  }, [travelOrder?.staffs])

  const approverText = useMemo(() => {
    const list = Array.isArray(travelOrder?.staffs) ? travelOrder.staffs : []
    const names = list.map((s) => (s?.approver_name ?? "").toString().trim()).filter(Boolean)
    const unique = [...new Set(names)]

    if (unique.length === 0) return <span>&nbsp;</span>
    if (unique.length === 1) return <span>{unique[0]}</span>
    return unique.map((name, idx) => (
      <span key={idx} className="block">
        {idx + 1}. {name}
      </span>
    ))
  }, [travelOrder?.staffs])

  const status = String(travelOrder.status || "").trim()
  const statusColor =
    status === "Submitted" ? "green" :
    status === "Resubmitted" ? "green" :
    status === "Returned" ? "red" :
    undefined

  return (
    // h-full + flex-col: enables footer to sit at bottom
    <div className="min-w-0 h-full flex flex-col">
      {/* Main content grows */}
      <div className="flex-1 min-h-0">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Trip Information</h3>
        </div>

        <div className="mb-4">
          <StatusInfoBox
            color={statusColor}
            status={travelOrder.status}
            message={
              <>
                {travelOrder.status || "\u00A0"}{" "}
                {travelOrder.acted_by_name && (
                  <>
                    by {travelOrder.acted_by_name} on {formatDate(travelOrder.date_acted)}
                  </>
                )}
                {travelOrder.remarks && (
                  <div className="text-xs flex gap-1 flex-col mt-2">
                    <span>Remarks:</span>
                    <span
                      dangerouslySetInnerHTML={{ __html: travelOrder.remarks }}
                    />
                  </div>
                )}
              </>
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-sm font-semibold">Reference No.</span>
            <div className="text-sm">{travelOrder.reference_no}</div>
          </div>

          <div className="space-y-1">
            <span className="text-sm font-semibold">Travel Date</span>
            <div className="text-sm">
              {formatDateRange(travelOrder.start_date, travelOrder.end_date)}
            </div>
          </div>

          <div className="md:col-span-2 space-y-1">
            <span className="text-sm font-semibold">Purpose</span>
            <div className="flex items-start gap-2">
              <Badge className="shrink-0">{travelOrder.category_title}</Badge>
              <div className="text-sm break-words">{travelOrder.purpose}</div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-1">
            <span className="text-sm font-semibold">Destination</span>
            <div className="text-sm break-words space-y-1">{destinationsText}</div>
          </div>

          <div className="md:col-span-2 space-y-1">
            <span className="text-sm font-semibold">Authorized Passengers</span>
            <div className="text-sm break-words space-y-1">{personnelText}</div>
          </div>

          <div className="space-y-1">
            <span className="text-sm font-semibold">Recommending Approval</span>
            <div className="text-sm break-words space-y-1">{recommendingText}</div>
          </div>

          <div className="space-y-1">
            <span className="text-sm font-semibold">Approved By</span>
            <div className="text-sm break-words space-y-1">{approverText}</div>
          </div>

          <div className="md:col-span-2 space-y-1">
            <span className="text-sm font-semibold">Fund Source</span>
            <div className="text-sm break-words">
              {travelOrder.fund_source_title || "\u00A0"}
            </div>
          </div>
        </div>
      </div>

      {/* Footer (sticks to bottom naturally via flex) */}
      {(can?.submit || can?.trReturn || can?.trResubmit || can?.view) && (
        <div className="mt-auto pt-6 flex justify-end gap-2">
          {can?.view && (
            <Button
                variant="outline"
                type="button"
                onClick={() =>
                    window.open(
                    route("travel-requests.generate", travelOrder.id),
                    "_blank",
                    "noopener,noreferrer"
                    )
                }
                >
                <Printer className="h-4 w-4" />
                Print Travel Order
            </Button>
          )}

          {can?.submit && (
            <Button type="button" onClick={() => openConfirm("Submit")}>
              Submit Travel Request
            </Button>
          )}
          {can?.trReturn && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => openConfirm("Return")}
            >
              Return Request
            </Button>
          )}
          {can?.trResubmit && (
            <Button
              type="button"
              onClick={() => openConfirm("Resubmit")}
            >
              Resubmit Request
            </Button>
          )}
        </div>
      )}

      <Dialog open={!!confirmAction} onOpenChange={(open) => (!open ? closeConfirm() : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>

            {actionNote && (
              <div className="rounded-md bg-muted p-3 text-xs flex flex-col gap-1 border-l-4 border-muted-foreground/30 mt-2">
                Note: {actionNote}
              </div>
            )}
          </DialogHeader>

          <form onSubmit={performConfirmAction}>
            {needsRemarks && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="remarks">Remarks</Label>
                <RichTextEditor
                  name="remarks"
                  id="remarks"
                  value={confirmForm.data.remarks}
                  isInvalid={confirmForm.errors.remarks}
                  onChange={(value) => confirmForm.setData("remarks", value)}
                />
                {confirmForm.errors?.remarks && (
                  <span className="text-red-500 text-xs">{confirmForm.errors.remarks}</span>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" type="button" onClick={closeConfirm}>
                Cancel
              </Button>
              <Button type="submit" disabled={confirmForm.processing} className="flex items-center gap-2">
                {confirmForm.processing && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TravelRequest
