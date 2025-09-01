import PageTitle from "@/components/PageTitle"
import { useState, useEffect, useMemo } from 'react'
import { useHasRole } from '@/hooks/useAuth'
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { store } from './store'
import { useForm } from '@inertiajs/react'
import SingleComboBox from "@/components/SingleComboBox"
import TextInput from "@/components/TextInput"
import AmountInput from "@/components/AmountInput"
import RichTextEditor from "@/components/RichTextEditor"
import { usePage } from '@inertiajs/react'
import { Loader2 } from "lucide-react"
import IntegerInput from "@/components/IntegerInput"
import CompetencyForm from "./CompetencyForm"
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
import { SquareLibrary, Plus, Trash2 } from 'lucide-react'

const VacancyForm = () => {

    const { toast } = useToast()
    
    const { vacancy } = usePage().props

    const classifications = useMemo(() => [
      { value: "Executive", label: "Executive" },
      { value: "Middle Management", label: "Middle Management" },
      { value: "Professional & Supervisory & Technical", label: "Professional & Supervisory & Technical" },
      { value: "Clerical & General Staff", label: "Clerical & General Staff" },
    ], [])

    const appointmentStatuses = useMemo(() => [
      { label: 'Permanent', value: 'Permanent'},
      { label: 'Casual', value: 'Casual'},
      { label: 'Contractual', value: 'Contractual'},
      { label: 'Contract of Service', value: 'Contract of Service'},
      { label: 'Job Order', value: 'Job Order'},
      { label: 'Temporary', value: 'Temporary'},
    ], [])

    const divisions = useMemo(() => [
      { value: 'DRD', label: 'Development Research, Communication, and Advocacy Division', },
      { value: 'FAD', label: 'Finance and Administrative Division'},
      { value: 'ORD', label: 'Office of the Regional Director'},
      { value: 'PMED', label: 'Monitoring and Evaluation Division'},
      { value: 'PDIPBD', label: 'Project Development, Investment Programming and Budgeting Division'},
      { value: 'PFPD', label: 'Policy Formulation and Planning Division'},
    ], [])

    const {
        initialValues,
        submitVacancy,
        positions: {
            data: positionsData,
        },
        isCompetencyFormOpen,
        fetchPositions,
        fetchCompetenciesPerPosition,
        openCompetencyForm,
        closeCompetencyForm,
    } = store()

    const { 
        data, 
        setData, 
        post, 
        put,
        processing,
        errors, 
        reset,
        clearErrors 
    } = useForm(initialValues)

    useEffect(() => {
    if (!vacancy) return

    setData({
        ...initialValues,
        ...vacancy
    })
}, [vacancy])

    useEffect(() => {
        fetchPositions()
    }, [])

    const handleSubmit = (e) => {
        e.preventDefault()
        submitVacancy({
            form: { post, put, reset, clearErrors, data },
            toast
        })
    }

    const handleChange = (type, index, key, value) => {
      const updated = [...data.competencies[type]]
      updated[index][key] = value

      setData('competencies', {
        ...data.competencies,
        [type]: updated,
      })
    }

    const handleRemoveCompetency = (type, index) => {
      const updated = data.competencies[type].filter((_, i) => i !== index)
      setData('competencies', {
        ...data.competencies,
        [type]: updated,
      })
    }

    const renderCompetencyTable = (type, label) => (
      <div>
        <span className="text-sm font-medium">{label}</span>
        <div className="border rounded-lg my-2">
          <Table className="text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[5%]">#</TableHead>
                <TableHead className="w-[70%]">Competency</TableHead>
                <TableHead  className="w-[2s0%]">Level</TableHead>
                <TableHead className="w-[5%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.competencies?.[type] ?? []).map((competency, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{competency.competency}</TableCell>
                  <TableCell>
                    <IntegerInput
                      value={competency.level}
                      onChange={(val) => handleChange(type, index, "level", val)}
                      min={1}
                      max={5}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleRemoveCompetency(type, index)}
                      size="sm"
                    >
                      <Trash2 className="w-6 h-6" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4}>
                  <Button
                    type="button"
                    onClick={() => openCompetencyForm(type)}
                    variant="outline"
                    size="sm"
                    className="flex"
                  >
                    <Plus className="h-4 w-4" />
                    Add Competency
                  </Button>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
    )

    return (
        <form onSubmit={handleSubmit}>
          <Card>
              <CardHeader>
                  <CardTitle className="text-lg">Vacancy Form</CardTitle>
              </CardHeader>
              <CardContent>
              <div className="grid gap-y-4">
                  <div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-center gap-y-1 md:gap-x-2">
                      <Label className="text-sm mb-1 md:mb-0">Status of Appointment</Label>
                      <div className="w-full">
                        <SingleComboBox 
                            items={appointmentStatuses} 
                            onChange={(value) => {

                              setData((prev) => ({
                                ...prev,
                                appointment_status: value,
                                item_no: "",
                              }))

                            }}
                            invalidMessage={errors.appointment_status}
                            placeholder="Choose status"
                            name="appointment_status"
                            id="appointment_status"
                            value={data.appointment_status}
                            className="w-full"
                        />
                        {errors?.appointment_status && <span className="text-red-500 text-xs">{errors.appointment_status}</span>}
                      </div>
                  </div>
                  {data.appointment_status === 'Permanent' && 
                  (<div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-center gap-y-1 md:gap-x-2">
                      <Label className="text-sm mb-1 md:mb-0">Plantilla Item No.</Label>
                      <div className="w-full">
                        <SingleComboBox 
                            items={positionsData} 
                            onChange={(value) => {
                              const matched = positionsData.find(item => item.value === value)

                              setData((prev) => ({
                                ...prev,
                                item_no: value,
                                division: matched?.division_id || "",
                                sg: matched?.grade || "",
                                position: matched?.position_id || "",
                                position_description: matched?.position_description || "",
                                monthly_salary: matched?.salary || "",
                              }))

                              fetchCompetenciesPerPosition(value, setData)

                            }}
                            invalidMessage={errors.item_no}
                            placeholder="Choose item no."
                            name="item_no"
                            id="item_no"
                            value={data.item_no}
                            className="w-full"
                            disabled={data.appointment_status !== 'Permanent'}
                        />
                        {errors?.item_no && <span className="text-red-500 text-xs">{errors.item_no}</span>}
                      </div>
                  </div>)}
                  <div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-center gap-y-1 md:gap-x-2">
                      <Label className="text-sm mb-1 md:mb-0">Position</Label>
                      <div className="w-full">
                        <TextInput
                          name="position_description"
                          onChange={(e) => setData("position_description", e.target.value)}
                          isInvalid={errors.position_description}
                          placeholder=""
                          id="position_description"
                          value={data.position_description}
                          disabled={data.appointment_status === 'Permanent'}
                        />
                        {errors?.position_description && <span className="text-red-500 text-xs">{errors.position_description}</span>}
                      </div>
                  </div>
                  <div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-center gap-y-1 md:gap-x-2">
                      <Label className="text-sm mb-1 md:mb-0">Salary Grade</Label>
                      <div className="w-full">
                        <TextInput
                          name="sg"
                          onChange={(e) => setData("sg", e.target.value)}
                          isInvalid={errors.sg}
                          placeholder=""
                          id="sg"
                          value={data.sg}
                          disabled={data.appointment_status === 'Permanent'}
                        />
                        {errors?.sg && <span className="text-red-500 text-xs">{errors.sg}</span>}
                      </div>
                  </div>
                  <div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-center gap-y-1 md:gap-x-2">
                      <Label className="text-sm mb-1 md:mb-0">Monthly Salary</Label>
                      <div className="w-full">
                        <AmountInput
                          id="monthly_salary"
                          value={data.monthly_salary}
                          onChange={(value) => setData("monthly_salary", value)}
                          isInvalid={!!errors.monthly_salary}
                          disabled={data.appointment_status === 'Permanent'}
                        />
                        {errors?.monthly_salary && <span className="text-red-500 text-xs">{errors.monthly_salary}</span>}
                      </div>
                  </div>
                  <div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-center gap-y-1 md:gap-x-2">
                      <Label className="text-sm mb-1 md:mb-0">Division</Label>
                      <div className="w-full">
                        <SingleComboBox 
                            items={divisions} 
                            onChange={(value) => {
                              setData((prev) => ({
                                ...prev,
                                division: value,
                              }))
                            }}
                            invalidMessage={errors.division}
                            placeholder="Choose division"
                            name="division"
                            id="division"
                            value={data.division}
                            className="w-full"
                        />
                        {errors?.division && <span className="text-red-500 text-xs">{errors.division}</span>}
                      </div>
                  </div>
                  {data.appointment_status === 'Permanent' && 
                  (<div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-center gap-y-1 md:gap-x-2">
                      <Label className="text-sm mb-1 md:mb-0">Reports to</Label>
                      <div className="w-full">
                        <TextInput
                          name="reports_to"
                          onChange={(e) => setData("reports_to", e.target.value)}
                          isInvalid={errors.reports_to}
                          placeholder=""
                          id="reports_to"
                          value={data.reports_to}
                        />
                        {errors?.reports_to && <span className="text-red-500 text-xs">{errors.reports_to}</span>}
                      </div>
                  </div>)}
                 {data.appointment_status === 'Permanent' && 
                  (<div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-center gap-y-1 md:gap-x-2">
                      <Label className="text-sm mb-1 md:mb-0">Positions Supervised</Label>
                      <div className="w-full">
                        <TextInput
                          name="positions_supervised"
                          onChange={(e) => setData("positions_supervised", e.target.value)}
                          isInvalid={errors.positions_supervised}
                          placeholder=""
                          id="positions_supervised"
                          value={data.positions_supervised}
                        />
                        {errors?.positions_supervised && <span className="text-red-500 text-xs">{errors.positions_supervised}</span>}
                      </div>
                  </div>)}
                  {data.appointment_status === 'Permanent' && 
                  (<div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-center gap-y-1 md:gap-x-2">
                      <Label className="text-sm mb-1 md:mb-0">Classification</Label>
                      <div className="w-full">
                        <SingleComboBox 
                            items={classifications} 
                            onChange={(value) => {
                              setData((prev) => ({
                                ...prev,
                                classification: value,
                              }))
                            }}
                            invalidMessage={errors.classification}
                            placeholder="Choose classification"
                            name="classification"
                            id="classification"
                            value={data.classification}
                            className="w-full"
                        />
                        {errors?.classification && <span className="text-red-500 text-xs">{errors.classification}</span>}
                      </div>
                  </div>)}
                  <hr />
                  <div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-center gap-y-1 md:gap-x-2">
                      <Label className="text-sm mb-1 md:mb-0">A. Qualification Guide</Label>
                      
                  </div>
                
                  {data.appointment_status === 'Permanent' && 
                  (<fieldset className="border border-border rounded-2xl p-8 space-y-4">
                    <legend className="text-sm font-medium px-2">
                      CSC-Prescribed QS
                    </legend>

                    <div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-start gap-y-1 md:gap-x-2">
                      <Label className="text-sm mb-1 ml-0 md:mb-0">Education</Label>
                      <div className="w-full">
                        <RichTextEditor
                          name="prescribed_education"
                          value={data.prescribed_education}
                          onChange={(value) => setData("prescribed_education", value)}
                          isInvalid={!!errors.prescribed_education}
                          placeholder="Write the prescribed education..."
                        />
                        {errors?.prescribed_education && (
                          <span className="text-red-500 text-xs">{errors.prescribed_education}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-start gap-y-1 md:gap-x-2">
                      <Label className="text-sm mb-1 ml-0 md:mb-0">Experience</Label>
                      <div className="w-full">
                        <RichTextEditor
                          name="prescribed_experience"
                          value={data.prescribed_experience}
                          onChange={(value) => setData("prescribed_experience", value)}
                          isInvalid={!!errors.prescribed_experience}
                          placeholder="Write the prescribed experience..."
                        />
                        {errors?.prescribed_experience && (
                          <span className="text-red-500 text-xs">{errors.prescribed_experience}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-start gap-y-1 md:gap-x-2">
                      <Label className="text-sm mb-1 ml-0 md:mb-0">Training</Label>
                      <div className="w-full">
                        <RichTextEditor
                          name="prescribed_training"
                          value={data.prescribed_training}
                          onChange={(value) => setData("prescribed_training", value)}
                          isInvalid={!!errors.prescribed_training}
                          placeholder="Write the prescribed training..."
                        />
                        {errors?.prescribed_training && (
                          <span className="text-red-500 text-xs">{errors.prescribed_training}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-center gap-y-1 md:gap-x-2">
                        <Label className="text-sm mb-1 ml-0 md:mb-0">Eligibility</Label>
                        <div className="w-full">
                          <TextInput
                            name="prescribed_eligibility"
                            onChange={(e) => setData("prescribed_eligibility", e.target.value)}
                            isInvalid={errors.prescribed_eligibility}
                            placeholder=""
                            id="prescribed_eligibility"
                            value={data.prescribed_eligibility}
                          />
                          {errors?.prescribed_eligibility && <span className="text-red-500 text-xs">{errors.prescribed_eligibility}</span>}
                        </div>
                    </div>
                  </fieldset>)}
                  <fieldset className="border border-border rounded-2xl p-8 space-y-4">
                    <legend className="text-sm font-medium px-2">
                      Preferred Qualifications
                    </legend>
                    
                    <div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-start gap-y-1 md:gap-x-2">
                      <Label className="text-sm mb-1 ml-0 md:mb-0">Education</Label>
                      <div className="w-full">
                        <RichTextEditor
                          name="preferred_education"
                          value={data.preferred_education}
                          onChange={(value) => setData("preferred_education", value)}
                          isInvalid={!!errors.preferred_education}
                          placeholder="Write the preferred education..."
                        />
                        {errors?.preferred_education && (
                          <span className="text-red-500 text-xs">{errors.preferred_education}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-start gap-y-1 md:gap-x-2">
                      <Label className="text-sm mb-1 ml-0 md:mb-0">Experience</Label>
                      <div className="w-full">
                        <RichTextEditor
                          name="preferred_experience"
                          value={data.preferred_experience}
                          onChange={(value) => setData("preferred_experience", value)}
                          isInvalid={!!errors.preferred_experience}
                          placeholder="Write the preferred experience..."
                        />
                        {errors?.preferred_experience && (
                          <span className="text-red-500 text-xs">{errors.preferred_experience}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-start gap-y-1 md:gap-x-2">
                      <Label className="text-sm mb-1 ml-0 md:mb-0">Training</Label>
                      <div className="w-full">
                        <RichTextEditor
                          name="preferred_training"
                          value={data.preferred_training}
                          onChange={(value) => setData("preferred_training", value)}
                          isInvalid={!!errors.preferred_training}
                          placeholder="Write the preferred training..."
                        />
                        {errors?.preferred_training && (
                          <span className="text-red-500 text-xs">{errors.preferred_training}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-center gap-y-1 md:gap-x-2">
                        <Label className="text-sm mb-1 ml-0 md:mb-0">Eligibility</Label>
                        <div className="w-full">
                          <TextInput
                            name="preferred_eligibility"
                            onChange={(e) => setData("preferred_eligibility", e.target.value)}
                            isInvalid={errors.preferred_eligibility}
                            placeholder=""
                            id="preferred_eligibility"
                            value={data.preferred_eligibility}
                          />
                          {errors?.preferred_eligibility && <span className="text-red-500 text-xs">{errors.preferred_eligibility}</span>}
                        </div>
                    </div>
                    {data.appointment_status !== 'Permanent' && 
                    (<div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-start gap-y-1 md:gap-x-2">
                        <Label className="text-sm mb-1 ml-0 md:mb-0">Skills</Label>
                        <div className="w-full">
                          <RichTextEditor
                            name="preferred_skills"
                            value={data.preferred_skills}
                            onChange={(value) => setData("preferred_skills", value)}
                            isInvalid={!!errors.preferred_skills}
                            placeholder="Write the preferred skills..."
                          />
                          {errors?.preferred_skills && <span className="text-red-500 text-xs">{errors.preferred_skills}</span>}
                        </div>
                    </div>)}
                    {data.appointment_status === 'Permanent' && 
                    (<div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-center gap-y-1 md:gap-x-2">
                      <Label className="text-sm mb-1 ml-0 md:mb-0">NEDA Pre-employment Exam</Label>
                      <div className="w-full">
                        <TextInput
                          name="examination"
                          onChange={(e) => setData("examination", e.target.value)}
                          isInvalid={errors.examination}
                          placeholder=""
                          id="examination"
                          value={data.examination}
                        />
                        {errors?.examination && <span className="text-red-500 text-xs">{errors.examination}</span>}
                      </div>
                    </div>)}
                  </fieldset>
                  
                  <hr />
                  <div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-start gap-y-1 md:gap-x-2">
                    <Label className="text-sm mb-1 md:mb-0">B. Job Summary</Label>
                    <div className="w-full">
                      <RichTextEditor
                        name="summary"
                        value={data.summary}
                        onChange={(value) => setData("summary", value)}
                        isInvalid={!!errors.summary}
                        placeholder="Write the job summary..."
                      />
                      {errors?.summary && (
                        <span className="text-red-500 text-xs">{errors.summary}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-start gap-y-1 md:gap-x-2">
                    <Label className="text-sm mb-1 md:mb-0">C. Job Output</Label>
                    <div className="w-full">
                      <RichTextEditor
                        name="output"
                        value={data.output}
                        onChange={(value) => setData("output", value)}
                        isInvalid={!!errors.output}
                        placeholder="Write the job output..."
                      />
                      {errors?.output && (
                        <span className="text-red-500 text-xs">{errors.output}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-start gap-y-1 md:gap-x-2">
                    <Label className="text-sm mb-1 md:mb-0">D. Duties and Responsibilities</Label>
                    <div className="w-full">
                      <RichTextEditor
                        name="responsibility"
                        value={data.responsibility}
                        onChange={(value) => setData("responsibility", value)}
                        isInvalid={!!errors.responsibility}
                        placeholder="Write the duties and responsibilities..."
                      />
                      {errors?.responsibility && (
                        <span className="text-red-500 text-xs">{errors.responsibility}</span>
                      )}
                    </div>
                  </div>
                  {data.appointment_status === 'Permanent' && 
                  (<div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-start gap-y-1 md:gap-x-2">
                    <Label className="text-sm mb-1 md:mb-0">E. Competency Requirements</Label>
                    <div className="flex flex-col gap-4">
                      {renderCompetencyTable('organizational', 'Organizational')}
                      {renderCompetencyTable('leadership', 'Leadership/Managerial')}
                      {renderCompetencyTable('functional', 'Technical/Functional')}
                    </div>
                  </div>)}
                  <div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-start gap-y-1 md:gap-x-2">
                    <Label className="text-sm mb-1 md:mb-0">Remarks</Label>
                    <div className="w-full">
                      <RichTextEditor
                        name="remarks"
                        value={data.remarks}
                        onChange={(value) => setData("remarks", value)}
                        isInvalid={!!errors.remarks}
                        placeholder="Write the remarks..."
                      />
                      {errors?.remarks && (
                        <span className="text-red-500 text-xs">{errors.remarks}</span>
                      )}
                    </div>
                  </div>
              </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                  <Button variant="ghost">Cancel</Button>
                  <Button type="submit" disabled={processing}>
                    {processing ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                    {data.id ? "Update" : "Submit"}
                  </Button>
                  
              </CardFooter>
          </Card>
          <CompetencyForm
            open={isCompetencyFormOpen}
            onClose={closeCompetencyForm} 
            data={data}
            setData={setData}
          /> 
        </form>
    )
}

export default VacancyForm