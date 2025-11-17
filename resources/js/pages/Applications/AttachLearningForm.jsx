import { useEffect, useState } from "react"
import { useForm, usePage } from "@inertiajs/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import FileUpload from "@/components/FileUpload"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { formatDate, formatDateRange, formatNumberWithCommas } from "@/lib/utils.jsx"

const AttachLearningForm = ({ open, onClose, jobId, applicantId, requirement }) => {

  const { toast } = useToast()

  const [processing, setProcessing] = useState(false)

  const { data, setData, errors, reset, clearErrors, progress } =
    useForm({
      applicant_id: null,
      vacancy_id: null,
      requirement_id: null,
      requirement: "",
      sub_requirement_id: null,
      newFiles: [],
    })

  useEffect(() => {
    if (requirement) {
      setData({
        applicant_id: applicantId || null,
        vacancy_id: jobId || null,
        requirement_id: requirement.req?.requirement_id || null,
        requirement: requirement.req?.requirement || "",
        sub_requirement_id: requirement.subReq?.id || null,
        newFiles: [],
      })
      clearErrors()
    }
  }, [requirement])

  const handleFileSelect = (files) => {
    setData("newFiles", Array.from(files))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setProcessing(true)

    const formData = new FormData()
    formData.append("applicant_id", data.applicant_id)
    formData.append("vacancy_id", data.vacancy_id)
    formData.append("requirement_id", data.requirement_id)
    formData.append("requirement", data.requirement)
    formData.append("sub_requirement_id", data.sub_requirement_id)

    data.newFiles.forEach((file) => {
      formData.append("newFiles[]", file)
    })

    try {
      await axios.post(
        route("jobs.requirements.store", { hashedId: jobId }),
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      )

      toast({
        title: "Success!",
        description: "The requirement has been uploaded successfully",
      })
      reset()
      clearErrors()
      onClose?.(true)
    } catch (err) {
      if (err.response?.data?.errors) {
        const backendErrors = err.response.data.errors;

        // Start with main newFiles error
        let combinedNewFilesError = backendErrors.newFiles ? backendErrors.newFiles[0] : '';

        // Append indexed file errors if any
        const indexedErrors = Object.keys(backendErrors)
          .filter(k => k.startsWith('newFiles.'))
          .map(k => backendErrors[k][0]);

        if (indexedErrors.length) {
          combinedNewFilesError += (combinedNewFilesError ? ' ' : '') + indexedErrors.join(', ');
        }

        if (combinedNewFilesError) {
          errors.newFiles = combinedNewFilesError;
        }

        // Other fields
        Object.keys(backendErrors).forEach(key => {
          if (!key.startsWith('newFiles')) {
            errors[key] = backendErrors[key][0];
          }
        });
      } else {
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
        });
      }
    } finally {
      setProcessing(false) 
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Attach Document</DialogTitle>
          <DialogDescription>
            Please upload the documents related to the selected requirement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-2">
            <Label>Requirement</Label>
            <p className="text-sm font-medium border rounded-lg px-4 py-2">
              {requirement?.req?.requirement}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Details</Label>
            <p className="flex flex-col text-sm font-medium border rounded-lg px-4 py-2">
              <span>{requirement?.subReq?.seminar_title}</span>
              <span>{formatDateRange(requirement?.subReq?.from_date ?? null, requirement?.subReq?.to_date ?? null)}</span>
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="newFiles">Choose document</Label>
            <FileUpload
              id="newFiles"
              name="newFiles"
              data={data.newFiles}
              onFilesSelect={handleFileSelect}
              invalidMessage={errors.newFiles}
            />
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
            {!errors.newFiles && (
              <div className="inline-flex justify-end text-xs text-muted-foreground">
                <span>allowed file type: pdf (max 5MB)</span>
              </div>
            )}
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
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AttachLearningForm
