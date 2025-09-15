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

const types = [
  {value: "org", label: "Organization"},
  {value: "mnt", label: "Managerial"}, 
  {value: "func", label: "Functional/Technical"},
]
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
    competency: "",
    comp_type: "",
    description: "",
  })

  useEffect(() => {
    if (isEdit && data) {
      setData({
        id: data.id || null,
        competency: data.competency || "",
        comp_type: data.comp_type || "",
        description: data.description || "",
      })
    } else {
      reset()
    }
  }, [mode, data])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (isEdit) {
      put(route("competencies.update", data.id), {
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
      post(route("competencies.store"), {
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
          <DialogTitle>{isEdit ? "Edit Competency" : "Add Competency"}</DialogTitle>
          <DialogDescription className="text-justify">Fill-up all required fields.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Competency</Label>
            <TextInput
              name="competency"
              onChange={(e) => setData("competency", e.target.value)}
              isInvalid={errors.competency}
              id="competency"
              value={formData.competency}
            />
            {errors.competency && (
              <p className="text-xs text-red-500">{errors.competency}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Type</Label>
            <SingleComboBox
              items={types}
              onChange={(e) => setData("comp_type", e)}
              invalidMessage={errors.comp_type}
              placeholder="Select type"
              name="comp_type"
              id="comp_type"
              value={formData.comp_type}
            />
            {errors.comp_type && (
              <p className="text-xs text-red-500">{errors.comp_type}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <TextArea
              value={formData.description}
              invalidMessage={errors.description}
              onChange={(e) => setData("description", e.target.value)}
              name="description"
              id="description"
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description}</p>
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