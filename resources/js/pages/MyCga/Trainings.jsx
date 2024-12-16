import { Button } from "@/components/ui/button"
import useCgaTrainingStore from '@/stores/useCgaTrainingStore'
import ProposedTrainingForm from "./ProposedTrainingForm"
import { useState, useEffect } from 'react'
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { MessageCirclePlus, Pencil, Trash2 } from 'lucide-react'

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
import { useToast } from "@/hooks/use-toast"
import { useForm } from '@inertiajs/react'
import { Badge } from "@/components/ui/badge"
import { formatDateWithTime } from "@/lib/utils.jsx"

const Trainings = ({emp_id, position_id}) => {

    const {
        setToast,
        trainingsState: { 
            trainings,
            currentPage,
            selectedTraining,
            isFormModalOpen      
        },
        loadTrainings,
        openFormModal,
        closeFormModal,
        setCurrentPage
    } = useCgaTrainingStore()

    const { toast } = useToast()

    const { delete: destroy } = useForm()

    useEffect(() => {
      if(toast){
          setToast(toast)
      }
  }, [toast, setToast])

    useEffect(() => {
        loadTrainings(emp_id, position_id)
    }, [currentPage, emp_id])

    const handleAddOrUpdate = () => {
      loadTrainings(emp_id, position_id)
    }

    const handleDelete = async (training) => {

      //await deleteTraining(training, emp_id, position_id)

      destroy(`/my-cga/proposed-trainings/${training.id}`, {
        onSuccess: () => {
          toast({
            title: "Training Deleted",
            description: "The training was successfully deleted.",
            variant: "success",
          })

          loadTrainings(emp_id, position_id)
        },
        onError: (error) => {
          toast({
            title: "Error Deleting Training",
            description: error.message || "An unexpected error occurred.",
            variant: "destructive",
          })
        },
      })
    
    }

    const handlePaginationClick = (link, e) => {
      e.preventDefault()
      if (link.url) {
          const url = new URL(link.url)
          const params = new URLSearchParams(url.search)
          const page = params.get('page') 
          
          if (page) {
              setCurrentPage(parseInt(page, 10))
          }
      }
    }

    const total = trainings?.total || 0
    const startIndex = (currentPage - 1) * trainings.per_page + 1
    const endIndex = Math.min(startIndex + trainings.per_page - 1, total)

  return (
    <>
        <div className="flex justify-between items-start">
            <h4 className="font-semibold leading-normal text-lg tracking-tight">Proposed Trainings</h4>
            <Button onClick={() => openFormModal()}>Add Training</Button>
        </div>

        <div className="border rounded-lg my-2">
          <Table className="text-sm">
            <TableHeader>
                <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead className="w-[20%]">Competency</TableHead>
                    <TableHead>Title of Training</TableHead>
                    <TableHead className="w-[20%]">Date/Time Submitted</TableHead>
                    <TableHead></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
            {trainings.data && trainings.data.length > 0 ? (
              trainings.data.map((training, idx) => (
                <TableRow key={training.id}>
                  <TableCell>{(currentPage - 1) * trainings.per_page + idx + 1}</TableCell>
                  <TableCell>{training.competency}</TableCell>
                  <TableCell>{training.title}</TableCell>
                  <TableCell>{training.date_created ? formatDateWithTime(training.date_created) : <Badge variant="destructive">Not Submitted</Badge>}</TableCell>
                  <TableCell className="flex justify-end">
                    {!training.date_created && (
                      <AlertDialog>
                        <TooltipProvider>
                          <div className="flex">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="icon"
                                  size="sm"
                                  onClick={() => openFormModal(training)}
                                  className="p-1"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit training</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                  <Button variant="icon" size="sm" className="p-1">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete training</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you sure you want to delete training?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the training.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-0">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(training)}>Confirm</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-4">
                  No trainings found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
        </div>

        <div className="flex gap-2 items-center justify-between w-full">
            {trainings?.total > 20 && (
              <div className="flex items-center space-x-2">
                {trainings.links.map((link) =>
                  link.url ? (
                    <Button
                      key={link.label}
                      variant={link.active ? "default" : "outline"}
                      size="sm"
                      onClick={(e) => handlePaginationClick(link, e)}
                      dangerouslySetInnerHTML={{ __html: link.label }} // Renders the label directly
                      className="text-xs"
                    />
                  ) : (
                    <Button
                      key={link.label}
                      variant="outline"
                      size="sm"
                      disabled
                      dangerouslySetInnerHTML={{ __html: link.label }}
                      className="text-xs text-slate-400"
                    />
                  )
                )}
              </div>
            )}
            <div className="text-xs font-medium">
              Showing {endIndex > 0 ? startIndex : 0}-{endIndex} of {total} items
            </div>
          </div>

        <ProposedTrainingForm 
          emp_id={emp_id}
          position_id={position_id}
          selectedTraining={selectedTraining}
          open={isFormModalOpen} 
          onClose={closeFormModal}
          onSuccess={handleAddOrUpdate}
        />
    </>
  )
}

export default Trainings