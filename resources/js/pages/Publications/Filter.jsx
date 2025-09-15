import { useEffect, useRef } from "react"
import { useForm } from "@inertiajs/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const Filter = ({ onClose, open, onApply, initialValues }) => {
  const emptyInitialValues = { status: "" }
  const firstOpenRef = useRef(true) // track first open

  const { data, setData } = useForm({
    status: initialValues?.status || "",
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
            Select a status to filter results.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <RadioGroup
              value={data.status}
              onValueChange={(val) => setData("status", val)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Draft" id="draft" />
                <Label className="text-sm" htmlFor="draft">Draft</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Published" id="published" />
                <Label className="text-sm" htmlFor="published">Published</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Closed" id="closed" />
                <Label className="text-sm" htmlFor="closed">Closed</Label>
              </div>
            </RadioGroup>
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
