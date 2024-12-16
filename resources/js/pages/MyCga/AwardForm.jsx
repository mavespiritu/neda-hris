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

const AwardForm = ({ emp_id, evidence, indicator, open, onClose, onSuccess }) => {

    const { toast } = useToast()

    const [fileErrorMessage, setFileErrorMessage] = useState("")

    const [awards, setAwards] = useState([])

    const initialValues = {
        award_id: null,
        description: "",
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

            setData((prevData) => ({
                ...prevData,
                award_id: data.evidence.description || null,
                description: evidence.description || "",
                oldFiles: data.files || [],
            }))
  
        } catch (err) {
            console.log(err)
            toast({
                title: "Uh oh! Something went wrong.",
                description: "There was a problem with your request",
            })
        }
    }

    const fetchAwards = async () => {
        try {
            const response = await fetch(`/my-cga/awards/${emp_id}`)
            if (!response.ok) {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "Network response was not ok",
                })
            }
            const data = await response.json()
          
            setAwards(data)

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
            fetchAwards()
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
        ? `/my-cga/update-award/${evidence.id}`
        : `/my-cga/award/${emp_id}?indicator_id=${indicator.indicator_id}`

        const formData = new FormData()
        formData.append('award_id', data.award_id)
        formData.append('description', data.description)
        
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
            onError: () => {
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
                    <DialogTitle>Add award as evidence</DialogTitle>
                    <DialogDescription>
                    Select from your awards as evidence and give context for this indicator: <span className="font-medium underline">{indicator.indicator}</span>
                    </DialogDescription>
                </DialogHeader>
                <div>
                    <form onSubmit={handleSubmit}>

                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="award_id">Award</Label>
                                <SingleComboBox 
                                    items={awards} 
                                    onChange={(value => setData('award_id', value))}
                                    invalidMessage={errors.award_id}
                                    placeholder="Select award"
                                    name="award"
                                    id="award"
                                    value={data.award_id}
                                    width="w-[460px]"
                                    className="w-full"
                                />
                                {errors?.award_id && <span className="text-red-500 text-xs">{errors.award_id}</span>}
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

export default AwardForm