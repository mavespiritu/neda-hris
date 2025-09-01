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
import FileUpload from "@/components/FileUpload"
import TextArea from "@/components/TextArea"

const TrainingForm = ({ open, onClose }) => {
  const { toast } = useToast()

  const {
      selectedIndicator,
      selectedStaff,
      fetchTrainings,
      trainings,
      selectedEvidence,
      fetchEvidence,
      selectedEvidenceData,
      submitEvidence,
      selectedEvidenceType,
      setSelectedEvidenceType,
      setSelectedEvidence
  } = store()

  const [fileErrorMessage, setFileErrorMessage] = useState("")

  const initialValues = {
    id: null,
    indicator_id: null,
    training_id: null,
    description: "",
    oldFiles: [],
    removedFiles: [],
    isEdit: false
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

  const handleFileSelect = (files) => {
    setData((prevData) => ({
        ...prevData,
        newFiles: [...files],
    }))
  }

  const handleFileRemove = (fileToRemove) => {
    setData((prevData) => ({
      ...prevData,
      oldFiles: prevData.oldFiles.filter((file) => file.id !== fileToRemove.id),
      removedFiles: [...(Array.isArray(prevData.removedFiles) ? prevData.removedFiles : []), fileToRemove],
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    submitEvidence({
        form: { data, post, put, reset, clearErrors },
        toast,
        type: selectedEvidenceType,
        onClose
    })
  }

  useEffect(() => {
    if (open) {
      if (selectedEvidence) {
          fetchEvidence({
          id: selectedStaff.value, 
          filters: {
            evidence_id: selectedEvidence.id
          }})
      }
      fetchTrainings({ id: selectedStaff.value })
      clearErrors()
      setFileErrorMessage("")
    } else {
      reset()
      setSelectedEvidence(null)
    }
  }, [open])

  useEffect(() => {
    setData(prev => {
        let updatedData = {
            ...prev,
            indicator_id: selectedIndicator.indicator_id ?? null,
        }

        if (selectedEvidence && selectedEvidenceData.data) {
            updatedData = {
                ...updatedData,
                id: selectedEvidence.id ?? null,
                training_id: `${selectedEvidenceData.data.seminar_title}__${selectedEvidenceData.data.from_date}` || null,
                description: selectedEvidence.description ?? "",
                oldFiles: selectedEvidenceData.data.files ?? [],
                removedFiles: [],
                newFiles: [],
                isEdit: true,
            }
        }

        return updatedData
    })
  }, [selectedEvidence, selectedEvidenceData.data])

  useEffect(() => {
    if (data.newFiles) {

        const errorMessages = []

        data.newFiles.forEach((_, index) => {
            const fileError = errors?.[`newFiles.${index}`]

            if (fileError) {
                const message = Array.isArray(fileError) ? fileError.join(', ') : fileError
                errorMessages.push(`File ${index + 1}: ${message}`)
            }
        })

        setFileErrorMessage(errorMessages.length > 0 ? errorMessages.join('\n') : "")
    }
  }, [data.newFiles, errors])

  return (
    <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          {(trainings.isLoading || selectedEvidenceData.isLoading) && (
              <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-xs bg-black/30 rounded-lg">
                  <Loader2 className="h-10 w-10 animate-spin text-white" />
              </div>
          )}
          <DialogHeader>
              <DialogTitle>Add training as evidence</DialogTitle>
              <DialogDescription className="text-justify">
              Select from your trainings and give context for this indicator: <br/>
              <span className="font-medium underline">{selectedIndicator.indicator}</span>
              </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="training_id">Training</Label>
                <SingleComboBox 
                    items={trainings.data} 
                    onChange={(value => setData('training_id', value))}
                    invalidMessage={errors.training_id}
                    placeholder="Select training"
                    name="training"
                    id="training"
                    value={data.training_id}
                />
              {errors?.training_id && <span className="text-red-500 text-xs">{errors.training_id}</span>}
          </div>

          <div className="flex flex-col gap-2">
              <Label htmlFor="description">Details</Label>
              <TextArea 
                  name="description" 
                  onChange={(e => setData('description', e.target.value))}
                  invalidMessage={errors.description}
                  placeholder="Give context to the indicator here" 
                  id="description"
                  value={data.description}
              />
              {errors?.description && <span className="text-red-500 text-xs">{errors.description}</span>}
          </div>

          <div className="flex flex-col gap-2">
              <Label htmlFor="newFiles">Supporting Documents</Label>
              <FileUpload 
                  name="newFiles[]"
                  id="newFiles" 
                  invalidMessage={fileErrorMessage}
                  data={data.newFiles}
                  errors={errors}
                  onFilesSelect={handleFileSelect}
              />
              
              {progress && (
                  <>
                  <span className="text-xs">Uploading. Please wait</span>
                  <progress value={progress.percentage} max="100">
                      {progress.percentage}%
                  </progress>
              </>
              )}

              {fileErrorMessage ? (
                  <div className="text-red-500 text-xs">
                      {fileErrorMessage.split('\n').map((msg, index) => (
                          <span key={index}>
                              {msg}
                              <br />
                          </span>
                      ))}
                  </div>
              ) : (
              <div className="inline-flex justify-between text-xs text-muted-foreground">
                  <span>max no. of files: 5 (max of 5MB each)</span>
                  <span>allowed types: jpg, jpeg, png, pdf</span>
              </div>
              )}
              
              <div className="flex flex-col gap-4 my-4">
              { selectedEvidenceData.data !== null && <span className="text-sm font-medium">Choose files to remove:</span> }
              {data?.oldFiles.map((file, index) => (
                  <div key={index} className="flex justify-between items-center text-xs">
                  <a 
                      key={file.id}
                      href={`/storage/${file.path}`} 
                      className="text-xs text-blue-500 hover:underline cursor-pointer" 
                      download
                  >
                      {file.filename}
                  </a>
                  <a onClick={() => handleFileRemove(file)} className="text-xs hover:underline cursor-pointer" >Remove</a>
                  </div>
              ))}
              </div>
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

export default TrainingForm