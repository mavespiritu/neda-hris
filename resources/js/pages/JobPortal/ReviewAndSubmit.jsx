import React, { useState, useEffect } from "react"
import { Send, Loader2 } from "lucide-react"
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
import { store } from "./store"
import { router } from "@inertiajs/react"
import { useToast } from "@/hooks/use-toast"

const ReviewAndSubmit = ({ job }) => {
  const { toast } = useToast()
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmitApplication = () => {
    setSubmitting(true)
    router.post(
      route("jobs.submit", { hashedId: job.hashed_id }),
      {},
      {
        onSuccess: () => {
          toast({ title: "Submitted", description: "Your application has been submitted." })
          setSubmitting(false)
        },
        onError: () => setSubmitting(false),
      }
    )
  }

  return (
    <div className="border rounded-lg p-4 flex flex-col gap-6">
      <h3 className="tracking-tight font-semibold text-lg flex items-center text-black">
        <Send className="mr-2 h-4 w-4" />
        Submit Application
      </h3>

      <div className="flex flex-col gap-4 w-full p-4">
        <div className="space-y-2">
          <h4 className="font-bold text-lg">Note</h4>
          <p className="text-base text-red-500 font-bold">APPLICATIONS WITH INCOMPLETE DOCUMENTS SHALL NOT BE ENTERTAINED. </p>
          <p className="text-sm">The DEPDev adheres to the existing general policy of no discrimination based on gender identity, sexual orientation, disabilities, religion and/or indigenous group membership in the implementation of its recruitment, selection and placement.</p>
          <p className="text-sm"><span className="font-bold">DEPDev PRIVACY NOTICE:</span> All the personal information contained in your PDS, Curriculum Vitae, medical records, and other related documents and information shall be used solely for documentation and processing purposes within the DEPDev and shall not be shared with any outside parties, unless with your written consent. Personal information shall be retained and stored by DEPDev within a time period in accordance with the National Archives of the Philippines’ General Disposition Schedule.</p>
          <p className="text-sm">
            For inquiries, you may contact us through the DEPDev RO1 Trunk Line at <span className="font-bold">(072) 888-5501 Local 111</span> and <span className="font-bold">0999-991-9633 (Smart)</span>. 
          </p>
        </div> 
        <div className="space-y-2">
          <h4 className="font-bold text-lg">Terms and Conditions</h4>
          <p className="text-sm">
            By <span className="font-bold">checking the box below</span> and clicking <span className="font-bold">Submit Application</span>, I agree to the processing of my personal data by <span className="font-bold">Department of Economy, Planning, and Development Regional Office 1</span> which includes: 1. assessing my suitability for employment
            for the position I'm applying to now and future opportunities and 2. receiving information about Department
            of Economy, Planning, and Development Regional Office 1 and new career opportunities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="agree" checked={agreed} onCheckedChange={(checked) => setAgreed(!!checked)} />
          <label htmlFor="agree" className="text-sm">
            I agree to the Terms and Conditions
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="primary"
              disabled={!agreed || submitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {submitting && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
              Submit Application
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to submit your application? You won't be able to edit it after submission.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-0">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSubmitApplication} className="bg-green-600 hover:bg-green-700 text-white">Yes, submit now</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

export default ReviewAndSubmit
