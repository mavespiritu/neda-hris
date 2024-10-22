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
import { useState, useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import SingleComboBox from "@/components/SingleComboBox"
import TextArea from "@/components/TextArea"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import FileUpload from "@/components/FileUpload"

const PerformanceForm = ({ evidence, indicator, open, onClose, onSuccess }) => {

    const { toast } = useToast()

    const [fileErrorMessage, setFileErrorMessage] = useState("")

    const [performances, setPerformances] = useState([])


    const initialValues = {
        ipcr_id: null,
        description: "",
        files: [],
        oldFiles: [],
        removedFiles: []
    }

    const { data, setData, post, processing, errors, clearErrors, reset, progress } = useForm(initialValues)

    const fetchEvidence = async () => {
        try {
            const response = await fetch(`/my-cga/evidence/${evidence.id}`);
            if (!response.ok) {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "Network response was not ok",
                })
            }
            const data = await response.json()
          
            setData({
                ipcr_id: data.evidence.ipcr_id || null,
                description: evidence.description || "",
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

    const fetchPerformances = async () => {
        try {
            const response = await fetch(`/my-cga/performances`);
            if (!response.ok) {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "Network response was not ok",
                })
            }
            const data = await response.json()
            
            setPerformances(data)

        } catch (err) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: "There was a problem with your request",
            })
        } 
    }

    useEffect(() => {
        if (open) {
            if(evidence) fetchEvidence()
            fetchPerformances()
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
        ? `/my-cga/update-performance/${evidence.id}`
        : `/my-cga/performance/${indicator.indicator_id}`
    
        const formData = new FormData()
        formData.append('award_id', data.award_id)
        formData.append('description', data.description)
        
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
            onError: () => {
                console.log(e)
            }
        })
    }

return (
    <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add performance as evidence</DialogTitle>
                <DialogDescription>
                Select from your performances as evidence and give context for this indicator.
                </DialogDescription>
            </DialogHeader>
            <div>
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="training_id">Performance</Label>
                            <SingleComboBox 
                                items={performances} 
                                onChange={(value => setData('ipcr_id', value))}
                                invalidMessage={errors.ipcr_id}
                                placeholder="Select performance"
                                name="award"
                                id="award"
                                value={data.ipcr_id}
                                width="w-[460px]"
                                className="w-full"
                            />
                            {errors?.ipcr_id && <span className="text-red-500 text-xs">{errors.ipcr_id}</span>}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="description">Context</Label>
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

export default PerformanceForm