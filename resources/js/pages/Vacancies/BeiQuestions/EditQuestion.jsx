import QuestionForm from './QuestionForm'

const EditQuestion = ({onBack, question}) => {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-normal font-semibold mb-2">Edit Question</h2>

      <QuestionForm onBack={onBack} question={question} />
    </div>
  )
}

export default EditQuestion