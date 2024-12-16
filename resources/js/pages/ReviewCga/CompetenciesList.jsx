
import { ScrollArea } from "@/components/ui/scroll-area"
import { Link } from '@inertiajs/react'
import CompetencyReviewLoading from "@/components/skeletons/CompetencyReviewLoading"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import useCompetencyReviewStore from '@/stores/useCompetencyReviewStore'

const CompetenciesList = ({ 
    handleCompetencyClick, 
    handlePaginationClick 
}) => {
    const {
        competenciesState: { 
            competencies, 
            competenciesLoading, 
            selectedCompetency,
            filteredCompetencies 
        },
    } = useCompetencyReviewStore()

    return (
        <div className="flex-grow grid grid-rows-[1fr,auto] h-full gap-4">
            <ScrollArea className="h-full border rounded-lg p-2">
                <div className="h-12 pr-2">
                    {!competenciesLoading ? (
                        filteredCompetencies.length > 0 ? (
                            filteredCompetencies.map((competency, i) => (
                                <span 
                                    key={`for-review-competencies-${competency.id}`}
                                    className={`
                                        flex items-center gap-2 flex-1
                                        rounded-md transition-colors 
                                        disabled:pointer-events-none disabled:opacity-50 
                                        hover:text-accent-foreground px-4 py-2 hover:bg-muted cursor-pointer
                                        ${selectedCompetency?.id === competency.id ? 
                                            'bg-muted font-semibold' : 
                                            'hover:underline font-medium'
                                        }`}
                                    onClick={() => handleCompetencyClick(competency.id)}
                                    title={competency.staff}
                                >
                                    <Avatar className="size-10">
                                        <AvatarImage src={`/employees/image/${competency.emp_id}`} />
                                        <AvatarFallback>{competency ? competency.staff : 'Unknown Staff'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="break-words text-sm">{competency.staff}</span>
                                        <span className="break-words text-xs">{competency.date_submitted}</span>
                                    </div>
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
                {competencies?.total > 20 && (
                <div className="flex items-center space-x-2">
                    {competencies.links.map((link) =>
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

export default CompetenciesList