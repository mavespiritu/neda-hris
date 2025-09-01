import { useEffect } from "react"
import { useForm } from "@inertiajs/react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import TextInput from "@/components/TextInput"
import TextArea from "@/components/TextArea"
import { Label } from "@/components/ui/label"
import SingleComboBox from "@/components/SingleComboBox"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { useHasRole } from "@/hooks/useAuth"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const Form = ({ mode, data, onClose, open, employees, dates }) => {
  const isEdit = mode === "edit"
  const canSelectStaff = useHasRole(["HRIS_HR", "HRIS_DC", "HRIS_ADC"])
  const { toast } = useToast()

  const formattedDates = dates.map((d) => ({
    value: d,
    label: format(new Date(d), "MMMM dd, yyyy"),
  }))

  const types = [
    {'value': 'WFH', 'label': 'WFH'},
    {'value': 'Satellite Office', 'label': 'Satellite Office'},
    {'value': 'Other', 'label': 'Another Fixed Place'},
  ]

  const {
    data: formData,
    setData,
    post,
    put,
    processing,
    reset,
    errors,
  } = useForm({
    emp_id: "",
    date: "",
    type: "",
    other_type: "",
    outputs: [{ id: null, output: "" }],
    removedOutputs: [],
  })

  // initialize when editing
  useEffect(() => {
    if (isEdit && data) {
      setData({
        id: data.id || null,
        emp_id: data.emp_id || "",
        date: data.date || "",
        type: data.type || "",
        other_type: data.other_type || "",
        outputs: data.outputs?.length
          ? data.outputs.map((o) => ({
              id: o.id || null,
              output: o.output || "",
            }))
          : [{ id: null, value: "" }],
        removedOutputs: [],
      })
    } else {
      reset()
    }
  }, [mode, data])

  // add new output
  const addOutput = () => {
    setData("outputs", [...formData.outputs, { id: null, output: "" }])
  }

  // remove output
  const removeOutput = (index) => {
    setData((prev) => {
      const updatedOutputs = [...prev.outputs]
      const removed = updatedOutputs.splice(index, 1)[0]

      return {
        ...prev,
        outputs: updatedOutputs.length ? updatedOutputs : [{ id: null, output: "" }],
        removedOutputs: removed.id
          ? [...prev.removedOutputs, removed.id]
          : prev.removedOutputs,
      }
    })
  }

  // update output value
  const updateOutput = (index, output) => {
    const updated = [...formData.outputs]
    updated[index].output = output
    setData("outputs", updated)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (isEdit) {
      put(route("rto.update", data.id), {
        onSuccess: () => {
          onClose()
          reset()
          toast({
            title: "Success!",
            description: "The outputs were updated successfully.",
          })
        },
      })
    } else {
      post(route("rto.store"), {
        onSuccess: () => {
          onClose()
          reset()
          toast({
            title: "Success!",
            description: "The outputs were saved successfully.",
          })
        },
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Target Outputs" : "Add Target Outputs"}
          </DialogTitle>
          <DialogDescription className="text-justify">
            Select one employee and date, then add multiple outputs.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {canSelectStaff && (
            <div className="space-y-1">
              <Label>Employee</Label>
              <SingleComboBox
                items={employees}
                value={formData.emp_id}
                onChange={(val) => setData("emp_id", val)}
                placeholder="Select employee"
                invalidMessage={errors.emp_id}
              />
              {errors.emp_id && (
                <p className="text-xs text-red-500">{errors.emp_id}</p>
              )}
            </div>
          )}

          <div className="space-y-1">
            <Label>Date of Flexiplace</Label>
            <SingleComboBox
              items={formattedDates}
              value={formData.date}
              onChange={(val) => setData("date", val)}
              placeholder="Select date"
              invalidMessage={errors.date}
            />
            {errors.date && (
              <p className="text-xs text-red-500">{errors.date}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Flexiplace Type</Label>
            <RadioGroup
              value={formData.type}
              onValueChange={(val) => setData("type", val)}
              className="flex flex-col space-y-1"
            >
              {types.map((t) => (
                <div key={t.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={t.value} id={`type-${t.value}`} />
                  <Label htmlFor={`type-${t.value}`}>{t.label}</Label>
                </div>
              ))}
            </RadioGroup>

            {formData.type === "Other" && (
              <div className="space-y-1">
                <Label>Specify Place</Label>
                <TextInput
                  name="other_type"
                  onChange={(e) => setData("other_type", e.target.value)}
                  isInvalid={errors.other_type}
                  id="other_type"
                  value={formData.other_type}
                />
                {errors.other_type && (
                  <p className="text-xs text-red-500">{errors.other_type}</p>
                )}
              </div>
            )}

            {errors.type && <p className="text-xs text-red-500">{errors.type}</p>}
          </div>

          <div className="space-y-1">
            <Label>Target Outputs</Label>
            <div className="space-y-2">
              {formData.outputs.map((out, index) => (
                <div key={out.id ?? `new-${index}`} className="relative">
                  <TextArea
                    value={out.output}
                    onChange={(e) => updateOutput(index, e.target.value)}
                    invalidMessage={errors[`outputs.${index}.output`]}
                  />
                  {errors[`outputs.${index}.output`] && (
                    <p className="text-xs text-red-500 my-1">
                      {errors[`outputs.${index}.output`]}
                    </p>
                  )}
                  {formData.outputs.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => removeOutput(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addOutput}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add Target Output
            </Button>
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
