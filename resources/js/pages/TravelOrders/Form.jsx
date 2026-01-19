import { useEffect, useMemo } from "react"
import { useForm } from "@inertiajs/react"
import Report from "./Report"
import { Label } from "@/components/ui/label"
import { Car, MapPin, Hotel, Flag, Trash2 } from "lucide-react"
import SingleComboBox from "@/components/SingleComboBox"
import TextArea from "@/components/TextArea"
import MultipleComboBox from "@/components/MultipleComboBox"
import TextInput from "@/components/TextInput"
import { Switch } from "@/components/ui/switch"
import DestinationForm from "./DestinationForm"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils.jsx"
import DatePicker from "@/components/DatePicker" // ✅ adjust path if needed

const Form = ({ mode, data, travelCategories, employees }) => {
  const isEdit = mode === "edit"

  const {
    data: formData,
    setData,
    post,
    put,
    processing,
    reset,
    errors,
  } = useForm({
    travel_category_id: "",
    start_date: "",
    end_date: "",
    purpose: "",
    staffs: [],
    destinations: [],
    other_passengers: "",
    isRequestingVehicle: false,
    date_created: "",
  })

  // ✅ Normalize employees ONCE and keep stable reference
  const employeesList = useMemo(() => {
    return Array.isArray(employees)
      ? employees
      : employees && typeof employees === "object"
        ? Object.values(employees)
        : []
  }, [employees])

  // ✅ Memoize combobox items so it doesn't "change" every render
  const employeeOptions = useMemo(() => {
    return employeesList.map((e) => ({
      value: String(e.emp_id).trim(),
      label: e.name,
    }))
  }, [employeesList])

  // ✅ Don't depend on whole `data` object; use stable key only
  useEffect(() => {
    if (isEdit && data?.id) {
      setData({
        travel_category_id: data.travel_category_id ?? "",
        start_date: data.start_date ?? "",
        end_date: data.end_date ?? "",
        purpose: data.purpose ?? "",
        staffs: Array.isArray(data.staffs)
          ? data.staffs
              .map((s) => s.emp_id ?? s.value ?? s.id ?? s)
              .filter((v) => v !== undefined && v !== null && v !== "")
          : [],
        destinations: Array.isArray(data.destinations) ? data.destinations : [],
        other_passengers: data.other_passengers ?? "",
        isRequestingVehicle: !!data.isRequestingVehicle,
        date_created: formatDate(data.date_created) ?? formatDate(new Date()),
      })
    } else {
      reset()
      setData("date_created", formatDate(new Date()))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, data?.id])

  const removeDestination = (indexToRemove) => {
    const next = (formData.destinations ?? []).filter((_, idx) => idx !== indexToRemove)
    setData("destinations", next)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isEdit) put(route("travel-orders.update", data.id))
    else post(route("travel-orders.store"))
  }

  // ✅ Optional: keep end_date >= start_date
  const handleStartDateChange = (val) => {
    setData("start_date", val || "")
    // if end_date exists but becomes earlier than start_date, clear it
    if (val && formData.end_date && formData.end_date < val) {
      setData("end_date", "")
    }
  }

  const handleEndDateChange = (val) => {
    setData("end_date", val || "")
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-2 items-start">
      <div className="min-w-0 flex flex-col gap-2">
        {/* Category */}
        <div className="space-y-1">
          <Label className="text-sm">Category</Label>
          <SingleComboBox
            items={travelCategories ?? []}
            onChange={(val) => setData("travel_category_id", val)}
            placeholder="Select category"
            name="travel category"
            id="travel_category_id"
            value={formData.travel_category_id}
          />
          {errors?.travel_category_id && (
            <span className="text-red-500 text-xs">{errors.travel_category_id}</span>
          )}
        </div>

        {/* Dates (two DatePickers) */}
        <div className="space-y-1">
          <Label className="text-sm">Date of Travel</Label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Start Date</Label>
              <DatePicker
                placeholder="Start date"
                value={formData.start_date}
                onDateChange={handleStartDateChange}
                invalidMessage={errors?.start_date}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">End Date</Label>
              <DatePicker
                placeholder="End date"
                value={formData.end_date}
                onDateChange={handleEndDateChange}
                invalidMessage={errors?.end_date}
                minDate={formData.start_date || undefined}
                disabled={!formData.start_date}
                />
            </div>
          </div>

          {/* If you still want the old error text style */}
          {errors?.start_date && <span className="text-red-500 text-xs">{errors.start_date}</span>}
          {errors?.end_date && <span className="text-red-500 text-xs">{errors.end_date}</span>}
        </div>

        {/* Purpose */}
        <div className="space-y-1">
          <Label className="text-sm">Purpose</Label>
          <TextArea
            name="purpose"
            placeholder="Describe the purpose of the travel..."
            rows={4}
            required
            value={formData.purpose}
            onChange={(e) => setData("purpose", e.target.value)}
          />
          {errors?.purpose && <span className="text-red-500 text-xs">{errors.purpose}</span>}
        </div>

        {/* Authorized Personnel */}
        <div className="space-y-1">
          <Label className="flex flex-col gap-1 mb-2">
            <span className="text-sm">Authorized Personnel</span>
            <span>(Include yourself if you are part of the travel)</span>
          </Label>

          <MultipleComboBox
            items={employeeOptions}
            onChange={(vals) => setData("staffs", vals)}
            placeholder="Select staff"
            name="staff"
            id="staffs"
            value={formData.staffs}
            width="w-fit"
            className="w-full"
          />
          {errors?.staffs && <span className="text-red-500 text-xs">{errors.staffs}</span>}
        </div>

        {/* Other passengers */}
        <div className="space-y-1">
          <Label className="text-sm">Other Passenger/s (optional)</Label>
          <TextInput
            name="other_passengers"
            type="text"
            placeholder="Other Passenger/s (optional)"
            value={formData.other_passengers}
            onChange={(e) => setData("other_passengers", e.target.value)}
          />
          {errors?.other_passengers && (
            <p className="text-red-500 text-sm">{errors.other_passengers}</p>
          )}
        </div>

        {/* Vehicle request */}
        <div className="space-y-1 mt-2">
          <div className="flex items-center space-x-4 rounded-md border p-4">
            <Car />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">I need a vehicle</p>
              <p className="text-xs text-muted-foreground">
                PRU will check the availability of vehicles on the requested dates.
              </p>
            </div>
            <Switch
              checked={formData.isRequestingVehicle}
              onCheckedChange={(isChecked) => setData("isRequestingVehicle", isChecked)}
            />
          </div>
        </div>

        {/* Destinations */}
        <div className="space-y-1 mt-2">
          <div
            className={cn(
              "flex flex-col rounded-md border p-4 space-y-4",
              errors?.destinations ? "border-red-500" : ""
            )}
          >
            <div className="flex items-center space-x-4">
              <MapPin />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">Destinations</p>
                <p className="text-xs text-muted-foreground">Where are you going?</p>
              </div>

              <DestinationForm
                destinations={formData.destinations}
                setDestinations={(newArr) => setData("destinations", newArr)}
              />
            </div>

            {Array.isArray(formData.destinations) && formData.destinations.length > 0 && (
              <div className="flex flex-col text-sm flex-1 space-y-2">
                {formData.destinations.map((dest, index) => (
                  <div key={index} className="flex justify-between rounded-md border px-4 py-2">
                    <div className="flex items-center space-x-4 w-full">
                      {dest.type === "Local" ? (
                        <Hotel className="hidden md:block" />
                      ) : (
                        <Flag className="hidden md:block" />
                      )}

                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{dest.location}</p>
                        <p className="text-xs text-muted-foreground">
                          {dest.type === "International" || dest.country !== "Philippines"
                            ? dest.country
                            : `${dest.cityMunName || dest.citymun}, ${dest.provinceName || dest.province}`}
                        </p>
                      </div>

                      <Button
                        type="button"
                        className="pr-0"
                        variant="link"
                        onClick={() => removeDestination(index)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {errors?.destinations && (
            <span className="text-red-500 text-xs">{errors.destinations}</span>
          )}
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={processing}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            {processing ? "Saving..." : isEdit ? "Update" : "Save"}
          </button>
        </div>
      </div>

      <div className="min-w-0">
        <Report data={formData} employees={employees} />
      </div>
    </form>
  )
}

export default Form
