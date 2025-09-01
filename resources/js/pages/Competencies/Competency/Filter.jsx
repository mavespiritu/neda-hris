import { useEffect, useRef } from "react"
import { useForm } from "@inertiajs/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import SingleComboBox from "@/components/SingleComboBox"

const types = [
  { value: "org", label: "Organization" },
  { value: "mnt", label: "Managerial" }, 
  { value: "func", label: "Functional/Technical" },
]

const Filter = ({ onClose, open, onApply, initialValues }) => {

  const emptyInitialValues = { comp_type: "" }
  const firstOpenRef = useRef(true) // track first open

  const { data, setData } = useForm({
    comp_type: initialValues?.comp_type || "",
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
            <Label>Type</Label>
            <SingleComboBox
              items={types}
              onChange={(e) => setData("comp_type", e)}
              placeholder="Select type"
              name="comp_type"
              id="comp_type"
              value={data.comp_type}
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
