import axios from "axios"
import { create } from "zustand"

export const store = create((set) => ({
  ppas: {
    data: {
      data: [],
      current_page: 1,
      last_page: 1,
      per_page: 20,
    },
    isLoading: false,
    error: null,
    filters: {},
  },
  setPpas: (updater) =>
    set((state) =>
      typeof updater === "function"
        ? { ppas: updater(state.ppas) }
        : { ppas: updater }
    ),
  fetchPpas: async ({ filters = {} } = {}) => {
    set((state) => ({
      ppas: {
        ...state.ppas,
        isLoading: true,
        error: null,
        filters,
      },
    }))

    try {
      const response = await axios.get(route("performance.ppas.index"), { params: filters })
      set((state) => ({
        ppas: {
          ...state.ppas,
          data: response.data,
          isLoading: false,
          error: null,
        },
      }))
    } catch (error) {
      set((state) => ({
        ppas: {
          ...state.ppas,
          error: error.message || "Failed to fetch PPAs.",
          isLoading: false,
        },
      }))
    }
  },
}))
