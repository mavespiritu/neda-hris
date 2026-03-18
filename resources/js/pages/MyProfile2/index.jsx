import PageTitle from "@/components/PageTitle"
import Pds from "./Pds"
import { usePage } from "@inertiajs/react"

const MyProfile2 = () => {
  const { url, props } = usePage()

  const params = new URLSearchParams(url.split("?")[1])
  const redirect = params.get("redirect")

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        pageTitle="My Profile"
        description="Make sure your personal data sheet is updated before submitting an application."
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

export default MyProfile2
