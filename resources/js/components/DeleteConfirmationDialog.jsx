import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useState } from 'react'
import { Trash2 } from 'lucide-react'

const DeleteConfirmationDialog = ({ onConfirm, type, variant, size }) => {
  const [open, setOpen] = useState(false)

  const handleConfirm = () => {
    onConfirm()
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <>
          {type === "icon" && (
            <Button size={size} variant={variant} onClick={() => setOpen(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {type === "text" && (
            
            <Button size={size} variant={variant} onClick={() => setOpen(true)}>
              Delete
            </Button>
          )}
          {type === "icon+text" && (
            
            <Button size={size} variant={variant} onClick={() => setOpen(true)}>
              <div className="inline-flex justify-start items-center gap-2">
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
            </div>
            </Button>
          )}
        </>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Are you sure you want to delete this item?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-0" onClick={() => setOpen(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default DeleteConfirmationDialog
