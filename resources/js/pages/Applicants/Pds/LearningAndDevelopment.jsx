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
import PageTitle from "@/components/PageTitle"
import { useForm, usePage, Link } from '@inertiajs/react'
import { useToast } from "@/hooks/use-toast"
import { 
    ChevronLeft,
    Loader2
 } from 'lucide-react'
 import { types, participations } from "../selections"

const LearningAndDevelopment = () => {

  const { toast } = useToast()

  const { applicant, learningAndDevelopment, flash } = usePage().props

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Recruitment', href: '#' },
    { label: 'Applicants', href: route('applicants.index') },
    { 
      label: 'Edit Applicant: Learning and Development', 
      href: route('applicants.edit', { 
        id: applicant.id, 
        step: 'learningAndDevelopment' 
      }) 
    },
  ]

  const { data, setData, put, processing, errors } = useForm({
    step: 'learningAndDevelopment',
    learningAndDevelopment,
  })

  const handleAddLearningAndDevelopment = () => {
    const newLearningAndDevelopment = {
      seminar_title: "",
      from_date: "",
      to_date: "",
      hours: "",
      participation: "",
      type: "",
      conducted_by: "",
    }

    setData("learningAndDevelopment", [...data.learningAndDevelopment, newLearningAndDevelopment])
  }

  const handleUpdateLearningAndDevelopment = (index, field, value) => {
    const updated = data.learningAndDevelopment.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    setData("learningAndDevelopment", updated)
  }

  const handleRemoveLearningAndDevelopment = (index) => {
    const updated = data.learningAndDevelopment.filter((_, i) => i !== index)
    setData("learningAndDevelopment", updated)
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
      <PageTitle pageTitle="Edit Learning and Development" description="Accomplish the form to edit learning and development of an applicant." breadcrumbItems={breadcrumbItems} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-semibold text-lg flex items-center"><Brain className="mr-2 h-4 w-4"/> Learning and Development (L&D)</CardTitle>
            <CardDescription>Start from the most recent L&D/training program and include only the relevant L&D/training taken for the last five (5) years for Division Chief/Executive/Managerial positions</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {data.learningAndDevelopment?.map((child, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold">
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
                <CardContent className="flex flex-col gap-4 pt-4 border-t bg-muted">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`seminar_title_${index}`}>Title of Learning and Development Interventions / Training Programs (Write in full)</Label>
                    <TextInput
                      id={`seminar_title_${index}`}
                      value={child.seminar_title ?? ""}
                      onChange={(e) => handleUpdateLearningAndDevelopment(index, 'seminar_title', e.target.value)}
                      isInvalid={!!errors[`learningAndDevelopment.${index}.seminar_title`]}
                    />
                    {errors[`learningAndDevelopment.${index}.seminar_title`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`learningAndDevelopment.${index}.seminar_title`]}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-4">
                    <div>
                      <Label htmlFor={`from_date_${index}`}>Start Date</Label>
                      <DatePicker
                        placeholder="From"
                        onDateChange={(date) => handleUpdateLearningAndDevelopment(index, 'from_date', date)}
                        value={child.from_date}
                        invalidMessage={errors[`learningAndDevelopment.${index}.from_date`]}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`to_date_${index}`}>End Date</Label>
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
            <Button type="button" onClick={() => handleAddLearningAndDevelopment()} variant="outline" className="w-full bg-muted">
              <Plus className="h-4 w-4" />
              Add Record
            </Button>
          </CardContent>
          <CardFooter>
            <div className="flex w-full justify-end gap-2">
              <Button type="submit" disabled={processing}>
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {data.id ? 'Update Learning and Development' : 'Save Learning and Development'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default LearningAndDevelopment