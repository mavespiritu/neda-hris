import { useEffect } from "react"
import { useForm } from "@inertiajs/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import MultipleComboBox from "@/components/MultipleComboBox"
import SingleComboBox from "@/components/SingleComboBox"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

const dtrOptions = [
  { value: "Onsite", label: "Onsite" },
  { value: "Flexiplace", label: "Flexiplace" },
  { value: "VL", label: "Vacation Leave (VL)" },
  { value: "SL", label: "Sick Leave (SL)" },
  { value: "FL", label: "Forced Leave (FL)" },
  { value: "OB", label: "Official Business (OB)" },
]

const MultipleUpdateForm = ({ onClose, open, employees = [], dates = [], onSaved }) => {
  const { toast } = useToast()

  const {
    data,
    setData,
    post,
    processing,
    reset,
    errors,
  } = useForm({
    employees: [],
    dates: [],
    dtr_type: "",
  })

  const formattedDates = dates.map(d => ({
    value: d,
    label: format(new Date(d), "MMMM dd, yyyy"),
    }))

  useEffect(() => {
    if (!open) reset()
  }, [open])

  const handleSubmit = (e) => {
    e.preventDefault()

    post(route("fwa.schedule.bulk-store"), {
      onSuccess: () => {
        toast({
          title: "Success!",
          description: "The flexiplace schedules were saved successfully.",
        })
        onSaved()
        reset()
        onClose()
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Something went wrong while saving schedules.",
        })
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Flexiplace Multiple Schedule Update Form</DialogTitle>
          <DialogDescription className="text-justify">
            Fill-up all required fields.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Employees</Label>
            <MultipleComboBox
              items={employees}
              onChange={(val) => setData("employees", val)}
              invalidMessage={errors.employees}
              placeholder="Select employees"
              name="employees"
              id="employees"
              value={data.employees}
            />
            {errors.employees && (
              <p className="text-xs text-red-500">{errors.employees}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Dates</Label>
            <MultipleComboBox
              items={formattedDates}
              value={data.dates}
              onChange={(val) => setData("dates", val)}
              placeholder="Select dates"
              invalidMessage={errors.dates}
            />
            {errors.dates && (
              <p className="text-xs text-red-500">{errors.dates}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>DTR Type</Label>
            <SingleComboBox
              items={dtrOptions}
              value={data.dtr_type}
              onChange={(val) => setData("dtr_type", val)}
              placeholder="Select one"
              invalidMessage={errors.dtr_type}
              width="w-full"
            />
            {errors.dtr_type && (
              <p className="text-xs text-red-500">{errors.dtr_type}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default MultipleUpdateForm
