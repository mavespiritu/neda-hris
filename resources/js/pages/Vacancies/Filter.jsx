import { useEffect, useRef } from "react"
import { useForm } from "@inertiajs/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import SingleComboBox from "@/components/SingleComboBox"
import IntegerInput from "@/components/IntegerInput"

const Filter = ({ onClose, open, onApply, initialValues, divisions, appointmentStatuses }) => {

  const emptyInitialValues = { division: "", appointment_status: "", sg: ""}
  const firstOpenRef = useRef(true) // track first open

  const { data, setData } = useForm({
    division: initialValues?.division || "",
    appointment_status: initialValues?.appointment_status || "",
    sg: initialValues?.sg || "",
  })

  useEffect(() => {
    if (open && firstOpenRef.current) {
      setData(initialValues || emptyInitialValues)
      firstOpenRef.current = false
    }

    // Reset firstOpenRef when dialog closes
    if (!open) {
      firstOpenRef.current = true
    }
  }, [open, initialValues, setData])

  const handleSubmit = (e) => {
    e.preventDefault()
    onApply(data)
    onClose(false)
  }

  const handleClear = () => {
    setData(emptyInitialValues)
    onApply(emptyInitialValues)
    onClose(false)
  }

  const hasFilters = Object.keys(emptyInitialValues).some(
    (key) => data[key] && data[key] !== ""
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply Filters</DialogTitle>
          <DialogDescription className="text-justify">
            Fill-up all required fields to filter results.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Division</Label>
            <SingleComboBox
              items={divisions}
              onChange={(e) => setData("division", e)}
              placeholder="Select division"
              name="division"
              id="division"
              value={data.division}
            />
          </div>
          <div className="space-y-1">
            <Label>Appointment Status</Label>
            <SingleComboBox
              items={appointmentStatuses}
              onChange={(e) => setData("appointment_status", e)}
              placeholder="Select appointment status"
              name="appointment status"
              id="appointment_status"
              value={data.appointment_status}
            />
          </div>
          <div className="space-y-1">
            <Label>Salary Grade</Label>
            <IntegerInput
                id="sg"
                value={data.sg}
                onChange={(e) => setData("sg", e)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              
              {hasFilters ? (
                <Button type="button" variant="ghost" onClick={handleClear}>
                  Clear Filters
                </Button>
              ) : (
                <Button type="button" variant="ghost" onClick={() => onClose(false)}>
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
