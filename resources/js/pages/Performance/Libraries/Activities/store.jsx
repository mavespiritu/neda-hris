import axios from "axios"
import { create } from "zustand"

export const store = create((set) => ({
  activities: {
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
  setActivities: (updater) =>
    set((state) =>
      typeof updater === "function"
        ? { activities: updater(state.activities) }
        : { activities: updater }
    ),
  fetchActivities: async ({ filters = {} } = {}) => {
    set((state) => ({
      activities: {
        ...state.activities,
        isLoading: true,
        error: null,
        filters,
      },
    }))

    try {
      const response = await axios.get(route("performance.activities.index"), { params: filters })
      set((state) => ({
        activities: {
          ...state.activities,
          data: response.data,
          isLoading: false,
          error: null,
        },
      }))
    } catch (error) {
      set((state) => ({
        activities: {
          ...state.activities,
          error: error.message || "Failed to fetch Activities/Outputs.",
          isLoading: false,
        },
      }))
    }
  },
}))
