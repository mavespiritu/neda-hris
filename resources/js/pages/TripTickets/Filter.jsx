import { useEffect, useRef } from "react"
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
import { Label } from "@/components/ui/label"
import SingleComboBox from "@/components/SingleComboBox"

const Filter = ({
  open,
  onClose,
  onApply,
  initialValues,
  options,
}) => {
  const emptyInitialValues = {
    vehicle_id: "",
    driver_id: "",
    dispatcher_id: "",
  }

  const firstOpenRef = useRef(true)

  const { data, setData } = useForm({
    vehicle_id: initialValues?.vehicle_id || "",
    driver_id: initialValues?.driver_id || "",
    dispatcher_id: initialValues?.dispatcher_id || "",
  })

  useEffect(() => {
    if (open && firstOpenRef.current) {
      setData({ ...emptyInitialValues, ...(initialValues || {}) })
      firstOpenRef.current = false
    }

    if (!open) {
      firstOpenRef.current = true
    }
  }, [open, initialValues, setData])

  const handleSubmit = (e) => {
    e.preventDefault()
    onApply?.(data)
    onClose?.(false)
  }

  const handleClear = () => {
    setData(emptyInitialValues)
    onApply?.(emptyInitialValues)
    onClose?.(false)
  }

  const hasFilters = Object.keys(emptyInitialValues).some(
    (key) => data[key] && data[key] !== ""
  )

  const vehicleItems = options?.vehicles || []
  const driverItems = options?.drivers || []
  const dispatcherItems = options?.dispatchers || []

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filter Trip Tickets</DialogTitle>
          <DialogDescription>
            Select one or more filters to narrow the results.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Vehicle</Label>
            <SingleComboBox
              items={vehicleItems}
              onChange={(v) => setData("vehicle_id", v)}
              placeholder="Select vehicle"
              name="vehicle_id"
              id="vehicle_id"
              value={data.vehicle_id}
            />
          </div>

          <div className="space-y-1">
            <Label>Driver</Label>
            <SingleComboBox
              items={driverItems}
              onChange={(v) => setData("driver_id", v)}
              placeholder="Select driver"
              name="driver_id"
              id="driver_id"
              value={data.driver_id}
            />
          </div>

          <div className="space-y-1">
            <Label>Dispatcher</Label>
            <SingleComboBox
              items={dispatcherItems}
              onChange={(v) => setData("dispatcher_id", v)}
              placeholder="Select dispatcher"
              name="dispatcher_id"
              id="dispatcher_id"
              value={data.dispatcher_id}
            />
          </div>

          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              {hasFilters ? (
                <Button type="button" variant="ghost" onClick={handleClear}>
                  Clear Filters
                </Button>
              ) : (
                <Button type="button" variant="ghost" onClick={() => onClose?.(false)}>
                  Close
                </Button>
              )}
            </DialogClose>

            <Button type="submit">Apply Filters</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default Filter
