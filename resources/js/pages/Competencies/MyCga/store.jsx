import { create } from 'zustand'
import { format } from 'date-fns'
import { router } from '@inertiajs/react'
import { 
    getCompetencies,
    getCompetencyIndicators,
    updateCompetencyIndicator,
    getEmployees,
    getDesignations,
    getCareerPaths,
    getCareerPathOptions,
    getIndicatorEvidences,
    getEvidence,
    getTrainings,
    getAwards,
    getPerformances,
    deleteCareerPath,
    getProposedTrainings,
    getTrainingOptions,
    getSubmissions,
    getSubmittedCompetencies,
    getSubmittedCompetencyIndicators,
    getSubmissionWindow,
    getGapAnalysis,
    notifyOfGapAnalysisSubmission
} from './api'

export const store = create((set, get) => ({
    data: [],
    isLoading: false,
    pageIndex: 0,
    pageCount: 0,
    perPage: 0,
    total: 0,
    search: '',
    selectedStaff: {},
    selectedPosition: null,
    selectedCompetency: {},
    selectedIndicator: {},
    selectedDesignation: null,
    selectedTraining: null,
    selectedProposedTraining: null,
    selectedEvidence: null,
    selectedEvidenceType: null,
    selectedProposedTraining: null,
    isCareerPathFormOpen: false,
    isEvidenceFormOpen: false,
    isProposedTrainingFormOpen: false,
    selectedSubmission: null,
    selectedSubmittedCompetencies: null,
    submissionWindow: null,
    gapAnalysis: null,

    employees: {
        data: [],
        isLoading: false,
        error: null,
        filters: {},
    },

    designations: {
        data: [],
        isLoading: false,
        error: null,
        filters: {},
    },

    careerPaths: {
        data: [],
        isLoading: false,
        error: null,
        filters: {},
    },

    careerPathOptions: {
        data: [],
        isLoading: false,
        error: null,
        filters: {},
    },

    proposedTrainings: {
        data: [],
        isLoading: false,
        error: null,
        filters: {},
    },

    trainingOptions: {
        data: [],
        isLoading: false,
        error: null,
        filters: {},
    },

    competencies: {
        data: [],
        isLoading: false,
        error: null,
        filters: {},
    },

    selectedCompetencyData: {
        data: null,
        isLoading: false,
        error: null,
    },

    selectedIndicatorData: {
        data: null,
        isLoading: false,
        error: null,
    },

    selectedEvidenceData: {
        data: null,
        isLoading: false,
        error: null,
    },

    trainings: {
        data: [],
        isLoading: false,
        error: null,
        filters: {},
    },

    awards: {
        data: [],
        isLoading: false,
        error: null,
        filters: {},
    },

    performances: {
        data: [],
        isLoading: false,
        error: null,
        filters: {},
    },

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

    selectedSubmittedCompetencyData: {
        data: null,
        isLoading: false,
        error: null,
    },

    openCareerPathForm: () => set({ isCareerPathFormOpen: true }),
    closeCareerPathForm: () => set({ isCareerPathFormOpen: false }),
    openEvidenceForm: () => set({ isEvidenceFormOpen: true }),
    closeEvidenceForm: () => set({ isEvidenceFormOpen: false }),
    openProposedTrainingForm: () => set({ isProposedTrainingFormOpen: true }),
    closeProposedTrainingForm: () => set({ isProposedTrainingFormOpen: false }),
    setPageIndex: (pageIndex) => set({ pageIndex }),
    setSearch: (search) => set({ search, pageIndex: 0 }),
    setSelectedStaff: (staff) => set({ selectedStaff: staff }),
    setSelectedPosition: (position) => set({ selectedPosition: position }),
    setSelectedDesignation: (designation) => set({ selectedDesignation: designation }),
    setSelectedCareerPath: (careerPath) => set({ selectedCareerPath: careerPath }),
    setSelectedTraining: (training) => set({ selectedTraining: training }),
    setSelectedCompetency: (competency) => set({ selectedCompetency: competency }),
    setSelectedCompetencyData: (updater) =>
        set((state) =>
            typeof updater === "function"
                ? { selectedCompetencyData: updater(state.selectedCompetencyData) }
                : { selectedCompetencyData: updater }
        ),
    setSelectedIndicator: (indicator) => set({ selectedIndicator: indicator }),
    setSelectedIndicatorData: (updater) =>
        set((state) =>
            typeof updater === "function"
                ? { selectedIndicatorData: updater(state.selectedIndicatorData) }
                : { selectedIndicatorData: updater }
        ),
    setSelectedEvidence: (evidence) => set({ selectedEvidence: evidence }),
    setSelectedEvidenceType: (type) => set({ selectedEvidenceType: type }),
    setSelectedProposedTraining: (training) => set({ selectedProposedTraining: training }),
    setProposedTrainings: (updater) =>
        set((state) =>
            typeof updater === "function"
                ? { proposedTrainings: updater(state.proposedTrainings) }
                : { proposedTrainings: updater }
        ),
    setSubmissions: (updater) =>
        set((state) =>
            typeof updater === "function"
                ? { submissions: updater(state.submissions) }
                : { submissions: updater }
        ),
    setSelectedSubmission: (submission) => set({ selectedSubmission: submission }),
    setSelectedSubmittedCompetencies: (competencies) => set({ selectedSubmittedCompetencies: competencies }),
    setSubmissionWindow: (window) => set({ submissionWindow: window }),
    setGapAnalysis: (gapAnalysis) => set({ gapAnalysis }),

    setCompetenciesFilters: (filters) => {
        set((state) => ({
            competencies: {
                ...state.competencies,
                filters,
            }
        }))
    },

    fetchEmployees: async({filters = {}} = {}) => {
        const { employees } = get()

        set((state) => ({
        employees: {
            ...state.employees,
            isLoading: true,
            error: null,
            filters
        }
        }))

        try {
            const response = await getEmployees({filters})

            const data = response.data

            set((state) => ({
                employees: {
                    ...state.employees,
                    data,
                    isLoading: false,
                    error: null,
                }
            }))
        } catch (error) {
            set((state) => ({
                employees: {
                    ...state.employees,
                    error: error.message || 'Failed to fetch employees.',
                    isLoading: false,
                }
            }))
        }
    },

    fetchDesignations: async({id = null, filters = {}} = {}) => {
        const { designations } = get()

        set((state) => ({
            designations: {
                ...state.designations,
                isLoading: true,
                error: null,
                filters
            }
        }))

        try {
            const response = await getDesignations({id})

            const data = response.data

            set((state) => ({
                designations: {
                    ...state.designations,
                    data,
                    isLoading: false,
                    error: null,
                }
            }))
        } catch (error) {
            set((state) => ({
                designations: {
                    ...state.designations,
                    error: error.message || 'Failed to fetch designations.',
                    isLoading: false,
                }
            }))
        }
    },

    fetchCareerPaths: async({id = null, filters = {}} = {}) => {
        const { careerPaths } = get()

        set((state) => ({
            careerPaths: {
                ...state.careerPaths,
                isLoading: true,
                error: null,
                filters
            }
        }))

        try {
            const response = await getCareerPaths({id})

            const data = response.data

            set((state) => ({
                careerPaths: {
                    ...state.careerPaths,
                    data,
                    isLoading: false,
                    error: null,
                }
            }))
        } catch (error) {
            set((state) => ({
                careerPaths: {
                    ...state.careerPaths,
                    error: error.message || 'Failed to fetch career paths.',
                    isLoading: false,
                }
            }))
        }
    },

    fetchCareerPathOptions: async({id = null, filters = {}} = {}) => {
        const { careerPathOptions } = get()

        set((state) => ({
            careerPathOptions: {
                ...state.careerPathOptions,
                isLoading: true,
                error: null,
                filters
            }
        }))

        try {
            const response = await getCareerPathOptions({id})

            const data = response.data

            set((state) => ({
                careerPathOptions: {
                    ...state.careerPathOptions,
                    data,
                    isLoading: false,
                    error: null,
                }
            }))
        } catch (error) {
            set((state) => ({
                careerPathOptions: {
                    ...state.careerPathOptions,
                    error: error.message || 'Failed to fetch career path options.',
                    isLoading: false,
                }
            }))
        }
    },

    submitCareerPath: async ({form, toast, onClose}) => {
        const { 
            selectedStaff,
            fetchCareerPaths,
            careerPathOptions,
            setSelectedCareerPath
        } = get()

        const onDone = () => {
            form.reset()
            form.clearErrors()
            if (onClose) onClose()
            fetchCareerPaths({id: selectedStaff.value})
            setSelectedCareerPath(careerPathOptions.data.find(item => item.value === form.data.position_id) ?? null)
        }

        form.post(route('cga.career-path.store', selectedStaff.value), {
            onSuccess: () => {
                toast({
                    title: "Success!",
                    description: "The career path has been saved successfully",
                })
                onDone()
            },
            onError: () => {},
        })
    },

    deleteCareerPath: async ({toast}) => {
        const { 
            selectedCareerPath,
            setSelectedCareerPath,
            fetchCareerPaths,
            setSelectedCompetency,
            setSelectedIndicator,
            setSelectedCompetencyData,
            setSelectedIndicatorData,
            resetCompetencies
        } = get()
        if (!selectedCareerPath) return

        const { emp_id, value: position_id } = selectedCareerPath

        const onDone = () => {
            fetchCareerPaths({id: emp_id})
            setSelectedCareerPath(null)
            setSelectedCompetency({})
            setSelectedIndicator({})
            setSelectedCompetencyData({})
            setSelectedIndicatorData({})
            resetCompetencies()
        }


        try {
            await deleteCareerPath({ id: emp_id, position_id })
            toast({
                title: "Position removed from the career path",
                description: `Position has been successfully deleted from your career path list.`,
            })
            onDone()

        } catch (error) {
            console.error('Delete career path error:', error)
            toast({
                title: "Delete failed",
                description: error.response?.data?.message || error.message,
                variant: "destructive"
            })
        } 
    },

    fetchCompetencies: async ({id = null, filters = {}} = {}) => {
        const { competencies } = get()

        set((state) => ({
            competencies: {
                ...state.competencies,
                isLoading: true,
            }
            }))

        try {
            const response = await getCompetencies({
                id,
                filters
            })

            const data = response.data

            set((state) => ({
                competencies: {
                    ...state.competencies,
                    data,
                    isLoading: false,
                }
            }))
        } catch (error) {
            set((state) => ({
                competencies: {
                    ...state.competencies,
                    error: error.message || 'Failed to fetch competencies.',
                    isLoading: false,
                }
            }))
        }
    },

    resetCompetencies: () => set((state) => ({
        competencies: {
            ...state.competencies,
            data: [],
            isLoading: false,
            error: null,
            filters: {},
        }
    })),

    fetchSelectedCompetency: async ({id = null, filters = {}} = {}) => {
        set((state) => ({
            selectedCompetencyData: {
                ...state.selectedCompetencyData,
                isLoading: true,
                error: null,
            }
        }))

        try {
            const response = await getCompetencyIndicators({
                id,
                filters
            }
        )
            const data = response.data

            set((state) => ({
                selectedCompetencyData: {
                    ...state.selectedCompetencyData,
                    data,
                    isLoading: false,
                    error: null,
                }
            }))
        } catch (error) {
            set((state) => ({
                selectedCompetencyData: {
                    ...state.selectedCompetencyData,
                    error: error.message || 'Failed to fetch competency indicators.',
                    isLoading: false,
                }
            }))
        }
    },

    updateIndicator: async (indicator, toast) => {
        
        const { 
            selectedCompetencyData,
            fetchCompetencies,
            competencies,
            selectedCompetency
         } = get()
        const { 
            id, 
            emp_id,
            position_id, 
            compliance 
        } = indicator

        try {
            await updateCompetencyIndicator(indicator)

            toast({
                title: 'Success!',
                description: 'The indicator updated successfully',
            })

            const newData = { ...selectedCompetencyData.data }
            
            for (const proficiency in newData) {
                newData[proficiency] = newData[proficiency].map(ind =>
                    ind.id === indicator.id
                        ? { ...ind, compliance }
                        : ind
                )
            }

            const allIndicators = Object.values(newData).flat()
            const total = allIndicators.length
            const compliantCount = allIndicators.filter(ind => ind.compliance === true || ind.compliance === 1).length

            const newPercentage = total > 0 ? ((compliantCount / total) * 100).toFixed(2) : "0.00"

            const newCompetencies = { ...competencies }

            for (const type in newCompetencies.data) {
                newCompetencies.data[type] = newCompetencies.data[type].map(comp =>
                    comp.id === selectedCompetency.id
                        ? { ...comp, percentage: newPercentage }
                        : comp
                )
            }

            set({
                selectedCompetencyData: {
                    ...selectedCompetencyData,
                    data: newData
                },
                competencies: newCompetencies
            })

        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update indicator.',
                variant: 'destructive',
            })

            console.log(error)
        }
    },

    fetchSelectedIndicator: async ({id = null, filters = {}} = {}) => {
        set((state) => ({
            selectedIndicatorData: {
                ...state.selectedIndicatorData,
                isLoading: true,
                error: null,
            }
        }))

        try {
            const response = await getIndicatorEvidences({id, filters })

            const data = response.data

            set((state) => ({
                selectedIndicatorData: {
                    ...state.selectedIndicatorData,
                    data,
                    isLoading: false,
                    error: null,
                }
            }))

        } catch (error) {
            set((state) => ({
                selectedIndicatorData: {
                    ...state.selectedIndicatorData,
                    error: error.message || 'Failed to fetch indicator evidences.',
                    isLoading: false,
                }
            }))
        }
    },

    fetchEvidence: async({id = null, filters = {}} = {}) => {
        set((state) => ({
        selectedEvidenceData: {
            ...state.selectedEvidenceData,
            isLoading: true,
            error: null,
            filters
        }
        }))

        try {
            const response = await getEvidence({id, filters})

            const data = response.data.evidence

            set((state) => ({
                selectedEvidenceData: {
                    ...state.selectedEvidenceData,
                    data,
                    isLoading: false,
                    error: null,
                }
            }))
        } catch (error) {
            set((state) => ({
                selectedEvidenceData: {
                    ...state.selectedEvidenceData,
                    error: error.message || 'Failed to fetch evidence.',
                    isLoading: false,
                }
            }))
        }
    },

    fetchTrainings: async({id = null, filters = {}} = {}) => {
        set((state) => ({
        trainings: {
            ...state.trainings,
            isLoading: true,
            error: null,
            filters
        }
        }))

        try {
            const response = await getTrainings({id, filters})

            const data = response.data

            set((state) => ({
                trainings: {
                    ...state.trainings,
                    data,
                    isLoading: false,
                    error: null,
                }
            }))
        } catch (error) {
            set((state) => ({
                trainings: {
                    ...state.trainings,
                    error: error.message || 'Failed to fetch trainings.',
                    isLoading: false,
                }
            }))
        }
    },

    fetchAwards: async({id = null, filters = {}} = {}) => {
        set((state) => ({
        awards: {
            ...state.awards,
            isLoading: true,
            error: null,
            filters
        }
        }))

        try {
            const response = await getAwards({id, filters})

            const data = response.data

            set((state) => ({
                awards: {
                    ...state.awards,
                    data,
                    isLoading: false,
                    error: null,
                }
            }))
        } catch (error) {
            set((state) => ({
                awards: {
                    ...state.awards,
                    error: error.message || 'Failed to fetch awards.',
                    isLoading: false,
                }
            }))
        }
    },

    fetchPerformances: async({id = null, filters = {}} = {}) => {
        set((state) => ({
        performances: {
            ...state.performances,
            isLoading: true,
            error: null,
            filters
        }
        }))

        try {
            const response = await getPerformances({id, filters})

            const data = response.data

            set((state) => ({
                performances: {
                    ...state.performances,
                    data,
                    isLoading: false,
                    error: null,
                }
            }))
        } catch (error) {
            set((state) => ({
                performances: {
                    ...state.performances,
                    error: error.message || 'Failed to fetch performances.',
                    isLoading: false,
                }
            }))
        }
    },

    submitEvidence: async ({form, toast, type, onClose}) => {
        const { 
            selectedStaff,
            selectedIndicator,
            fetchSelectedIndicator,
            selectedEvidence,
            selectedCompetencyData,
            setSelectedCompetencyData
        } = get()

        const onDone = () => {
            form.reset()
            form.clearErrors()
            if (onClose) onClose()
            fetchSelectedIndicator({
                id: selectedIndicator.id,
                filters: { 
                    emp_id: selectedStaff.value,
                    position_id: selectedStaff.item_no,
                    indicator_id: selectedIndicator.indicator_id
                }
            })
        }

        if (form.data.isEdit) {
            form.post(route(`cga.${type.toLowerCase()}.store`, selectedEvidence.id), {
                onSuccess: () => {
                    toast({
                        title: "Success!",
                        description: "The evidence has been updated successfully",
                    })
                    onDone()
                },
                onError: () => {},
            })
        } else {
            form.post(route(`cga.${type.toLowerCase()}.store`, selectedStaff.value), {
                onSuccess: () => {
                    toast({
                        title: "Success!",
                        description: "The evidence has been saved successfully",
                    })
                    onDone()
                    if (selectedCompetencyData?.data) {
                        const newData = { ...selectedCompetencyData.data }
                        for (const proficiency in newData) {
                            newData[proficiency] = newData[proficiency].map(ind =>
                                ind.indicator_id === selectedIndicator.indicator_id
                                    ? { ...ind, evidence_count: (ind.evidence_count ?? 0) + 1 }
                                    : ind
                            )
                        }
                        setSelectedCompetencyData((old) => ({
                            ...old,
                            data: newData
                        }))
                    }  
                },
                onError: () => {},
            })
        }
    },

    deleteEvidence: async ({ id, form, toast }) => {
        const { 
            selectedStaff,
            selectedIndicator,
            fetchSelectedIndicator,
            selectedCompetencyData,
            setSelectedCompetencyData
        } = get()

        const onDone = () => {
            fetchSelectedIndicator({
                id: selectedIndicator.id,
                filters: { 
                    emp_id: selectedStaff.value,
                    position_id: selectedStaff.item_no,
                    indicator_id: selectedIndicator.indicator_id
                }
            }) 
            
            if (selectedCompetencyData?.data) {
                const newData = { ...selectedCompetencyData.data }
                for (const proficiency in newData) {
                    newData[proficiency] = newData[proficiency].map(ind =>
                        ind.indicator_id === selectedIndicator.indicator_id
                            ? { ...ind, evidence_count: Math.max((ind.evidence_count ?? 1) - 1, 0) }
                            : ind
                    )
                }
                setSelectedCompetencyData((old) => ({
                    ...old,
                    data: newData
                }))
            }
        }

        form.delete(route('cga.evidence.destroy', id), {
            onSuccess: () => {
                toast({
                    title: "Success!",
                    description: "The evidence was deleted successfully.",
                })
                onDone()
            },
            onError: () => {
                toast({
                    title: 'Error',
                    description: 'Failed to delete the evidence.',
                    variant: 'destructive',
                })
            },
        })
    },

    deleteEvidences: async ({ form, toast }) => {
        const { 
            selectedStaff,
            selectedIndicator,
            fetchSelectedIndicator,
            selectedCompetencyData,
            setSelectedCompetencyData
        } = get()

        const toSubtract = form.data?.ids?.length || 0

        const onDone = () => {
            fetchSelectedIndicator({
                id: selectedIndicator.id,
                filters: { 
                    emp_id: selectedStaff.value,
                    position_id: selectedStaff.item_no,
                    indicator_id: selectedIndicator.indicator_id
                }
            })  

            if (selectedCompetencyData?.data && toSubtract > 0) {
                const newData = { ...selectedCompetencyData.data }
                for (const proficiency in newData) {
                    newData[proficiency] = newData[proficiency].map(ind =>
                        ind.indicator_id === selectedIndicator.indicator_id
                            ? { ...ind, evidence_count: Math.max((ind.evidence_count ?? 0) - toSubtract, 0) }
                            : ind
                    )
                }
                setSelectedCompetencyData((old) => ({
                    ...old,
                    data: newData
                }))
            }
        }

        form.delete(route('cga.evidence.bulk-destroy'), {
            onSuccess: () => {
                toast({
                    title: "Success!",
                    description: "The evidences were deleted successfully.",
                })
                onDone()
            },
            onError: () => {
                toast({
                    title: 'Error',
                    description: 'Failed to delete the evidences.',
                    variant: 'destructive',
                })
            },
        })
    },

    fetchProposedTrainings: async({id = null, filters = {}} = {}) => {
        set((state) => ({
        proposedTrainings: {
            ...state.proposedTrainings,
            isLoading: true,
            error: null,
            filters
        }
        }))

        try {
            const response = await getProposedTrainings({id, filters})

            const data = response.data

            set((state) => ({
                proposedTrainings: {
                    ...state.proposedTrainings,
                    data,
                    isLoading: false,
                    error: null,
                }
            }))
        } catch (error) {
            set((state) => ({
                proposedTrainings: {
                    ...state.proposedTrainings,
                    error: error.message || 'Failed to fetch proposed trainings.',
                    isLoading: false,
                }
            }))
        }
    },

    fetchTrainingOptions: async({filters = {}} = {}) => {
        const { trainingOptions } = get()

        set((state) => ({
            trainingOptions: {
                ...state.trainingOptions,
                isLoading: true,
                error: null,
                filters
            }
        }))

        try {
            const response = await getTrainingOptions({filters})

            const data = response.data

            set((state) => ({
                trainingOptions: {
                    ...state.trainingOptions,
                    data,
                    isLoading: false,
                    error: null,
                }
            }))
        } catch (error) {
            set((state) => ({
                trainingOptions: {
                    ...state.trainingOptions,
                    error: error.message || 'Failed to fetch training options.',
                    isLoading: false,
                }
            }))
        }
    },

    deleteProposedTraining: async ({ emp_id, submission_id, id, form, toast }) => {
        const { 
            fetchProposedTrainings,
        } = get()

        const onDone = () => {
            fetchProposedTrainings({
                id: emp_id,
                filters: {
                    review_id: submission_id ?? null
                }
            })
        }

        form.delete(route('cga.proposed-trainings.destroy', id), {
            onSuccess: () => {
                toast({
                    title: "Success!",
                    description: "The proposed training was deleted successfully.",
                })
                onDone()
            },
            onError: () => {
                toast({
                    title: 'Error',
                    description: 'Failed to delete the proposed training.',
                    variant: 'destructive',
                })
            },
        })
    },

    deleteProposedTrainings: async ({ emp_id, submission_id, form, toast }) => {
        const { 
            fetchProposedTrainings,
        } = get()

        const onDone = () => {
            fetchProposedTrainings({
                id: emp_id,
                filters: {
                    review_id: submission_id ?? null
                }
            })
        }

        form.delete(route('cga.proposed-trainings.bulk-destroy'), {
            onSuccess: () => {
                toast({
                    title: "Success!",
                    description: "The proposed trainings were deleted successfully.",
                })
                onDone()
            },
            onError: () => {
                toast({
                    title: 'Error',
                    description: 'Failed to delete the proposed trainings.',
                    variant: 'destructive',
                })
            },
        })
    },

    submitProposedTraining: async ({submission_id, form, toast, onClose}) => {
        const { 
            fetchProposedTrainings,
        } = get()

        const onDone = () => {
            form.reset()
            form.clearErrors()
            if (onClose) onClose()
            fetchProposedTrainings({
                id: form.data.emp_id,
                filters: {
                    review_id: submission_id ?? null
                }
            })
        }

        if (form.data.id) {
            form.put(route('cga.proposed-trainings.update', form.data.id), {
                onSuccess: () => {
                    toast({
                        title: "Success!",
                        description: "The training has been updated successfully",
                    })
                    onDone()
                },
                onError: () => {},
            })
        } else {
            form.post(route('cga.proposed-trainings.store'), {
                onSuccess: () => {
                    toast({
                        title: "Success!",
                        description: "The training has been saved successfully",
                    })
                    onDone()
                },
                onError: () => {},
            })
        }
    },

    fetchSubmissions: async({id = null, filters = {}} = {}) => {
        set((state) => ({
        submissions: {
            ...state.submissions,
            isLoading: true,
            error: null,
            filters
        }
        }))

        try {
            const response = await getSubmissions({id, filters})

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

    deleteSubmission: async ({ id, form, toast }) => {
        const { 
            selectedStaff,
            fetchSubmissions,
            setSelectedSubmission
        } = get()

        const onDone = () => {
            setSelectedSubmission(null)
            fetchSubmissions({
                id: selectedStaff.value,
            })
        }

        router.delete(route('cga.submissions.destroy', id), {
            onSuccess: () => {
                toast({
                    title: "Success!",
                    description: "The submission was deleted successfully.",
                })
                onDone()
            },
            onError: () => {
                toast({
                    title: 'Error',
                    description: 'Failed to delete the submission.',
                    variant: 'destructive',
                })
            },
        })
    },

    deleteSubmissions: async ({ form, toast }) => {
        const { 
            selectedStaff,
            fetchSubmissions,
        } = get()

        const onDone = () => {
            fetchSubmissions({
                id: selectedStaff.value,
            })
        }

        form.delete(route('cga.submissions.bulk-destroy'), {
            onSuccess: () => {
                toast({
                    title: "Success!",
                    description: "The submissions were deleted successfully.",
                })
                onDone()
            },
            onError: () => {
                toast({
                    title: 'Error',
                    description: 'Failed to delete the submissions.',
                    variant: 'destructive',
                })
            },
        })
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

    fetchSubmissionWindow: async () => {
        const { 
            selectedStaff,
            setSubmissionWindow,
        } = get()

        try {
            const response = await getSubmissionWindow()
            const data = response.data

            setSubmissionWindow(data)

        } catch (error) {
            console.log(error)
            setSubmissionWindow(null)
        }
    },

    fetchGapAnalysis: async ({id = null, filters = {}} = {}) => {
        const { 
            setGapAnalysis,
        } = get()

        try {
            const response = await getGapAnalysis({id, filters})
            const data = response.data

            setGapAnalysis(data)

        } catch (error) {
            console.log(error)
            setGapAnalysis(null)
        }
    },

    submitGapAnalysis: async ({ form, toast, setSubmitted }) => {
        const {
            selectedStaff,
            sendGapAnalysisSubmissionNotification
        } = get()

        toast({
            title: "Submitting...",
            description: "Gap analysis submission is being processed in the background.",
        })

        setTimeout(() => {
            form.post(route('cga.gap-analysis.store'), {
                onSuccess: () => {
                    setSubmitted(true)
                    sendGapAnalysisSubmissionNotification({ emp_id: selectedStaff?.value })

                    toast({
                        title: "Success!",
                        description: "Gap analysis has been submitted successfully.",
                    })
                },
                onError: () => {
                    toast({
                        title: "Error",
                        description: "Submission failed. Please try again.",
                        variant: "destructive"
                    })
                }
            })
        }, 100)
    },

    sendGapAnalysisSubmissionNotification: async (payload) => {
        try {
            const response = await notifyOfGapAnalysisSubmission(payload)
    
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
}))