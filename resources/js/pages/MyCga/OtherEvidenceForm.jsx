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

const OtherEvidenceForm = ({ evidence, indicator, open, onClose, onSuccess }) => {

  const { toast } = useToast()

  const [fileErrorMessage, setFileErrorMessage] = useState("")

  const initialValues = {
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    files: [],
    oldFiles: [],
    removedFiles: []
  }

  const { data, setData, post, processing, errors, clearErrors, reset, progress } = useForm(initialValues)

  const fetchEvidence = async () => {
    try {
        const response = await fetch(`/my-cga/evidence/${evidence.id}`)
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
          files: data.files || [],
          oldFiles: data.files || [],
          removedFiles: []
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
    }
    reset()
  }, [open])

  useEffect(() => {
    if (data.files) {
        const hasErrors = data.files.some((_, index) => errors?.[`files.${index}`])
        
        if (hasErrors) {
            setFileErrorMessage("There are issues with the uploaded files. Please check the type and size of uploaded files")
        } else {
            setFileErrorMessage("")
        }
    }
}, [data.files, errors])

  const handleDateRangeChange = (startDate, endDate) => {
    setData({
      ...data,
      start_date: startDate,
      end_date: endDate,
    })
  }

  const handleFileSelect = (files) => {
    
    setData((prevData) => {
        return {
            ...prevData,
            files: [...prevData.files, ...files],
        }
    })
  }

  const handleFileRemove = (fileToRemove) => {

    setData((prevData) => ({
      ...prevData,
      files: prevData.files.filter((file) => file.id !== fileToRemove.id),
      oldFiles: prevData.files.filter((file) => file.id !== fileToRemove.id),
      removedFiles: [...prevData.removedFiles, fileToRemove],
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const isUpdate = evidence !== null
    const url = isUpdate
        ? `/my-cga/update-other-evidence/${evidence.id}`
        : `/my-cga/other-evidence/${indicator.indicator_id}`

    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('description', data.description)
    formData.append('start_date', data.start_date)
    formData.append('end_date', data.end_date)
    
    if (Array.isArray(data.files)) {
      data.files.forEach((file) => {
        formData.append("files[]", file)
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
        console.log(e)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add other evidence</DialogTitle>
                <DialogDescription>
                Add other information as evidence and give context for this indicator.
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
                        <Label htmlFor="picture">Files</Label>
                        <FileUpload 
                            name="files[]"
                            id="files" 
                            invalidMessage={errors.files}
                            data={data.files}
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
                        {errors?.files ? (<span className="text-red-500 text-xs">{errors.files}</span>) : (
                          <div className="inline-flex justify-between text-xs text-muted-foreground">
                            <span>max allowed files: 5 (5MB each)</span>
                            <span>file types: jpg, jpeg, png, pdf</span>
                          </div>
                        )}

                        {fileErrorMessage && <span className="text-red-500 text-xs">{fileErrorMessage}</span>}
                        
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