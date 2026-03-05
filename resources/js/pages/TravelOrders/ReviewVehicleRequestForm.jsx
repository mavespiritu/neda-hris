import { useEffect, useMemo, useState, useCallback } from "react"
import { useForm, router } from "@inertiajs/react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import SingleComboBox from "@/components/SingleComboBox"
import RichTextEditor from "@/components/RichTextEditor"
import StatusInfoBox from "@/components/StatusInfoBox"
import { formatAmount } from "@/lib/utils.jsx"
import { useToast } from "@/hooks/use-toast"

const ReviewVehicleRequestForm = ({
  travelOrderId,
  reasons = [],
  guide,
  disabled = false,
}) => {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)

  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    recommendation: "",
    prioritization_id: "",
    remarks: "",
  })

  const recommendationOptions = useMemo(
    () => [
      { value: "Approved", label: "Approve Vehicle Provision" },
      { value: "Disapproved", label: "Decline Vehicle Provision" },
    ],
    []
  )

  const reasonOptions = useMemo(
    () =>
      (Array.isArray(reasons) ? reasons : []).map((r) => ({
        value: String(r.id ?? r.value),
        label: r.title ?? r.label,
      })),
    [reasons]
  )

  const isApproved = data.recommendation === "Approved"
  const isDisapproved = data.recommendation === "Disapproved"

  // ✅ when Disapproved: hide reason and clear value + errors
  useEffect(() => {
    if (isDisapproved) {
      if (data.prioritization_id) setData("prioritization_id", "")
      clearErrors("prioritization_id")
    }
  }, [isDisapproved]) // eslint-disable-line react-hooks/exhaustive-deps


  const submit = (e) => {
    e.preventDefault()
    if (disabled) return

    post(route("vehicle-requests.review", travelOrderId), {
      preserveScroll: true,
      onSuccess: (page) => {
        const flash = page?.props?.flash ?? {}

        toast({
          title: flash.title || "Success",
          description: flash.message || "PRU assessment submitted.",
          variant: flash.status === "error" ? "destructive" : "default",
        })

        reset()
        setOpen(false)
      },
      onError: () => {
        toast({
          title: "Submission failed",
          description: "Please check the form and try again.",
          variant: "destructive",
        })
      },
    })
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} disabled={disabled}>
        Assess Vehicle Request
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>PRU Assessment on Vehicle Request</DialogTitle>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4">
            {guide?.totalServiceVehicleEstimate > 0 ? (
              <div className="space-y-2">
                <div className="text-xs font-semibold">Recommendation Guide</div>

                <StatusInfoBox
                  status={guide.isVehicleRecommended ? "Approved" : "Disapproved"}
                  message={
                    <div className="text-xs space-y-1">
                      <div>
                        Travel expense if personnel opt to commute:{" "}
                        <b>{formatAmount(guide.commutationTotalCost)}</b>
                      </div>
                      <div>
                        Estimated cost if service vehicle will be provided:{" "}
                        <b>{formatAmount(guide.totalServiceVehicleEstimate)}</b>
                      </div>
                      <div>
                        80% of Service Vehicle Provision Cost Estimate:{" "}
                        <b>{formatAmount(guide.serviceEstimateThreshold)}</b>
                      </div>
                    </div>
                  }
                />
              </div>
            ) : (
              <StatusInfoBox
                status=""
                message={
                  <>
                    <span className="text-sm break-words">No estimate provided yet.</span>
                    <span className="text-xs">Add an estimate to generate a recommendation guide.</span>
                  </>
                }
              />
            )}

            {/* Recommendation */}
            <div className="space-y-1">
              <Label>
                Recommendation <span className="text-destructive">*</span>
              </Label>
              <SingleComboBox
                items={recommendationOptions}
                value={data.recommendation}
                onChange={(val) => setData("recommendation", val)}
                placeholder="Select recommendation"
                invalidMessage={errors.recommendation}
              />
              {errors.recommendation && <div className="text-xs text-destructive">{errors.recommendation}</div>}
            </div>

            {/* ✅ Reason ONLY when Approved */}
            {isApproved && (
              <div className="space-y-1">
                <Label>
                  Reason <span className="text-destructive">*</span>
                </Label>
                <SingleComboBox
                  items={reasonOptions}
                  value={data.prioritization_id}
                  onChange={(val) => setData("prioritization_id", val)}
                  placeholder="Select reason"
                  invalidMessage={errors.prioritization_id}
                />
                {errors.prioritization_id && (
                  <div className="text-xs text-destructive">{errors.prioritization_id}</div>
                )}
              </div>
            )}

            {/* Remarks: required only when Disapproved */}
            <div className="space-y-1">
              <Label>
                Additional Remarks {isDisapproved && <span className="text-destructive">*</span>}
              </Label>
              <RichTextEditor
                value={data.remarks}
                onChange={(val) => setData("remarks", val)}
                isInvalid={errors.remarks}
              />
              {errors.remarks && <div className="text-xs text-destructive">{errors.remarks}</div>}
              {isDisapproved && (
                <div className="text-xs text-muted-foreground">
                  Remarks are required when declining vehicle provision.
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>

              <Button type="submit" disabled={disabled || processing}>
                {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Submit Review
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ReviewVehicleRequestForm
