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

const Form = ({mode, data, onClose, open, vacancyId}) => {

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
    vacancy_id: vacancyId || null,
    requirement: "",
  })

  useEffect(() => {
    if (isEdit && data) {
      setData({
        id: data.id || null,
        vacancy_id: data.vacancy_id || null,
        requirement: data.requirement || "",
      })
    } else {
      reset()
    }
  }, [mode, data])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (isEdit) {
      put(route("vacancy-requirements.update", data.id), {
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
      post(route("vacancy-requirements.store"), {
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
          <DialogTitle>{isEdit ? "Edit Requirement" : "Add Requirement"}</DialogTitle>
          <DialogDescription className="text-justify">Fill-up all required fields.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Requirement</Label>
            <TextInput
              name="requirement"
              onChange={(e) => setData("requirement", e.target.value)}
              isInvalid={errors.requirement}
              id="requirement"
              value={formData.requirement}
            />
            {errors.requirement && (
              <p className="text-xs text-red-500">{errors.requirement}</p>
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