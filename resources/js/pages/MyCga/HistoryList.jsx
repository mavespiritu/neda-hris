
import { ScrollArea } from "@/components/ui/scroll-area"
import { Link } from '@inertiajs/react'
import CompetencyReviewLoading from "@/components/skeletons/CompetencyReviewLoading"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import useCgaHistoryStore from '@/stores/useCgaHistoryStore'

const HistoryList = () => {
    const {
        submissionsState: { 
            submissions, 
            loading: submissionsLoading, 
            selectedSubmission,
            filteredSubmissions,
        },
        setCurrentPage,
        setSelectedSubmission,
    } = useCgaHistoryStore()

    const handleSubmissionClick = (submissionId) => {
        const selected = submissions.data.find(submission => submission.id === submissionId)
        setSelectedSubmission(selected)
    }

    const handlePaginationClick = (link, e) => {
        e.preventDefault()
        if (link.url) {
            const url = new URL(link.url)
            const params = new URLSearchParams(url.search)
            const page = params.get('page') 
            
            if (page) {
                setCurrentPage(parseInt(page, 10))
            }
        }
    }

    return (
        <div className="flex-grow grid grid-rows-[1fr,auto] h-full gap-4">
            <ScrollArea className="h-full p-2 border rounded-lg">
                <div className="h-12 flex flex-col gap-2 pr-2">
                    {!submissionsLoading ? (
                        filteredSubmissions.length > 0 ? (
                            filteredSubmissions.map((submission, i) => (
                                <span 
                                    key={`submitted-competencies-${submission.id}`}
                                    className={`
                                        flex items-start gap-4 flex-1
                                        rounded-md transition-colors 
                                        disabled:pointer-events-none disabled:opacity-50 
                                        hover:text-accent-foreground px-4 py-2 hover:bg-muted cursor-pointer
                                        ${selectedSubmission?.id === submission.id ? 
                                            'bg-muted font-semibold' : 
                                            'hover:underline font-medium'
                                        }`}
                                    onClick={() => handleSubmissionClick(submission.id)}
                                >
                                    <span className="break-words text-sm">{submission.dateCreated}</span>
                                    <Badge className="rounded-lg font-bold" variant={submission.status !== 'Approved' ? 'outline' : ''}>{submission.status === 'Approved' ? 'Approved' : 'Pending'}</Badge>
                                </span>
                                
                            ))
                        ) : (
                            <div className="flex items-center justify-center text-xs h-full">
                                No submissions found
                            </div>
                        )
                    ) : (
                        <CompetencyReviewLoading />
                    )}
                </div>
            </ScrollArea>
            <div className="flex gap-2 items-center justify-between w-full">
                {submissions?.total > 20 && (
                <div className="flex items-center space-x-2">
                    {submissions.links.map((link) =>
                    link.url ? (
                        <Button
                        key={link.label}
                        variant={link.active ? "default" : "outline"}
                        size="sm"
                        onClick={(e) => handlePaginationClick(link, e)}
                        dangerouslySetInnerHTML={{ __html: link.label }} // Renders the label directly
                        className="text-xs"
                        />
                    ) : (
                        <Button
                        key={link.label}
                        variant="outline"
                        size="sm"
                        disabled
                        dangerouslySetInnerHTML={{ __html: link.label }}
                        className="text-xs text-slate-400"
                        />
                    )
                    )}
                </div>
                )}
            </div>
        </div>
    )
}

export default HistoryList