import {
  Card, CardContent, CardHeader, CardTitle, CardFooter
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Fieldset } from "@/components/Fieldset"
import { GraduationCap, Plus, Trash2 } from 'lucide-react'
import { Label } from "@/components/ui/label"
import TextInput from "@/components/TextInput"
import { Switch } from "@/components/ui/switch"
import { YearPicker } from "@/components/YearPicker"
import PageTitle from "@/components/PageTitle"
import { useForm, usePage, Link } from '@inertiajs/react'
import { useState, useEffect } from 'react'
import { 
    ChevronLeft,
    Loader2
 } from 'lucide-react'
 import { useToast } from "@/hooks/use-toast"

const EducationSection = ({
  dataKey,
  level,
  onAdd,
  onUpdate,
  onRemove,
  errors,
  data
}) => {
  return (
    <Fieldset legend={level} className="bg-muted">
      <p className="text-sm">List your entries from the most recent up to the oldest.</p>
      {data?.map((child, index) => (
        <Card key={`${dataKey}-${index}`}>
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
                checked={child.is_graduated}
                onCheckedChange={(isChecked) => onUpdate(dataKey, index, 'is_graduated', isChecked)}
              />
              <span>I graduated here.</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor={`${dataKey}.school_${index}`}>Name of School</Label>
                <TextInput
                  id={`${dataKey}.school_${index}`}
                  value={child.school}
                  onChange={(e) => onUpdate(dataKey, index, 'school', e.target.value)}
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
                  value={child.course}
                  onChange={(e) => onUpdate(dataKey, index, 'course', e.target.value)}
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
                      value={child.from_year}
                      onChange={(value) => onUpdate(dataKey, index, 'from_year', value)}
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
                      value={child.to_year}
                      onChange={(value) => onUpdate(dataKey, index, 'to_year', value)}
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
                  value={child.highest_attainment}
                  onChange={(e) => onUpdate(dataKey, index, 'highest_attainment', e.target.value)}
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
                  value={child.year_graduated}
                  onChange={(value) => onUpdate(dataKey, index, 'year_graduated', value)}
                  startYear={1950}
                  placeholder="Select year"
                  isInvalid={!!errors[`${dataKey}.${index}.year_graduated`]}
                  disabled={!child.is_graduated}
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
                  value={child.award}
                  onChange={(e) => onUpdate(dataKey, index, 'award', e.target.value)}
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

const EducationalBackground = () => {

  const { toast } = useToast()
  
  const { applicant, educations, flash } = usePage().props
  
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Recruitment', href: '#' },
    { label: 'Applicants', href: route('applicants.index') },
    { 
      label: 'Edit Applicant: Educational Background', 
      href: route('applicants.edit', { 
        id: applicant.id, 
        step: 'educationalBackground' 
      }) 
    },
  ]

  const { data, setData, put, processing, errors } = useForm({
    step: 'educationalBackground',
    elementary: educations.elementary ?? [],
    secondary: educations.secondary ?? [],
    vocational: educations.vocational ?? [],
    college: educations.college ?? [],
    graduate: educations.graduate ?? [],
  });

  const levels = [
    { id: 'elementary', label: 'Elementary' },
    { id: 'secondary', label: 'Secondary' },
    { id: 'vocational', label: 'Vocational/Trade Course' },
    { id: 'college', label: 'College' },
    { id: 'graduate', label: 'Graduate Studies' },
  ]

  const handleAddEducation = (dataKey) => {
    const newEntry = {
      level: dataKey,
      course: "",
      school: "",
      highest_attainment: "",
      from_date: "",
      from_year: "",
      to_date: "",
      to_year: "",
      award: "",
      year_graduated: "",
    }
    setData(prevData => ({
      ...prevData,
      [dataKey]: [...(prevData[dataKey] ?? []), newEntry]
    }))
  }

  const handleUpdateEducation = (dataKey, index, field, value) => {
    setData(prevData => {
      const newData = {
        ...prevData,
        [dataKey]: prevData[dataKey].map((entry, i) =>
          i === index ? { ...entry, [field]: value } : entry
        )
      }
      if (field === 'is_graduated' && value === false) {
        newData[dataKey][index].year_graduated = ""
      }
      return newData
    })
  }

  const handleRemoveEducation = (dataKey, index) => {
    setData(prevData => ({
      ...prevData,
      [dataKey]: prevData[dataKey].filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    console.log(data)
    
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
      <PageTitle pageTitle="Edit Educational Background" description="Accomplish the form to edit educational background of an applicant." breadcrumbItems={breadcrumbItems} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-semibold text-lg flex items-center">
              <GraduationCap className="mr-2 h-4 w-4" /> Educational Background
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {levels.map(level => (
              <EducationSection
                key={level.id}
                dataKey={level.id}
                level={level.label}
                onAdd={handleAddEducation}
                onUpdate={handleUpdateEducation}
                onRemove={handleRemoveEducation}
                errors={errors}
                data={data[level.id]}
              />
            ))}
          </CardContent>
          <CardFooter>
            <div className="flex w-full justify-end gap-2">
              <Button type="submit" disabled={processing}>
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {data.id ? 'Update Educational Background' : 'Save Educational Background'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default EducationalBackground
