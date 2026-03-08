// VehicleRequest.jsx
import { useMemo, useState } from "react"
import { useForm } from "@inertiajs/react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import StatusInfoBox from "@/components/StatusInfoBox"
import { useToast } from "@/hooks/use-toast"
import { formatDate, formatTime12, formatAmount } from "@/lib/utils.jsx"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import RichTextEditor from "@/components/RichTextEditor"

import ServiceVehicleExpenseForm from "./ServiceVehicleExpenseForm"
import ReviewVehicleRequestForm from "./ReviewVehicleRequestForm"
import { vehicleRequestActionMap as actionMap } from "./actions"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table"

const VehicleRequest = ({
  travelOrder,
  can,
  user,
  vehicles,
  serviceExpenses,
  reasons,
}) => {
  const { toast } = useToast()
  const [confirmAction, setConfirmAction] = useState(null)

  const confirmForm = useForm({ remarks: "" })
  const [serviceVehicleTotal, setServiceVehicleTotal] = useState(0)

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
      onSuccess: () => {
        toast({ title: "Success!", description: `${confirmAction} successful!` })
        closeConfirm()
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

  const needsRemarks = actionMap[confirmAction]?.needsRemarks
  const currentActionConfig = actionMap[confirmAction] || {}
  const dialogTitle = currentActionConfig.title || `Confirm ${confirmAction}`
  const dialogDescription =
    currentActionConfig.description ||
    `Are you sure you want to ${confirmAction} this vehicle request?`
  const actionNote = currentActionConfig.note

  const commutationRows = useMemo(() => {
    const rows = Array.isArray(travelOrder?.commutation_expenses)
      ? travelOrder.commutation_expenses
      : []
    return rows
      .map((r) => ({
        particulars: (r?.particulars ?? "").toString().trim(),
        amount: Number(r?.amount ?? 0),
      }))
      .filter((r) => r.particulars)
  }, [travelOrder?.commutation_expenses])

  const commutationTotal = useMemo(
    () =>
      commutationRows.reduce(
        (sum, r) => sum + (Number.isFinite(r.amount) ? r.amount : 0),
        0
      ),
    [commutationRows]
  )

  const staffCount = useMemo(
    () => (Array.isArray(travelOrder?.staffs) ? travelOrder.staffs.length : 0),
    [travelOrder?.staffs]
  )

  const commutationTotalCost = useMemo(
    () => commutationTotal * staffCount,
    [commutationTotal, staffCount]
  )

  const totalServiceVehicleEstimate = useMemo(
    () => Number(serviceVehicleTotal || 0),
    [serviceVehicleTotal]
  )
  const serviceEstimateThreshold = useMemo(
    () => totalServiceVehicleEstimate * 0.8,
    [totalServiceVehicleEstimate]
  )

  const isVehicleRecommended = useMemo(() => {
    if (!(totalServiceVehicleEstimate > 0)) return false
    return commutationTotalCost > serviceEstimateThreshold
  }, [commutationTotalCost, serviceEstimateThreshold, totalServiceVehicleEstimate])

  const showApproveButton = useMemo(
    () => totalServiceVehicleEstimate > 0,
    [totalServiceVehicleEstimate]
  )

  const vehicleStatusLabel = useMemo(() => {
    const s = String(travelOrder?.vehicle_request_status || "").trim()
    return s ? s : "This vehicle request is not yet submitted"
  }, [travelOrder?.vehicle_request_status])

  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">Vehicle Request</h3>
      </div>

      <div className="mb-4">
        <StatusInfoBox
          color={
            ["Reviewed", "Approved", "Vehicle Authorized"].includes(
              travelOrder?.vehicle_request_status
            ) && "green"
          }
          status={vehicleStatusLabel}
          message={
            <>
              {vehicleStatusLabel}{" "}
              {String(travelOrder?.vehicle_request_status || "").trim() &&
                travelOrder.vehicle_request_acted_by_name && (
                  <>
                    by {travelOrder.vehicle_request_acted_by_name} on{" "}
                    {formatDate(travelOrder.vehicle_request_date_acted)}
                  </>
                )}
            </>
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="space-y-1">
          <span className="text-sm font-semibold">Estimated Distance (in km)</span>
          <div className="text-sm">{travelOrder.est_distance}</div>
        </div>
        <div className="space-y-1">
          <span className="text-sm font-semibold">Estimated Departure Time</span>
          <div className="text-sm">{formatTime12(travelOrder.est_departure_time)}</div>
        </div>
        <div className="space-y-1">
          <span className="text-sm font-semibold">Estimated Arrival Time</span>
          <div className="text-sm">{formatTime12(travelOrder.est_arrival_time)}</div>
        </div>
      </div>

      <div className="space-y-2 mb-3 border-b pb-4">
        <span className="text-sm font-semibold">Commute Expense Estimate</span>

        {commutationRows.length === 0 ? (
          <div className="text-sm">No commute estimate provided.</div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="h-8">
                  <TableHead className="py-1 px-2 text-xs font-semibold">Particulars</TableHead>
                  <TableHead className="py-1 px-2 text-xs text-right font-semibold">Amount</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {commutationRows.map((row, idx) => (
                  <TableRow key={idx} className="h-8">
                    <TableCell className="py-1 px-2 text-xs break-words">
                      {row.particulars}
                    </TableCell>
                    <TableCell className="py-1 px-2 text-xs text-right whitespace-nowrap">
                      {formatAmount(row.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>

              <TableFooter>
                <TableRow className="h-8">
                  <TableCell className="py-1 px-2 text-xs font-semibold text-right">
                    Total
                  </TableCell>
                  <TableCell className="py-1 px-2 text-xs text-right font-semibold">
                    {formatAmount(commutationTotal)}
                  </TableCell>
                </TableRow>

                <TableRow className="h-8">
                  <TableCell className="py-1 px-2 text-xs font-semibold text-right">
                    Total Cost of Commute ({staffCount} authorized personnel)
                  </TableCell>
                  <TableCell className="py-1 px-2 text-xs text-right font-semibold">
                    {formatAmount(commutationTotalCost)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}

        {(can?.vrSubmit || can?.endorse || can?.approve || can?.return || can?.resubmit) && (
          <div className="pt-3 flex flex-col sm:flex-row gap-2 justify-end">
            {can?.vrSubmit && (
              <Button type="button" onClick={() => openConfirm("Submit")}>
                Submit Vehicle Request
              </Button>
            )}
            {can?.endorse && (
              <Button type="button" onClick={() => openConfirm("Endorse")}>
                Endorse for Approval
              </Button>
            )}

            {can?.return && (
              <Button type="button" variant="destructive" onClick={() => openConfirm("Return")}>
                Return Request
              </Button>
            )}

            {can?.resubmit && (
              <Button type="button" onClick={() => openConfirm("Resubmit")}>
                Re-submit Request
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="mb-6 flex flex-col gap-4 items-start">
        <span className="text-normal font-semibold">PRU Assessment</span>

        <ServiceVehicleExpenseForm
          travelOrderId={travelOrder.id}
          vehicles={vehicles}
          initial={serviceExpenses}
          onTotalChange={setServiceVehicleTotal}
          canReview={can?.review}
          isRequestingVehicle={travelOrder.isRequestingVehicle}
        />

        {can?.review && (
          <div className="w-full space-y-2">
            {totalServiceVehicleEstimate <= 0 && (
              <div className="rounded-md bg-muted p-3 text-xs flex flex-col gap-1 border-l-4 border-muted-foreground/30">
                Note: Please provide an estimate first before assessing the vehicle request.
              </div>
            )}

            <div className="flex justify-end">
              <ReviewVehicleRequestForm
                travelOrderId={travelOrder.id}
                reasons={reasons}
                guide={{
                  totalServiceVehicleEstimate,
                  serviceEstimateThreshold,
                  commutationTotalCost,
                  staffCount,
                  isVehicleRecommended,
                }}
                userId={user.ipms_id}
                //disabled={totalServiceVehicleEstimate <= 0}
              />
            </div>
          </div>
        )}
      </div>

      {travelOrder?.review && (can?.approve || can?.review) && (() => {
        const rec = travelOrder.review.recommendation
        const isApprove = rec === "Approved"
        const isDisapprove = rec === "Disapproved"

        const label = isApprove ? "Approve" : isDisapprove ? "Disapprove" : rec || "Recommendation"
        const accent = isApprove
          ? "border-green-500 bg-green-50/50"
          : isDisapprove
          ? "border-red-500 bg-red-50/50"
          : "border-muted"

        const hasGuide = (totalServiceVehicleEstimate ?? 0) > 0

        return (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">Recommendation</span>

            <div className={`rounded-md border-l-4 border p-4 ${accent}`}>
              <div className="space-y-1">
                <div className="text-sm font-semibold">{label} for vehicle provision</div>

                {travelOrder.review.dispatcher_name && (
                  <div className="text-xs text-muted-foreground">
                    Reviewed and assessed by {travelOrder.review.dispatcher_name}
                  </div>
                )}
              </div>

              <div className="mt-3 space-y-3">
                {hasGuide ? (
                  <div className="text-xs space-y-2 rounded-md border bg-background/50 p-3">
                    <div className="font-medium">Estimate Guide</div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        Commute Expense Estimate ({staffCount}{staffCount ? " personnel" : ""})
                      </span>
                      <b className="whitespace-nowrap">{formatAmount(commutationTotalCost)}</b>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Official Vehicle Use Estimate</span>
                      <b className="whitespace-nowrap">{formatAmount(totalServiceVehicleEstimate)}</b>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">80% threshold for basis of vehicle use</span>
                      <b className="whitespace-nowrap">{formatAmount(serviceEstimateThreshold)}</b>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs rounded-md border bg-background/50 p-3 space-y-1">
                    <div className="font-medium">Guide</div>
                    <div className="text-muted-foreground">
                      No service vehicle expense estimate provided yet. Add an estimate above to generate the guide.
                    </div>
                  </div>
                )}

                {travelOrder.review.reason && (
                  <div className="text-xs space-y-1">
                    <div className="font-medium">Prioritization</div>
                    <div className="leading-relaxed">{travelOrder.review.reason}</div>
                  </div>
                )}

                {travelOrder.review.remarks && (
                  <div className="text-xs space-y-1">
                    <div className="font-medium">Additional Remarks</div>
                    <div
                      className="leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: travelOrder.review.remarks }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {showApproveButton && can?.approve && (
        <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-end">
          <Button type="button" variant="destructive" onClick={() => openConfirm("Disapprove")}>
            Disapprove
          </Button>

          <Button type="button" onClick={() => openConfirm("Approve")}>
            Approve
          </Button>
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

export default VehicleRequest
