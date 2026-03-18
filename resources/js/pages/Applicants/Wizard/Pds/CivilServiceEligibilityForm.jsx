import { Label } from "@/components/ui/label"
import DatePicker from "@/components/DatePicker"
import TextInput from "@/components/TextInput"
import { Loader2 } from "lucide-react"

const CivilServiceEligibilityForm = ({
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
          <Label htmlFor="eligibility">Eligibility</Label>
          <TextInput
            id="eligibility"
            value={formData.eligibility || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, eligibility: e.target.value }))}
            isInvalid={!!formErrors.eligibility}
          />
          {formErrors.eligibility && (
            <p className="text-red-500 text-xs mt-1">{formErrors.eligibility}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rating">Rating</Label>
            <TextInput
              id="rating"
              value={formData.rating || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, rating: e.target.value }))}
              isInvalid={!!formErrors.rating}
            />
            {formErrors.rating && (
              <p className="text-red-500 text-xs mt-1">{formErrors.rating}</p>
            )}
          </div>

          <div>
            <Label htmlFor="license_no">License No.</Label>
            <TextInput
              id="license_no"
              value={formData.license_no || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, license_no: e.target.value }))}
              isInvalid={!!formErrors.license_no}
            />
            {formErrors.license_no && (
              <p className="text-red-500 text-xs mt-1">{formErrors.license_no}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="exam_date">Date of Examination / Conferment</Label>
            <DatePicker
              value={formData.exam_date || ""}
              onDateChange={(date) => setFormData((prev) => ({ ...prev, exam_date: date }))}
              invalidMessage={formErrors.exam_date}
            />
          </div>

          <div>
            <Label htmlFor="validity_date">Date of Validity</Label>
            <DatePicker
              value={formData.validity_date || ""}
              onDateChange={(date) => setFormData((prev) => ({ ...prev, validity_date: date }))}
              invalidMessage={formErrors.validity_date}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="exam_place">Place of Examination / Conferment</Label>
          <TextInput
            id="exam_place"
            value={formData.exam_place || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, exam_place: e.target.value }))}
            isInvalid={!!formErrors.exam_place}
          />
          {formErrors.exam_place && (
            <p className="text-red-500 text-xs mt-1">{formErrors.exam_place}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default CivilServiceEligibilityForm
