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
import PageTitle from "@/components/PageTitle"
import { useForm, usePage, Link } from '@inertiajs/react'
import { useToast } from "@/hooks/use-toast"
import { 
    ChevronLeft,
    Loader2
 } from 'lucide-react'

const VoluntaryWork = () => {

  const { toast } = useToast()

  const { applicant, voluntaryWork, flash } = usePage().props

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Recruitment', href: '#' },
    { label: 'Applicants', href: route('applicants.index') },
    { 
      label: 'Edit Applicant: Voluntary Work', 
      href: route('applicants.edit', { 
        id: applicant.id, 
        step: 'voluntaryWork' 
      }) 
    },
  ]

  const { data, setData, put, processing, errors } = useForm({
    step: 'voluntaryWork',
    voluntaryWork,
  })

  const handleAddVoluntaryWork = () => {
    const newVoluntaryWork = {
      org_name: "",
      org_address: "",
      from_date: "",
      to_date: "",
      hours: 0,
      nature_of_work: "",
    }

    setData("voluntaryWork", [...data.voluntaryWork, newVoluntaryWork])
  }

  const handleUpdateVoluntaryWork = (index, field, value) => {
    const updated = data.voluntaryWork.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    setData("voluntaryWork", updated)
  }

  const handleRemoveVoluntaryWork = (index) => {
    const updated = data.voluntaryWork.filter((_, i) => i !== index)
    setData("voluntaryWork", updated)
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
      <PageTitle pageTitle="Edit Voluntary Work" description="Accomplish the form to edit voluntary work of an applicant." breadcrumbItems={breadcrumbItems} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-semibold text-lg flex items-center"><Waypoints className="mr-2 h-4 w-4"/> Voluntary Work</CardTitle>
            <CardDescription>List your entries from the most recent up to the oldest.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {data.voluntaryWork?.map((child, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold">
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
                <CardContent className="flex flex-col gap-4 pt-4 border-t bg-muted">
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
                        <Label htmlFor={`from_date_${index}`}>Start Date</Label>
                        <DatePicker
                          placeholder="From"
                          onDateChange={(date) => handleUpdateVoluntaryWork(index, 'from_date', date)}
                          value={child.from_date}
                          invalidMessage={errors[`voluntaryWork.${index}.from_date`]}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`to_date_${index}`}>End Date</Label>
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
            <Button type="button" onClick={() => handleAddVoluntaryWork()} variant="outline" className="w-full bg-muted">
              <Plus className="h-4 w-4" />
              Add Record
            </Button>
          </CardContent>
          <CardFooter>
            <div className="flex w-full justify-end gap-2">
              <Button type="submit" disabled={processing}>
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {data.id ? 'Update Voluntary Work' : 'Save Voluntary Work'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default VoluntaryWork