import PageTitle from "@/components/PageTitle"
import Pds from "./Pds"
import { usePage } from "@inertiajs/react"

const ApplicantsWizard = () => {
  const { url, props } = usePage()

  const params = new URLSearchParams(url.split("?")[1])
  const redirect = params.get("redirect")

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        pageTitle={props.applicantId ? "Edit Applicant" : "Add New Applicant"}
        description="Complete the applicant personal data sheet section by section."
      />
      <Pds
        redirect={redirect}
        initialProgress={props.progress || {}}
        applicantId={props.applicantId ?? null}
        profileType={props.profileType ?? "Applicant"}
      />
    </div>
  )
}

export default ApplicantsWizard
