import { create } from "zustand"

export const store = create((set) => ({
  mfos: {
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
  setMfos: (updater) =>
    set((state) =>
      typeof updater === "function"
        ? { mfos: updater(state.mfos) }
        : { mfos: updater }
    ),
  fetchMfos: async ({ filters = {} } = {}) => {
    set((state) => ({
      mfos: {
        ...state.mfos,
        isLoading: true,
        error: null,
        filters,
      },
    }))

    try {
      const response = await axios.get(route("performance.mfos.index"), { params: filters })
      set((state) => ({
        mfos: {
          ...state.mfos,
          data: response.data,
          isLoading: false,
          error: null,
        },
      }))
    } catch (error) {
      set((state) => ({
        mfos: {
          ...state.mfos,
          error: error.message || "Failed to fetch MFOs.",
          isLoading: false,
        },
      }))
    }
  },
}))
