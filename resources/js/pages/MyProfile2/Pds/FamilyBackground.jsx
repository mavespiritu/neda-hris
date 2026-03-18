import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import DatePicker from "@/components/DatePicker"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Fieldset } from "@/components/Fieldset"
import store from "../store"
import { Home, UserPlus, Trash2, Loader2 } from "lucide-react"
import TextInput from "@/components/TextInput"
import { useEffect } from "react"

const defaultSpouse = {
  hasSpouse: false,
  last_name: "",
  first_name: "",
  middle_name: "",
  ext_name: "",
  occupation: "",
  employer_name: "",
  business_address: "",
  telephone_no: "",
}

const defaultFather = {
  last_name: "",
  first_name: "",
  middle_name: "",
  ext_name: "",
  birth_date: "",
}

const defaultMother = {
  last_name: "",
  first_name: "",
  middle_name: "",
  maiden_name: "",
  birth_date: "",
}

const FamilyBackground = ({
  applicantId,
  profileType,
  section = "familyBackground",
  errors = {},
}) => {
  const { 
    loading,
    pdsState, 
    fetchPdsSection, 
    setPdsField 
  } = store()

  const data = pdsState.familyBackground || {
    isThereSpouse: false,
    spouse: defaultSpouse,
    father: defaultFather,
    mother: defaultMother,
    children: [],
  }

  const spouse = data.spouse || defaultSpouse
  const father = data.father || defaultFather
  const mother = data.mother || defaultMother
  const children = Array.isArray(data.children) ? data.children : []

  const setData = (field, value) => {
    setPdsField("familyBackground", field, value)
  }

  const updateData = (parentKey, field, value) => {
    setData(parentKey, {
      ...(data[parentKey] || {}),
      [field]: value,
    })
  }

  const handleAddChild = () => {
    const newChild = {
      last_name: "",
      first_name: "",
      middle_name: "",
      ext_name: "",
      birth_date: "",
    }

    setData("children", [...children, newChild])
  }

  const handleUpdateChild = (index, field, value) => {
    const updatedChildren = children.map((child, i) =>
      i === index ? { ...child, [field]: value } : child
    )

    setData("children", updatedChildren)
  }

  const handleRemoveChild = (index) => {
    const updatedChildren = children.filter((_, i) => i !== index)
    setData("children", updatedChildren)
  }

  useEffect(() => {
    fetchPdsSection(section, { applicantId, profileType })
  }, [applicantId, profileType, section])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-semibold text-lg flex items-center">
          <Home className="mr-2 h-4 w-4" /> Family Background
        </CardTitle>
      </CardHeader>

      <CardContent className="relative">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-md bg-white/50 backdrop-blur-[2px]">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        <div className={`${loading ? "pointer-events-none blur-[1.5px] opacity-70" : ""} flex flex-col gap-4 transition`}>

          <div className="flex gap-4 items-center text-sm font-medium">
            <Switch
              checked={!!data.isThereSpouse}
              onCheckedChange={(checked) => {
                setData("isThereSpouse", checked)

                if (checked) {
                  setData("spouse", {
                    ...spouse,
                    hasSpouse: true,
                  })
                } else {
                  setData("spouse", {
                    ...defaultSpouse,
                    hasSpouse: false,
                  })
                }
              }}
            />
            I have a spouse.
          </div>

          {data.isThereSpouse && (
            <Fieldset legend="Spouse's Information" className="bg-muted">
              <div className="grid grid-cols-1 lg:grid-cols-[28%_28%_28%_auto] gap-4">
                <div>
                  <Label htmlFor="spouse_last_name">Last Name</Label>
                  <TextInput
                    id="spouse_last_name"
                    value={spouse.last_name ?? ""}
                    onChange={(e) => updateData("spouse", "last_name", e.target.value)}
                    isInvalid={!!errors["spouse.last_name"]}
                  />
                  {errors["spouse.last_name"] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors["spouse.last_name"]}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="spouse_first_name">First Name</Label>
                  <TextInput
                    id="spouse_first_name"
                    value={spouse.first_name ?? ""}
                    onChange={(e) => updateData("spouse", "first_name", e.target.value)}
                    isInvalid={!!errors["spouse.first_name"]}
                  />
                  {errors["spouse.first_name"] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors["spouse.first_name"]}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="spouse_middle_name">Middle Name</Label>
                  <TextInput
                    id="spouse_middle_name"
                    value={spouse.middle_name ?? ""}
                    onChange={(e) => updateData("spouse", "middle_name", e.target.value)}
                    isInvalid={!!errors["spouse.middle_name"]}
                  />
                  {errors["spouse.middle_name"] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors["spouse.middle_name"]}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="spouse_ext_name">Suffix</Label>
                  <TextInput
                    id="spouse_ext_name"
                    value={spouse.ext_name ?? ""}
                    onChange={(e) => updateData("spouse", "ext_name", e.target.value)}
                    isInvalid={!!errors["spouse.ext_name"]}
                  />
                  {errors["spouse.ext_name"] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors["spouse.ext_name"]}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="spouse_occupation">Occupation</Label>
                  <TextInput
                    id="spouse_occupation"
                    value={spouse.occupation ?? ""}
                    onChange={(e) => updateData("spouse", "occupation", e.target.value)}
                    isInvalid={!!errors["spouse.occupation"]}
                  />
                  {errors["spouse.occupation"] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors["spouse.occupation"]}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="spouse_employer_name">Employer Name</Label>
                  <TextInput
                    id="spouse_employer_name"
                    value={spouse.employer_name ?? ""}
                    onChange={(e) => updateData("spouse", "employer_name", e.target.value)}
                    isInvalid={!!errors["spouse.employer_name"]}
                  />
                  {errors["spouse.employer_name"] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors["spouse.employer_name"]}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="spouse_business_address">Business Address</Label>
                  <TextInput
                    id="spouse_business_address"
                    value={spouse.business_address ?? ""}
                    onChange={(e) => updateData("spouse", "business_address", e.target.value)}
                    isInvalid={!!errors["spouse.business_address"]}
                  />
                  {errors["spouse.business_address"] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors["spouse.business_address"]}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="spouse_telephone_no">Telephone No.</Label>
                  <TextInput
                    id="spouse_telephone_no"
                    value={spouse.telephone_no ?? ""}
                    onChange={(e) => updateData("spouse", "telephone_no", e.target.value)}
                    isInvalid={!!errors["spouse.telephone_no"]}
                  />
                  {errors["spouse.telephone_no"] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors["spouse.telephone_no"]}
                    </p>
                  )}
                </div>
              </div>
            </Fieldset>
          )}

          <Fieldset legend="Father's Information" className="bg-muted">
            <div className="grid grid-cols-1 lg:grid-cols-[28%_28%_28%_auto] gap-4">
              <div>
                <Label htmlFor="father_last_name">Last Name</Label>
                <TextInput
                  id="father_last_name"
                  value={father.last_name ?? ""}
                  onChange={(e) => updateData("father", "last_name", e.target.value)}
                  isInvalid={!!errors["father.last_name"]}
                />
                {errors["father.last_name"] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors["father.last_name"]}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="father_first_name">First Name</Label>
                <TextInput
                  id="father_first_name"
                  value={father.first_name ?? ""}
                  onChange={(e) => updateData("father", "first_name", e.target.value)}
                  isInvalid={!!errors["father.first_name"]}
                />
                {errors["father.first_name"] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors["father.first_name"]}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="father_middle_name">Middle Name</Label>
                <TextInput
                  id="father_middle_name"
                  value={father.middle_name ?? ""}
                  onChange={(e) => updateData("father", "middle_name", e.target.value)}
                  isInvalid={!!errors["father.middle_name"]}
                />
                {errors["father.middle_name"] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors["father.middle_name"]}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="father_ext_name">Suffix</Label>
                <TextInput
                  id="father_ext_name"
                  value={father.ext_name ?? ""}
                  onChange={(e) => updateData("father", "ext_name", e.target.value)}
                  isInvalid={!!errors["father.ext_name"]}
                />
                {errors["father.ext_name"] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors["father.ext_name"]}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="father_birth_date">Date of Birth</Label>
                <DatePicker
                  placeholder="Select a date"
                  value={father.birth_date ?? ""}
                  onDateChange={(date) => updateData("father", "birth_date", date)}
                  invalidMessage={errors["father.birth_date"]}
                />
              </div>
            </div>
          </Fieldset>

          <Fieldset legend="Mother's Information" className="bg-muted">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="mother_last_name">Last Name</Label>
                <TextInput
                  id="mother_last_name"
                  value={mother.last_name ?? ""}
                  onChange={(e) => updateData("mother", "last_name", e.target.value)}
                  isInvalid={!!errors["mother.last_name"]}
                />
                {errors["mother.last_name"] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors["mother.last_name"]}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="mother_first_name">First Name</Label>
                <TextInput
                  id="mother_first_name"
                  value={mother.first_name ?? ""}
                  onChange={(e) => updateData("mother", "first_name", e.target.value)}
                  isInvalid={!!errors["mother.first_name"]}
                />
                {errors["mother.first_name"] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors["mother.first_name"]}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="mother_middle_name">Middle Name</Label>
                <TextInput
                  id="mother_middle_name"
                  value={mother.middle_name ?? ""}
                  onChange={(e) => updateData("mother", "middle_name", e.target.value)}
                  isInvalid={!!errors["mother.middle_name"]}
                />
                {errors["mother.middle_name"] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors["mother.middle_name"]}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="mother_birth_date">Date of Birth</Label>
                <DatePicker
                  placeholder="Select a date"
                  value={mother.birth_date ?? ""}
                  onDateChange={(date) => updateData("mother", "birth_date", date)}
                  invalidMessage={errors["mother.birth_date"]}
                />
              </div>

              <div>
                <Label htmlFor="mother_maiden_name">Maiden Name</Label>
                <TextInput
                  id="mother_maiden_name"
                  value={mother.maiden_name ?? ""}
                  onChange={(e) => updateData("mother", "maiden_name", e.target.value)}
                  isInvalid={!!errors["mother.maiden_name"]}
                />
                {errors["mother.maiden_name"] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors["mother.maiden_name"]}
                  </p>
                )}
              </div>
            </div>
          </Fieldset>

          <Fieldset legend="Children's Information" className="bg-muted">
            {children.map((child, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold">Child # {index + 1}</CardTitle>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleRemoveChild(index)}
                    size="sm"
                    className="flex"
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </Button>
                </CardHeader>

                <CardContent className="flex flex-col gap-4 pt-4 border-t">
                  <div className="grid grid-cols-1 lg:grid-cols-[28%_28%_28%_auto] gap-4">
                    <div>
                      <Label htmlFor={`last_name_${index}`}>Last Name</Label>
                      <TextInput
                        id={`last_name_${index}`}
                        value={child.last_name ?? ""}
                        onChange={(e) => handleUpdateChild(index, "last_name", e.target.value)}
                        isInvalid={!!errors[`children.${index}.last_name`]}
                      />
                      {errors[`children.${index}.last_name`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`children.${index}.last_name`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`first_name_${index}`}>First Name</Label>
                      <TextInput
                        id={`first_name_${index}`}
                        value={child.first_name ?? ""}
                        onChange={(e) => handleUpdateChild(index, "first_name", e.target.value)}
                        isInvalid={!!errors[`children.${index}.first_name`]}
                      />
                      {errors[`children.${index}.first_name`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`children.${index}.first_name`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`middle_name_${index}`}>Middle Name</Label>
                      <TextInput
                        id={`middle_name_${index}`}
                        value={child.middle_name ?? ""}
                        onChange={(e) => handleUpdateChild(index, "middle_name", e.target.value)}
                        isInvalid={!!errors[`children.${index}.middle_name`]}
                      />
                      {errors[`children.${index}.middle_name`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`children.${index}.middle_name`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`ext_name_${index}`}>Suffix</Label>
                      <TextInput
                        id={`ext_name_${index}`}
                        value={child.ext_name ?? ""}
                        onChange={(e) => handleUpdateChild(index, "ext_name", e.target.value)}
                        isInvalid={!!errors[`children.${index}.ext_name`]}
                      />
                      {errors[`children.${index}.ext_name`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`children.${index}.ext_name`]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`birth_date_${index}`}>Birth Date</Label>
                      <DatePicker
                        placeholder="Select a date"
                        value={child.birth_date ?? ""}
                        onDateChange={(date) => handleUpdateChild(index, "birth_date", date)}
                        invalidMessage={errors[`children.${index}.birth_date`]}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button type="button" onClick={handleAddChild} variant="outline" className="w-full">
              <UserPlus className="h-4 w-4" /> Add Child
            </Button>
          </Fieldset>
        </div>
      </CardContent>
    </Card>
  )
}

export default FamilyBackground
