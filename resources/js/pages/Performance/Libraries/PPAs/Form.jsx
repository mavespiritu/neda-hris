import { useEffect } from "react"
import { useForm } from "@inertiajs/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import TextInput from "@/components/TextInput"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const Form = ({ mode, data, onClose, open }) => {
  const isEdit = mode === "edit"
  const { toast } = useToast()

  const {
    data: formData,
    setData,
    post,
    put,
    processing,
    reset,
    errors,
  } = useForm({
    short_code: "",
    title: "",
  })

  useEffect(() => {
    if (isEdit && data) {
      setData({
        id: data.id || null,
        short_code: data.short_code || "",
        title: data.title || data.activity || "",
      })
    } else {
      reset()
    }
  }, [mode, data])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (isEdit) {
      put(route("performance.ppas.update", data.id), {
        onSuccess: () => {
          onClose()
          reset()
          toast({ title: "Success!", description: "The item was updated successfully." })
        },
      })
      return
    }

    post(route("performance.ppas.store"), {
      onSuccess: () => {
        onClose()
        reset()
        toast({ title: "Success!", description: "The item was saved successfully." })
      },
    })
  }

  const labelPreview = formData.short_code?.trim()
    ? `${formData.short_code.trim()} - ${formData.title.trim()}`.trim()
    : formData.title.trim()

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit MFO/PAP" : "Add MFO/PAP"}</DialogTitle>
          <DialogDescription className="text-justify">
            Fill-up all required fields.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="short_code">Short Code</Label>
            <TextInput
              id="short_code"
              name="short_code"
              value={formData.short_code}
              onChange={(e) => setData("short_code", e.target.value)}
              isInvalid={errors.short_code}
              placeholder="Optional short code"
            />
            {errors.short_code && <p className="text-xs text-red-500">{errors.short_code}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <TextInput
              id="title"
              name="title"
              value={formData.title}
              onChange={(e) => setData("title", e.target.value)}
              isInvalid={errors.title}
              placeholder="Enter the MFO/PAP title"
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Label Preview:</span> {labelPreview || "-"}
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
