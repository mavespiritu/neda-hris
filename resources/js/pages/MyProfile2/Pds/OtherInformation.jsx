import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Fieldset } from "@/components/Fieldset"
import { SquareLibrary, Plus, Trash2, Loader2 } from "lucide-react"
import TextInput from "@/components/TextInput"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import store from "../store"
import Question from "./Question"

const defaultOtherInformation = {
  skills: [],
  recognitions: [],
  memberships: [],
  questions: [],
  references: [
    { name: "", address: "", contact_no: "" },
    { name: "", address: "", contact_no: "" },
    { name: "", address: "", contact_no: "" },
  ],
}

const createInfoEntry = (type = "") => ({
  id: null,
  type,
  description: "",
  year: "",
})

const InfoTableSection = ({
  legend,
  dataKey,
  rows = [],
  errors = {},
  onAdd,
  onUpdate,
  onRemove,
}) => {
  return (
    <Fieldset legend={legend} className="bg-muted">
      <div className="border rounded-lg my-2 bg-white">
        <Table className="text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[5%]">#</TableHead>
              <TableHead>{legend}</TableHead>
              <TableHead className="w-[5%]"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={`${dataKey}-${row.id ?? index}`}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <TextInput
                    id={`${dataKey}.description_${index}`}
                    value={row.description || ""}
                    onChange={(e) => onUpdate(dataKey, index, "description", e.target.value)}
                    isInvalid={!!errors[`${dataKey}.${index}.description`]}
                  />
                  {errors[`${dataKey}.${index}.description`] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[`${dataKey}.${index}.description`]}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => onRemove(dataKey, index)}
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>
                <Button type="button" onClick={() => onAdd(dataKey)} variant="outline" className="w-full">
                  <Plus className="h-4 w-4" />
                  Add Entry
                </Button>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </Fieldset>
  )
}

const OtherInformation = ({
  applicantId,
  profileType,
  section = "otherInformation",
  errors = {},
}) => {
  const { loading, pdsState, fetchPdsSection, setPdsSection } = store()

  const otherInformation = pdsState.otherInformation || defaultOtherInformation

  const setData = (value) => {
    setPdsSection("otherInformation", value)
  }

  const handleAddEntry = (dataKey) => {
    const typeMap = {
      skills: "hobbies",
      recognitions: "recognition",
      memberships: "membership",
    }

    setData({
      ...otherInformation,
      [dataKey]: [
        ...(otherInformation[dataKey] || []),
        createInfoEntry(typeMap[dataKey] || ""),
      ],
    })
  }

  const handleUpdateEntry = (dataKey, index, field, value) => {
    setData({
      ...otherInformation,
      [dataKey]: (otherInformation[dataKey] || []).map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    })
  }

  const handleRemoveEntry = (dataKey, index) => {
    setData({
      ...otherInformation,
      [dataKey]: (otherInformation[dataKey] || []).filter((_, i) => i !== index),
    })
  }

  const handleUpdateQuestion = (itemNo, subItemNo, field, value) => {
    const updatedQuestions = (otherInformation.questions || []).map((question) => {
      if (question.item_no !== itemNo) return question

      if (subItemNo) {
        return {
          ...question,
          subQuestions: (question.subQuestions || []).map((subQuestion) =>
            subQuestion.list === subItemNo
              ? { ...subQuestion, [field]: value }
              : subQuestion
          ),
        }
      }

      return {
        ...question,
        [field]: value,
      }
    })

    setData({
      ...otherInformation,
      questions: updatedQuestions,
    })
  }

  const handleUpdateReference = (index, field, value) => {
    setData({
      ...otherInformation,
      references: (otherInformation.references || []).map((reference, i) =>
        i === index ? { ...reference, [field]: value } : reference
      ),
    })
  }

  useEffect(() => {
    fetchPdsSection(section, { applicantId, profileType })
  }, [applicantId, profileType, section])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-semibold text-lg flex items-center">
          <SquareLibrary className="mr-2 h-4 w-4" /> Other Information
        </CardTitle>
      </CardHeader>

      <CardContent className="relative">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-md bg-white/50 backdrop-blur-[2px]">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        <div className={`${loading ? "pointer-events-none blur-[1.5px] opacity-70" : ""} flex flex-col gap-4 transition`}>
          <InfoTableSection
            legend="Special Skills and Hobbies"
            dataKey="skills"
            rows={otherInformation.skills || []}
            errors={errors}
            onAdd={handleAddEntry}
            onUpdate={handleUpdateEntry}
            onRemove={handleRemoveEntry}
          />

          <InfoTableSection
            legend="Non-Academic Distinctions/Recognition"
            dataKey="recognitions"
            rows={otherInformation.recognitions || []}
            errors={errors}
            onAdd={handleAddEntry}
            onUpdate={handleUpdateEntry}
            onRemove={handleRemoveEntry}
          />

          <InfoTableSection
            legend="Membership in Association/Organization"
            dataKey="memberships"
            rows={otherInformation.memberships || []}
            errors={errors}
            onAdd={handleAddEntry}
            onUpdate={handleUpdateEntry}
            onRemove={handleRemoveEntry}
          />

          <Fieldset legend="Questions" className="bg-muted">
            <div className="border rounded-lg p-4 bg-white">
              {(otherInformation.questions || []).map((question, index) => (
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
            <p className="text-sm">Person not related by consanguinity or affinity to applicant/appointee</p>
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
                  {(otherInformation.references || []).map((reference, index) => (
                    <TableRow key={`reference-${index}`}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <TextInput
                          id={`references.name_${index}`}
                          value={reference.name || ""}
                          onChange={(e) => handleUpdateReference(index, "name", e.target.value)}
                          isInvalid={!!errors[`references.${index}.name`]}
                        />
                        {errors[`references.${index}.name`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`references.${index}.name`]}
                          </p>
                        )}
                      </TableCell>

                      <TableCell>
                        <TextInput
                          id={`references.address_${index}`}
                          value={reference.address || ""}
                          onChange={(e) => handleUpdateReference(index, "address", e.target.value)}
                          isInvalid={!!errors[`references.${index}.address`]}
                        />
                        {errors[`references.${index}.address`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`references.${index}.address`]}
                          </p>
                        )}
                      </TableCell>

                      <TableCell>
                        <TextInput
                          id={`references.contact_no_${index}`}
                          value={reference.contact_no || ""}
                          onChange={(e) => handleUpdateReference(index, "contact_no", e.target.value)}
                          isInvalid={!!errors[`references.${index}.contact_no`]}
                        />
                        {errors[`references.${index}.contact_no`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`references.${index}.contact_no`]}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Fieldset>
        </div>
      </CardContent>
    </Card>
  )
}

export default OtherInformation
