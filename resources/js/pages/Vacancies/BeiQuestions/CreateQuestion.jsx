import QuestionForm from './QuestionForm'

const CreateQuestion = ({onBack}) => {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-normal font-semibold mb-2">Add New Question</h2>

      <QuestionForm onBack={onBack} />
    </div>
  )
}

export default CreateQuestion