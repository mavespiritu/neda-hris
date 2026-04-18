import { useEffect, useState } from "react"
import { formatFullName } from "@/lib/utils.jsx"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import Profile from "@/pages/Vacancies/Applicants/Profile"
import Documents from "@/pages/Vacancies/Applicants/Documents"

const ApplicantSummaryDialog = ({ open, applicant, onOpenChange }) => {
  const [tab, setTab] = useState("profile")

  useEffect(() => {
    if (open) {
      setTab("profile")
    }
  }, [open, applicant?.id])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{formatFullName(applicant?.name) || "Applicant"}</DialogTitle>
          <DialogDescription>
            View the applicant profile and submitted documents.
          </DialogDescription>
          <div className="text-sm text-muted-foreground">
            {applicant?.email_address || "No email"}
          </div>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
          <TabsList className="w-fit">
            <TabsTrigger value="profile">Applicant's Profile</TabsTrigger>
            <TabsTrigger value="documents">Submitted Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="flex-1 min-h-0">
            <ScrollArea className="h-[70vh] pr-4">
              {applicant?.id ? <Profile applicantId={applicant.id} /> : null}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="documents" className="flex-1 min-h-0">
            <ScrollArea className="h-[70vh] pr-4">
              {applicant?.id ? <Documents applicant={applicant} /> : null}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default ApplicantSummaryDialog
