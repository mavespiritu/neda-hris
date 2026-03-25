import React, { useState } from "react"
import { Send, Loader2, CheckCircle2, CircleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { router } from "@inertiajs/react"
import { useToast } from "@/hooks/use-toast"

const ReviewAndSubmit = ({ job, isReopenedSubmission = false }) => {
  const { toast } = useToast()
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const submitLabel = isReopenedSubmission ? "Re-submit Application" : "Submit Application"
  const successTitle = isReopenedSubmission ? "Application Re-submitted" : "Application Submitted"
  const successDescription = isReopenedSubmission
    ? "You’ll receive an email confirmation that your updated application was re-submitted."
    : "You’ll receive an email confirmation shortly."

  const handleSubmitApplication = () => {
    setSubmitting(true)
    router.post(
      route("jobs.submit", { hashedId: job.hashed_id }),
      {},
      {
        onSuccess: () => {
          toast({
            title: successTitle,
            description: successDescription,
          })
          setSubmitting(false)
        },
        onError: () => setSubmitting(false),
      }
    )
  }

  return (
    <div className="border rounded-lg p-6 flex flex-col gap-8 bg-white">
      <h3 className="tracking-tight font-semibold text-lg flex items-center text-black">
        <Send className="mr-2 h-4 w-4" />
        {submitLabel}
      </h3>

      {isReopenedSubmission && (
        <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 flex items-start gap-2 border-l-4 border-amber-400">
          <CircleAlert className="w-4 h-4 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Resubmission Instructions</p>
            <p>
              Review your submitted profile snapshot and uploaded documents carefully. When you re-submit,
              your updated application will replace the previously submitted copy and DEPDev will be notified
              that you submitted a revised application.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2 border-l-4 border-red-400">
        <CircleAlert className="w-4 h-4 mt-0.5" />
        <p className="font-semibold">
          APPLICATIONS WITH INCOMPLETE DOCUMENTS SHALL NOT BE ENTERTAINED.
        </p>
      </div>

      <div className="space-y-3">
        <h4 className="font-bold text-lg">Before You Submit</h4>
        <p className="text-sm text-muted-foreground">
          {isReopenedSubmission ? (
            <>
              Please make sure your corrections are final and all revised supporting documents are uploaded.
              After re-submission, the edit window will close and your updated application will return to review.
            </>
          ) : (
            <>
              Please make sure all details are correct and all documents are uploaded. Once submitted, you
              <span className="font-semibold"> won’t be able to make any edits</span>.
            </>
          )}
        </p>

        <ul className="text-sm space-y-2 pl-6 list-disc">
          <li>All required fields in your application are filled out accurately.</li>
          <li>Your supporting documents (eligibility, training, work experience, etc.) are complete.</li>
          <li>Your Personal Data Sheet (PDS) is updated and attached.</li>
          <li>Uploaded files are clear, valid, and readable.</li>
          {isReopenedSubmission && (
            <li>The revisions requested by DEPDev have been addressed before re-submitting.</li>
          )}
        </ul>
      </div>

      <div className="space-y-3">
        <h4 className="font-bold text-lg">Important Notes</h4>
        <p className="text-sm">
          The DEPDev adheres to a policy of <span className="font-bold">non-discrimination</span> based on gender identity,
          sexual orientation, disability, religion, or indigenous group membership in its recruitment and selection process.
        </p>
        <p className="text-sm">
          <span className="font-bold">Privacy Notice:</span> All personal information you provide will be used solely for
          recruitment, selection, and placement purposes within the Department of Economy, Planning, and Development Regional
          Office 1 (DEPDev). Data will be retained according to the National Archives’ General Disposition Schedule and handled
          under the Data Privacy Act of 2012.
        </p>
        <p className="text-sm">
          For inquiries, you may contact DEPDev RO1 through the Trunk Line at{" "}
          <span className="font-bold">(072) 888-5501 Local 111</span> or{" "}
          <span className="font-bold">0999-991-9633 (Smart)</span>.
        </p>
      </div>

      <div className="space-y-2">
        <h4 className="font-bold text-lg">Terms and Conditions</h4>
        <p className="text-sm">
          By checking the box below and clicking <span className="font-bold">{submitLabel}</span>, I confirm that:
        </p>
        <ul className="text-sm space-y-1 pl-6 list-disc">
          <li>The information provided is true and correct to the best of my knowledge.</li>
          <li>I consent to DEPDev processing my personal data for recruitment and related purposes.</li>
          <li>I understand that false or misleading information may lead to disqualification.</li>
        </ul>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="agree" checked={agreed} onCheckedChange={(checked) => setAgreed(!!checked)} />
        <label htmlFor="agree" className="text-sm cursor-pointer select-none">
          {isReopenedSubmission
            ? "I have reviewed my revised application and agree to the Terms and Conditions."
            : "I have reviewed my application and agree to the Terms and Conditions."}
        </label>
      </div>

      <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700 flex items-start gap-2 border-l-4 border-blue-400">
        <CheckCircle2 className="w-4 h-4 mt-0.5" />
        <p>
          {isReopenedSubmission ? (
            <>
              After re-submitting, you will receive an email confirmation that your updated application was received.
              You can also track your application status anytime under <span className="font-semibold">My Applications</span> in your account.
            </>
          ) : (
            <>
              After submitting, you will receive an email confirmation. You can also track your application
              status anytime under <span className="font-semibold">My Applications</span> in your account.
            </>
          )}
        </p>
      </div>

      <div className="flex">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="primary"
              disabled={!agreed || submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitting && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
              {submitLabel}
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{isReopenedSubmission ? "Confirm Re-submission" : "Confirm Submission"}</AlertDialogTitle>
              <AlertDialogDescription>
                {isReopenedSubmission
                  ? "Are you sure you want to re-submit your updated application? The current edit window will close after re-submission."
                  : "Are you sure you want to submit your application? You won’t be able to edit it after submission."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-0">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSubmitApplication}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isReopenedSubmission ? "Yes, re-submit now" : "Yes, submit now"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

export default ReviewAndSubmit
