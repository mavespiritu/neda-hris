import { useState, useEffect, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import useDebounce from "@/hooks/useDebounce"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Loader2, SlidersHorizontal, ChevronDown } from 'lucide-react'
import RemarksForm from "@/pages/ReviewCga/RemarksForm"
import FilterForm from "@/pages/ReviewCga/FilterForm"
import CompetenciesList from "@/pages/ReviewCga/CompetenciesList"
import Indicators from "@/pages/ReviewCga/Indicators"
import EvidencesList from "@/pages/ReviewCga/EvidencesList"
import { useTextSize } from "@/providers/TextSizeProvider"
import { useUser } from "@/providers/UserProvider"
import { format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import useCompetencyReviewStore from '@/stores/useCompetencyReviewStore'
import { 
    sendEmailForCgaApproval,
} from '@/pages/ReviewCga/api'

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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const Competencies = ({employees}) => {

    const {
        setToast,
        competenciesState: { 
            competencies, 
            currentPage,
            loading: competenciesLoading, 
            filters,
            selectedCompetency,
            filteredCompetencies,
            statusCounts,
            isFilterModalOpen 
        },
        selectedCompetencyState,
        indicatorsState,
        indicatorsState: {
            expandedRows,
            additionalInfo: indicatorAdditionalInfo,
            loadingAdditionalInfo: loadingIndicatorAdditionalInfo,
            selectedIndicator,
            activeModalType
        },
        loadCompetencies,
        loadCompetenciesCount,
        loadSelectedCompetency,
        loadIndicators,
        setFilteredCompetencies,
        setFilters,
        setSelectedCompetency,
        setCurrentPage,
        toggleCompliance,
        openIndicatorModal,
        closeIndicatorModal,
        approveCompetency,
        updateIndicatorAdditionalInfo,
        deleteRemarks,
        expandCompetencyRow,
        openFilterModal,
        closeFilterModal
    } = useCompetencyReviewStore()

    const textSize = useTextSize()
    const { user } = useUser()
    const { toast } = useToast()
    const debouncedSearchValue = useDebounce(filters?.search, 500)
    const itemsPerPage = 20
    const [activeTab, setActiveTab] = useState(() => localStorage.getItem('HRIS_ReviewCGA_activeCompetenciesTab') || 'Pending')
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)

    const total = useMemo(() => competencies?.total || 0, [competencies])
    const startIndex = useMemo(() => (currentPage - 1) * itemsPerPage + 1, [currentPage])
    const endIndex = useMemo(() => Math.min(startIndex + itemsPerPage - 1, total), [startIndex, total])

    useEffect(() => {
        if(toast){
            setToast(toast)
        }
    }, [toast, setToast])

    useEffect(() => {
        loadCompetencies()
    }, [
        activeTab,
        currentPage
    ])

    useEffect(() => {
        loadCompetenciesCount()
    }, [])
    
    useEffect(() => {
        if (competencies.data){ 
            handleFilterCompetencies()
        } 
    }, [
        competencies.data, 
        debouncedSearchValue, 
        activeTab,
        filters.staff
    ])

    useEffect(() => {
        if (selectedCompetency){
            loadSelectedCompetency()
        }
    }, [selectedCompetency])

    useEffect(() => {
        localStorage.setItem('HRIS_ReviewCGA_activeCompetenciesTab', activeTab)
        setFilters({status: activeTab.toLowerCase()})
    }, [activeTab])

    const handleTabChange = (value) => {
        setActiveTab(value)
        setFilters({status: value})
    }

    const handleCompetencyClick = (competencyId) => {
        const selected = competencies.data.find(comp => comp.id === competencyId)
        setSelectedCompetency(selected)
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

    const handleFilterCompetencies = () => {
        
        const filtered = competencies.data?.filter((competency) => {
            const matchesSearch = filters.staff ? competency.emp_id === filters.staff : true
            return matchesSearch
        })
        
        setFilteredCompetencies(filtered)
    }

    const handleExpandRow = (competency) => {

        const competencyId = competency.competency_id

        expandCompetencyRow(competencyId)

        if (!expandedRows[competencyId] && !indicatorAdditionalInfo[competencyId]) {
            loadIndicators(competency)
        }
    
    }

    const handleComplianceToggleChange = (competency, indicatorId, isChecked) => {
        const {
            competency_id: competencyId, 
            type, 
        } = competency

        const updatedIndicator = indicatorAdditionalInfo[competencyId].map((indicator) => indicator.id === indicatorId ? { ...indicator, compliance: isChecked ? 1 : 0 } : indicator)

        const compliantCount = updatedIndicator.filter(indicator => indicator.compliance === 1).length

        const newPercentage = updatedIndicator.length > 0 ? parseFloat(((compliantCount / updatedIndicator.length) * 100).toFixed(2)) : 0

        const data = {
            ...competency,
            id: indicatorId, 
            compliance: isChecked ? 1 : 0,
            percentage: newPercentage,
        }

        toggleCompliance(updatedIndicator, data, type)
    }

    const handleRemarksUpdate = (updatedRemarks, indicator) => {

        const {competency_id: competencyId, id: indicatorId } = indicator

        const updatedIndicator = indicatorAdditionalInfo[competencyId].map((indicator) => indicator.id === indicatorId ? { ...indicator, remarks: updatedRemarks } : indicator)

        updateIndicatorAdditionalInfo(competencyId, updatedIndicator)
    }

    const handleRemarksDelete = async (indicator) => {
        deleteRemarks(indicator)
    }

    const handleApproveCompetency = async () => {

        const { id: competencyId } = selectedCompetency

        const approver = employees.find(employee => employee.value === user.ipms_id)
        const dateApproved = format(new Date(), 'MMMM dd, yyyy hh:mm:ss a')

        await approveCompetency(competencyId, approver, dateApproved)
        await sendEmailNotification()

        setIsApproveDialogOpen(false)
    }

    const sendEmailNotification = async () => {
        try {
            const response = await sendEmailForCgaApproval({review_id: selectedCompetency.id})
    
            if (response.status !== 200) {
                throw new Error("Failed to send email notification.");
            }
    
        } catch (err) {
            console.error(err)
            toast({
                title: "Error",
                description: "Failed to send email notification.",
                variant: "destructive",
            })
        }
    }

    return (
        <>
        <div className="flex flex-col lg:grid lg:grid-cols-[350px,1fr] gap-4 h-full w-full">
            <div className="grid grid-rows-[auto,1fr] gap-4 h-full">
                <div className="flex justify-between gap-2 items-center"
                >
                    <div>
                        <h4 className="text-normal font-semibold">Submitted Competencies</h4>
                        <span className="text-xs font-medium">
                            Showing {endIndex > 0 ? startIndex : 0}-{endIndex} of {total} items
                        </span>
                    </div>
                    
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => openFilterModal()}>
                        <SlidersHorizontal className="h-4 w-4" />
                        <span className="hidden md:block">Filter</span>
                    </Button>
                </div>
                <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-grow grid grid-rows-[auto,1fr] h-full">
                    <TabsList className="w-full justify-start gap-4">
                        <TabsTrigger value="pending" className="flex gap-2">Pending {statusCounts.pending > 0 && <Badge className="rounded-lg">{statusCounts.pending}</Badge>}</TabsTrigger>
                        <TabsTrigger value="approved" className="flex gap-2">Approved {statusCounts.approved > 0 && <Badge className="rounded-lg">{statusCounts.approved}</Badge>}</TabsTrigger>
                    </TabsList>
                    {['pending', 'approved'].map((status) => (
                        <TabsContent key={status} value={status}>
                            <CompetenciesList 
                                handleCompetencyClick={handleCompetencyClick}
                                handlePaginationClick={handlePaginationClick}
                            />
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
            {selectedCompetency ? (
            <div className="grid grid-rows-[auto,auto,1fr] gap-2 h-full border rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                        <Avatar className="size-12">
                            <AvatarImage src={`/employees/image/${selectedCompetency.emp_id}`} loading="lazy" />
                            <AvatarFallback>{selectedCompetency ? selectedCompetency.staff : 'Unknown Staff'}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <h4 className="text-normal font-semibold">Review Competency of {selectedCompetency.staff}</h4>
                            <span className="text-sm font-medium">Submitted on {selectedCompetency.date_submitted}</span>
                        </div>
                    </div>
                    {!selectedCompetency.status ? (
                        <AlertDialog open={isApproveDialogOpen}>
                            <AlertDialogTrigger asChild>
                                <Button onClick={() => setIsApproveDialogOpen(true)}>Approve Submission</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure you want to approve this submission?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    This action cannot be undone. Once approved, reviewing of this submission will no longer be available.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setIsApproveDialogOpen(false)} className="border-0">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleApproveCompetency}
                                    disabled={selectedCompetencyState.isApproving}
                                    >
                                        {selectedCompetencyState.isApproving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                <span>Please wait</span>
                                            </>
                                        ) : 'Continue'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    ) : (
                        <div className="flex flex-col text-right">
                            <h4 className="text-normal font-semibold">Approved by {selectedCompetency?.approver}</h4>
                            <span className="text-sm font-medium">Approved on {selectedCompetency.date_acted}</span>
                        </div>
                    )}
                </div>
                <span className="text-xs">Note: Highlighted rows indicate competencies that require review due to changes in compliance made by the staff.</span>
                <div>
                {!selectedCompetencyState.loading ? (
                    Object.keys(selectedCompetencyState.competencies).length > 0 ? (
                        Object.keys(selectedCompetencyState.competencies).map((type, i) => (
                            <div key={`${type}-${i}`} className="mb-2 flex flex-col">
                                <div className="text-sm text-center font-semibold sticky top-0 z-20 bg-gray-100 p-2 border rounded-tl-lg rounded-tr-lg border-b-0">
                                    {type}
                                </div>
                                <div className="flex flex-col gap-1 border rounded-bl-lg rounded-br-lg p-4">
                                    {selectedCompetencyState.competencies[type].map((competency, j) => (
                                        <div key={`${type}-${competency.competency_id}-${j}`}>
                                            <div
                                                key={`link-${type}-${competency.competency_id}-${j}`}
                                                className={`flex justify-between items-center flex-1 rounded-md ${textSize} transition-colors 
                                                disabled:pointer-events-none disabled:opacity-50 hover:bg-muted h-9 p-2 gap-2 hover:cursor-pointer font-medium
                                                ${competency?.isUpdated === 1 && "bg-red-200 hover:bg-red-200"}            
                                                ${expandedRows[competency.competency_id] && "bg-muted font-bold"}            
                                                `}
                                                onClick={() => handleExpandRow(competency)}
                                                title={competency.competency}
                                            >
                                                <span className="break-words">{competency.competency} ({competency.proficiency})</span>
                                                <span className="flex gap-4">
                                                    <span>{competency.percentage}%</span>
                                                    <ChevronDown className="h-4 w-4" />
                                                </span>
                                            </div>
                                            {expandedRows[competency.competency_id] && (
                                                <>
                                                {loadingIndicatorAdditionalInfo[competency.id] ? (
                                                   <div className="flex items-center justify-center text-xs p-2">
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                        <span>Loading additional information...</span>
                                                    </div> 
                                                ) : (
                                                    <div key={competency.competency_id} className="flex flex-col mt-2">
                                                        <span className="text-xs">Note: Highlighted rows indicate indicators that require review due to changes in compliance made by the staff.</span>
                                                        <div className="border rounded-lg my-2">
                                                            <Indicators competency={competency} handleComplianceToggleChange={handleComplianceToggleChange} handleRemarksDelete={handleRemarksDelete} />
                                                        </div>
                                                    </div>
                                                )}
                                                </>
                                            )}  
                                        </div>                                      
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex items-center justify-center w-full h-full flex-1 text-sm font-semibold text-muted-foreground">
                            <span>No retrieved competencies</span>
                        </div>
                    )
                ) : (
                    <div className="flex justify-center items-center h-full text-sm flex-1 border">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Loading competencies...</span>
                    </div>
                )}
                </div>
            </div>
            ) : (
                <div className="flex items-center justify-center w-full h-full flex-1 text-sm font-semibold text-muted-foreground">
                    <span>Choose from submissions to review competencies</span>
                </div>
            )}
        </div>
        <RemarksForm 
          indicator={selectedIndicator}
          open={activeModalType === 'remarks'} 
          onClose={closeIndicatorModal} 
          onSuccess={handleRemarksUpdate}
        />
        <EvidencesList 
          indicator={selectedIndicator}
          open={activeModalType === 'evidences'} 
          onClose={closeIndicatorModal} 
          employees={employees}
        />
        <FilterForm 
          open={isFilterModalOpen} 
          onClose={closeFilterModal}
          employees={employees}
        />
        </>
      )
}

export default Competencies