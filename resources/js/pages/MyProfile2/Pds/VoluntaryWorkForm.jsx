import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import DatePicker from "@/components/DatePicker"
import TextInput from "@/components/TextInput"
import SingleComboBox from "@/components/SingleComboBox"
import AmountInput from "@/components/AmountInput"
import { Loader2 } from "lucide-react"

const VoluntaryWorkForm = ({
  formData,
  setFormData,
  formErrors = {},
  formLoading = false,
}) => {
  return (
    <div className="relative">
      {formLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-md bg-white/50 backdrop-blur-[2px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className={`${formLoading ? "pointer-events-none blur-[1.5px] opacity-70" : ""} grid gap-4 transition`}>
        <div>
            <Label htmlFor="org_name">Name of Organization (Write in full)</Label>
            <TextInput
                id="org_name"
                value={formData.org_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, org_name: e.target.value }))}
                isInvalid={!!formErrors.org_name}
            />
            {formErrors.org_name && (
              <p className="text-red-500 text-xs mt-1">{formErrors.org_name}</p>
            )}
        </div>

        <div>
            <Label htmlFor="org_address">Address</Label>
            <TextInput
                id="org_address"
                value={formData.org_address}
                onChange={(e) => setFormData((prev) => ({ ...prev, org_address: e.target.value }))}
                isInvalid={!!formErrors.org_address}
            />
            {formErrors.org_address && (
              <p className="text-red-500 text-xs mt-1">{formErrors.org_address}</p>
            )}
        </div>
        <div className="flex items-center space-x-2">
            <Switch 
                checked={!!formData.isPresent}
                onCheckedChange={(isChecked) =>
                    setFormData((prev) => ({
                    ...prev,
                    isPresent: isChecked,
                    hours: isChecked ? "" : prev.hours,
                    to_date: isChecked ? null : prev.to_date,
                    }))
                }
            />
            <span className="text-sm font-medium">I presently volunteer here</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="from_date">Start Date</Label>
            <DatePicker
                placeholder="From"
                onDateChange={(date) =>setFormData((prev) => ({ ...prev, from_date: date }))}
                value={formData.from_date}
                invalidMessage={formErrors.from_date}
            />
          </div>

          <div>
            <Label htmlFor="to_date">End Date</Label>
            <DatePicker
                placeholder="To"
                onDateChange={(date) => setFormData((prev) => ({ ...prev, to_date: date }))}
                value={formData.to_date}
                invalidMessage={formErrors.to_date}
                disabled={!!formData.isPresent}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
                <Label htmlFor="hours">Number of Hours</Label>
                <AmountInput
                    id="hours"
                    value={formData.hours}
                    onChange={(value) =>setFormData((prev) => ({ ...prev, hours: value }))}
                    placeholder=""
                    isInvalid={!!formErrors.hours}
                    disabled={!!formData.isPresent}
                />
                {formErrors.hours && (
                    <p className="text-red-500 text-xs mt-1">
                    {formErrors.hours}
                    </p>
                )}
            </div>

            <div>
                <Label htmlFor="nature_of_work">Position / Nature of Work</Label>
                <TextInput
                    id="nature_of_work"
                    value={formData.nature_of_work}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nature_of_work: e.target.value }))}
                    isInvalid={!!formErrors.nature_of_work}
                />
                {formErrors.nature_of_work && (
                <p className="text-red-500 text-xs mt-1">{formErrors.nature_of_work}</p>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}

export default VoluntaryWorkForm
