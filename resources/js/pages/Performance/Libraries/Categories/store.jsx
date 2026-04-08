import { create } from "zustand"

export const store = create((set) => ({
  categories: {
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
  setCategories: (updater) =>
    set((state) =>
      typeof updater === "function"
        ? { categories: updater(state.categories) }
        : { categories: updater }
    ),
  fetchCategories: async ({ filters = {} } = {}) => {
    set((state) => ({
      categories: {
        ...state.categories,
        isLoading: true,
        error: null,
        filters,
      },
    }))

    try {
      const response = await axios.get(route("performance.categories.index"), { params: filters })
      set((state) => ({
        categories: {
          ...state.categories,
          data: response.data,
          isLoading: false,
          error: null,
        },
      }))
    } catch (error) {
      set((state) => ({
        categories: {
          ...state.categories,
          error: error.message || "Failed to fetch Categories.",
          isLoading: false,
        },
      }))
    }
  },
}))
