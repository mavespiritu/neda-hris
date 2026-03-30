import { useEffect, useRef } from "react"
import { useForm } from "@inertiajs/react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import SingleComboBox from "@/components/SingleComboBox"

const Filter = ({ open, onClose, onApply, initialValues, options }) => {
  const empty = { employee_id: "", travel_type: "", travel_category_id: "" }
  const firstOpenRef = useRef(true)

  const { data, setData } = useForm({
    employee_id: initialValues?.employee_id || "",
    travel_type: initialValues?.travel_type || "",
    travel_category_id: initialValues?.travel_category_id || "",
  })

  useEffect(() => {
    if (open && firstOpenRef.current) {
      setData({ ...empty, ...(initialValues || {}) })
      firstOpenRef.current = false
    }
    if (!open) firstOpenRef.current = true
  }, [open, initialValues, setData])

  const handleSubmit = (e) => {
    e.preventDefault()
    onApply?.(data)
    onClose?.(false)
  }

  const handleClear = () => {
    setData(empty)
    onApply?.(empty)
    onClose?.(false)
  }

  const hasFilters = Object.values(data).some((v) => !!v)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filter Travel Requests</DialogTitle>
          <DialogDescription>Select one or more filters.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Employee</Label>
            <SingleComboBox
              items={options?.employees || []}
              value={data.employee_id}
              onChange={(v) => setData("employee_id", v)}
              placeholder="Select employee"
            />
          </div>

          <div className="space-y-1">
            <Label>Travel Type</Label>
            <SingleComboBox
              items={options?.travel_types || []}
              value={data.travel_type}
              onChange={(v) => setData("travel_type", v)}
              placeholder="Select travel type"
            />
          </div>

          <div className="space-y-1">
            <Label>Category</Label>
            <SingleComboBox
              items={options?.travel_categories || []}
              value={data.travel_category_id}
              onChange={(v) => setData("travel_category_id", v)}
              placeholder="Select category"
            />
          </div>

          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              {hasFilters ? (
                <Button type="button" variant="ghost" onClick={handleClear}>Clear Filters</Button>
              ) : (
                <Button type="button" variant="ghost" onClick={() => onClose?.(false)}>Close</Button>
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
