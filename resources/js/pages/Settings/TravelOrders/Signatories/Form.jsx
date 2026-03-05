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
import { roles, divisions } from "./selections"

const Form = ({mode, data, onClose, open, employees}) => {

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
    signatory: "",
    type: "",
    division: "",
    designation: "",
  })

  useEffect(() => {
    if (isEdit && data) {
      setData({
        id: data.id || null,
        signatory: data.signatory || "",
        type: data.type || "",
        division: data.division || "",
        designation: data.designation || "",
      })
    } else {
      reset()
    }
  }, [mode, data])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (isEdit) {
      put(route("settings.travel-orders.signatories.update", data.id), {
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
      post(route("settings.travel-orders.signatories.store"), {
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
          <DialogTitle>{isEdit ? "Edit Signatory" : "Add Signatory"}</DialogTitle>
          <DialogDescription className="text-justify">Fill-up all required fields.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="space-y-1">
            <Label>Signatory</Label>
            <SingleComboBox
              items={employees}
              value={formData.signatory}
              onChange={(value) => setData('signatory', value)}
              placeholder="Select signatory"
              name="signatory"
              invalidMessage={!!errors.signatory}
            />
            {errors.signatory && (
              <p className="text-xs text-red-500">{errors.signatory}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Division</Label>
            <SingleComboBox
              items={divisions}
              value={formData.division}
              onChange={(value) => setData('division', value)}
              placeholder="Select division"
              name="division"
              invalidMessage={!!errors.division}
            />
            {errors.division && (
              <p className="text-xs text-red-500">{errors.division}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Roles</Label>
            <SingleComboBox
              items={roles}
              value={formData.type}
              onChange={(value) => setData('type', value)}
              placeholder="Select role"
              name="role"
              invalidMessage={!!errors.type}
            />
            {errors.type && (
              <p className="text-xs text-red-500">{errors.type}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Designation</Label>
            <TextInput
              value={formData.designation}
              onChange={(e) => setData('designation', e.target.value)}
              placeholder="Enter designation"
              isInvalid={!!errors.designation}
            />
            {errors.designation && (
              <p className="text-xs text-red-500">{errors.designation}</p>
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