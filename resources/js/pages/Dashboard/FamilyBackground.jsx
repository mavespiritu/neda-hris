import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import DatePicker from "@/components/DatePicker"
import { Button } from "@/components/ui/button"
import { Fieldset } from "@/components/Fieldset"
import usePdsStore from '@/stores/usePdsStore'
import { Home, UserPlus, Trash2 } from 'lucide-react'
import SingleComboBox from "@/components/SingleComboBox"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import TextInput from "@/components/TextInput"

const FamilyBackground = ({ updateFormData }) => {

  const {
    pdsState,
    pdsState: {
      familyBackground
    },
    addChild, 
    updateChild, 
    removeChild
  } = usePdsStore()

  const { data, setData, post, processing, errors, clearErrors, reset, progress } = useForm(familyBackground)

  useEffect(() => {
    setData({
      ...data,
      spouse: {
        ...data.spouse,
        last_name: !data.isThereSpouse ? data.spouse.last_name : '',
        first_name: !data.isThereSpouse ? data.spouse.first_name : '',
        middle_name: !data.isThereSpouse ? data.spouse.middle_name : '',
        ext_name: !data.isThereSpouse ? data.spouse.ext_name : '',
        occupation: !data.isThereSpouse ? data.spouse.occupation : '',
        employer_name: !data.isThereSpouse ? data.spouse.employer_name : '',
        business_address: !data.isThereSpouse ? data.spouse.business_address : '',
        telephone_no: !data.isThereSpouse ? data.spouse.telephone_no : '',
      }
    })
  }, [data.isThereSpouse])

  /* useEffect(() => {
      if (familyBackground) {
        setData(normalizeData(familyBackground))
      }
    }, [familyBackground]) */

  useEffect(() => {
    updateFormData(data)
  }, [data])

  const { toast } = useToast()

  const handleAddChild = () => {
    const newChild = {
      last_name: "",
      first_name: "",
      middle_name: "",
      ext_name: "",
      birth_date: ""
    }
    setData(prevData => ({
      ...prevData,
      children: [...prevData.children, newChild]
    }))
    addChild()
  }

  const handleUpdateChild = (index, field, value) => {
    setData(prevData => ({
      ...prevData,
      children: prevData.children.map((child, i) => 
        i === index ? { ...child, [field]: value } : child
      )
    }))
    updateChild(index, field, value)
  }

  const handleRemoveChild = (index) => {
    setData(prevData => ({
      ...prevData,
      children: prevData.children.filter((_, i) => i !== index)
    }))
    removeChild(index)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-semibold text-lg flex items-center"><Home className="mr-2 h-4 w-4"/> Family Background</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex gap-4 items-center text-sm font-medium">
          <Switch 
            checked={data.isThereSpouse}
            onCheckedChange={(isChecked) => {
              setData("isThereSpouse", isChecked)
            }}
            value={data.isThereSpouse}
          />
          I don't have a spouse.
        </div>
        <Fieldset legend="Spouse's Information">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Last Name */}
            <div>
              <Label htmlFor="last_name">Last Name</Label>  
              <Input
                id="spouse_last_name"
                name="spouse_last_name"
                value={data.spouse.last_name}
                onChange={(e) => setData(prevData => ({
                  ...prevData,
                  spouse: {
                    ...prevData.spouse,
                    last_name: e.target.value,
                  }
                }))}
                placeholder=""
                className="w-full"
                disabled={data.isThereSpouse}
              />
            </div>

            {/* First Name */}
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="spouse_first_name"
                name="spouse_first_name"
                value={data.spouse.first_name}
                onChange={(e) => setData(prevData => ({
                  ...prevData,
                  spouse: {
                    ...prevData.spouse,
                    first_name: e.target.value,
                  }
                }))}
                placeholder=""
                className="w-full"
                disabled={data.isThereSpouse}
              />
            </div>

            {/* Middle Name */}
            <div>
              <Label htmlFor="middle_name">Middle Name</Label>
              <Input
                id="spouse_middle_name"
                name="spouse_middle_name"
                value={data.spouse.middle_name}
                onChange={(e) => setData(prevData => ({
                  ...prevData,
                  spouse: {
                    ...prevData.spouse,
                    middle_name: e.target.value,
                  }
                }))}
                placeholder=""
                className="w-full"
                disabled={data.isThereSpouse}
              />
            </div>

            {/* Extension Name */}
            <div>
              <Label htmlFor="ext_name">Suffix</Label>
              <Input
                id="spouse_ext_name"
                name="spouse_ext_name"
                value={data.spouse.ext_name}
                onChange={(e) => setData(prevData => ({
                  ...prevData,
                  spouse: {
                    ...prevData.spouse,
                    ext_name: e.target.value,
                  }
                }))}
                placeholder=""
                className="w-full"
                disabled={data.isThereSpouse}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Occupation */}
            <div>
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="spouse_occupation"
                name="spouse_occupation"
                value={data.spouse.occupation}
                onChange={(e) => setData(prevData => ({
                  ...prevData,
                  spouse: {
                    ...prevData.spouse,
                    occupation: e.target.value,
                  }
                }))}
                placeholder=""
                className="w-full"
                disabled={data.isThereSpouse}
              />
            </div>

            {/* Employer/Business Name */}
            <div>
              <Label htmlFor="employer_name">Employer/Business Name</Label>
              <Input
                id="spouse_employer_name"
                name="spouse_employer_name"
                value={data.spouse.employer_name}
                onChange={(e) => setData(prevData => ({
                  ...prevData,
                  spouse: {
                    ...prevData.spouse,
                    employer_name: e.target.value,
                  }
                }))}
                placeholder=""
                className="w-full"
                disabled={data.isThereSpouse}
              />
            </div>

            {/* Business Address */}
            <div>
              <Label htmlFor="business_address">Business Address</Label>
              <Input
                id="spouse_business_address"
                name="spouse_business_address"
                value={data.spouse.business_address}
                onChange={(e) => setData(prevData => ({
                  ...prevData,
                  spouse: {
                    ...prevData.spouse,
                    business_address: e.target.value,
                  }
                }))}
                placeholder=""
                className="w-full"
                disabled={data.isThereSpouse}
              />
            </div>

            {/* Telephone No. */}
            <div>
              <Label htmlFor="telephone_no">Telephone No.</Label>
              <Input
                id="spouse_telephone_no"
                name="spouse_telephone_no"
                value={data.spouse.telephone_no}
                onChange={(e) => setData(prevData => ({
                  ...prevData,
                  spouse: {
                    ...prevData.spouse,
                    telephone_no: e.target.value,
                  }
                }))}
                placeholder=""
                className="w-full"
                disabled={data.isThereSpouse}
              />
            </div>
          </div>
        </Fieldset>
        <Fieldset legend="Father's Information">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Last Name */}
            <div>
              <Label htmlFor="last_name">Last Name</Label>  
              <Input
                id="father_last_name"
                name="father_last_name"
                value={data.father.last_name}
                onChange={(e) => setData(prevData => ({
                  ...prevData,
                  father: {
                    ...prevData.father,
                    last_name: e.target.value,
                  }
                }))}
                placeholder=""
                className="w-full"
              />
            </div>

            {/* First Name */}
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="father_first_name"
                name="father_first_name"
                value={data.father.first_name}
                onChange={(e) => setData(prevData => ({
                  ...prevData,
                  father: {
                    ...prevData.father,
                    first_name: e.target.value,
                  }
                }))}
                placeholder=""
                className="w-full"
              />
            </div>

            {/* Middle Name */}
            <div>
              <Label htmlFor="middle_name">Middle Name</Label>
              <Input
                id="father_middle_name"
                name="father_middle_name"
                value={data.father.middle_name}
                onChange={(e) => setData(prevData => ({
                  ...prevData,
                  father: {
                    ...prevData.father,
                    middle_name: e.target.value,
                  }
                }))}
                placeholder=""
                className="w-full"
              />
            </div>

            {/* Extension Name */}
            <div>
              <Label htmlFor="ext_name">Suffix</Label>
              <Input
                id="father_ext_name"
                name="father_ext_name"
                value={data.father.ext_name}
                onChange={(e) => setData(prevData => ({
                  ...prevData,
                  father: {
                    ...prevData.father,
                    ext_name: e.target.value,
                  }
                }))}
                placeholder=""
                className="w-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Date of Birth */}
            <div>
              <Label htmlFor="birth_date">Date of Birth</Label>
              <DatePicker
                placeholder="Select a date"
                value={data.father.birth_date}
                onDateChange={(date) => setData(prevData => ({
                  ...prevData,
                  father: {
                    ...prevData.father,
                    birth_date: date,
                  }
                }))}
              />
            </div>
          </div>
        </Fieldset>
        <Fieldset legend="Mother's Information">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Last Name */}
            <div>
              <Label htmlFor="last_name">Last Name</Label>  
              <Input
                id="mother_last_name"
                name="mother_last_name"
                value={data.mother.last_name}
                onChange={(e) => setData(prevData => ({
                  ...prevData,
                  mother: {
                    ...prevData.mother,
                    last_name: e.target.value,
                  }
                }))}
                placeholder=""
                className="w-full"
              />
            </div>

            {/* First Name */}
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="mother_first_name"
                name="mother_first_name"
                value={data.mother.first_name}
                onChange={(e) => setData(prevData => ({
                  ...prevData,
                  mother: {
                    ...prevData.mother,
                    first_name: e.target.value,
                  }
                }))}
                placeholder=""
                className="w-full"
              />
            </div>

            {/* Middle Name */}
            <div>
              <Label htmlFor="middle_name">Middle Name</Label>
              <Input
                id="mother_middle_name"
                name="mother_middle_name"
                value={data.mother.middle_name}
                onChange={(e) => setData(prevData => ({
                  ...prevData,
                  mother: {
                    ...prevData.mother,
                    middle_name: e.target.value,
                  }
                }))}
                placeholder=""
                className="w-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Date of Birth */}
            <div>
              <Label htmlFor="birth_date">Date of Birth</Label>
              <DatePicker
                placeholder="Select a date"
                value={data.mother.birth_date}
                onDateChange={(date) => setData(prevData => ({
                  ...prevData,
                  mother: {
                    ...prevData.mother,
                    birth_date: date,
                  }
                }))}
              />
            </div>

            {/* Maiden Name */}
            <div>
              <Label htmlFor="maiden_name">Mother's Maiden Name</Label>
              <Input
                id="mother_maiden_name"
                name="mother_maiden_name"
                value={data.mother.maiden_name}
                onChange={(e) => setData(prevData => ({
                  ...prevData,
                  mother: {
                    ...prevData.mother,
                    maiden_name: e.target.value,
                  }
                }))}
                placeholder=""
                className="w-full"
              />
            </div>
          </div>
        </Fieldset>
        <Fieldset legend="Children's Information">
        {familyBackground.children.map((child, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Child # {index + 1}
              </CardTitle>
              <Button 
                type="button"
                variant="destructive" 
                onClick={() => handleRemoveChild(index)}
                className="flex"
                size="sm"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor={`last_name_${index}`}>Last Name</Label>
                  <Input
                    id={`last_name_${index}`}
                    value={child.last_name}
                    onChange={(e) => handleUpdateChild(index, 'last_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`first_name_${index}`}>First Name</Label>
                  <Input
                    id={`first_name_${index}`}
                    value={child.first_name}
                    onChange={(e) => handleUpdateChild(index, 'first_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`middle_name_${index}`}>Middle Name</Label>
                  <Input
                    id={`middle_name_${index}`}
                    value={child.middle_name}
                    onChange={(e) => handleUpdateChild(index, 'middle_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`ext_name_${index}`}>Suffix</Label>
                  <Input
                    id={`ext_name_${index}`}
                    value={child.ext_name}
                    onChange={(e) => handleUpdateChild(index, 'ext_name', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor={`birth_date_${index}`}>Birth Date</Label>
                  <DatePicker
                    placeholder="Select a date"
                    value={child.birth_date}
                    onDateChange={(date) => handleUpdateChild(index, 'birth_date', date)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <Button type="button" onClick={handleAddChild} variant="secondary" className="flex">
          <UserPlus className="h-4 w-4" />
          Add Child
        </Button>
        </Fieldset>
      </CardContent>
      
    </Card>
  )
}

export default FamilyBackground