import { create } from 'zustand'
import { format } from 'date-fns'
import { router } from '@inertiajs/react'
import { 
    getSubmissions,
    getSubmittedCompetencies,
    getSubmittedCompetencyIndicators,
    getSubmittedIndicatorEvidences,
    updateIndicatorInfo,
    getSubmissionHistory,
    notifyOfGapAnalysisEndorsement,
    notifyOfGapAnalysisApproval,
    notifyOfGapAnalysisDisapproval,
} from './api'

export const store = create((set, get) => ({
    data: [],
    isLoading: false,
    pageIndex: 0,
    pageCount: 0,
    perPage: 0,
    total: 0,
    search: '',

    submissions: {
        data: [],
        isLoading: false,
        error: null,
        filters: {},
    },

    submittedCompetencies: {
        data: [],
        isLoading: false,
        error: null,
        filters: {},
    },

    selectedSubmittedCompetencies: null,
    
    submissionHistory: {
        data: [],
        isLoading: false,
        error: null,
        filters: {},
    },

    selectedSubmittedCompetencyData: {
        data: null,
        isLoading: false,
        error: null,
    },

    selectedSubmittedIndicatorData: {
        data: null,
        isLoading: false,
        error: null,
    },

    selectedSubmission: null,

    indicatorForm: {
        selectedIndicator: null,
        modalType: null
    },

    actionForm: {
        open: false,
        data: null
    },

    summary: {
        data: [],
        isLoading: false,
        error: null,
        filters: {},
    },

    openIndicatorForm: (selectedIndicator, modalType) => set(state => ({
        indicatorForm: { 
            ...state.indicatorForm, 
            selectedIndicator,
            modalType
        }
    })),

    closeIndicatorForm: () => set(state => ({
        indicatorForm: { 
            ...state.indicatorForm, 
            selectedIndicator: null,
            modalType: null
        }
    })),

    openActionForm: (data) => set(state => ({
        actionForm: { 
            ...state.actionForm,
            open: true, 
            data,
        }
    })),

    closeActionForm: () => set(state => ({
        actionForm: { 
            ...state.actionForm, 
            open: false, 
            data: null,
        }
    })),

    setSubmissions: (updater) =>
        set((state) =>
            typeof updater === "function"
                ? { submissions: updater(state.submissions) }
                : { submissions: updater }
        ),

    setSubmissionFilters: (filters) => {
        set((state) => ({
            submissions: {
                ...state.submissions,
                filters,
            }
        }))
    },

    setSelectedSubmission: (selectedSubmission) => set({ selectedSubmission }),
    setSelectedSubmittedCompetencies: (selectedSubmittedCompetencies) => set({ selectedSubmittedCompetencies }),
    setSelectedSubmittedIndicatorData: (updater) =>
        set((state) =>
            typeof updater === "function"
                ? { selectedSubmittedIndicatorData: updater(state.selectedSubmittedIndicatorData) }
                : { selectedSubmittedIndicatorData: updater }
        ),

    fetchSubmissions: async({filters = {}} = {}) => {
        set((state) => ({
        submissions: {
            ...state.submissions,
            isLoading: true,
            error: null,
            filters
        }
        }))

        try {
            const response = await getSubmissions({ filters })

            const data = response.data

            set((state) => ({
                submissions: {
                    ...state.submissions,
                    data,
                    isLoading: false,
                    error: null,
                }
            }))
        } catch (error) {

            set((state) => ({
                submissions: {
                    ...state.submissions,
                    error: error.message || 'Failed to fetch submissions.',
                    isLoading: false,
                }
            }))
            
        }
    },

    fetchSubmittedCompetencies: async({id = null, filters = {}} = {}) => {
        set((state) => ({
        submittedCompetencies: {
            ...state.submittedCompetencies,
            isLoading: true,
            error: null,
            filters
        }
        }))

        try {
            const response = await getSubmittedCompetencies({id, filters})

            const data = response.data

            set((state) => ({
                submittedCompetencies: {
                    ...state.submittedCompetencies,
                    data,
                    isLoading: false,
                    error: null,
                }
            }))
        } catch (error) {
            set((state) => ({
                submittedCompetencies: {
                    ...state.submittedCompetencies,
                    error: error.message || 'Failed to fetch submitted competencies.',
                    isLoading: false,
                }
            }))
        }
    },

    fetchSelectedSubmittedCompetency: async ({id = null, filters = {}} = {}) => {
        set((state) => ({
            selectedSubmittedCompetencyData: {
                ...state.selectedSubmittedCompetencyData,
                isLoading: true,
                error: null,
            }
        }))

        try {
            const response = await getSubmittedCompetencyIndicators({
                id,
                filters
            }
        )
            const data = response.data

            set((state) => ({
                selectedSubmittedCompetencyData: {
                    ...state.selectedSubmittedCompetencyData,
                    data,
                    isLoading: false,
                    error: null,
                }
            }))
        } catch (error) {
            set((state) => ({
                selectedSubmittedCompetencyData: {
                    ...state.selectedSubmittedCompetencyData,
                    error: error.message || 'Failed to fetch submitted competency indicators.',
                    isLoading: false,
                }
            }))
        }
    },

    fetchSelectedSubmittedIndicator: async ({id = null, filters = {}} = {}) => {
        set((state) => ({
            selectedSubmittedIndicatorData: {
                ...state.selectedSubmittedIndicatorData,
                isLoading: true,
                error: null,
            }
        }))

        try {
            const response = await getSubmittedIndicatorEvidences({
                id,
                filters
            }
        )
            const data = response.data

            set((state) => ({
                selectedSubmittedIndicatorData: {
                    ...state.selectedSubmittedIndicatorData,
                    data,
                    isLoading: false,
                    error: null,
                }
            }))
        } catch (error) {
            set((state) => ({
                selectedSubmittedIndicatorData: {
                    ...state.selectedSubmittedIndicatorData,
                    error: error.message || 'Failed to fetch submitted indicator evidences.',
                    isLoading: false,
                }
            }))
        }
    },

    updateCompliance: async (updatedIndicator, newCompetencyPercentage, toast) => {
        const {
            updateSubmittedCompetencies,
            updateSubmittedCompetencyData,
            selectedSubmittedCompetencies
        } = get()

        const updatedCompetency = {
            ...selectedSubmittedCompetencies,
            percentage: newCompetencyPercentage,
        }

        try{
            const response = await updateIndicatorInfo({
                id: updatedIndicator.id ?? 0, 
                competency: updatedCompetency, 
                indicator: updatedIndicator
            })

            if (response.status === 200) {
                updateSubmittedCompetencies({percentage: newCompetencyPercentage})
                updateSubmittedCompetencyData(updatedIndicator)
                toast({
                    title: "Success!",
                    description: "Indicator compliance updated successfully",
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
        }
    },

    updateRemarks: async (updatedIndicator, toast) => {
        const {
            updateSubmittedCompetencyData,
            selectedSubmittedCompetencies
        } = get()

        try{
            const response = await updateIndicatorInfo({
                id: updatedIndicator.id, 
                competency: selectedSubmittedCompetencies, 
                indicator: updatedIndicator
            })

            if (response.status === 200) {
                updateSubmittedCompetencyData(updatedIndicator)
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
        }
    },

    updateSubmittedCompetencies: (fields) =>
        set((state) => {

            const { type, competency_id: competencyId } = state.selectedSubmittedCompetencies

            const updatedData = state.submittedCompetencies.data[type].map((item) =>
                item.competency_id === competencyId
                    ? { ...item, ...fields }
                    : item
            )

            return {
            submittedCompetencies: {
                ...state.submittedCompetencies,
                data: {
                    ...state.submittedCompetencies.data,
                    [type]: updatedData,
                },
            },
        }
    }),

    updateSubmittedCompetencyData: (updatedIndicator) =>
        set((state) => {

            const { indicator_id, proficiency } = updatedIndicator

            const currentIndicators = state.selectedSubmittedCompetencyData.data?.[proficiency] || [];

            const updatedData = currentIndicators.map((item) =>
                item.indicator_id === indicator_id
                    ? { ...item, ...updatedIndicator }
                    : item
            )

            return {
            selectedSubmittedCompetencyData: {
                ...state.selectedSubmittedCompetencyData,
                data: {
                    ...state.selectedSubmittedCompetencyData.data,
                    [proficiency]: updatedData,
                },
            },
        }
    }),

    fetchSubmissionHistory: async({id = null, filters = {}} = {}) => {
        set((state) => ({
        submissionHistory: {
            ...state.submissionHistory,
            isLoading: true,
            error: null,
            filters
        }
        }))

        try {
            const response = await getSubmissionHistory({id, filters})

            const data = response.data

            set((state) => ({
                submissionHistory: {
                    ...state.submissionHistory,
                    data,
                    isLoading: false,
                    error: null,
                }
            }))
        } catch (error) {
            set((state) => ({
                submissionHistory: {
                    ...state.submissionHistory,
                    error: error.message || 'Failed to fetch submission history.',
                    isLoading: false,
                }
            }))
        }
    },

    sendGapAnalysisEndorsementNotification: async (payload) => {
        try {
            const response = await notifyOfGapAnalysisEndorsement(payload)
    
            if (response.status !== 200) {
                throw new Error("Failed to send email notification.");
            }
    
        } catch (err) {
            console.error(err) 
        }
    },

    sendGapAnalysisApprovalNotification: async (payload) => {
        try {
            const response = await notifyOfGapAnalysisApproval(payload)
    
            if (response.status !== 200) {
                throw new Error("Failed to send email notification.");
            }
    
        } catch (err) {
            console.error(err)
        }
    },

    sendGapAnalysisDisapprovalNotification: async (payload) => {
        try {
            const response = await notifyOfGapAnalysisDisapproval(payload)
    
            if (response.status !== 200) {
                throw new Error("Failed to send email notification.");
            }
    
        } catch (err) {
            console.error(err)
        }
    },

    fetchSummary: async({filters = {}} = {}) => {
        set((state) => ({
        summary: {
            ...state.summary,
            isLoading: true,
            error: null,
            filters
        }
        }))

        try {
            const response = await getSummary({ filters })

            const data = response.data

            set((state) => ({
                summary: {
                    ...state.summary,
                    data,
                    isLoading: false,
                    error: null,
                }
            }))
        } catch (error) {

            set((state) => ({
                summary: {
                    ...state.summary,
                    error: error.message || 'Failed to fetch submissions.',
                    isLoading: false,
                }
            }))
            
        }
    },
}))