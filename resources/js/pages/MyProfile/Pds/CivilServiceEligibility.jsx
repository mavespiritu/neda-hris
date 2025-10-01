import { Card, CardDescription, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import DatePicker from "@/components/DatePicker"
import { Button } from "@/components/ui/button"
import { Fieldset } from "@/components/Fieldset"
import usePdsStore from '@/stores/usePdsStore'
import { FileText, Plus, Trash2 } from 'lucide-react'
import SingleComboBox from "@/components/SingleComboBox"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import TextInput from "@/components/TextInput"
import { YearPicker } from "@/components/YearPicker"

const CivilServiceEligibility = ({ data, setData, errors = {} }) => {

  const { 
    addEligibility, 
    updateEligibility, 
    removeEligibility, 
  } = usePdsStore()

  const handleAddEligibility = () => {
    const newEligibility = {
      eligibility: "",
      rating: "",
      exam_date: "",
      exam_place: "",
      license_no: "",
      validity_date: "",
    }

    setData(prevData => ([
      ...prevData,
      newEligibility
    ]))
    addEligibility(newEligibility)
  }

  const handleUpdateEligibility = (index, field, value) => {
    setData(prevData => prevData.map((eligibility, i) => 
      i === index ? { ...eligibility, [field]: value } : eligibility
    ))
    updateEligibility(index, field, value)
  }

  const handleRemoveEligibility = (index) => {
    setData(prevData => prevData.filter((_, i) => i !== index))
    removeEligibility(index) 
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-semibold text-lg flex items-center"><FileText className="mr-2 h-4 w-4"/> Civil Service Eligibility</CardTitle>
        <CardDescription>List your entries from the most recent up to the oldest.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
          {data.map((child, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold">
                  Civil Service Eligibility Entry # {index + 1}
                </CardTitle>
                <Button 
                    type="button"
                    variant="destructive" 
                    onClick={() => handleRemoveEligibility(index)}
                    className="flex"
                    size="sm"
                    >
                    
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden md:block">Remove</span>
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 border-t pt-4 bg-muted">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
                  <div>
                    <Label htmlFor={`eligibility_${index}`}>Career Service / RA 1080 (Board / Bar) Under Special Laws / CES / CSEE Barangay Eligibility / Driver's License</Label>
                    <TextInput
                      id={`eligibility_${index}`}
                      value={child.eligibility ?? ""}
                      onChange={(e) => handleUpdateEligibility(index, 'eligibility', e.target.value)}
                      isInvalid={!!errors[`civilServiceEligibility.${index}.eligibility`]}
                    />
                    {errors[`civilServiceEligibility.${index}.eligibility`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`civilServiceEligibility.${index}.eligibility`]}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`rating_${index}`}>Rating (if applicable)</Label>
                    <TextInput
                      id={`rating_${index}`}
                      value={child.rating ?? ""}
                      onChange={(e) => handleUpdateEligibility(index, 'rating', e.target.value)}
                      isInvalid={!!errors[`civilServiceEligibility.${index}.rating`]}
                    />
                    {errors[`civilServiceEligibility.${index}.rating`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`civilServiceEligibility.${index}.rating`]}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`exam_date_${index}`}>Date of Examination / Conferment</Label>
                    <DatePicker
                      placeholder="Select a date"
                      value={child.exam_date}
                      onDateChange={(date) => handleUpdateEligibility(index, 'exam_date', date)}
                      invalidMessage={errors[`civilServiceEligibility.${index}.exam_date`]}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
                  <div>
                    <Label htmlFor={`exam_place_${index}`}>Place of Examination / Conferment</Label>
                    <TextInput
                      id={`exam_place_${index}`}
                      value={child.exam_place ?? ""}
                      onChange={(e) => handleUpdateEligibility(index, 'exam_place', e.target.value)}
                      isInvalid={!!errors[`civilServiceEligibility.${index}.exam_place`]}
                    />
                    {errors[`civilServiceEligibility.${index}.exam_place`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`civilServiceEligibility.${index}.exam_place`]}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`license_no_${index}`}>License No. (if applicable)</Label>
                    <TextInput
                      id={`license_no_${index}`}
                      value={child.license_no ?? ""}
                      onChange={(e) => handleUpdateEligibility(index, 'license_no', e.target.value)}
                      isInvalid={!!errors[`civilServiceEligibility.${index}.license_no`]}
                    />
                    {errors[`civilServiceEligibility.${index}.license_no`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`civilServiceEligibility.${index}.license_no`]}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`validity_date_${index}`}>Date of Validity</Label>
                    <DatePicker
                      placeholder="Select a date"
                      onDateChange={(date) => handleUpdateEligibility(index, 'validity_date', date)}
                      value={child.validity_date}
                      invalidMessage={errors[`civilServiceEligibility.${index}.validity_date`]}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button type="button" onClick={() => handleAddEligibility()} variant="outline" className="w-full bg-muted">
            <Plus className="h-4 w-4" />
            Add Record
          </Button>
      </CardContent>
      
    </Card>
  )
}

export default CivilServiceEligibility