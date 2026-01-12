import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { store } from './store'
import { useToast } from "@/hooks/use-toast"
import { useForm } from '@inertiajs/react'
import SingleComboBox from "@/components/SingleComboBox"
import { Loader2 } from "lucide-react"
import TextInput from "@/components/TextInput"
import IntegerInput from "@/components/IntegerInput"
import AmountInput from "@/components/AmountInput"
import { useHasRole } from '@/hooks/useAuth'

const ProposedTrainingForm = ({ 
  submission,
  open, 
  onClose 
}) => {
  const { toast } = useToast()

  const modalityOptions = [
    {value: "Hybrid", label: "Hybrid"},
    {value: "F2F", label: "F2F"},
    {value: "Virtual", label: "Virtual"},
    {value: "Synchronous", label: "Synchronous"},
  ]

  const canAddTraining = useHasRole(['HRIS_HR'])

  const {
    fetchTrainingOptions,
    trainingOptions,
    competencies,
    fetchCompetencies,
    selectedProposedTraining,
    setSelectedProposedTraining,
    resetCompetencies,
    submitProposedTraining,
    submissions,
    fetchSubmissions
  } = store()

  const initialValues = {
    id: null,
    competency_id: null,
    training_id: null,
    emp_id: null,
    position_id: null,
    training_title: "",
    review_id: null,
    no_of_hours: null,
    cost: 0,
    modality: null
  }

  const {
    data,
    setData,
    post,
    put,
    processing,
    errors,
    reset,
    clearErrors,
    progress
  } = useForm(initialValues)

  /* const emp_id = selectedStaff?.value ?? null
  const item_no = selectedStaff?.designation?.item_no ?? selectedStaff?.item_no ?? null
  const position = selectedStaff?.designation?.position ?? selectedStaff?.position ?? null */

  const actualSubmission = selectedProposedTraining
  ? submissions.data?.data?.find(sub =>
      sub.emp_id === (selectedProposedTraining?.emp_id ?? emp_id) &&
      sub.position_id === (selectedProposedTraining?.position_id ?? submission.position_id) &&
      sub.date_created === (selectedProposedTraining?.date_created ?? null)
    )
  : submission

  const mode = (() => {
    if (selectedProposedTraining && actualSubmission) return 'edit-submitted'
    if (!selectedProposedTraining && actualSubmission) return 'add-submitted'
    if (selectedProposedTraining && !actualSubmission) return 'edit'
    return 'add'
  })()

  const handleSubmit = (e) => {
    e.preventDefault()
    submitProposedTraining({
      submission_id: submission.id,
      form: { data, post, put, reset, clearErrors },
      toast,
      onClose
    })
  }

  useEffect(() => {
    if (open) {
      fetchTrainingOptions()
      fetchSubmissions({ id: submission.emp_id })

      fetchCompetencies({
        id: submission.emp_id,
        filters: {
          item_no: submission.position_id,
          review_id: actualSubmission?.id ?? null,
          mode,
          all: canAddTraining
        }
      })

      setData(prev => ({
        ...prev,
        emp_id: submission.emp_id,
        position_id: submission.position_id,
        review_id: actualSubmission?.id ?? null
      }))

      clearErrors()
    } else {
      reset()
      setSelectedProposedTraining(null)
      resetCompetencies()
    }
  }, [open])

  useEffect(() => {
    if (selectedProposedTraining) {
      setData({
        id: selectedProposedTraining.id ?? null,
        competency_id: selectedProposedTraining.competency_id ?? null,
        training_id: selectedProposedTraining.training_id ?? null,
        training_title: selectedProposedTraining.training_title ?? "",
        emp_id: submission.emp_id,
        position_id: submission.position_id,
        review_id: actualSubmission?.id ?? null,
        no_of_hours: selectedProposedTraining.no_of_hours ?? null,
        cost: selectedProposedTraining.cost ?? null,
        modality: selectedProposedTraining.modality ?? null,
      })
    }
  }, [selectedProposedTraining])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        {(trainingOptions.isLoading || competencies.isLoading) && (
          <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-xs bg-black/30 rounded-lg">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>
        )}
        <DialogHeader>
          <DialogTitle>
            {mode.startsWith('edit') ? 'Edit Training' : 'Add Training'}
          </DialogTitle>
          <DialogDescription className="text-justify">
            {mode.startsWith('edit') ? 'Update the training to address competency gaps.' : 'Add a training to help you address competency gaps.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="competency_id">Propose training for:</Label>
            <span className="text-sm border rounded-sm py-2 px-4">{submission.position} ({submission.position_id})</span>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="competency_id">Competency</Label>
            <SingleComboBox
              items={competencies.data}
              onChange={(value) => setData('competency_id', value)}
              invalidMessage={errors.competency_id}
              placeholder="Select competency"
              name="competency"
              id="competency"
              value={data.competency_id}
            />
            {errors?.competency_id && <span className="text-red-500 text-xs">{errors.competency_id}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="training_id">Training</Label>
            <SingleComboBox
              items={trainingOptions.data}
              onChange={(value) => {
                const training = trainingOptions.data.find(t => t.value === value)

                setData(prev => ({
                    ...prev,
                    training_id: value,
                    training_title: '',
                    no_of_hours: training.no_of_hours,
                    cost: training.cost,
                    modality: training.modality,
                }))
            }}
              invalidMessage={errors.training_id}
              placeholder="Select training"
              name="training"
              id="training"
              value={data.training_id}
            />
            {errors?.training_id && <span className="text-red-500 text-xs">{errors.training_id}</span>}
          </div>

          <div className="flex items-center justify-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="px-4 text-center text-sm font-medium">or</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="training_title">Type the title of training manually</Label>
            <TextInput
              name="training_title"
              onChange={(e) => {
                const value = e.target.value
                setSelectedProposedTraining(null)
                setData(prev => ({
                  ...prev,
                  training_title: value,
                  training_id: null
                }))
              }}
              isInvalid={errors.training_title}
              placeholder="Type the title of training"
              id="training_title"
              value={data.training_title}
            />
            {errors?.training_title && <span className="text-red-500 text-xs">{errors.training_title}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="no_of_hours">No. of Hours</Label>
            <IntegerInput
                id="no_of_hours"
                value={data.no_of_hours}
                onChange={(value) => {
                    setData(prev => ({
                    ...prev,
                    no_of_hours: value,
                    }))
                }}
                isInvalid={errors.no_of_hours}
                disabled={!!data.training_id}
            />
            {errors?.no_of_hours && (
                <span className="text-red-500 text-xs">{errors.no_of_hours}</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="cost">Cost</Label>
            <AmountInput
                id="cost"
                value={data.cost ?? ""}
                onChange={(value) => {
                    setData(prev => ({
                    ...prev,
                    cost: value,
                    }))
                }}
                isInvalid={errors.cost}
                disabled={!!data.training_id}
            />
            {errors?.cost && (
                <span className="text-red-500 text-xs">{errors.cost}</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="modality">Modality</Label>
            <SingleComboBox
              items={modalityOptions}
              onChange={(value) => {
                setData(prev => ({
                    ...prev,
                    modality: value,
                }))
            }}
              invalidMessage={errors.modality}
              placeholder="Select modality"
              name="modality"
              id="modality"
              value={data.modality}
              disabled={!!data.training_id}
            />
            {errors?.modality && <span className="text-red-500 text-xs">{errors.modality}</span>}
          </div>

          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Please wait</span>
                </>
              ) : 'Submit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ProposedTrainingForm
