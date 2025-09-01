import { Card, CardDescription, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import DatePicker from "@/components/DatePicker"
import { Button } from "@/components/ui/button"
import { Fieldset } from "@/components/Fieldset"
import usePdsStore from '@/stores/usePdsStore'
import { BriefcaseBusiness, Plus, Trash2 } from 'lucide-react'
import SingleComboBox from "@/components/SingleComboBox"
import AmountInput from "@/components/AmountInput"
import IntegerInput from "@/components/IntegerInput"
import { Switch } from "@/components/ui/switch"
import { useState, useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import { useToast } from "@/hooks/use-toast"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const WorkExperience = ({ updateFormData }) => {

  const { 
    pdsState,
    pdsState: {
      workExperience
    },
    addWorkExperience, 
    updateWorkExperience, 
    removeWorkExperience, 
  } = usePdsStore()

  const { data, setData, post, processing, errors, clearErrors, reset, progress } = useForm(workExperience)

  const appointmentStatuses = [
    { label: 'Permanent', value: 'Permanent'},
    { label: 'Temporary', value: 'Temporary'},
    { label: 'Casual', value: 'Casual'},
    { label: 'Contractual', value: 'Contractual'},
  ]

  useEffect(() => {
    updateFormData(data)
  }, [data])

  const { toast } = useToast()

  const handleAddWorkExperience = () => {
    const newWorkExperience = {
      agency: "",
      position: "",
      appointment: "",
      grade: 0,
      step: 0,
      monthly_salary: 0,
      from_date: "",
      to_date: "",
      isGovtService: false,
      isPresent: false
    }

    setData(prevData => ([
      ...prevData,
      newWorkExperience
    ]))
    addWorkExperience(newWorkExperience)
  }

  const handleUpdateWorkExperience = (index, field, value) => {
    setData(prevData => prevData.map((workExperience, i) => 
      i === index ? { ...workExperience, [field]: value } : workExperience
    ))
    updateWorkExperience(index, field, value)
  }

  const handleRemoveWorkExperience = (index) => {
    setData(prevData => prevData.filter((_, i) => i !== index))
    removeWorkExperience(index) 
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-semibold text-lg flex items-center"><BriefcaseBusiness className="mr-2 h-4 w-4"/> Work Experience</CardTitle>
        <CardDescription>List your entries from the most recent up to the oldest.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {workExperience.map((child, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Work Experience Entry # {index + 1}
              </CardTitle>
              <Button 
                  type="button"
                  variant="destructive" 
                  onClick={() => handleRemoveWorkExperience(index)}
                  className="flex"
                  size="sm"
                  >
                  
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden md:block">Remove</span>
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-4">
              <div className="flex flex-col gap-2 items-end">
                <div className="grid lg:grid-cols-2 gap-4 w-full">
                  <div>
                    <Label htmlFor={`inclusive_dates_from_${index}`}>Inclusive Dates</Label>
                    <DatePicker
                      placeholder="From"
                      onDateChange={(date) => handleUpdateWorkExperience(index, 'from_date', date)}
                      value={child.from_date}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`inclusive_dates_to_${index}`}>&nbsp;</Label>
                    <DatePicker
                      placeholder="To"
                      onDateChange={(date) => handleUpdateWorkExperience(index, 'to_date', date)}
                      value={child.to_date}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={child.isPresent}
                    onCheckedChange={(isChecked) => handleUpdateWorkExperience(index, 'isPresent', isChecked)}
                  />
                  <span className="text-sm font-medium">I presently work here</span>
                </div>
              </div>
              <div>
                <Label htmlFor={`position_${index}`}>Position Title (Write in full/Do not abbreviate)</Label>
                <Input
                  id={`position_${index}`}
                  value={child.position}
                  onChange={(e) => handleUpdateWorkExperience(index, 'position', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`agency_${index}`}>Department/Agency/Office/Company (Write in full)</Label>
                <Input
                  id={`agency_${index}`}
                  value={child.agency}
                  onChange={(e) => handleUpdateWorkExperience(index, 'agency', e.target.value)}
                />
              </div>
            </div>
        
              <div className="grid grid-cols-1 lg:grid-cols-[30%,70%] gap-4 items-end">
                <div>
                  <Label htmlFor={`monthly_salary_${index}`}>Monthly Salary</Label>
                  <AmountInput
                    id={`monthly_salary_${index}`}
                    value={child.monthly_salary}
                    onChange={(value) => handleUpdateWorkExperience(index, 'monthly_salary', value)}
                  />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
                  <div>
                  <Label htmlFor={`grade_${index}`}>Salary/Job/Pay Grade</Label>
                  <IntegerInput
                    id={`grade_${index}`}
                    value={child.grade}
                    onChange={(value) => handleUpdateWorkExperience(index, 'grade', value)}
                  />
                </div>
                  <div>
                    <Label htmlFor={`step_${index}`}>Step</Label>
                    <IntegerInput
                      id={`step_${index}`}
                      value={child.step}
                      onChange={(value) => handleUpdateWorkExperience(index, 'step', value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`appointment_${index}`}>Status of Appointment</Label>
                    <SingleComboBox
                      items={appointmentStatuses}
                      placeholder="Select one"
                      name={`appointment_${index}`}
                      id={`appointment_${index}`}
                      value={child.appointment}
                      width="w-full"
                      className="w-full"
                      onChange={(value) => handleUpdateWorkExperience(index, 'appointment', value)}
                    />
                  </div>
                  <div className="flex flex-col gap-6">
                    <Label htmlFor={`isGovtService_${index}`}>Government Service?</Label>
                    <div className="flex">
                      <Switch 
                        checked={child.isGovtService}
                        onCheckedChange={(isChecked) => handleUpdateWorkExperience(index, 'isGovtService', isChecked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <Button type="button" onClick={() => handleAddWorkExperience()} variant="secondary" className="inline-flex self-start">
          <Plus className="h-4 w-4" />
          Add Record
        </Button>
      </CardContent>
    </Card>
  )
}

export default WorkExperience