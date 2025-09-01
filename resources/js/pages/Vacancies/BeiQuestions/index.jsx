import Questions from "./Questions"
import CreateQuestion from "./CreateQuestion"
import EditQuestion from "./EditQuestion"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from 'react'
import { useToast } from "@/hooks/use-toast"
import { 
    Plus,
    ChevronLeft
} from 'lucide-react'
import { usePage, router } from '@inertiajs/react'

const BeiQuestions = () => {

  const { toast } = useToast()

  const { vacancy } = usePage().props

  const [view, setView] = useState("index")
  const [editingQuestion, setEditingQuestion] = useState(null)

  const handleEdit = (question) => {
    setEditingQuestion(question)
    setView("edit")
  }

  const handleDelete = ({ id }) => {
    
    if (!id) return

    router.delete(route('vacancies.questions.delete', {
      vacancy: vacancy.id,
      question: id,
    }), {
      preserveScroll: true,
      onSuccess: () => {
        toast({
            title: "Success!",
            description: 'Question deleted successfully!',
        })
      },
      onError: () => {
        toast({
            title: 'Error',
            description: 'Failed to delete the question.',
            variant: 'destructive',
        })
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
          <h3 className="font-bold text-lg">BEI Questions</h3>
          <p className="text-muted-foreground text-sm">All HRMPSB members can input questions and rating matrix here.</p>
      </div>
      <div className="flex flex-col gap-4 border rounded-lg p-4">
        {view === "index" && (
          <Button
            variant=""
            size="sm"
            className="w-fit inline-flex"
            onClick={() => setView("create")}
          >
            <Plus className="h-6 w-6" />
            <span>New Question</span>
          </Button>
        )}

        {["create", "edit"].includes(view) && (
          <Button
            variant="ghost"
            size="sm"
            className="w-fit inline-flex"
            onClick={() => setView("index")}
          >
            <ChevronLeft className="h-6 w-6" />
            <span>Back to Questions</span>
          </Button>
        )}

        {view === "index" && <Questions onEdit={handleEdit} onDelete={handleDelete} />}
        {view === "create" && <CreateQuestion onBack={() => setView("index")} />}
        {view === "edit" && editingQuestion && (
          <EditQuestion
            question={editingQuestion}
            onBack={() => {
              setEditingQuestion(null)
              setView("index")
            }}
          />
        )}
      </div>
    </div>
  )
}

export default BeiQuestions