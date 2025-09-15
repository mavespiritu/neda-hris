import { useEffect } from "react"
import { useForm } from "@inertiajs/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import TextInput from "@/components/TextInput"
import TextArea from "@/components/TextArea"
import { Label } from "@/components/ui/label"
import SingleComboBox from "@/components/SingleComboBox"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DateRangePicker } from "@/components/DateRangePicker"
import { YearPicker } from "@/components/YearPicker"

const Form = ({mode, data, onClose, open}) => {

  const isEdit = mode === "edit"

  const { toast } = useToast()

  const { 
    data: formData, 
    setData, 
    post, 
    put, 
    processing, 
    reset, 
    errors 
  } = useForm({
    id: null,
    year: "",
    from_date: "",
    end_date: "",
  })

  useEffect(() => {
    if (isEdit && data) {
      setData({
        id: data.id || null,
        year: data.year || "",
        from_date: data.from_date || "",
        end_date: data.end_date || "",
      })
    } else {
      reset()
    }
  }, [mode, data])

  const handleDateRangeChange = (from_date, end_date) => {
      setData({
        ...formData,
        from_date,
        end_date,
      })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (isEdit) {
      put(route("settings.cga.submission-schedules.update", data.id), {
        onSuccess: () => {
          onClose()
          reset()
          toast({
            title: "Success!",
            description: "The item was updated successfully.",
          })
        },
      })
    } else {
      post(route("settings.cga.submission-schedules.store"), {
        onSuccess: () => {
          onClose()
          reset()
          toast({
            title: "Success!",
            description: "The item was saved successfully.",
          })
        },
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Schedule" : "Add Schedule"}</DialogTitle>
          <DialogDescription className="text-justify">Fill-up all required fields.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Year</Label>
            <YearPicker
              value={formData.year}
              onChange={(value) => setData('year', value)}
              startYear={2000}
              endYear={new Date().getFullYear() + 5}
              placeholder="Select year"
              isInvalid={!!errors.year}
            />
            {errors.year && (
              <p className="text-xs text-red-500">{errors.year}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Schedule</Label>
            <DateRangePicker 
            startDate={formData.from_date} 
            endDate={formData.end_date} 
            invalidStartDateMessage={errors.from_date}
            invalidEndDateMessage={errors.end_date}
            onDateChange={handleDateRangeChange}
            />
            {(errors?.from_date) && <div className="text-red-500 text-xs">{errors.from_date}</div>}
            {(errors?.end_date) && <div className="text-red-500 text-xs">{errors.end_date}</div>}
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
      </DialogContent>
    </Dialog>
  )
}

export default Form