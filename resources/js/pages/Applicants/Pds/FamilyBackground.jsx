import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import DatePicker from "@/components/DatePicker"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Fieldset } from "@/components/Fieldset"
import { Home, UserPlus, Trash2 } from 'lucide-react'
import TextInput from "@/components/TextInput"
import PageTitle from "@/components/PageTitle"
import { useForm, usePage, Link } from '@inertiajs/react'
import { useState, useEffect } from 'react'
import { 
    ChevronLeft,
    Loader2
 } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

const FamilyBackground = () => {

  const { toast } = useToast()

  const { isThereSpouse, applicant, spouse, mother, father, children, flash } = usePage().props

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Recruitment', href: '#' },
    { label: 'Applicants', href: route('applicants.index') },
    { 
      label: 'Edit Applicant: Family Background', 
      href: route('applicants.edit', { 
        id: applicant.id, 
        step: 'familyBackground' 
      }) 
    },
  ]

  const { data, setData, put, processing, errors } = useForm({
    step: 'familyBackground',
    isThereSpouse,
    spouse,
    father,
    mother,
    children
  })

  const updateData = (parentKey, field, value) => {
    setData(parentKey, {
      ...data[parentKey],
      [field]: value
    })
  }

  const handleAddChild = () => {
    setData("children", [
      ...data.children,
      {
        last_name: "",
        first_name: "",
        middle_name: "",
        ext_name: "",
        birth_date: "",
      },
    ])
  }

  const handleUpdateChild = (index, field, value) => {
    const updated = data.children.map((child, i) =>
      i === index ? { ...child, [field]: value } : child
    )
    setData("children", updated)
  }

  const handleRemoveChild = (index) => {
    const updated = data.children.filter((_, i) => i !== index)
    setData("children", updated)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    put(route('applicants.update', applicant.id)) 
  }

  useEffect(() => {
    if (flash?.message) {
      toast({
        title: flash.title || (flash.status === 'success' ? 'Success!' : 'Error'),
        description: flash.message,
        variant: flash.status === 'error' ? 'destructive' : 'default',
      })
    }
  }, [flash])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between">
          <Link
              href="/applicants"
              className="hidden md:block"
          >
              <Button
                  variant="ghost"
                  className="flex items-center rounded-md disabled:opacity-50"
                  size="sm"
              >
                  <ChevronLeft className="h-8 w-8" />
                  <span className="sr-only sm:not-sr-only">Back to Applicants</span>
              </Button>
          </Link>
      </div>
      <PageTitle pageTitle="Edit Family Background" description="Accomplish the form to edit family background of an applicant." breadcrumbItems={breadcrumbItems} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-semibold text-lg flex items-center">
              <Home className="mr-2 h-4 w-4"/> Family Background
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            
            {/* SPOUSE */}
            <div className="flex gap-4 items-center text-sm font-medium">
              <Switch 
                checked={data.isThereSpouse ?? false}
                onCheckedChange={(isChecked) => setData("isThereSpouse", isChecked)}
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
                      value={data.spouse.last_name ?? ""}
                      onChange={(e) => updateData('spouse', 'last_name', e.target.value)}
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
                      value={data.spouse.first_name ?? ""}
                      onChange={(e) => updateData('spouse', 'first_name', e.target.value)}
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
                      value={data.spouse.middle_name ?? ""}
                      onChange={(e) => updateData('spouse', 'middle_name', e.target.value)}
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
                      value={data.spouse.ext_name ?? ""}
                      onChange={(e) => updateData('spouse', 'ext_name', e.target.value)}
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
                      value={data.spouse.occupation ?? ""}
                      onChange={(e) => updateData('spouse', 'occupation', e.target.value)}
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
                      value={data.spouse.employer_name ?? ""}
                      onChange={(e) => updateData('spouse', 'employer_name', e.target.value)}
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
                      value={data.spouse.business_address ?? ""}
                      onChange={(e) => updateData('spouse', 'business_address', e.target.value)}
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
                      value={data.spouse.telephone_no ?? ""}
                      onChange={(e) => updateData('spouse', 'telephone_no', e.target.value)}
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

            {/* FATHER */}
            <Fieldset legend="Father's Information" className="bg-muted">
              <div className="grid grid-cols-1 lg:grid-cols-[28%_28%_28%_auto] gap-4">
                <div>
                  <Label htmlFor="father_last_name">Last Name</Label>
                  <TextInput
                    id="father_last_name"
                    value={data.father.last_name ?? ""}
                    onChange={(e) => updateData('father', 'last_name', e.target.value)}
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
                    value={data.father.first_name ?? ""}
                    onChange={(e) => updateData('father', 'first_name', e.target.value)}
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
                    value={data.father.middle_name ?? ""}
                    onChange={(e) => updateData('father', 'middle_name', e.target.value)}
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
                    value={data.father.ext_name ?? ""}
                    onChange={(e) => updateData('father', 'ext_name', e.target.value)}
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
                    value={data.father.birth_date ?? ""}
                    onDateChange={(date) => updateData('father', 'birth_date', date)}
                    invalidMessage={errors["father.birth_date"]}
                  />
                </div>
              </div>
            </Fieldset>

            {/* MOTHER */}
            <Fieldset legend="Mother's Information" className="bg-muted">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="mother_last_name">Last Name</Label>
                  <TextInput
                    id="mother_last_name"
                    value={data.mother.last_name ?? ""}
                    onChange={(e) => updateData('mother', 'last_name', e.target.value)}
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
                    value={data.mother.first_name ?? ""}
                    onChange={(e) => updateData('mother', 'first_name', e.target.value)}
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
                    value={data.mother.middle_name ?? ""}
                    onChange={(e) => updateData('mother', 'middle_name', e.target.value)}
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
                    value={data.mother.birth_date ?? ""}
                    onDateChange={(date) => updateData('mother', 'birth_date', date)}
                    invalidMessage={errors["mother.birth_date"]}
                  />
                </div>
                <div>
                  <Label htmlFor="mother_maiden_name">Maiden Name</Label>
                  <TextInput
                    id="mother_maiden_name"
                    value={data.mother.maiden_name ?? ""}
                    onChange={(e) => updateData('mother', 'maiden_name', e.target.value)}
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

            {/* CHILDREN */}
            <Fieldset legend="Children's Information" className="bg-muted">
              {data.children.map((child, index) => (
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
                          onChange={(e) => handleUpdateChild(index, 'last_name', e.target.value)}
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
                          onChange={(e) => handleUpdateChild(index, 'first_name', e.target.value)}
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
                          onChange={(e) => handleUpdateChild(index, 'middle_name', e.target.value)}
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
                          onChange={(e) => handleUpdateChild(index, 'ext_name', e.target.value)}
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
                          onDateChange={(date) => handleUpdateChild(index, 'birth_date', date)}
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
          </CardContent>
          <CardFooter>
            <div className="flex w-full justify-end gap-2">
              <Button type="submit" disabled={processing}>
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {data.id ? 'Update Family Background' : 'Save Family Background'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default FamilyBackground
