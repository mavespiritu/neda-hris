import { useState, useEffect } from 'react'
import { Label } from "@/components/ui/label"
import MultipleComboBox from "@/components/MultipleComboBox"
import { usePage, useForm } from '@inertiajs/react'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import RichTextEditor from "@/components/RichTextEditor"
import TextArea from "@/components/TextArea"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
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
import QuestionRepoForm from "./QuestionRepoForm"

const QuestionForm = ({onBack, question = null}) => {

  const { toast } = useToast()

  const { vacancy, competencies } = usePage().props

  const [isQuestionRepoOpen, setIsQuestionRepoOpen] = useState(false)

  const defaultRatings = [
    {element: 'Scope/Context', score: 1, title: 'Basic', description: ''},
    {element: 'Scope/Context', score: 2, title: 'Intermediate', description: ''},
    {element: 'Scope/Context', score: 3, title: 'Advance', description: ''},
    {element: 'Scope/Context', score: 4, title: 'Superior', description: ''},
    {element: 'Complexity', score: 1, title: 'Basic', description: ''},
    {element: 'Complexity', score: 2, title: 'Intermediate', description: ''},
    {element: 'Complexity', score: 3, title: 'Advance', description: ''},
    {element: 'Complexity', score: 4, title: 'Superior', description: ''},
    {element: 'Autonomy and Responsibility', score: 1, title: 'Basic', description: ''},
    {element: 'Autonomy and Responsibility', score: 2, title: 'Intermediate', description: ''},
    {element: 'Autonomy and Responsibility', score: 3, title: 'Advance', description: ''},
    {element: 'Autonomy and Responsibility', score: 4, title: 'Superior', description: ''},
  ]

  const {
    data,
    setData,
    errors,
    processing,
    put,
    post
  } = useForm({
    id: question?.id || null,
    competencies: question?.competencyIds || [],
    question: question?.question || '',
    ratings: question?.ratings || defaultRatings,
  })

  const elements = [
    { 'value': 'Scope/Context', 'description': 'the contribution of the applicant in the delivery of the output was:'},
    { 'value': 'Complexity', 'description': 'the contributions of the applicant require:'},
    { 'value': 'Autonomy and Responsibility', 'description': 'the applicant completed the assigned tasks:'},
  ]

  const handleSubmit = (e) => {
    e.preventDefault()

    const successMessage = data.id 
    ? "Question has been updated successfully!" 
    : "Question has been created successfully!"

  const errorMessage = data.id 
    ? "Failed to update the question." 
    : "Failed to create the question."

    if (data.id) {
      put(route('vacancies.questions.update', {
        vacancy: vacancy.id,
        question: data.id
      }), {
        preserveScroll: true,
        onSuccess: () => {
          toast({
              title: "Success!",
              description: successMessage,
          })
          onBack()
        },
      })
    } else {
      post(route('vacancies.questions.store', vacancy.id), {
        preserveScroll: true,
        onSuccess: () => {
          toast({
              title: "Success!",
              description: successMessage,
          })
          onBack()
        },
      })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 p-4">
        <div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-start gap-y-1 md:gap-x-2">
          <Label></Label>
          <div className="flex justify-end">
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit inline-flex mb-2"
                onClick={() => setIsQuestionRepoOpen(true)}
              >
                Look for existing questions
              </Button>
            </div>
        </div>
        <div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-start gap-y-1 md:gap-x-2">
          <Label className="text-sm mb-1 md:mb-0">Competencies</Label>
          <div className="w-full">
            <MultipleComboBox 
                items={competencies} 
                onChange={(value) => setData("competencies", value)}
                invalidMessage={errors.competencies}
                placeholder="Select competencies"
                name="competencies"
                id="competencies"
                value={data.competencies}
                width="w-fit"
                className="w-full"
            />
            {errors?.competencies && (
              <span className="text-red-500 text-xs">{errors.competencies}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-start gap-y-1 md:gap-x-2">
          <Label className="text-sm mb-1 md:mb-0">Question</Label>
          <div className="w-full">
            <RichTextEditor
              name="question"
              value={data.question}
              onChange={(value) => setData("question", value)}
              isInvalid={!!errors.question}
              placeholder="Write the question..."
            />
            {errors?.question && (
              <span className="text-red-500 text-xs">{errors.question}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col md:grid md:grid-cols-[30%_70%] items-start md:items-start gap-y-1 md:gap-x-2">
          <Label className="text-sm mb-1 md:mb-0">Ratings</Label>
          <div>
          {elements.map((el) => (
            <div key={el.value} className="border rounded-lg my-2">
              <div className="bg-muted px-4 py-2 font-medium text-sm rounded-t-lg">
                {el.value} <span className="text-muted-foreground">— {el.description}</span>
              </div>
              <Table className="text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[15%]">Title</TableHead>
                    <TableHead className="w-[10%] text-center">Rating</TableHead>
                    <TableHead className="w-[75%]">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data.ratings || defaultRatings)
                    .filter((r) => r.element === el.value)
                    .map((rating, index) => (
                      <TableRow key={`${rating.element}-${rating.score}`}>
                        <TableCell>{rating.title}</TableCell>
                        <TableCell className="text-center">{rating.score}</TableCell>
                        <TableCell>
                          <TextArea
                            name={`description-${rating.element}-${rating.score}`}
                            value={rating.description || ''}
                            onChange={(e) => {
                              const updatedRatings = data.ratings.map((r) =>
                                r.element === rating.element && r.score === rating.score
                                  ? { ...r, description: e.target.value }
                                  : r
                              )
                              setData('ratings', updatedRatings)
                            }}
                            invalidMessage={
                              !!errors[`ratings.${index}.description`]
                            }
                            placeholder="Write the description..."
                          />
                          {errors?.[`ratings.${index}.description`] && (
                            <span className="text-red-500 text-xs">
                              {errors[`ratings.${index}.description`]}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
          <Button 
            variant="ghost"
            onClick={() => onBack()}
          >Cancel</Button>
          <Button type="submit" disabled={processing}>
            {processing ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
            {data.id ? "Update" : "Submit"}
          </Button>
      </div>
      <QuestionRepoForm isOpen={isQuestionRepoOpen} setIsOpen={setIsQuestionRepoOpen} setData={setData} />
    </form>
  )
}

export default QuestionForm