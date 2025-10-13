import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useForm } from "@inertiajs/react"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

const ApplicationForm = ({ open, onClose, job }) => {
  const { data, setData, post, processing, reset } = useForm({
    job_id: job?.id,
    type: null,
  })

  // 🔹 Watch for `type` change and submit automatically when set
  useEffect(() => {
    if (data.type) {
      post(route("jobs.store", job.hashed_id), {
        onSuccess: () => {
          reset()
          onClose()
        },
      })
    }
  }, [data.type]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (appType) => {
    setData("type", appType)
  }

  const renderButtonContent = (label, appType) => {
    if (processing && data.type === appType) {
      return (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Please wait...
        </span>
      )
    }
    return label
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Start your application</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="font-medium">{job.position_description}</p>
            <p className="text-sm">{job.item_no}</p>
          </div>

          <p className="text-sm">
            Please choose how you want to apply by clicking on your preferred option below.
          </p>

          <Button
            className="w-full"
            disabled={processing}
            onClick={() => handleSubmit("reuse")}
          >
            {renderButtonContent("Use my last application", "reuse")}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            disabled={processing}
            onClick={() => handleSubmit("manual")}
          >
            {renderButtonContent("Start fresh application", "manual")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ApplicationForm
