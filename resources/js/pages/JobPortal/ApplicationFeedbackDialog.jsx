import { useEffect, useMemo, useState } from "react"
import { useForm } from "@inertiajs/react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Star, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const MAX_STARS = 5

const starTone = (filled) =>
  filled ? "text-amber-400 fill-amber-400" : "text-slate-300"

const ApplicationFeedbackDialog = ({ open, onOpenChange, prompt = null, onSubmitted }) => {
  const { toast } = useToast()
  const [hoveredRating, setHoveredRating] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const { data, setData, post, processing, reset } = useForm({
    rating: 0,
    feedback: "",
  })

  const ratingLabel = useMemo(() => {
    const value = hoveredRating || data.rating

    if (value >= 5) return "Excellent"
    if (value >= 4) return "Very good"
    if (value >= 3) return "Good"
    if (value >= 2) return "Fair"
    if (value >= 1) return "Poor"

    return "Choose a rating"
  }, [data.rating, hoveredRating])

  useEffect(() => {
    if (!open) {
      setHoveredRating(0)
    }
  }, [open])

  useEffect(() => {
    if (!prompt) {
      reset()
      setSubmitted(false)
    }
  }, [prompt, reset])

  const handleClose = (nextOpen) => {
    if (processing) {
      return
    }

    if (!nextOpen && !submitted) {
      toast({
        title: "Feedback required",
        description: "Please choose a star rating before closing this form.",
        variant: "destructive",
      })
      return
    }

    if (!nextOpen) {
      onOpenChange(nextOpen)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!prompt?.application_id || !data.rating) {
      toast({
        title: "Rating required",
        description: "Please choose a star rating before submitting your feedback.",
        variant: "destructive",
      })
      return
    }

    post(route("jobs.feedback.store", { applicationId: prompt.application_id }), {
      preserveScroll: true,
      onSuccess: () => {
        toast({
          title: "Feedback submitted",
          description: "Thank you for sharing your experience.",
        })
        reset()
        setHoveredRating(0)
        setSubmitted(true)
        onOpenChange(false)
        onSubmitted?.()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-xl"
        onEscapeKeyDown={(event) => {
          if (!submitted) {
            event.preventDefault()
            toast({
              title: "Feedback required",
              description: "Please choose a star rating before closing this form.",
              variant: "destructive",
            })
          }
        }}
        onPointerDownOutside={(event) => {
          if (!submitted) {
            event.preventDefault()
            toast({
              title: "Feedback required",
              description: "Please choose a star rating before closing this form.",
              variant: "destructive",
            })
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>How was your application experience?</DialogTitle>
          <DialogDescription>
            Please choose a star rating to continue. The improvement comments are optional, but we’d appreciate any
            details you can share about your experience after submitting your application.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
            <div className="text-sm font-medium text-slate-900">
              {prompt?.position || "Submitted application"}
            </div>
            <div className="text-xs text-slate-500">
              {prompt?.reference_no ? `Reference No. ${prompt.reference_no}` : "Application submitted successfully."}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-900">How many stars would you give your experience?</Label>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: MAX_STARS }, (_, index) => {
                  const starValue = index + 1
                  const filled = (hoveredRating || data.rating) >= starValue

                  return (
                    <button
                      key={starValue}
                      type="button"
                      className="rounded-md p-1 transition hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      onClick={() => setData("rating", starValue)}
                      onMouseEnter={() => setHoveredRating(starValue)}
                      onMouseLeave={() => setHoveredRating(0)}
                      aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
                    >
                      <Star className={`h-6 w-6 ${starTone(filled)}`} />
                    </button>
                  )
                })}
              </div>
              <span className="text-sm text-slate-600">{ratingLabel}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="application-feedback" className="text-sm font-medium text-slate-900">
              Tell us what went well or what we can improve
            </Label>
            <Textarea
              id="application-feedback"
              value={data.feedback}
              onChange={(event) => setData("feedback", event.target.value)}
              placeholder="Share any thoughts about the application experience..."
              rows={5}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700 text-white">
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Feedback
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ApplicationFeedbackDialog
