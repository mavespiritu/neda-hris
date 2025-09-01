import { Card, CardDescription, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import DatePicker from "@/components/DatePicker"
import TextInput from "@/components/TextInput"
import { Button } from "@/components/ui/button"
import { Fieldset } from "@/components/Fieldset"
import usePdsStore from '@/stores/usePdsStore'
import { Waypoints, Plus, Trash2 } from 'lucide-react'
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

const VoluntaryWork = ({ data, setData, errors = {} }) => {

  const { 
    addVoluntaryWork, 
    updateVoluntaryWork, 
    removeVoluntaryWork, 
  } = usePdsStore()

  const handleAddVoluntaryWork = () => {
    const newVoluntaryWork = {
      org_name: "",
      org_address: "",
      from_date: "",
      to_date: "",
      hours: 0,
      nature_of_work: "",
    }

    setData(prevData => ([
      ...prevData,
      newVoluntaryWork
    ]))
    addVoluntaryWork(newVoluntaryWork)
  }

  const handleUpdateVoluntaryWork = (index, field, value) => {
    setData(prevData => prevData.map((voluntaryWork, i) => 
      i === index ? { ...voluntaryWork, [field]: value } : voluntaryWork
    ))
    updateVoluntaryWork(index, field, value)
  }

  const handleRemoveVoluntaryWork = (index) => {
    setData(prevData => prevData.filter((_, i) => i !== index))
    removeVoluntaryWork(index) 
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-semibold text-lg flex items-center"><Waypoints className="mr-2 h-4 w-4"/> Voluntary Work</CardTitle>
        <CardDescription>List your entries from the most recent up to the oldest.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {data.map((child, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Voluntary Work Entry # {index + 1}
              </CardTitle>
              <Button 
                  type="button"
                  variant="destructive" 
                  onClick={() => handleRemoveVoluntaryWork(index)}
                  className="flex"
                  size="sm"
                  >
                  
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden md:block">Remove</span>
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 mt-4">
              <div className="flex gap-2 mb-2">
                <Switch 
                  checked={child.isPresent}
                  onCheckedChange={(isChecked) => handleUpdateVoluntaryWork(index, 'isPresent', isChecked)}
                />
                <span className="text-sm font-medium">I presently volunteer here</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`org_name_${index}`}>Name of Organization (Write in full)</Label>
                  <TextInput
                    id={`org_name_${index}`}
                    value={child.org_name ?? ""}
                    onChange={(e) => handleUpdateVoluntaryWork(index, 'org_name', e.target.value)}
                    isInvalid={!!errors[`voluntaryWork.${index}.org_name`]}
                  />
                  {errors[`voluntaryWork.${index}.org_name`] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[`voluntaryWork.${index}.org_name`]}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor={`org_address_${index}`}>Address</Label>
                  <TextInput
                    id={`org_address_${index}`}
                    value={child.org_address ?? ""}
                    onChange={(e) => handleUpdateVoluntaryWork(index, 'org_address', e.target.value)}
                    isInvalid={!!errors[`voluntaryWork.${index}.org_address`]}
                  />
                  {errors[`voluntaryWork.${index}.org_address`] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[`voluntaryWork.${index}.org_address`]}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 ">
                  <div>
                    <Label htmlFor={`from_date_${index}`}>Inclusive Dates</Label>
                    <DatePicker
                      placeholder="From"
                      onDateChange={(date) => handleUpdateVoluntaryWork(index, 'from_date', date)}
                      value={child.from_date}
                      invalidMessage={errors[`voluntaryWork.${index}.from_date`]}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`to_date_${index}`}>&nbsp;</Label>
                    <DatePicker
                      placeholder="To"
                      onDateChange={(date) => handleUpdateVoluntaryWork(index, 'to_date', date)}
                      value={child.to_date}
                      invalidMessage={errors[`voluntaryWork.${index}.to_date`]}
                      disabled={child.isPresent}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor={`hours_${index}`}>Number of Hours</Label>
                  <AmountInput
                    id={`hours_${index}`}
                    value={child.hours ?? ""}
                    onChange={(value) => handleUpdateVoluntaryWork(index, 'hours', value)}
                    placeholder=""
                    isInvalid={!!errors[`voluntaryWork.${index}.hours`]}
                    disabled={child.isPresent}
                  />
                  {errors[`voluntaryWork.${index}.hours`] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[`voluntaryWork.${index}.hours`]}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor={`nature_of_work_${index}`}>Position / Nature of Work</Label>
                  <TextInput
                    id={`nature_of_work_${index}`}
                    value={child.nature_of_work}
                    onChange={(e) => handleUpdateVoluntaryWork(index, 'nature_of_work', e.target.value)}
                    isInvalid={!!errors[`voluntaryWork.${index}.nature_of_work`]}
                  />
                  {errors[`voluntaryWork.${index}.nature_of_work`] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[`voluntaryWork.${index}.nature_of_work`]}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <Button type="button" onClick={() => handleAddVoluntaryWork()} variant="secondary" className="inline-flex self-start">
          <Plus className="h-4 w-4" />
          Add Record
        </Button>
      </CardContent>
    </Card>
  )
}

export default VoluntaryWork