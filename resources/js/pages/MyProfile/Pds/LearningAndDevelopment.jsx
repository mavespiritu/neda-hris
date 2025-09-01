import { Card, CardDescription, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import DatePicker from "@/components/DatePicker"
import TextInput from "@/components/TextInput"
import { Button } from "@/components/ui/button"
import { Fieldset } from "@/components/Fieldset"
import usePdsStore from '@/stores/usePdsStore'
import { Brain, Plus, Trash2 } from 'lucide-react'
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

const LearningAndDevelopment = ({ data, setData, errors = {} }) => {

  const {
    addLearningAndDevelopment, 
    updateLearningAndDevelopment, 
    removeLearningAndDevelopment, 
  } = usePdsStore()

  const types = [
    { label: 'Managerial', value: 'Managerial'},
    { label: 'Supervisory', value: 'Supervisory'},
    { label: 'Technical', value: 'Technical'},
    { label: 'Administrative', value: 'Administrative'},
  ]

  const participations = [
    { label: 'Facilitator', value: 'Facilitator'},
    { label: 'Speaker', value: 'Speaker'},
    { label: 'Trainee', value: 'Trainee'},
  ]

  const handleAddLearningAndDevelopment = () => {
    const newLearningAndDevelopment = {
      training_title: "",
      from_date: "",
      to_date: "",
      hours: "",
      participation: "",
      type: "",
      conducted_by: "",
    }

    setData(prevData => ([
      ...prevData,
      newLearningAndDevelopment
    ]))
    addLearningAndDevelopment(newLearningAndDevelopment)
  }

  const handleUpdateLearningAndDevelopment = (index, field, value) => {
    setData(prevData => prevData.map((learningAndDevelopment, i) => 
      i === index ? { ...learningAndDevelopment, [field]: value } : learningAndDevelopment
    ))
    updateLearningAndDevelopment(index, field, value)
  }

  const handleRemoveLearningAndDevelopment = (index) => {
    setData(prevData => prevData.filter((_, i) => i !== index))
    removeLearningAndDevelopment(index) 
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-semibold text-lg flex items-center"><Brain className="mr-2 h-4 w-4"/> Learning and Development (L&D)</CardTitle>
        <CardDescription>Start from the most recent L&D/training program and include only the relevant L&D/training taken for the last five (5) years for Division Chief/Executive/Managerial positions</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {data.map((child, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                L&D Entry # {index + 1}
              </CardTitle>
              <Button 
                  type="button"
                  variant="destructive" 
                  onClick={() => handleRemoveLearningAndDevelopment(index)}
                  className="flex"
                  size="sm"
                  >
                  
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden md:block">Remove</span>
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`training_title_${index}`}>Title of Learning and Development Interventions / Training Programs (Write in full)</Label>
                <TextInput
                  id={`training_title_${index}`}
                  value={child.training_title ?? ""}
                  onChange={(e) => handleUpdateLearningAndDevelopment(index, 'training_title', e.target.value)}
                  isInvalid={!!errors[`learningAndDevelopment.${index}.training_title`]}
                />
                {errors[`learningAndDevelopment.${index}.training_title`] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors[`learningAndDevelopment.${index}.training_title`]}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-4">
                <div>
                  <Label htmlFor={`from_date_${index}`}>Inclusive Dates</Label>
                  <DatePicker
                    placeholder="From"
                    onDateChange={(date) => handleUpdateLearningAndDevelopment(index, 'from_date', date)}
                    value={child.from_date}
                    invalidMessage={errors[`learningAndDevelopment.${index}.from_date`]}
                  />
                </div>
                <div>
                  <Label htmlFor={`to_date_${index}`}>&nbsp;</Label>
                  <DatePicker
                    placeholder="To"
                    onDateChange={(date) => handleUpdateLearningAndDevelopment(index, 'to_date', date)}
                    value={child.to_date}
                    invalidMessage={errors[`learningAndDevelopment.${index}.to_date`]}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor={`hours_${index}`}>Number of Hours</Label>
                <AmountInput
                  id={`hours_${index}`}
                  value={child.hours ?? ""}
                  onChange={(value) => handleUpdateLearningAndDevelopment(index, 'hours', value)}
                  placeholder=""
                  isInvalid={!!errors[`learningAndDevelopment.${index}.hours`]}
                />
                {errors[`learningAndDevelopment.${index}.hours`] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors[`learningAndDevelopment.${index}.hours`]}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor={`type_${index}`}>Type of L&D</Label>
                <SingleComboBox
                  items={types}
                  placeholder="Select one"
                  name={`type_${index}`}
                  id={`type_${index}`}
                  value={child.type}
                  width="w-full"
                  className="w-full"
                  onChange={(value) => handleUpdateLearningAndDevelopment(index, 'type', value)}
                  invalidMessage={errors[`learningAndDevelopment.${index}.type`]}
                />
                {errors[`learningAndDevelopment.${index}.type`] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors[`learningAndDevelopment.${index}.type`]}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor={`participation_${index}`}>Participation</Label>
                <SingleComboBox
                  items={participations}
                  placeholder="Select one"
                  name={`participation_${index}`}
                  id={`participation_${index}`}
                  value={child.participation}
                  width="w-full"
                  className="w-full"
                  onChange={(value) => handleUpdateLearningAndDevelopment(index, 'participation', value)}
                  invalidMessage={errors[`learningAndDevelopment.${index}.participation`]}
                />
                {errors[`learningAndDevelopment.${index}.participation`] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors[`learningAndDevelopment.${index}.participation`]}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor={`conducted_by_${index}`}>Conducted/Sponsored by</Label>
                <TextInput
                  id={`conducted_by_${index}`}
                  value={child.conducted_by}
                  onChange={(e) => handleUpdateLearningAndDevelopment(index, 'conducted_by', e.target.value)}
                  isInvalid={!!errors[`learningAndDevelopment.${index}.conducted_by`]}
                />
                {errors[`learningAndDevelopment.${index}.conducted_by`] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors[`learningAndDevelopment.${index}.conducted_by`]}
                  </p>
                )}
              </div>
            </div>
            </CardContent>
          </Card>
        ))}
        <Button type="button" onClick={() => handleAddLearningAndDevelopment()} variant="secondary" className="inline-flex self-start">
          <Plus className="h-4 w-4" />
          Add Record
        </Button>
      </CardContent>
    </Card>
  )
}

export default LearningAndDevelopment