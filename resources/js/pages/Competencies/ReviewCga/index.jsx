import PageTitle from "@/components/PageTitle"
import SubmissionList from "./SubmissionList"
import SelectedSubmission from "./SelectedSubmission"
import Summary from "./Summary"
import { store } from "./store"

const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Competencies' },
    { label: 'Gap Analysis Submissions', href: '/cga-submissions' },
]

const ReviewCga = () => {

    const selectedSubmission = store((state) => state.selectedSubmission)

    return (
        <div className="grid grid-rows-[auto,1fr] h-screen flex-1 overflow-hidden gap-4">
            <PageTitle pageTitle="Gap Analysis Submissions" breadcrumbItems={breadcrumbItems} description="Review submitted competency gap analysis here by clicking on each submission." />
            <div className="grid md:grid-cols-[25%,1fr] grid-cols-1 h-full overflow-hidden gap-4">
                <SubmissionList />
                {selectedSubmission ? <SelectedSubmission /> : <Summary />}
            </div>
        </div>
    )
}

export default ReviewCga