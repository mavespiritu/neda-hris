import { create } from 'zustand'
import { format } from 'date-fns'
import { 
    getCompetencies,
    getCompetenciesCount,
    getSelectedCompetency,
    getIndicators,
    updateCompliance,
    updateRemarks,
    endorseCompetency as saveEndorsedCompetency,
    approveCompetency as saveApprovedCompetency
} from '@/pages/ReviewCga/api'

const useCompetencyReviewStore = create((set, get) => ({
    toast: null,
    setToast: (toastInstance) => set({ toast: toastInstance }),
    competenciesState: {
        competencies: [],
        filteredCompetencies: [],
        loading: true,
        currentPage: 1,
        selectedCompetency: null,
        filters: {
            staff: null,
            status: "pending",
            search: ""
        },
        statusCounts: {
            pending: 0,
            approved: 0
        },
        isFilterModalOpen: false
    },
    selectedCompetencyState: {
        competencies: [],
        loading: true,
        isEndorsing: false,
        isApproving: false,
        isDeleting: false
    },
    indicatorsState: {
        expandedRows: {},
        additionalInfo: {},
        loadingAdditionalInfo: {},
        selectedIndicator: null,
        activeModalType: null,
    },

    setCompetenciesLoading: (loading) => set(state => ({
        competenciesState: { ...state.competenciesState, loading }
    })),

    setCompetencies: (competencies) => set(state => ({
        competenciesState: { ...state.competenciesState, competencies, loading: false }
    })),

    setCompetenciesCount: (competenciesCount) => set(state => ({
        competenciesState: { 
            ...state.competenciesState, 
            statusCounts: competenciesCount.reduce((acc, { status, count }) => {
                if (status === 'Pending') acc.pending = count;
                if (status === 'Approved') acc.approved = count;
                return acc;
            }, { pending: 0, approved: 0 }) 
        }
    })),

    setFilteredCompetencies: (filtered) => set(state => ({
        competenciesState: { ...state.competenciesState, filteredCompetencies: filtered }
    })),

    setFilters: (filters) => set(state => ({
        competenciesState: {
            ...state.competenciesState,
            currentPage: 1,
            filters: { ...state.competenciesState.filters, ...filters }
        }
    })),

    clearFilters: () => set(state => ({
        competenciesState: {
            ...state.competenciesState,
            filters: { staff: null }
        }
    })),

    setCurrentPage: (page) => set(state => ({
        competenciesState: {
            ...state.competenciesState,
            currentPage: page
        }
    })),

    setSelectedCompetency: (selectedCompetency) => set(state => ({
        competenciesState: { ...state.competenciesState, selectedCompetency }
    })),

    setSelectedCompetenyInfoLoading: (loading) => set(state => ({
        selectedCompetencyState: { ...state.selectedCompetencyState, loading }
    })),

    setSelectedCompetencyEndorsementLoading: (isEndorsing) => set(state => ({
        selectedCompetencyState: { ...state.selectedCompetencyState, isEndorsing }
    })),
    
    setSelectedCompetencyApprovalLoading: (isApproving) => set(state => ({
        selectedCompetencyState: { ...state.selectedCompetencyState, isApproving }
    })),

    setSelectedCompetencyInfo: (competencies) => set(state => ({
        selectedCompetencyState: { ...state.selectedCompetencyState, competencies, loading: false }
    })),

    resetExpansionIndicatorRows: () => set(state => ({
        indicatorsState: {
            expandedRows: {},
            additionalInfo: {},
            loadingAdditionalInfo: {},
            selectedIndicator: null,
            activeModaltype: null,
        },
    })),

    updateSelectedCompetencyInfoPercentages: (competencyId, type, newPercentage) => {
        set(state => {
            const currentCompetencies = state.selectedCompetencyState.competencies[type]

            const updatedCompetencies = currentCompetencies.map(competency =>
                competency.competency_id === competencyId
                    ? { ...competency, percentage: newPercentage }
                    : competency
            )
            
            return {
                selectedCompetencyState: {
                    ...state.selectedCompetencyState,
                    competencies: {
                        ...state.selectedCompetencyState.competencies,
                        [type]: updatedCompetencies
                    }
                }
            }
        })
    },

    endorseSelectedCompetencyInfo: (endorser, dateEndorsed) => {
        set(state => {

            const {
                competencies,
                filteredCompetencies,
                selectedCompetency
            } = state.competenciesState
            
            return {
                competenciesState: {
                    ...state.competenciesState,
                    selectedCompetency: {
                        ...state.competenciesState.selectedCompetency,
                        endorser,
                        date_endorsed: dateEndorsed,
                    },
                }
            }
        })
    },

    approveSelectedCompetencyInfo: (approver, dateApproved) => {
        set(state => {

            const {
                competencies,
                filteredCompetencies,
                selectedCompetency
            } = state.competenciesState

            const updatedCompetencies = competencies.data.filter(comp => comp.id !== selectedCompetency.id)

            const updatedFilteredCompetencies = filteredCompetencies.filter(comp => comp.id !== selectedCompetency.id)
            
            return {
                competenciesState: {
                    ...state.competenciesState,
                    selectedCompetency: {
                        ...state.competenciesState.selectedCompetency,
                        approver,
                        date_acted: dateApproved,
                        status: 'Approved'
                    },
                    competencies: {
                        ...state.competenciesState.competencies,
                        data: updatedCompetencies
                    },
                    filteredCompetencies: updatedFilteredCompetencies,
                }
            }
        })
    },

    expandCompetencyRow: (competencyId) => set(state => ({
        indicatorsState: { 
            ...state.indicatorsState, 
            expandedRows: {
                ...state.indicatorsState.expandedRows,
                [competencyId]: !state.indicatorsState.expandedRows[competencyId]
            },
        }
    })),

    setIndicatorAdditionalInfo: (competencyId, data) => set(state => ({
        indicatorsState: { 
            ...state.indicatorsState, 
            additionalInfo: {
                ...state.indicatorsState.additionalInfo,
                [competencyId]: data
            }
        }
    })),

    updateIndicatorAdditionalInfo: (competencyId, updatedIndicator) => set(state => ({
        indicatorsState: { 
            ...state.indicatorsState, 
            additionalInfo: {
                ...state.indicatorsState.additionalInfo,
                [competencyId]: updatedIndicator
            }
        }
    })),

    setIndicatorAdditionalInfoLoading: (competencyId, loading) => set(state => ({
        indicatorsState: { 
            ...state.indicatorsState, 
            loadingAdditionalInfo: {
                ...state.indicatorsState.loadingAdditionalInfo,
                [competencyId]: loading
            }
        }
    })),

    openIndicatorModal: (type, selectedIndicator) => set(state => ({
        indicatorsState: { 
            ...state.indicatorsState, 
            activeModalType: type,
            selectedIndicator
        }
    })),

    closeIndicatorModal: () => set(state => ({
        indicatorsState: { 
            ...state.indicatorsState, 
            activeModalType: null,
            selectedIndicator: null
        }
    })),

    openFilterModal: () => set(state => ({
        competenciesState: { 
            ...state.competenciesState, 
            isFilterModalOpen: true
        }
    })),

    closeFilterModal: () => set(state => ({
        competenciesState: { 
            ...state.competenciesState, 
            isFilterModalOpen: false
        }
    })),

    loadCompetencies: async () => {
        const { 
            toast,
            competenciesState: {
                currentPage,
                filters,
            }, 
            setCompetenciesLoading,
            setCompetencies
        } = get()
        
        try{
            setCompetenciesLoading(true)

            const response = await getCompetencies({page: currentPage, filters})

            if (response.status === 200) {
                setCompetencies(response.data)
            } else {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "There was a problem with your request.",
                    variant: "destructive"
                })
            }
        }catch (error) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setCompetenciesLoading(false)
        }
    },

    loadCompetenciesCount: async() => {
        const { 
            toast,
            setCompetenciesCount
        } = get()
        
        try{

            const response = await getCompetenciesCount()

            if (response.status === 200) {
                
                setCompetenciesCount(response.data)
            } else {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "There was a problem with your request.",
                    variant: "destructive"
                })
            }
        }catch (error) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: error.message,
                variant: "destructive"
            })
        } finally {

        }
    },

    loadSelectedCompetency: async () => {
        const { 
            toast,
            competenciesState: {
                selectedCompetency
            }, 
            setSelectedCompetenyInfoLoading,
            setSelectedCompetencyInfo,
            resetExpansionIndicatorRows,
        } = get()

        try{
            setSelectedCompetenyInfoLoading(true)

            const response = await getSelectedCompetency(selectedCompetency)

            if (response.status === 200) {
                setSelectedCompetencyInfo(response.data)
                resetExpansionIndicatorRows()
            } else {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "There was a problem with your request.",
                    variant: "destructive"
                })
            }
        }catch (error) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setSelectedCompetenyInfoLoading(false)
        }
    },

    loadIndicators: async (competency) => {

        const { id, competency_id: competencyId } = competency

        const { 
            toast,
            setIndicatorAdditionalInfo,
            setIndicatorAdditionalInfoLoading,
            expandCompetencyRow
         } = get()

         setIndicatorAdditionalInfoLoading(competencyId, true)

        try{

            const response = await getIndicators({id})

            if (response.status === 200) {
                setIndicatorAdditionalInfo(competencyId, response.data)
            } else {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "There was a problem with your request.",
                    variant: "destructive"
                })
            }
        }catch (error) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setIndicatorAdditionalInfoLoading(competencyId, false)
        }
    },

    toggleCompliance: async (updatedIndicator, data, type) => {
        const { 
            toast,
            updateIndicatorAdditionalInfo,
            updateSelectedCompetencyInfoPercentages,
        } = get()

        const { competency_id: competencyId, percentage } = data

        try{
            const response = await updateCompliance(data)

            if (response.status === 200) {
                updateIndicatorAdditionalInfo(competencyId, updatedIndicator)
                updateSelectedCompetencyInfoPercentages(competencyId, type, percentage)
                toast({
                    title: "Success!",
                    description: "Compliance updated successfully",
                })
            } else {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "There was a problem with your request.",
                    variant: "destructive"
                })
            }
        }catch (error) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            
        }
    },

    updateRemarks: async (updatedRemarks, indicator) => {
        const { 
            toast,
            indicatorsState,
            updateIndicatorAdditionalInfo
        } = get()
        
        const {competency_id: competencyId, id: indicatorId } = indicator
        const updatedIndicator = indicatorsState.additionalInfo[competencyId].map((indicator) => indicator.id === indicatorId ? { ...indicator, remarks: updatedRemarks } : indicator)

        try{
            const response = await updateRemarks({id: indicatorId, remarks: updatedRemarks})

            if (response.status === 200) {
                updateIndicatorAdditionalInfo(updatedIndicator)
                toast({
                    title: "Success!",
                    description: "Remarks updated successfully",
                })
            } else {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "There was a problem with your request.",
                    variant: "destructive"
                })
            }
        }catch (error) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            
        }
    },

    deleteRemarks: async (indicator) => {
        const { 
            toast,
            indicatorsState,
            updateIndicatorAdditionalInfo
        } = get()

        const {competency_id: competencyId, id: indicatorId } = indicator
        const updatedIndicator = indicatorsState.additionalInfo[competencyId].map((indicator) => indicator.id === indicatorId ? { ...indicator, remarks: '' } : indicator)

        try{
            const response = await updateRemarks({id: indicatorId, action: 'delete', remarks: ''})

            if (response.status === 200) {
                updateIndicatorAdditionalInfo(competencyId,updatedIndicator)
                toast({
                    title: "Success!",
                    description: "Remarks removed successfully",
                })
            } else {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "There was a problem with your request.",
                    variant: "destructive"
                })
            }
        }catch (error) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            
        }
    },

    endorseCompetency: async (competencyId, endorser, dateEndorsed) => {
        const { 
            toast,
            endorseSelectedCompetencyInfo,
            setSelectedCompetencyEndorsementLoading
        } = get()

        try{
            setSelectedCompetencyEndorsementLoading(true)

            const response = await saveEndorsedCompetency({id: competencyId})

            if (response.status === 200) {
                endorseSelectedCompetencyInfo(endorser.label, dateEndorsed)
                
                toast({
                    title: "Success!",
                    description: "Competency endorsed successfully",
                })
            } else {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "There was a problem with your request.",
                    variant: "destructive"
                })
            }
        }catch (error) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setSelectedCompetencyEndorsementLoading(false)
        }
    },

    approveCompetency: async (competencyId, approver, dateApproved) => {
        const { 
            toast,
            approveSelectedCompetencyInfo,
            setSelectedCompetencyApprovalLoading
        } = get()

        try{
            setSelectedCompetencyApprovalLoading(true)

            const response = await saveApprovedCompetency({id: competencyId})

            if (response.status === 200) {
                approveSelectedCompetencyInfo(approver.label, dateApproved)
                
                toast({
                    title: "Success!",
                    description: "Competency approved successfully",
                })
            } else {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "There was a problem with your request.",
                    variant: "destructive"
                })
            }
        }catch (error) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setSelectedCompetencyApprovalLoading(false)
        }
    }
}))

export default useCompetencyReviewStore