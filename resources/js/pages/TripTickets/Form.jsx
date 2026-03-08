import { useEffect, useRef, useState } from "react"
import { useForm } from "@inertiajs/react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import TextInput from "@/components/TextInput"
import TextArea from "@/components/TextArea"
import { Label } from "@/components/ui/label"
import SingleComboBox from "@/components/SingleComboBox"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import StatusInfoBox from "@/components/StatusInfoBox"

const Form = ({ mode, data, onClose, open }) => {
  const isEdit = mode === "edit"
  const editId = data?.id ?? data?.original?.id ?? null
  const { toast } = useToast()

  const [bootLoading, setBootLoading] = useState(false)
  const [bootData, setBootData] = useState(null)
  const loadedKeyRef = useRef(null)
  const [driverCheckLoading, setDriverCheckLoading] = useState(false)
  const [driverScheduleCheck, setDriverScheduleCheck] = useState(null)

  const {
    data: formData,
    setData,
    post,
    put,
    processing,
    reset,
    errors,
  } = useForm({
    id: "",
    travel_order_id: "",
    reference_no: "",
    vehicle_id: "",
    driver_id: "",
    dispatcher_id: "",
    prexc: "",
    remarks: "",
  })

  useEffect(() => {
    if (!open) loadedKeyRef.current = null
  }, [open])

 useEffect(() => {
  if (!open) return

  const controller = new AbortController()
  let active = true

  const load = async () => {
    setBootLoading(true)

    try {
      let url = ""

      if (isEdit) {
        if (!data?.id) return
        url = route("trip-tickets.edit", { id: data.id, lock_travel_request: 0 })
      } else {
        url = route("trip-tickets.create")
      }

      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      })
      if (!res.ok) throw new Error("Failed to load form data")

      const json = await res.json()
      if (!active) return

      const payload = json?.data ?? {}
      const ticket = payload?.trip_ticket ?? {}

      setBootData(payload)
      setData({
        travel_order_id: ticket.travel_order_id ?? "",
        reference_no: ticket.reference_no ?? "",
        vehicle_id: ticket.vehicle_id ?? "",
        driver_id: ticket.driver_id ?? "",
        dispatcher_id: ticket.dispatcher_id ?? "",
        prexc: ticket.prexc ?? "",
        remarks: ticket.remarks ?? "",
      })
    } catch (err) {
      if (!active || err?.name === "AbortError") return
      console.log(err)
      toast({
        title: "Failed to load form",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      if (active) setBootLoading(false)
    }
  }

  load()

  return () => {
    active = false
    controller.abort()
  }
  }, [open, isEdit, data?.id])

  useEffect(() => {
    if (!open) return
    if (!formData.driver_id || !formData.travel_order_id) {
      setDriverScheduleCheck(null)
      return
    }

    const controller = new AbortController()

    const run = async () => {
      setDriverCheckLoading(true)
      try {
        const params = new URLSearchParams({
          driver_id: String(formData.driver_id),
          travel_order_id: String(formData.travel_order_id),
        })
        if (isEdit && editId) {
          params.append("trip_ticket_id", String(editId))
        }

        const res = await fetch(
          `${route("trip-ticket.check-driver-schedule")}?${params.toString()}`,
          { headers: { Accept: "application/json" }, signal: controller.signal }
        )

        if (!res.ok) throw new Error("Failed to check driver schedule")
        const json = await res.json()
        setDriverScheduleCheck(json)
      } catch (err) {
        if (err?.name !== "AbortError") setDriverScheduleCheck(null)
      } finally {
        setDriverCheckLoading(false)
      }
    }

    run()
    return () => controller.abort()
  }, [open, formData.driver_id, formData.travel_order_id, isEdit, editId])

  const vehicles = bootData?.vehicles || []
  const requests = bootData?.requests || []
  const dispatchers = bootData?.dispatchers || []
  const drivers = bootData?.drivers || []
  const showRequestSelector = bootData?.show_travel_request_selector !== false

  const handleSubmit = (e) => {
    e.preventDefault()

    const onSuccess = (page) => {
      const flash = page?.props?.flash || {}

      onClose?.()
      reset()

      toast({
        title: flash.title || "Success",
        description:
          flash.message ||
          (isEdit ? "Trip ticket updated successfully." : "Trip ticket saved successfully."),
        variant: flash.status === "error" ? "destructive" : "default",
      })
    }

    if (isEdit && editId) {
      put(route("trip-tickets.update", { id: editId }), {
        preserveScroll: true,
        onSuccess,
      })
      return
    }

    post(route("trip-tickets.store"), {
      preserveScroll: true,
      onSuccess,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Trip Ticket" : "Add Trip Ticket"}</DialogTitle>
          <DialogDescription>Fill up all required fields.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <div className={bootLoading ? "pointer-events-none blur-[0.5px] opacity-85" : ""}>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className={`grid grid-cols-1 ${showRequestSelector ? "sm:grid-cols-2" : ""} gap-3`}>
                {showRequestSelector && (
                  <div className="space-y-1">
                    <Label>Travel Request</Label>
                    <SingleComboBox
                      items={requests}
                      value={formData.travel_order_id || ""}
                      onChange={(v) => setData("travel_order_id", v)}
                      placeholder="Select travel request"
                      invalidMessage={errors.travel_order_id}
                    />
                    {errors.travel_order_id && (
                      <p className="text-xs text-red-500">{errors.travel_order_id}</p>
                    )}
                  </div>
                )}

                <div className={`space-y-1 ${!showRequestSelector ? "sm:col-span-2" : ""}`}>
                  <Label>Trip Ticket Reference No.</Label>
                  <TextInput
                    name="reference_no"
                    id="reference_no"
                    value={formData.reference_no}
                    onChange={(e) => setData("reference_no", e.target.value)}
                    isInvalid={errors.reference_no}
                    readOnly
                  />
                  {errors.reference_no && (
                    <p className="text-xs text-red-500">{errors.reference_no}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Vehicle</Label>
                  <SingleComboBox
                    items={vehicles}
                    value={formData.vehicle_id || ""}
                    onChange={(v) => setData("vehicle_id", v)}
                    placeholder="Select vehicle"
                    invalidMessage={errors.vehicle_id}
                  />
                  {errors.vehicle_id && <p className="text-xs text-red-500">{errors.vehicle_id}</p>}
                </div>

                <div className="space-y-1">
                  <Label>Driver</Label>
                  <SingleComboBox
                    items={drivers}
                    value={formData.driver_id || ""}
                    onChange={(v) => setData("driver_id", v)}
                    placeholder="Select driver"
                    invalidMessage={errors.driver_id}
                  />
                  {errors.driver_id && <p className="text-xs text-red-500">{errors.driver_id}</p>}
                </div>
              </div>

              {formData.driver_id && formData.travel_order_id && (
                <div className="mt-2">
                  <StatusInfoBox
                    color={driverScheduleCheck?.has_conflict ? "red" : "green"}
                    status={
                      driverCheckLoading
                        ? "Checking driver schedule..."
                        : driverScheduleCheck?.has_conflict
                          ? "Conflict Found"
                          : "No Conflict"
                    }
                    message={
                      <div className="space-y-1">
                        <div>
                          {driverCheckLoading
                            ? "Please wait..."
                            : driverScheduleCheck?.has_conflict
                              ? `${driverScheduleCheck.message} (${driverScheduleCheck.conflicts?.length || 0} conflict${(driverScheduleCheck.conflicts?.length || 0) > 1 ? "s" : ""})`
                              : (driverScheduleCheck?.message || "No conflict found.")}
                        </div>

                        {!driverCheckLoading &&
                          driverScheduleCheck?.has_conflict &&
                          Array.isArray(driverScheduleCheck.conflict_lines) &&
                          driverScheduleCheck.conflict_lines.length > 0 && (
                            <div className="text-xs space-y-1">
                              {driverScheduleCheck.conflict_lines.map((line, idx) => (
                                <div key={idx}>{line}</div>
                              ))}
                            </div>
                          )}
                      </div>
                    }
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label>Dispatcher</Label>
                <SingleComboBox
                  items={dispatchers}
                  value={formData.dispatcher_id || ""}
                  onChange={(v) => setData("dispatcher_id", v)}
                  placeholder="Select dispatcher"
                  invalidMessage={errors.dispatcher_id}
                />
                {errors.dispatcher_id && (
                  <p className="text-xs text-red-500">{errors.dispatcher_id}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label>PREXC</Label>
                <TextInput
                  name="prexc"
                  id="prexc"
                  value={formData.prexc}
                  onChange={(e) => setData("prexc", e.target.value)}
                  isInvalid={errors.prexc}
                />
                {errors.prexc && <p className="text-xs text-red-500">{errors.prexc}</p>}
              </div>

              <div className="space-y-1">
                <Label>Remarks</Label>
                <TextArea
                  name="remarks"
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => setData("remarks", e.target.value)}
                  invalidMessage={errors.remarks}
                />
                {errors.remarks && <p className="text-xs text-red-500">{errors.remarks}</p>}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="ghost">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={processing}>
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEdit ? "Updating..." : "Saving..."}
                    </>
                  ) : isEdit ? (
                    "Update"
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </form>
          </div>

          {bootLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/20 backdrop-blur-[0.5px]">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default Form
