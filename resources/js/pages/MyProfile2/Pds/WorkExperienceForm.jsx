import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import DatePicker from "@/components/DatePicker"
import TextInput from "@/components/TextInput"
import SingleComboBox from "@/components/SingleComboBox"
import { Loader2 } from "lucide-react"
import { appointmentStatuses } from "../selections.jsx"

const WorkExperienceForm = ({
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
        <div className="flex items-center space-x-2">
            <Switch 
                checked={!!formData.isPresent}
                onCheckedChange={(isChecked) => setFormData((prev) => ({ ...prev, isPresent: isChecked }))}
            />
            <span className="text-sm font-medium">I presently work here</span>
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
            />
          </div>
        </div>

        <div>
            <Label htmlFor="position">Position Title (Write in full)</Label>
            <TextInput
                id="position"
                value={formData.position}
                onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
                isInvalid={!!formErrors.position}
            />
            {formErrors.position && (
              <p className="text-red-500 text-xs mt-1">{formErrors.position}</p>
            )}
        </div>

        <div>
            <Label htmlFor="agency">Department/Agency/Office/Company (Write in full)</Label>
            <TextInput
                id="agency"
                value={formData.agency}
                onChange={(e) => setFormData((prev) => ({ ...prev, agency: e.target.value }))}
                isInvalid={!!formErrors.agency}
            />
            {formErrors.agency && (
              <p className="text-red-500 text-xs mt-1">{formErrors.agency}</p>
            )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
                <Label htmlFor="appointment">Status of Appointment</Label>
                <SingleComboBox
                    items={appointmentStatuses}
                    placeholder="Select one"
                    name="appointment"
                    id="appointment"
                    value={formData.appointment}
                    width="w-full"
                    className="w-full"
                    onChange={(value) =>setFormData((prev) => ({ ...prev, appointment: value }))}
                    invalidMessage={!!formErrors.appointment}
                />
                {formErrors.appointment && (
                    <p className="text-red-500 text-xs mt-1">
                    {formErrors.appointment}
                    </p>
                )}
            </div>

            <div className="flex items-center space-x-2">
                <Switch 
                    checked={!!formData.isGovtService}
                    onCheckedChange={(isChecked) => setFormData((prev) => ({ ...prev, isGovtService: isChecked }))}
                />
                <span className="text-sm font-medium">Is this a government service?</span>
            </div>
        </div>
      </div>
    </div>
  )
}

export default WorkExperienceForm
