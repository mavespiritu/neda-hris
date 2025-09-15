import { useEffect, useState } from "react"
import { useForm } from "@inertiajs/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import TextInput from "@/components/TextInput"
import TextArea from "@/components/TextArea"
import { Label } from "@/components/ui/label"
import SingleComboBox from "@/components/SingleComboBox"
import RichTextEditor from "@/components/RichTextEditor"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const proficiencies = [
  { value: 4, label: "4" },
  { value: 3, label: "3" }, 
  { value: 2, label: "2" },
  { value: 1, label: "1" },
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
    competency_id: "",
    proficiency: "",
    indicator: "",
  })

  const [competencies, setCompetencies] = useState([])
  const [competenciesLoading, setCompetenciesLoading] = useState(false)

  const fetchCompetencies = async () => {
    try {
      setCompetenciesLoading(true)
      const res = await axios.get(route("competencies.list")) 
      const items = res.data.data.map((c) => ({
        value: c.id,
        label: c.competency,
      }))
      setCompetencies(items)
    } catch (error) {
      console.error(error)
    } finally {
      setCompetenciesLoading(false)
    }
  }

  useEffect(() => {
    if (open) fetchCompetencies()
  }, [open])

  useEffect(() => {
    if (isEdit && data) {
      setData({
        id: data.id || null,
        competency_id: data.competency_id || "",
        proficiency: data.proficiency || "",
        indicator: data.indicator || "",
      })
    } else {
      reset()
    }
  }, [mode, data])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (isEdit) {
      put(route("indicators.update", data.id), {
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
      post(route("indicators.store"), {
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
          <DialogTitle>{isEdit ? "Edit Indicator" : "Add Indicator"}</DialogTitle>
          <DialogDescription className="text-justify">Fill-up all required fields.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Competency</Label>
            <SingleComboBox
              items={competencies}
              onChange={(e) => setData("competency_id", e)}
              invalidMessage={errors.competency_id}
              placeholder="Select competency"
              name="competency"
              id="competency"
              value={formData.competency_id}
            />
            {errors.competency_id && (
              <p className="text-xs text-red-500">{errors.competency_id}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Proficiency</Label>
            <SingleComboBox
              items={proficiencies}
              onChange={(e) => setData("proficiency", e)}
              invalidMessage={errors.proficiency}
              placeholder="Select proficiency"
              name="proficiency"
              id="proficiency"
              value={formData.proficiency}
            />
            {errors.proficiency && (
              <p className="text-xs text-red-500">{errors.proficiency}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Indicator</Label>
            <RichTextEditor
              name="indicator"
              onChange={(e) => setData("indicator", e)}
              isInvalid={errors.indicator}
              value={formData.indicator}
            />
            {errors.indicator && (
              <p className="text-xs text-red-500">{errors.indicator}</p>
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