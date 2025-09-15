import { create } from 'zustand'
import { format } from 'date-fns'
import { router } from '@inertiajs/react'

export const store = create((set, get) => ({
    indicators: {
        data: [],
        isLoading: false,
        error: null,
        filters: {},
    },

    setIndicators: (updater) =>
        set((state) =>
            typeof updater === "function"
                ? { indicators: updater(state.indicators) }
                : { indicators: updater }
        ),

    fetchIndicators: async({filters = {}} = {}) => {
        set((state) => ({
        indicators: {
            ...state.indicators,
            isLoading: true,
            error: null,
            filters
        }
        }))

        try {
            const response = await axios.get(route('indicators.index'),{filters})

            const data = response.data

            set((state) => ({
                indicators: {
                    ...state.indicators,
                    data,
                    isLoading: false,
                    error: null,
                }
            }))
        } catch (error) {

            set((state) => ({
                indicators: {
                    ...state.indicators,
                    error: error.message || 'Failed to fetch indicators.',
                    isLoading: false,
                }
            }))
            
        }
    },
}))