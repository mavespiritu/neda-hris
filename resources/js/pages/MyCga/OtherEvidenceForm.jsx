import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
  } from "@/components/ui/dialog"

import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from 'react'
import { router, useForm } from '@inertiajs/react'
import TextArea from "@/components/TextArea"
import TextInput from "@/components/TextInput"
import { DateRangePicker } from "@/components/DateRangePicker"
import FileUpload from "@/components/FileUpload"
import { useToast } from "@/hooks/use-toast"
import dayjs from 'dayjs'
import { Loader2 } from "lucide-react"

const OtherEvidenceForm = ({ emp_id, evidence, indicator, open, onClose, onSuccess }) => {

  const { toast } = useToast()

  const [fileErrorMessage, setFileErrorMessage] = useState("")

  const initialValues = {
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    newFiles: [],
    oldFiles: [],
    removedFiles: []
  }

  const { data, setData, post, processing, errors, clearErrors, reset, progress } = useForm(initialValues)

  const fetchEvidence = async () => {
    try {
        const response = await fetch(`/my-cga/evidence/${emp_id}?evidence_id=${evidence.id}`)
        if (!response.ok) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: "Network response was not ok",
            })
        }
        const data = await response.json()
      
        setData({
          title: data.evidence.title || "",
          description: data.evidence.description || "",
          start_date: data.evidence.start_date || "",
          end_date: data.evidence.end_date || "",
          oldFiles: data.files || [],
        })

    } catch (err) {
        console.log(err)
        toast({
            title: "Uh oh! Something went wrong.",
            description: "There was a problem with your request",
        })
    }
  }

  useEffect(() => {
    if (open) {
        if(evidence) fetchEvidence()
        clearErrors()
        setFileErrorMessage("")
    }
    reset()
  }, [open])

  useEffect(() => {
    if (data.newFiles) {
        // Initialize an array to collect error messages
        const errorMessages = []

        // Check each file for errors and add specific messages
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

  const handleDateRangeChange = (startDate, endDate) => {
    setData({
      ...data,
      start_date: startDate,
      end_date: endDate,
    })
  }

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
    const isUpdate = evidence !== null
    const url = isUpdate
        ? `/my-cga/update-other-evidence/${evidence.id}`
        : `/my-cga/other-evidence/${emp_id}?indicator_id=${indicator.indicator_id}`

    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('description', data.description)
    formData.append('start_date', data.start_date)
    formData.append('end_date', data.end_date)
    
    if (data.newFiles?.length > 0) {
      data.newFiles.forEach((file) => {
          formData.append('newFiles[]', file)
      })
    }

    formData.append("removed_files", JSON.stringify(data.removedFiles))

    post(url, {
      preserveState: true,
      forceFormData: true,
      data: formData,
      onSuccess: () => {
        toast({
            title: "Success!",
            description: isUpdate
            ? "The evidence has been updated successfully"
            : "The evidence has been created successfully",
        })
        reset()
        clearErrors()
        onClose()
        onSuccess()
      },
      onError: (e) => {
        const fileErrors = Object.entries(errors)
        .filter(([key]) => key.startsWith('newFiles.'))
        .map(([key, value]) => `${key}: ${value}`)
        setFileErrorMessage(fileErrors.join('\n'))
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add other evidence</DialogTitle>
                <DialogDescription>
                Add other information as evidence and give context for this indicator: <span className="font-medium underline">{indicator.indicator}</span>
                </DialogDescription>
            </DialogHeader>
            <div>
              <form onSubmit={handleSubmit} encType="multipart/form-data">

                  <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                          <Label htmlFor="title">Title</Label>
                          <TextInput 
                              name="title" 
                              onChange={(e => setData('title', e.target.value))}
                              invalidMessage={errors.title}
                              id="title"
                              value={data.title}
                          />
                          {errors?.title && <span className="text-red-500 text-xs">{errors.title}</span>}
                      </div>

                      <div className="flex flex-col gap-2">
                          <Label htmlFor="description">Context</Label>
                          <TextArea 
                              name="description" 
                              onChange={(e => setData('description', e.target.value))}
                              placeholder="Give context to the indicator here" 
                              id="description"
                              invalidMessage={errors.description}
                              value={data.description}
                          />
                          {errors?.description && <span className="text-red-500 text-xs">{errors.description}</span>}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="startDate">Date of Evidence</Label>
                        <DateRangePicker 
                          startDate={data.start_date} 
                          endDate={data.end_date} 
                          invalidStartDateMessage={errors.start_date}
                          invalidEndDateMessage={errors.end_date}
                          onDateChange={handleDateRangeChange}
                        />
                        {(errors?.start_date) && <span className="text-red-500 text-xs">{errors.start_date}</span>}
                        {(errors?.end_date) && <span className="text-red-500 text-xs">{errors.end_date}</span>}
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
                            <span>max allowed files: 5 (5MB each)</span>
                            <span>file types: jpg, jpeg, png, pdf</span>
                        </div>
                        )}
                        
                        <div className="flex flex-col gap-4 my-4">
                          { evidence !== null && <span className="text-sm font-medium">Choose files to remove:</span> }
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
                  </div>
              </form>
            </div>
        </DialogContent>
    </Dialog>
  )
}

export default OtherEvidenceForm