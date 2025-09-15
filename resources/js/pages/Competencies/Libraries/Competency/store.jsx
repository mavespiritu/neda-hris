import { create } from 'zustand'
import { format } from 'date-fns'
import { router } from '@inertiajs/react'

export const store = create((set, get) => ({
    competencies: {
        data: [],
        isLoading: false,
        error: null,
        filters: {},
    },

    setCompetencies: (updater) =>
        set((state) =>
            typeof updater === "function"
                ? { competencies: updater(state.competencies) }
                : { competencies: updater }
        ),

    fetchCompetencies: async({filters = {}} = {}) => {
        set((state) => ({
        competencies: {
            ...state.competencies,
            isLoading: true,
            error: null,
            filters
        }
        }))

        try {
            const response = await axios.get(route('competencies.index'),{filters})

            const data = response.data

            set((state) => ({
                competencies: {
                    ...state.competencies,
                    data,
                    isLoading: false,
                    error: null,
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
}))