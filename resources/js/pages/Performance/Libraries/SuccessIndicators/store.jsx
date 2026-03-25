import { create } from "zustand"

export const store = create((set) => ({
  indicators: {
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
  setIndicators: (updater) =>
    set((state) =>
      typeof updater === "function"
        ? { indicators: updater(state.indicators) }
        : { indicators: updater }
    ),
  fetchIndicators: async ({ filters = {} } = {}) => {
    set((state) => ({
      indicators: {
        ...state.indicators,
        isLoading: true,
        error: null,
        filters,
      },
    }))

    try {
      const response = await axios.get(route("performance.success-indicators.index"), { params: filters })
      set((state) => ({
        indicators: {
          ...state.indicators,
          data: response.data,
          isLoading: false,
          error: null,
        },
      }))
    } catch (error) {
      set((state) => ({
        indicators: {
          ...state.indicators,
          error: error.message || "Failed to fetch success indicators.",
          isLoading: false,
        },
      }))
    }
  },
}))
