import { useEffect } from "react"
import { useForm } from "@inertiajs/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import TextInput from "@/components/TextInput"
import TextArea from "@/components/TextArea"
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
    category: "",
    description: "",
  })

  useEffect(() => {
    if (isEdit && data) {
      setData({
        id: data.id || null,
        category: data.category || "",
        description: data.description || "",
      })
    } else {
      reset()
    }
  }, [mode, data])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (isEdit) {
      put(route("performance.categories.update", data.id), {
        onSuccess: () => {
          onClose()
          reset()
          toast({ title: "Success!", description: "The item was updated successfully." })
        },
      })
      return
    }

    post(route("performance.categories.store"), {
      onSuccess: () => {
        onClose()
        reset()
        toast({ title: "Success!", description: "The item was saved successfully." })
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Category" : "Add Category"}</DialogTitle>
          <DialogDescription className="text-justify">
            Fill-up all required fields.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Category</Label>
            <TextInput
              id="category"
              name="category"
              value={formData.category}
              onChange={(e) => setData("category", e.target.value)}
              isInvalid={errors.category}
            />
            {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <TextArea
              id="description"
              name="description"
              value={formData.description}
              onChange={(e) => setData("description", e.target.value)}
              invalidMessage={errors.description}
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
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
