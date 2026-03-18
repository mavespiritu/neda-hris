import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import DatePicker from "@/components/DatePicker"
import TextInput from "@/components/TextInput"
import SingleComboBox from "@/components/SingleComboBox"
import AmountInput from "@/components/AmountInput"
import { Loader2 } from "lucide-react"
import { types, participations } from "../selections.jsx"

const LearningAndDevelopmentForm = ({
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
            <Label htmlFor="org_name">Title of Learning and Development Interventions / Training Programs (Write in full)</Label>
            <TextInput
                id="seminar_title"
                value={formData.seminar_title}
                onChange={(e) => setFormData((prev) => ({ ...prev, seminar_title: e.target.value }))}
                isInvalid={!!formErrors.seminar_title}
            />
            {formErrors.seminar_title && (
              <p className="text-red-500 text-xs mt-1">{formErrors.seminar_title}</p>
            )}
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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
                <Label htmlFor="hours">Number of Hours</Label>
                <AmountInput
                    id="hours"
                    value={formData.hours}
                    onChange={(value) =>setFormData((prev) => ({ ...prev, hours: value }))}
                    placeholder=""
                    isInvalid={!!formErrors.hours}
                />
                {formErrors.hours && (
                    <p className="text-red-500 text-xs mt-1">
                    {formErrors.hours}
                    </p>
                )}
            </div>

            <div>
                <Label htmlFor="type">Type of L&D</Label>
                <SingleComboBox
                  items={types}
                  placeholder="Select one"
                  name="type"
                  id="type"
                  value={formData.type}
                  width="w-full"
                  className="w-full"
                  onChange={(value) =>setFormData((prev) => ({ ...prev, type: value }))}
                  invalidMessage={!!formErrors.type}
                />
                {formErrors.type && (
                <p className="text-red-500 text-xs mt-1">{formErrors.type}</p>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
                <Label htmlFor="participation">Participation</Label>
                <SingleComboBox
                  items={participations}
                  placeholder="Select one"
                  name="participation"
                  id="participation"
                  value={formData.participation}
                  width="w-full"
                  className="w-full"
                  onChange={(value) =>setFormData((prev) => ({ ...prev, participation: value }))}
                  invalidMessage={!!formErrors.participation}
                />
                {formErrors.type && (
                <p className="text-red-500 text-xs mt-1">{formErrors.participation}</p>
                )}
            </div>

            <div>
                <Label htmlFor="org_name">Conducted/Sponsored by</Label>
                <TextInput
                    id="conducted_by"
                    value={formData.conducted_by}
                    onChange={(e) => setFormData((prev) => ({ ...prev, conducted_by: e.target.value }))}
                    isInvalid={!!formErrors.conducted_by}
                />
                {formErrors.conducted_by && (
                <p className="text-red-500 text-xs mt-1">{formErrors.conducted_by}</p>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}

export default LearningAndDevelopmentForm
