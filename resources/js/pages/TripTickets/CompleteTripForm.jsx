import { useEffect, useState } from "react"
import { useForm } from "@inertiajs/react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import AmountInput from "@/components/AmountInput"

const CompleteTripForm = ({ open, ticket, onClose, onSuccess }) => {
  const { toast } = useToast()
  const [bootLoading, setBootLoading] = useState(false)

  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    odo_start: "",
    odo_end: "",
    fuel_filled: "",
    fuel_price: "",
    destinations: [],
  })

  useEffect(() => {
    if (!open || !ticket?.id) return

    const controller = new AbortController()
    let active = true

    const load = async () => {
      setBootLoading(true)
      clearErrors()

      try {
        const res = await fetch(route("trip-tickets.complete.form", { id: ticket.id }), {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        })

        if (!res.ok) throw new Error("Failed to load complete-trip form.")

        const json = await res.json()
        if (!active) return

        const payload = json?.data ?? {}
        const destinations = Array.isArray(payload?.destinations)
          ? payload.destinations.map((d) => ({
              id: d?.id ?? null,
              destination_label:
                d?.destination_label ||
                [d?.location, d?.citymunName, d?.provinceName].filter(Boolean).join(", "),
              departure_time: d?.departure_time ?? "",
              arrival_time: d?.arrival_time ?? "",
            }))
          : []

        setData({
          odo_start: payload?.trip_ticket?.odo_start ?? "",
          odo_end: payload?.trip_ticket?.odo_end ?? "",
          fuel_filled: payload?.trip_ticket?.fuel_filled ?? "",
          fuel_price: payload?.trip_ticket?.fuel_price ?? "",
          destinations,
        })
      } catch (err) {
        if (!active || err?.name === "AbortError") return
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
  }, [open, ticket?.id])

  useEffect(() => {
    if (!open) {
      reset()
      clearErrors()
      setBootLoading(false)
    }
  }, [open])

  const updateDestinationTime = (index, key, value) => {
    const next = [...data.destinations]
    next[index] = { ...next[index], [key]: value }
    setData("destinations", next)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    post(route("trip-tickets.complete", { id: ticket?.id }), {
      preserveScroll: true,
      onSuccess: (page) => {
        const flash = page?.props?.flash || {}

        toast({
          title: flash.title || "Success",
          description: flash.message || "Trip completed successfully.",
          variant: flash.status === "error" ? "destructive" : "default",
        })

        reset()
        onSuccess?.()
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to save trip completion.",
          variant: "destructive",
        })
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Complete Trip</DialogTitle>
          <DialogDescription>
            Set odometer readings and actual departure/arrival time per destination.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <div className={bootLoading ? "pointer-events-none opacity-70" : ""}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Odometer Reading (Start of Trip)</Label>
                  <AmountInput
                    value={data.odo_start}
                    onChange={(v) => setData("odo_start", v ?? "")}
                    placeholder="Enter odometer start"
                    isInvalid={!!errors.odo_start}
                  />
                  {errors.odo_start && <p className="text-xs text-red-500">{errors.odo_start}</p>}
                </div>

                <div className="space-y-1">
                  <Label>Odometer Reading (End of Trip)</Label>
                  <AmountInput
                    value={data.odo_end}
                    onChange={(v) => setData("odo_end", v ?? "")}
                    placeholder="Enter odometer end"
                    isInvalid={!!errors.odo_end}
                  />
                  {errors.odo_end && <p className="text-xs text-red-500">{errors.odo_end}</p>}
                </div>
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Destination</TableHead>
                      <TableHead className="text-xs w-[160px]">Departure Time</TableHead>
                      <TableHead className="text-xs w-[160px]">Arrival Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.destinations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-muted-foreground">
                          No destinations found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.destinations.map((d, i) => (
                        <TableRow key={d.id ?? i}>
                          <TableCell>{d.destination_label || "-"}</TableCell>
                          <TableCell>
                            <Input
                              type="time"
                              value={d.departure_time || ""}
                              onChange={(e) =>
                                updateDestinationTime(i, "departure_time", e.target.value)
                              }
                            />
                            {errors[`destinations.${i}.departure_time`] && (
                              <p className="text-xs text-red-500 mt-1">
                                {errors[`destinations.${i}.departure_time`]}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="time"
                              value={d.arrival_time || ""}
                              onChange={(e) =>
                                updateDestinationTime(i, "arrival_time", e.target.value)
                              }
                            />
                            {errors[`destinations.${i}.arrival_time`] && (
                              <p className="text-xs text-red-500 mt-1">
                                {errors[`destinations.${i}.arrival_time`]}
                              </p>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Fuel Filled (Liters)</Label>
                  <AmountInput
                    value={data.fuel_filled}
                    onChange={(v) => setData("fuel_filled", v ?? "")}
                    placeholder="Enter no. of liters"
                    isInvalid={!!errors.fuel_filled}
                  />
                  {errors.fuel_filled && <p className="text-xs text-red-500">{errors.fuel_filled}</p>}
                </div>

                <div className="space-y-1">
                  <Label>Fuel Price (per liter)</Label>
                  <AmountInput
                    value={data.fuel_price}
                    onChange={(v) => setData("fuel_price", v ?? "")}
                    placeholder="Enter fuel price"
                    isInvalid={!!errors.fuel_price}
                  />
                  {errors.fuel_price && <p className="text-xs text-red-500">{errors.fuel_price}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => onClose?.(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={processing || bootLoading}>
                  {processing ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </div>

          {bootLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/20">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CompleteTripForm
