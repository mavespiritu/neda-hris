import { useEffect } from "react"
import { useForm } from "@inertiajs/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import DatePicker from "@/components/DatePicker"
import TimePicker from "@/components/TimePicker"

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
    date_published: "",
    date_closed: "",
    time_closed: "",
  })

  useEffect(() => {
    if (isEdit && data) {
      setData({
        id: data.id || null,
        date_published: data.date_published || "",
        date_closed: data.date_closed || "",
        time_closed: data.time_closed || "",
      })
    } else {
      reset()
    }
  }, [mode, data])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (isEdit) {
      put(route("publications.update", data.id), {
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
      post(route("publications.store"), {
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
          <DialogTitle>{isEdit ? "Edit Publication" : "Add Publication"}</DialogTitle>
          <DialogDescription className="text-justify">Fill-up all required fields.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="date_published">Posting Date</Label>
            <DatePicker
                placeholder="Select a date"
                value={formData.date_published}
                onDateChange={(date) => setData('date_published', date)}
                invalidMessage={errors.date_published}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="date_closed">Closing Date</Label>
            <DatePicker
                placeholder="Select a date"
                value={formData.date_closed}
                onDateChange={(date) => setData('date_closed', date)}
                invalidMessage={errors.date_closed}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="time_closed">Closing Time</Label>
            <TimePicker
                value={formData.time_closed}
                onTimeChange={(time) => setData('time_closed', time)}
                invalidMessage={errors.time_closed}
            />
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