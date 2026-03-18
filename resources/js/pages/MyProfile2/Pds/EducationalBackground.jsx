import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Fieldset } from "@/components/Fieldset"
import { GraduationCap, Plus, Trash2, Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import TextInput from "@/components/TextInput"
import { Switch } from "@/components/ui/switch"
import { YearPicker } from "@/components/YearPicker"
import { useEffect } from "react"
import store from "../store"

const levels = [
  { id: "elementary", label: "Elementary" },
  { id: "secondary", label: "Secondary" },
  { id: "vocational", label: "Vocational/Trade Course" },
  { id: "college", label: "College" },
  { id: "graduate", label: "Graduate Studies" },
]

const createEntry = () => ({
  id: null,
  course: "",
  school: "",
  highest_attainment: "",
  from_year: "",
  to_year: "",
  award: "",
  year_graduated: "",
  is_graduated: false,
})

const defaultEducationalBackground = {
  elementary: [],
  secondary: [],
  vocational: [],
  college: [],
  graduate: [],
}

const EducationSection = ({
  dataKey,
  level,
  data = [],
  errors = {},
  onAdd,
  onUpdate,
  onRemove,
}) => {
  return (
    <Fieldset legend={level} className="bg-muted">
      <p className="text-sm">List your entries from the most recent up to the oldest.</p>

      {data.map((entry, index) => (
        <Card key={`${dataKey}-${entry.id ?? index}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">
              {level} Entry # {index + 1}
            </CardTitle>

            <Button
              type="button"
              variant="destructive"
              onClick={() => onRemove(dataKey, index)}
              className="flex"
              size="sm"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden md:block">Remove</span>
            </Button>
          </CardHeader>

          <CardContent className="flex flex-col gap-4 pt-4 border-t">
            <div className="flex gap-4 items-center text-sm font-medium">
              <Switch
                checked={!!entry.is_graduated}
                onCheckedChange={(checked) => onUpdate(dataKey, index, "is_graduated", checked)}
              />
              <span>I graduated here.</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor={`${dataKey}.school_${index}`}>Name of School</Label>
                <TextInput
                  id={`${dataKey}.school_${index}`}
                  value={entry.school || ""}
                  onChange={(e) => onUpdate(dataKey, index, "school", e.target.value)}
                  isInvalid={!!errors[`${dataKey}.${index}.school`]}
                />
                {errors[`${dataKey}.${index}.school`] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors[`${dataKey}.${index}.school`]}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor={`${dataKey}.course_${index}`}>Basic Education/Degree/Course</Label>
                <TextInput
                  id={`${dataKey}.course_${index}`}
                  value={entry.course || ""}
                  onChange={(e) => onUpdate(dataKey, index, "course", e.target.value)}
                  isInvalid={!!errors[`${dataKey}.${index}.course`]}
                />
                {errors[`${dataKey}.${index}.course`] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors[`${dataKey}.${index}.course`]}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor={`${dataKey}.period_of_attendance_${index}`}>Period of Attendance (Year)</Label>
                <div className="flex gap-4">
                  <div className="flex-1 w-[45%]">
                    <YearPicker
                      value={entry.from_year || ""}
                      onChange={(value) => onUpdate(dataKey, index, "from_year", value)}
                      startYear={1950}
                      placeholder="Select year"
                      isInvalid={!!errors[`${dataKey}.${index}.from_year`]}
                    />
                    {errors[`${dataKey}.${index}.from_year`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`${dataKey}.${index}.from_year`]}
                      </p>
                    )}
                  </div>

                  <div className="flex-1 w-[45%]">
                    <YearPicker
                      value={entry.to_year || ""}
                      onChange={(value) => onUpdate(dataKey, index, "to_year", value)}
                      startYear={1950}
                      placeholder="Select year"
                      isInvalid={!!errors[`${dataKey}.${index}.to_year`]}
                    />
                    {errors[`${dataKey}.${index}.to_year`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`${dataKey}.${index}.to_year`]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor={`${dataKey}.highest_attainment_${index}`}>Highest Level/Units Earned</Label>
                <TextInput
                  id={`${dataKey}.highest_attainment_${index}`}
                  value={entry.highest_attainment || ""}
                  onChange={(e) => onUpdate(dataKey, index, "highest_attainment", e.target.value)}
                  isInvalid={!!errors[`${dataKey}.${index}.highest_attainment`]}
                />
                {errors[`${dataKey}.${index}.highest_attainment`] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors[`${dataKey}.${index}.highest_attainment`]}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor={`${dataKey}.year_graduated_${index}`}>Year Graduated</Label>
                <YearPicker
                  value={entry.year_graduated || ""}
                  onChange={(value) => onUpdate(dataKey, index, "year_graduated", value)}
                  startYear={1950}
                  placeholder="Select year"
                  isInvalid={!!errors[`${dataKey}.${index}.year_graduated`]}
                  disabled={!entry.is_graduated}
                />
                {errors[`${dataKey}.${index}.year_graduated`] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors[`${dataKey}.${index}.year_graduated`]}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor={`${dataKey}.award_${index}`}>Scholarship / Academic Honors</Label>
                <TextInput
                  id={`${dataKey}.award_${index}`}
                  value={entry.award || ""}
                  onChange={(e) => onUpdate(dataKey, index, "award", e.target.value)}
                  isInvalid={!!errors[`${dataKey}.${index}.award`]}
                />
                {errors[`${dataKey}.${index}.award`] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors[`${dataKey}.${index}.award`]}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button type="button" onClick={() => onAdd(dataKey)} variant="outline" className="w-full">
        <Plus className="h-4 w-4" /> Add Entry
      </Button>
    </Fieldset>
  )
}

const EducationalBackground = ({
  applicantId,
  profileType,
  section = "educationalBackground",
  errors = {},
}) => {
  const { 
    loading,
    pdsState, 
    fetchPdsSection, 
    setPdsSection 
  } = store()

  const educationData = pdsState.educationalBackground || defaultEducationalBackground

  const setData = (value) => {
    setPdsSection("educationalBackground", value)
  }

  const handleAddEducation = (dataKey) => {
    setData({
      ...educationData,
      [dataKey]: [...(educationData[dataKey] || []), createEntry()],
    })
  }

  const handleUpdateEducation = (dataKey, index, field, value) => {
    const updatedEntries = (educationData[dataKey] || []).map((entry, i) => {
      if (i !== index) return entry

      const updatedEntry = { ...entry, [field]: value }

      if (field === "is_graduated" && value === false) {
        updatedEntry.year_graduated = ""
      }

      return updatedEntry
    })

    setData({
      ...educationData,
      [dataKey]: updatedEntries,
    })
  }

  const handleRemoveEducation = (dataKey, index) => {
    setData({
      ...educationData,
      [dataKey]: (educationData[dataKey] || []).filter((_, i) => i !== index),
    })
  }

  useEffect(() => {
    fetchPdsSection(section, { applicantId, profileType })
  }, [applicantId, profileType, section])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-semibold text-lg flex items-center">
          <GraduationCap className="mr-2 h-4 w-4" /> Educational Background
        </CardTitle>
      </CardHeader>

      <CardContent className="relative">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-md bg-white/50 backdrop-blur-[2px]">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        <div className={`${loading ? "pointer-events-none blur-[1.5px] opacity-70" : ""} flex flex-col gap-4 transition`}>
        {levels.map((level) => (
          <EducationSection
            key={level.id}
            dataKey={level.id}
            level={level.label}
            data={educationData[level.id] || []}
            errors={errors}
            onAdd={handleAddEducation}
            onUpdate={handleUpdateEducation}
            onRemove={handleRemoveEducation}
          />
        ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default EducationalBackground
