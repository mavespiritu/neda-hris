import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import DatePicker from "@/components/DatePicker"
import TextInput from "@/components/TextInput"
import { Button } from "@/components/ui/button"
import { Fieldset } from "@/components/Fieldset"
import usePdsStore from '@/stores/usePdsStore'
import { SquareLibrary, Plus, Trash2 } from 'lucide-react'
import SingleComboBox from "@/components/SingleComboBox"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from 'react'
import PageTitle from "@/components/PageTitle"
import { useForm, usePage, Link } from '@inertiajs/react'
import Question from "./Question"
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
import { 
    ChevronLeft,
    Loader2
 } from 'lucide-react'

const OtherInformation = () => {

  const { toast } = useToast()

  const { applicant, otherInformation, flash } = usePage().props

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Recruitment', href: '#' },
    { label: 'Applicants', href: route('applicants.index') },
    { 
      label: 'Edit Applicant: Other Information', 
      href: route('applicants.edit', { 
        id: applicant.id, 
        step: 'otherInformation' 
      }) 
    },
  ]

  const { data, setData, put, processing, errors } = useForm({
    step: 'otherInformation',
    otherInformation,
  })

  // === SKILLS ===
  const handleAddSkill = () => {
    const newSkill = { type: "hobbies", description: "" }
    setData(prev => ({
      ...prev,
      otherInformation: {
        ...prev.otherInformation,
        skills: [...(prev.otherInformation.skills || []), newSkill],
      },
    }))
  }

  const handleUpdateSkill = (index, field, value) => {
    setData(prev => ({
      ...prev,
      otherInformation: {
        ...prev.otherInformation,
        skills: prev.otherInformation.skills.map((s, i) =>
          i === index ? { ...s, [field]: value } : s
        ),
      },
    }))
  }

  const handleRemoveSkill = (index) => {
    setData(prev => ({
      ...prev,
      otherInformation: {
        ...prev.otherInformation,
        skills: prev.otherInformation.skills.filter((_, i) => i !== index),
      },
    }))
  }


  // === RECOGNITIONS ===
  const handleAddRecognition = () => {
    const newRecognition = { type: "recognition", description: "" }
    setData(prev => ({
      ...prev,
      otherInformation: {
        ...prev.otherInformation,
        recognitions: [...(prev.otherInformation.recognitions || []), newRecognition],
      },
    }))
  }

  const handleUpdateRecognition = (index, field, value) => {
    setData(prev => ({
      ...prev,
      otherInformation: {
        ...prev.otherInformation,
        recognitions: prev.otherInformation.recognitions.map((r, i) =>
          i === index ? { ...r, [field]: value } : r
        ),
      },
    }))
  }

  const handleRemoveRecognition = (index) => {
    setData(prev => ({
      ...prev,
      otherInformation: {
        ...prev.otherInformation,
        recognitions: prev.otherInformation.recognitions.filter((_, i) => i !== index),
      },
    }))
  }


  // === MEMBERSHIPS ===
  const handleAddMembership = () => {
    const newMembership = { type: "membership", description: "" }
    setData(prev => ({
      ...prev,
      otherInformation: {
        ...prev.otherInformation,
        memberships: [...(prev.otherInformation.memberships || []), newMembership],
      },
    }))
  }

  const handleUpdateMembership = (index, field, value) => {
    setData(prev => ({
      ...prev,
      otherInformation: {
        ...prev.otherInformation,
        memberships: prev.otherInformation.memberships.map((m, i) =>
          i === index ? { ...m, [field]: value } : m
        ),
      },
    }))
  }

  const handleRemoveMembership = (index) => {
    setData(prev => ({
      ...prev,
      otherInformation: {
        ...prev.otherInformation,
        memberships: prev.otherInformation.memberships.filter((_, i) => i !== index),
      },
    }))
  }


  // === REFERENCES ===
  const handleUpdateReference = (index, field, value) => {
    setData(prev => ({
      ...prev,
      otherInformation: {
        ...prev.otherInformation,
        references: prev.otherInformation.references.map((r, i) =>
          i === index ? { ...r, [field]: value } : r
        ),
      },
    }))
  }


  // === QUESTIONS ===
  const handleUpdateQuestion = (qIndex, subIndex, field, value) => {
    setData(prev => {
      const updatedQuestions = prev.otherInformation.questions.map((q, i) => {
        if (i !== qIndex) return q

        // If updating a subquestion
        if (subIndex !== null && subIndex !== undefined) {
          return {
            ...q,
            subQuestions: q.subQuestions?.map((sq, si) =>
              si === subIndex ? { ...sq, [field]: value } : sq
            ),
          }
        }

        // Otherwise updating the main question
        return { ...q, [field]: value }
      })

      return {
        ...prev,
        otherInformation: {
          ...prev.otherInformation,
          questions: updatedQuestions,
        },
      }
    })
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
      <PageTitle pageTitle="Edit Other Information" description="Accomplish the form to edit other information of an applicant." breadcrumbItems={breadcrumbItems} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-semibold text-lg flex items-center"><SquareLibrary className="mr-2 h-4 w-4"/> Other Information</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Fieldset legend="Special Skills and Hobbies" className="bg-muted">
              <div className="border rounded-lg my-2 bg-white">
                <Table className="text-sm">
                  <TableHeader>
                      <TableRow>
                          <TableHead className="w-[5%]">#</TableHead>
                          <TableHead>Special Skills and Hobbies</TableHead>
                          <TableHead className="w-[5%]"></TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                  {data.otherInformation.skills?.map((child, index) => (
                    <TableRow key={index}>
                      <TableCell>{ index + 1 }</TableCell>
                      <TableCell>
                        <TextInput
                          id={`skills.description_${index}`}
                          value={child.description}
                          onChange={(e) => handleUpdateSkill(index, 'description', e.target.value)}
                          isInvalid={!!errors[`otherInformation.skills.${index}.description`]}
                        />
                        {errors[`otherInformation.skills.${index}.description`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`otherInformation.skills.${index}.description`]}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          type="button"
                          variant="destructive" 
                          onClick={() => handleRemoveSkill(index)}
                          className="flex"
                          size="sm"
                          >
                          
                          <Trash2 className="h-4 w-4" />
                        </Button></TableCell>
                    </TableRow>
                  ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Button type="button" onClick={() => handleAddSkill()} variant="outline" className="w-full">
                          <Plus className="h-4 w-4" />
                          Add Entry
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </Fieldset>
            <Fieldset legend="Non-Academic Distinctions/Recognition" className="bg-muted">
              <div className="border rounded-lg my-2 bg-white">
                <Table className="text-sm">
                  <TableHeader>
                      <TableRow>
                          <TableHead className="w-[5%]">#</TableHead>
                          <TableHead>Non-Academic Distinctions/Recognition</TableHead>
                          <TableHead className="w-[5%]"></TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                  {data.otherInformation.recognitions?.map((child, index) => (
                    <TableRow key={index}>
                      <TableCell>{ index + 1 }</TableCell>
                      <TableCell>
                        <TextInput
                          id={`recognitions.description_${index}`}
                          value={child.description}
                          onChange={(e) => handleUpdateRecognition(index, 'description', e.target.value)}
                          isInvalid={!!errors[`otherInformation.recognitions.${index}.description`]}
                        />
                        {errors[`otherInformation.recognitions.${index}.description`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`otherInformation.recognitions.${index}.description`]}
                          </p>
                        )}
                      </TableCell>
                      <TableCell><Button 
                          type="button"
                          variant="destructive" 
                          onClick={() => handleRemoveRecognition(index)}
                          className="flex"
                          size="sm"
                          >
                          
                          <Trash2 className="h-4 w-4" />
                        </Button></TableCell>
                    </TableRow>
                  ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Button type="button" onClick={() => handleAddRecognition()} variant="outline" className="w-full">
                          <Plus className="h-4 w-4" />
                          Add Entry
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </Fieldset>
            <Fieldset legend="Membership in Association/Organization" className="bg-muted">
              <div className="border rounded-lg my-2 bg-white">
                <Table className="text-sm">
                  <TableHeader>
                      <TableRow>
                          <TableHead className="w-[5%]">#</TableHead>
                          <TableHead>Membership in Association/Organization</TableHead>
                          <TableHead className="w-[5%]"></TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                  {data.otherInformation.memberships?.map((child, index) => (
                    <TableRow key={index}>
                      <TableCell>{ index + 1 }</TableCell>
                      <TableCell>
                        <TextInput
                          id={`memberships.description_${index}`}
                          value={child.description}
                          onChange={(e) => handleUpdateMembership(index, 'description', e.target.value)}
                          isInvalid={!!errors[`otherInformation.memberships.${index}.description`]}
                        />
                        {errors[`otherInformation.memberships.${index}.description`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`otherInformation.memberships.${index}.description`]}
                          </p>
                        )}
                      </TableCell>
                      <TableCell><Button 
                          type="button"
                          variant="destructive" 
                          onClick={() => handleRemoveMembership(index)}
                          className="flex"
                          size="sm"
                          >
                          
                          <Trash2 className="h-4 w-4" />
                        </Button></TableCell>
                    </TableRow>
                  ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Button type="button" onClick={() => handleAddMembership()} variant="outline" className="w-full">
                          <Plus className="h-4 w-4" />
                          Add Entry
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </Fieldset>
            <Fieldset legend="Questions" className="bg-muted">
              <div className="border rounded-lg p-4 bg-white">
              {data.otherInformation.questions?.map((q, i) => (
                <Question
                  key={i}
                  qIndex={i}
                  question={q}
                  handleUpdateQuestion={handleUpdateQuestion}
                  errors={errors}
                />
              ))}
              </div>
            </Fieldset>
            <Fieldset legend="References" className="bg-muted">
              <p className="text-sm">Person not related by consanguinity or affinity to applicant /appointee</p>
              <div className="border rounded-lg my-2 bg-white">
                <Table className="text-sm">
                  <TableHeader>
                      <TableRow>
                          <TableHead className="w-[5%]">#</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Telephone/Mobile No.</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                  {data.otherInformation.references?.map((child, index) => (
                    <TableRow key={index}>
                      <TableCell>{ index + 1 }</TableCell>
                      <TableCell>
                        <TextInput
                          id={`references.name_${index}`}
                          value={child.name}
                          onChange={(e) => handleUpdateReference(index, 'name', e.target.value)}
                          isInvalid={!!errors[`otherInformation.references.${index}.name`]}
                        />
                        {errors[`otherInformation.references.${index}.name`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`otherInformation.references.${index}.name`]}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <TextInput
                          id={`references.address_${index}`}
                          value={child.address}
                          onChange={(e) => handleUpdateReference(index, 'address', e.target.value)}
                          isInvalid={!!errors[`otherInformation.references.${index}.address`]}
                        />
                        {errors[`otherInformation.references.${index}.address`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`otherInformation.references.${index}.address`]}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <TextInput
                          id={`references.contact_no_${index}`}
                          value={child.contact_no}
                          onChange={(e) => handleUpdateReference(index, 'contact_no', e.target.value)}
                          isInvalid={!!errors[`otherInformation.references.${index}.contact_no`]}
                        />
                        {errors[`otherInformation.references.${index}.contact_no`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`otherInformation.references.${index}.contact_no`]}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  </TableBody>
                </Table>
              </div>
            </Fieldset>
          </CardContent>
          <CardFooter>
            <div className="flex w-full justify-end gap-2">
              <Button type="submit" disabled={processing}>
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {data.id ? 'Update Other Information' : 'Save Other Information'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default OtherInformation