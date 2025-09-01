import { useEffect, useRef } from "react"
import { useForm } from "@inertiajs/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import SingleComboBox from "@/components/SingleComboBox"
import DatePicker from "@/components/DatePicker"

const Filter = ({ onClose, open, onApply, initialValues, employees }) => {

  const emptyInitialValues = { emp_id: "", date: "" }
  const firstOpenRef = useRef(true) // track first open

  const { data, setData } = useForm({
    emp_id: initialValues?.emp_id || "",
    date: initialValues?.date || "",
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
            <Label>Staff</Label>
            <SingleComboBox
              items={employees}
              onChange={(e) => setData("emp_id", e)}
              placeholder="Select staff"
              name="emp_id"
              id="emp_id"
              value={data.emp_id}
            />
          </div>
          <div className="space-y-1">
            <Label>Date</Label>
            <DatePicker
              placeholder="Select a date"
              value={data.date}
              onDateChange={(date) => setData("date", date)}
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
