import { create } from "zustand"

export const store = create((set) => ({
  programs: {
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
  setPrograms: (updater) =>
    set((state) =>
      typeof updater === "function"
        ? { programs: updater(state.programs) }
        : { programs: updater }
    ),
  fetchPrograms: async ({ filters = {} } = {}) => {
    set((state) => ({
      programs: {
        ...state.programs,
        isLoading: true,
        error: null,
        filters,
      },
    }))

    try {
      const response = await axios.get(route("performance.programs.index"), { params: filters })
      set((state) => ({
        programs: {
          ...state.programs,
          data: response.data,
          isLoading: false,
          error: null,
        },
      }))
    } catch (error) {
      set((state) => ({
        programs: {
          ...state.programs,
          error: error.message || "Failed to fetch Programs.",
          isLoading: false,
        },
      }))
    }
  },
}))

