import { create } from 'zustand'
import { format } from 'date-fns'
import { 
    getVacancies,
    getSelectedVacancy,
    addVacancy,
    editVacancy,
    deleteVacancy
} from '@/pages/Vacancies/api'

const useVacanciesStore = create((set, get) => ({
    toast: null,
    setToast: (toastInstance) => set({ toast: toastInstance }),
    vacanciesState: {
        vacancies: [],
        filteredVacancies: [],
        loading: false,
        currentPage: 1,
        isFormOpen: false
    },
    selectedVacancyState: {
        selectedVacancy: null,
        loading: false
    },

    setVacanciesLoading: (loading) => set(state => ({
        vacanciesState: { ...state.vacanciesState, loading }
    })),

    setVacancies: (vacancies) => set(state => ({
        vacanciesState: { ...state.vacanciesState, vacancies, loading: false }
    })),

    setFilteredVacancies: (filtered) => set(state => ({
        vacanciesState: { ...state.vacanciesState, filteredVacancies: filtered }
    })),

    /* setFilters: (filters) => set(state => ({
        competenciesState: {
            ...state.competenciesState,
            currentPage: 1,
            filters: { ...state.competenciesState.filters, ...filters }
        }
    })), */

    /* clearFilters: () => set(state => ({
        competenciesState: {
            ...state.competenciesState,
            filters: { staff: null }
        }
    })), */

    setCurrentPage: (page) => set(state => ({
        vacanciesState: {
            ...state.vacanciesState,
            currentPage: page
        }
    })),

    openFormModal: () => set(state => ({
        vacanciesState: { 
            ...state.vacanciesState, 
            isFormOpen: true
        }
    })),

    closeFormModal: () => set(state => ({
        vacanciesState: { 
            ...state.vacanciesState, 
            isFormOpen: false
        }
    })),

    setSelectedVacancy: (selectedVacancy) => set(state => ({
        selectedVacancyState: { ...state.selectedVacancyState, selectedVacancy }
    })),

    setSelectedVacancyLoading: (loading) => set(state => ({
        selectedVacancyState: { ...state.selectedVacancyState, loading }
    })),

    loadVacancies: async () => {
        const { 
            toast,
            vacanciesState: {
                currentPage,
                filters,
            }, 
            setVacanciesLoading,
            setVacancies
        } = get()
        
        try{
            setVacanciesLoading(true)

            const response = await getVacancies({page: currentPage, filters})

            if (response.status === 200) {
                setVacancies(response.data)
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
            setVacanciesLoading(false)
        }
    },

    addVacancy: async (newVacancy) => {
        const {
            toast,
            vacanciesState,
            setVacancies
        } = get()

        try {
            const response = await addVacancy(newTraining)

            if (response.status === 201) {
                setVacancies([...vacanciesState.vacancies, response.data])
                toast({
                    title: "Vacancy Added",
                    description: "The vacancy was successfully added.",
                    variant: "success",
                })
            } else {
                throw new Error("Failed to add the vacancy.")
            }
        } catch (error) {
            toast({
                title: "Error adding vacancy",
                description: error.message || "An unexpected error occurred.",
                variant: "destructive",
            })
        }
    },

    editVacancy: async (updatedVacancy) => {
        const {
            toast,
            vacanciesState,
            setVacancies
        } = get()

        try {
            const response = await editVacancy(updatedVacancy)

            if (response.status === 200) {
                const updatedVacancies = vacanciesState.vacancies.map((vacancy) =>
                    vacancy.id === updatedVacancy.id ? response.data : vacancy
                )
                setVacancies(updatedVacancies)

                toast({
                    title: "Vacancy Updated",
                    description: "The vacancy was successfully updated.",
                    variant: "success",
                })
            } else {
                throw new Error("Failed to update the vacancy.")
            }
        } catch (error) {
            toast({
                title: "Error updating vacancy",
                description: error.message || "An unexpected error occurred.",
                variant: "destructive",
            })
        }
    },

    deleteVacancy: async (deletedVacancy) => {
        const {
            toast,
            loadVacancies
        } = get()

        try {
            const response = await deleteVacancy(vacancy)

            if (response.status === 200) {
                
                loadVacancies()

                toast({
                    title: "Vacancy Deleted",
                    description: "The vacancy was successfully deleted.",
                    variant: "success",
                })
            } else {
                throw new Error("Failed to delete the vacancy.")
            }
        } catch (error) {
            
            toast({
                title: "Error deleting vacancy",
                description: error.message || "An unexpected error occurred.",
                variant: "destructive",
            })
        }
    },

    loadSelectedVacancy: async (selectedVacancy) => {
        const { 
            toast,
            setSelectedVacancy,
            setSelectedVacancyLoading,
        } = get()

        try{
            setSelectedVacancyLoading(true)

            const response = await getSelectedVacancy(selectedVacancy)

            if (response.status === 200) {
                setSelectedVacancy(response.data)
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
            setSelectedVacancyLoading(false)
        }
    },
}))

export default useVacanciesStore