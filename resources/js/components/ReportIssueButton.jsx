import { useState } from "react"
import { useForm } from "@inertiajs/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import TextInput from "@/components/TextInput"
import { Send, MessageCircleWarning } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ReportIssueButton() {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const { data, setData, post, processing, reset, errors } = useForm({
    name: "",
    email: "",
    message: "",
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    post(route("issue.report"), {
      onSuccess: () => {
        toast({
          title: "Report sent successfully",
          description: "Thank you for helping us improve!",
        })
        reset()
        setOpen(false)
      },
      onError: () => {
        toast({
          title: "Something went wrong",
          description: "There was a problem sending your report. Please try again later.",
          variant: "destructive",
        })
      },
    })
  }

  return (
    <>
      {/* Floating Circular Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-blue-700 hover:bg-blue-800 text-white p-4 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center"
      >
        <MessageCircleWarning className="w-6 h-6" />
      </button>

      {/* Dialog Form */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report an Issue</DialogTitle>
            <p className="text-sm text-gray-500">
              Found a bug or something not working? Let us know below.
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-2 mt-2">
            <div className="space-y-1">
              <Label>Your Name (optional)</Label>
              <TextInput
                name="name"
                placeholder="Your name (optional)"
                value={data.name}
                onChange={(e) => setData("name", e.target.value)}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            <div className="space-y-1">
              <Label>Your Email (optional)</Label>
              <TextInput
                name="email"
                type="email"
                placeholder="Your email (optional)"
                value={data.email}
                onChange={(e) => setData("email", e.target.value)}
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            </div>

            <div className="space-y-1">
              <Label>Describe the issue</Label>
              <Textarea
                name="message"
                placeholder="Describe the issue..."
                rows={4}
                required
                value={data.message}
                onChange={(e) => setData("message", e.target.value)}
              />
              {errors.message && <p className="text-red-500 text-sm">{errors.message}</p>}
            </div>

            <DialogFooter>
              <Button
                type="submit"
                className="flex items-center gap-2 mt-4"
                disabled={processing}
              >
                <Send className="w-4 h-4" />
                {processing ? "Sending..." : "Send Report"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
