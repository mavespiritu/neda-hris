import { useState, useEffect } from "react"
import { useForm } from "@inertiajs/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import DatePicker from "@/components/DatePicker"
import FileUpload from "@/components/FileUpload"
import axios from "axios"
import Attachment from "@/components/Attachment"

const Form = ({mode, data, onClose, open}) => {

  const isEdit = mode === "edit"

  const { toast } = useToast()

  const [processing, setProcessing] = useState(false)
  const [existingFiles, setExistingFiles] = useState([])

  const {
    data: formData,
    setData,
    errors,
    reset,
    clearErrors,
    progress,
  } = useForm({
    id: null,
    date_published: "",
    date_closed: "",
    newFiles: [],
    removeFiles: [],
  })

  useEffect(() => {
    if (isEdit && data) {
      setExistingFiles(data.files || [])
      setData({
        id: data.id || null,
        date_published: data.date_published || "",
        date_closed: data.date_closed || "",
        newFiles: [],
        removeFiles: [],
      })
    } else {
      reset()
      setExistingFiles([])
    }
  }, [mode, data])

  const handleFileSelect = (files) => {
    setData("newFiles", Array.from(files))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setProcessing(true)

    const submission = new FormData()
    if (isEdit) submission.append("id", formData.id)
    submission.append("date_published", formData.date_published)
    submission.append("date_closed", formData.date_closed)

    formData.newFiles.forEach((file) => {
      submission.append("newFiles[]", file)
    })

    formData.removeFiles.forEach((fileId) => {
      submission.append("removeFiles[]", fileId)
    })

    try {
      if (isEdit) {
        await axios.post(route("publications.update", data.id), submission, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        toast({
          title: "Success!",
          description: "The publication was updated successfully.",
        })
      } else {
        await axios.post(route("publications.store"), submission, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        toast({
          title: "Success!",
          description: "The publication was saved successfully.",
        })
      }
      reset()
      clearErrors()
      onClose?.(true)
    } catch (err) {
      if (err.response?.data?.errors) {
        const backendErrors = err.response.data.errors

        // Handle combined newFiles errors
        let combinedNewFilesError = backendErrors.newFiles
          ? backendErrors.newFiles[0]
          : ""

        const indexedErrors = Object.keys(backendErrors)
          .filter((k) => k.startsWith("newFiles."))
          .map((k) => backendErrors[k][0])

        if (indexedErrors.length) {
          combinedNewFilesError +=
            (combinedNewFilesError ? " " : "") + indexedErrors.join(", ")
        }

        if (combinedNewFilesError) {
          errors.newFiles = combinedNewFilesError
        }

        Object.keys(backendErrors).forEach((key) => {
          if (!key.startsWith("newFiles")) {
            errors[key] = backendErrors[key][0]
          }
        })
      } else {
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
        })
      }
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Publication" : "Add Publication"}</DialogTitle>
          <DialogDescription className="text-justify">Fill-up all required fields.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="date_published">Posting Date</Label>
            <DatePicker
                placeholder="Select a date"
                value={formData.date_published}
                onDateChange={(date) => setData('date_published', date)}
                invalidMessage={errors.date_published}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="date_closed">Closing Date</Label>
            <DatePicker
                placeholder="Select a date"
                value={formData.date_closed}
                onDateChange={(date) => setData('date_closed', date)}
                invalidMessage={errors.date_closed}
            />
          </div>

          <div className="space-y-1">
            
            
            {(!isEdit || (isEdit && existingFiles.length === 0)) ? (
              <>
                <Label htmlFor="newFiles">Attachment</Label>
                <FileUpload
                  id="newFiles"
                  name="newFiles"
                  data={formData.newFiles}
                  onFilesSelect={handleFileSelect}
                  invalidMessage={errors.newFiles}
                />
              </>
            ) : (
              <div className="text-xs text-muted-foreground italic">
                An attachment already exists. Remove it first to upload a new one.
              </div>
            )}
            
            {progress && (
              <>
                <span className="text-xs">Uploading. Please wait</span>
                <progress value={progress.percentage} max="100">
                  {progress.percentage}%
                </progress>
              </>
            )}
            {errors.newFiles && (
              <span className="text-red-500 text-xs">{errors.newFiles}</span>
            )}
            {!errors.newFiles && 
              (!isEdit || (isEdit && existingFiles.length === 0)) && (
                <div className="inline-flex justify-end text-xs text-muted-foreground">
                  <span>Allowed file type: PDF, Word (max 5MB)</span>
                </div>
              )
            }
          </div>

          {isEdit && existingFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Existing Attachments</Label>
              <ul className="space-y-1">
                {existingFiles.map((file) => (
                  <li key={file.id} className="flex items-center justify-between text-sm">
                    <Attachment file={file} />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-red-500"
                      onClick={() => {
                        // Add to removeFiles
                        setData("removeFiles", [...formData.removeFiles, file.id])
                        // Remove visually
                        setExistingFiles(existingFiles.filter((f) => f.id !== file.id))
                      }}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
                  {isEdit ? "Updating..." : "Saving..."}
                </>
              ) : isEdit ? (
                "Update"
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default Form