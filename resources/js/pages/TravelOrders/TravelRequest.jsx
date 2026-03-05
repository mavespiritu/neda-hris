import { useMemo, useState } from "react"
import { useForm, usePage } from "@inertiajs/react"
import { Button } from "@/components/ui/button"
import StatusInfoBox from "@/components/StatusInfoBox"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { formatDateRange, formatDate } from "@/lib/utils.jsx"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Printer, Loader2 } from "lucide-react"

const TravelRequest = ({ travelOrder, can, user }) => {
  const { toast } = useToast()
  const { props } = usePage()
  const [confirmAction, setConfirmAction] = useState(null)

  const { post, processing, reset, clearErrors, setData } = useForm({
    remarks: "",
  })

  const actionMap = {
    Submit: {
      route: "travel-requests.submit",
      needsRemarks: false,
      notifyWithUser: false,
    },
  }

  const openConfirm = (action) => {
    setConfirmAction(action)
    setData("remarks", "")
    clearErrors()
  }

  const performAction = (e) => {
    e.preventDefault()
    if (!confirmAction) return

    const cfg = actionMap[confirmAction]
    if (!cfg) return

    post(route(cfg.route, travelOrder.id), {
      preserveScroll: true,
      onSuccess: (page) => {
        const title = page.props?.title ?? props?.title ?? "Success"
        const description = page.props?.message ?? props?.message ?? `${confirmAction} successful!`

        toast({ title, description })

        reset()
        setConfirmAction(null)
      },
    })
  }

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
            status={travelOrder.status}
            message={
              <>
                {travelOrder.status || "\u00A0"}{" "}
                {travelOrder.acted_by_name && (
                  <>
                    by {travelOrder.acted_by_name} on {formatDate(travelOrder.date_acted)}
                  </>
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
      {(can?.submit || can?.view) && (
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
        </div>
      )}

      <Dialog
        open={!!confirmAction}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null)
            reset()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {confirmAction}</DialogTitle>
            <DialogDescription>
              Are you sure you want to <b>{confirmAction}</b> this travel request?
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={performAction}>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" type="button" onClick={() => setConfirmAction(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={processing} className="flex items-center gap-2">
                  {processing && <Loader2 className="h-4 w-4 animate-spin" />}
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
