import { create } from 'zustand'
import { format } from 'date-fns'
import { router } from '@inertiajs/react'

export const store = create((set, get) => ({
    jobs: {
        data: [],
        isLoading: false,
        error: null,
        filters: {},
    },

    requirements: {
        data: [],
        isLoading: false,
        error: null,
        filters: {},
    },

    selectedJob: null,
    selectedApplication: null,

    setJobs: (updater) =>
        set((state) =>
            typeof updater === "function"
                ? { jobs: updater(state.jobs) }
                : { jobs: updater }
        ),

    setSelectedApplication: (application) => set({ selectedApplication: application }),

    fetchVacancies: async(id, {filters = {}} = {}) => {
        set((state) => ({
        jobs: {
            ...state.jobs,
            isLoading: true,
            error: null,
            filters
        }
        }))

        try {
            const response = await axios.get(route('jobs.index', id),{filters})

            const data = response.data

            set((state) => ({
                jobs: {
                    ...state.jobs,
                    data,
                    isLoading: false,
                    error: null,
                }
            }))
        } catch (error) {

            set((state) => ({
                jobs: {
                    ...state.jobs,
                    error: error.message || 'Failed to fetch jobs.',
                    isLoading: false,
                }
            }))
            
        }
    },

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
            const response = await axios.get(route('jobs.requirements', id),{filters})

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