import { create } from 'zustand'
import { format } from 'date-fns'
import { router } from '@inertiajs/react'

export const store = create((set, get) => ({
    requirements: {
        data: [],
        isLoading: false,
        error: null,
        filters: {},
    },

    setRequirements: (updater) =>
        set((state) =>
            typeof updater === "function"
                ? { requirements: updater(state.requirements) }
                : { requirements: updater }
        ),

    fetchRequirements: async(id, {filters = {}} = {}) => {
        set((state) => ({
        requirements: {
            ...state.requirements,
            isLoading: true,
            error: null,
            filters
        }
        }))

        try {
            const response = await axios.get(route('vacancy-requirements.index', id),{filters})

            const data = response.data

            set((state) => ({
                requirements: {
                    ...state.requirements,
                    data,
                    isLoading: false,
                    error: null,
                }
            }))
        } catch (error) {

            set((state) => ({
                requirements: {
                    ...state.requirements,
                    error: error.message || 'Failed to fetch requirements.',
                    isLoading: false,
                }
            }))
            
        }
    },
}))