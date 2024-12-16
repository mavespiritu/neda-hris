import { create } from 'zustand'
import { format } from 'date-fns'
import { 
    getSubmissions,
    getSelectedSubmission
} from '@/pages/MyCga/api'

const useCgaHistoryStore = create((set, get) => ({
    toast: null,
    setToast: (toastInstance) => set({ toast: toastInstance }),
    submissionsState: {
        submissions: [],
        filteredSubmissions: [],
        loading: true,
        currentPage: 1,
        selectedSubmission: null,
        filters: {
            year: "",
            month: ""
        },
        isFilterModalOpen: false
    },
    selectedSubmissionState: {
        loading: true,
        competencies: [],
        expandedRows: {},
        additionalInfo: {},
        loadingAdditionalInfo: {},
    },

    setSubmissionsLoading: (loading) => set(state => ({
        submissionsState: { ...state.submissionsState, loading }
    })),

    setSubmissions: (submissions) => set(state => ({
        submissionsState: { ...state.submissionsState, submissions, loading: false }
    })),

    setFilteredSubmissions: (filtered) => set(state => ({
        submissionsState: { ...state.submissionsState, filteredSubmissions: filtered }
    })),

    setFilters: (filters) => set(state => ({
        submissionsState: {
            ...state.submissionsState,
            currentPage: 1,
            filters: { ...state.submissionsState.filters, ...filters }
        }
    })),

    clearFilters: () => set(state => ({
        submissionsState: {
            ...state.submissionsState,
            filters: { search: "" }
        }
    })),

    setCurrentPage: (page) => set(state => ({
        submissionsState: {
            ...state.submissionsState,
            currentPage: page
        }
    })),

    setSelectedSubmission: (selectedSubmission) => set(state => ({
        submissionsState: { ...state.submissionsState, selectedSubmission }
    })),

    setSelectedSubmissionInfoLoading: (loading) => set(state => ({
        selectedSubmissionState: { ...state.selectedSubmissionState, loading }
    })),

    setSelectedSubmissionInfo: (competencies) => set(state => ({
        selectedSubmissionState: { ...state.selectedSubmissionState, competencies, loading: false }
    })),

    resetExpansionIndicatorRows: () => set(state => ({
        selectedSubmissionState: {
            ...state.selectedSubmissionState,
            expandedRows: {},
            additionalInfo: {},
            loadingAdditionalInfo: {},
        },
    })),

    expandCompetencyRow: (competencyId) => set(state => ({
        selectedSubmissionState: { 
            ...state.selectedSubmissionState, 
            expandedRows: {
                ...state.selectedSubmissionState.expandedRows,
                [competencyId]: !state.selectedSubmissionState.expandedRows[competencyId]
            },
        }
    })),

    setSubmissionAdditionalInfo: (competencyId, data) => set(state => ({
        selectedSubmissionState: { 
            ...state.selectedSubmissionState, 
            additionalInfo: {
                ...state.selectedSubmissionState.additionalInfo,
                [competencyId]: data
            }
        }
    })),

    setSubmissionAdditionalInfoLoading: (competencyId, loading) => set(state => ({
        selectedSubmissionState: { 
            ...state.selectedSubmissionState, 
            loadingAdditionalInfo: {
                ...state.selectedSubmissionState.loadingAdditionalInfo,
                [competencyId]: loading
            }
        }
    })),

    openFilterModal: () => set(state => ({
        submissionsState: { 
            ...state.submissionsState, 
            isFilterModalOpen: true
        }
    })),

    closeFilterModal: () => set(state => ({
        submissionsState: { 
            ...state.submissionsState, 
            isFilterModalOpen: false
        }
    })),

    loadSubmissions: async (emp_id) => {
        const { 
            toast,
            submissionsState: {
                currentPage,
                filters,
            }, 
            setSubmissionsLoading,
            setSubmissions
        } = get()
        
        try{
            setSubmissionsLoading(true)

            const response = await getSubmissions({page: currentPage, filters, emp_id})

            if (response.status === 200) {
                setSubmissions(response.data)
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
            setSubmissionsLoading(false)
        }
    },

    loadSelectedSubmission: async () => {
        const { 
            toast,
            submissionsState: {
                selectedSubmission
            }, 
            setSelectedSubmissionInfoLoading,
            setSelectedSubmissionInfo,
            resetExpansionIndicatorRows,
        } = get()

        try{
            setSelectedSubmissionInfoLoading(true)

            const response = await getSelectedSubmission(selectedSubmission)

            if (response.status === 200) {
                setSelectedSubmissionInfo(response.data)
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
            setSelectedSubmissionInfoLoading(false)
        }
    },

    loadIndicators: async (competency) => {

        const { id, competency_id: competencyId } = competency

        const { 
            toast,
            setSubmissionAdditionalInfo,
            setSubmissionAdditionalInfoLoading,
         } = get()

         setSubmissionAdditionalInfoLoading(competencyId, true)

        try{

            const response = await getIndicators({id})

            if (response.status === 200) {
                setSubmissionAdditionalInfo(competencyId, response.data)
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
            setSubmissionAdditionalInfoLoading(competencyId, false)
        }
    },
}))

export default useCgaHistoryStore