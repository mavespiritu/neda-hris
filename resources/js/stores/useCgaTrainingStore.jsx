import { create } from 'zustand'
import { format } from 'date-fns'
import { 
    getProposedTrainings,
    addProposedTraining,
    editProposedTraining,
    deleteProposedTraining
} from '@/pages/MyCga/api'

const useCgaTrainingStore = create((set, get) => ({
    toast: null,
    setToast: (toastInstance) => set({ toast: toastInstance }),
    trainingsState: {
        trainings: [],
        filteredTrainings: [],
        loading: true,
        currentPage: 1,
        selectedTraining: null,
        filters: {
            competency: null,
            search: ""
        },
        isFilterModalOpen: false,
        isFormModalOpen: false
    },

    setTrainingsLoading: (loading) => set(state => ({
        trainingsState: { ...state.trainingsState, loading }
    })),

    setTrainings: (trainings) => set(state => ({
        trainingsState: { ...state.trainingsState, trainings, loading: false }
    })),

    setFilteredTrainings: (filtered) => set(state => ({
        trainingsState: { ...state.trainingsState, filteredTrainings: filtered }
    })),

    setFilters: (filters) => set(state => ({
        trainingsState: {
            ...state.trainingsState,
            currentPage: 1,
            filters: { ...state.trainingsState.filters, ...filters }
        }
    })),

    clearFilters: () => set(state => ({
        trainingsState: {
            ...state.trainingsState,
            filters: { 
                competency: null,
                search: "" 
            }
        }
    })),

    setCurrentPage: (page) => set(state => ({
        trainingsState: {
            ...state.trainingsState,
            currentPage: page
        }
    })),

    setSelectedTraining: (selectedTraining) => set(state => ({
        trainingsState: { ...state.trainingsState, selectedTraining }
    })),

    openFilterModal: () => set(state => ({
        trainingsState: { 
            ...state.trainingsState, 
            isFilterModalOpen: true
        }
    })),

    closeFilterModal: () => set(state => ({
        trainingsState: { 
            ...state.trainingsState, 
            isFilterModalOpen: false
        }
    })),

    openFormModal: (selectedTraining) => set(state => ({
        trainingsState: { 
            ...state.trainingsState, 
            isFormModalOpen: true,
            selectedTraining
        }
    })),

    closeFormModal: () => set(state => ({
        trainingsState: { 
            ...state.trainingsState, 
            isFormModalOpen: false
        }
    })),

    loadSubmittedTrainings: async (emp_id, review_id) => {
        const { 
            toast,
            trainingsState: {
                currentPage,
                filters,
            }, 
            setTrainingsLoading,
            setTrainings
        } = get()
        
        try{
            setTrainingsLoading(true)

            const response = await getProposedTrainings({emp_id, review_id, page: currentPage, filters})

            if (response.status === 200) {
                setTrainings(response.data)
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
            setTrainingsLoading(false)
        }
    },

    loadTrainings: async (emp_id, position_id) => {
        const { 
            toast,
            trainingsState: {
                currentPage,
                filters,
            }, 
            setTrainingsLoading,
            setTrainings
        } = get()
        
        try{
            setTrainingsLoading(true)

            const response = await getProposedTrainings({emp_id, position_id, page: currentPage, filters})

            if (response.status === 200) {
                setTrainings(response.data)
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
            setTrainingsLoading(false)
        }
    },

    addTraining: async (newTraining) => {
        const { toast, trainingsState, setTrainings } = get()

        try {
            const response = await addProposedTraining(newTraining)

            if (response.status === 201) {
                setTrainings([...trainingsState.trainings, response.data])
                toast({
                    title: "Training Added",
                    description: "The training was successfully added.",
                    variant: "success",
                })
            } else {
                throw new Error("Failed to add the training.")
            }
        } catch (error) {
            toast({
                title: "Error adding training",
                description: error.message || "An unexpected error occurred.",
                variant: "destructive",
            })
        }
    },

    editTraining: async (updatedTraining) => {
        const { toast, trainingsState, setTrainings } = get()

        try {
            const response = await editProposedTraining(updatedTraining)

            if (response.status === 200) {
                const updatedTrainings = trainingsState.trainings.map((training) =>
                    training.id === updatedTraining.id ? response.data : training
                )
                setTrainings(updatedTrainings)

                toast({
                    title: "Training Updated",
                    description: "The training was successfully updated.",
                    variant: "success",
                })
            } else {
                throw new Error("Failed to update the training.")
            }
        } catch (error) {
            toast({
                title: "Error Updating Training",
                description: error.message || "An unexpected error occurred.",
                variant: "destructive",
            })
        }
    },

    /* deleteTraining: async (training, empId, positionId) => {
        const { toast, loadTrainings } = get()

        try {
            const response = await deleteProposedTraining(training)

            if (response.status === 200) {
                
                loadTrainings(empId, positionId)

                toast({
                    title: "Training Deleted",
                    description: "The training was successfully deleted.",
                    variant: "success",
                })
            } else {
                throw new Error("Failed to delete the training.")
            }
        } catch (error) {
            
            toast({
                title: "Error Deleting Training",
                description: error.message || "An unexpected error occurred.",
                variant: "destructive",
            })
        }
    }, */

}))

export default useCgaTrainingStore