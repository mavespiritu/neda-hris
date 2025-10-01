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
import { useForm } from '@inertiajs/react'
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

const OtherInformation = ({ data, setData, errors = {} }) => {

  const { 
    addSkill, 
    updateSkill, 
    removeSkill, 
    addRecognition, 
    updateRecognition,
    removeRecognition,
    addMembership,
    updateMembership,
    removeMembership,
    updateQuestion,
    updateReference
  } = usePdsStore()

  const handleAddSkill = () => {
    const newSkill = {
      type: "hobbies",
      description: "",
    }
    setData(prevData => ({
      ...prevData,
      skills: [...prevData.skills, newSkill]
    }))
    addSkill(newSkill)
  }

  const handleUpdateSkill = (index, field, value) => {
    setData(prevData => ({
      ...prevData,
      skills: prevData.skills.map((child, i) => 
        i === index ? { ...child, [field]: value } : child
      )
    }))
    updateSkill(index, field, value)
  }

  const handleRemoveSkill = (index) => {
    setData(prevData => ({
      ...prevData,
      skills: prevData.skills.filter((_, i) => i !== index)
    }))
    removeSkill(index)
  }

  const handleAddRecognition = () => {
    const newRecognition = {
      type: "recognition",
      description: "",
    }
    setData(prevData => ({
      ...prevData,
      recognitions: [...prevData.recognitions, newRecognition]
    }))
    addRecognition(newRecognition)
  }

  const handleUpdateRecognition = (index, field, value) => {
    setData(prevData => ({
      ...prevData,
      recognitions: prevData.recognitions.map((child, i) => 
        i === index ? { ...child, [field]: value } : child
      )
    }))
    updateRecognition(index, field, value)
  }

  const handleRemoveRecognition = (index) => {
    setData(prevData => ({
      ...prevData,
      recognitions: prevData.recognitions.filter((_, i) => i !== index)
    }))
    removeRecognition(index)
  }

  const handleAddMembership = () => {
    const newMembership = {
      type: "membership",
      description: "",
    }
    setData(prevData => ({
      ...prevData,
      memberships: [...prevData.memberships, newMembership]
    }))
    addMembership(newMembership)
  }

  const handleUpdateMembership = (index, field, value) => {
    setData(prevData => ({
      ...prevData,
      memberships: prevData.memberships.map((child, i) => 
        i === index ? { ...child, [field]: value } : child
      )
    }))
    updateMembership(index, field, value)
  }

  const handleRemoveMembership = (index) => {
    setData(prevData => ({
      ...prevData,
      memberships: prevData.memberships.filter((_, i) => i !== index)
    }))
    removeMembership(index)
  }

  const handleUpdateQuestion = (itemNo, subItemNo, field, value) => {
    setData(prevData => {
      const updatedQuestions = prevData.questions.map((q) => {
        if (q.item_no !== itemNo) return q

        if (subItemNo) {
          const updatedSubQuestions = q.subQuestions?.map((sq) =>
            sq.list === subItemNo ? { ...sq, [field]: value } : sq
          )
          return { ...q, subQuestions: updatedSubQuestions }
        }

        return { ...q, [field]: value }
      })

      return {
        ...prevData,
        questions: updatedQuestions
      }
    })

    updateQuestion(itemNo, subItemNo, field, value)
  }


  const handleUpdateReference = (index, field, value) => {
    setData(prevData => ({
      ...prevData,
      references: prevData.references.map((child, i) => 
        i === index ? { ...child, [field]: value } : child
      )
    }))
    updateReference(index, field, value)
  }

  return (
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
              {data.skills.map((child, index) => (
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
              {data.recognitions.map((child, index) => (
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
              {data.memberships.map((child, index) => (
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
          {data.questions.map((question, index) => (
            <Question 
              key={`question-${index}`}
              question={question} 
              questionIndex={index}
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
              {data.references.map((child, index) => (
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
    </Card>
  )
}

export default OtherInformation