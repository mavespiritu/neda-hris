import { useEffect } from "react"
import { useForm } from "@inertiajs/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import TextInput from "@/components/TextInput"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import AmountInput from "@/components/AmountInput"
import SingleComboBox from "@/components/SingleComboBox"

const Form = ({mode, data, onClose, open}) => {

  const isEdit = mode === "edit"

  const fuelTypes = [
    {value: 'Diesel', label: 'Diesel'},
    {value: 'Gas', label: 'Gas'},
  ]

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
    vehicle: "",
    plate_no: "",
    avg_consumption: "",
  })

  useEffect(() => {
    if (isEdit && data) {
      setData({
        id: data.id || null,
        vehicle: data.vehicle || "",
        plate_no: data.plate_no || "",
        avg_consumption: data.avg_consumption || "",
        fuel_type: data.fuel_type || "",
      })
    } else {
      reset()
    }
  }, [mode, data])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (isEdit) {
      put(route("settings.travel-orders.vehicles.update", data.id), {
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
      post(route("settings.travel-orders.vehicles.store"), {
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
          <DialogTitle>{isEdit ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
          <DialogDescription className="text-justify">Fill-up all required fields.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="space-y-1">
            <Label>Name of Vehicle</Label>
            <TextInput
              value={formData.vehicle}
              onChange={(e) => setData('vehicle', e.target.value)}
              placeholder="Enter vehicle name"
              isInvalid={!!errors.vehicle}
            />
            {errors.vehicle && (
              <p className="text-xs text-red-500">{errors.vehicle}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Plate No.</Label>
            <TextInput
              value={formData.plate_no}
              onChange={(e) => setData('plate_no', e.target.value)}
              placeholder="Enter plate number"
              isInvalid={!!errors.plate_no}
            />
            {errors.plate_no && (
              <p className="text-xs text-red-500">{errors.plate_no}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Avg Fuel Consumption (km/l)</Label>
            <AmountInput
                id="avg_consumption"
                value={formData.avg_consumption}
                onChange={(value) => setData('avg_consumption', value)}
                placeholder=""
                isInvalid={!!errors.avg_consumption}
            />
            {errors.avg_consumption && (
              <p className="text-xs text-red-500">{errors.avg_consumption}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Fuel Type</Label>
            <SingleComboBox
              items={fuelTypes}
              value={formData.fuel_type}
              onChange={(value) => setData('fuel_type', value)}
              placeholder="Select fuel type"
              name="division"
              invalidMessage={!!errors.fuel_type}
            />
            {errors.fuel_type && (
              <p className="text-xs text-red-500">{errors.fuel_type}</p>
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