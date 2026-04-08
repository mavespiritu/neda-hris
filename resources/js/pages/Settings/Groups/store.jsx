import { create } from "zustand"
import axios from "axios"

export const store = create((set) => ({
  groups: {
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
  setGroups: (updater) =>
    set((state) =>
      typeof updater === "function"
        ? { groups: updater(state.groups) }
        : { groups: updater }
    ),
  fetchGroups: async ({ filters = {} } = {}) => {
    set((state) => ({
      groups: {
        ...state.groups,
        isLoading: true,
        error: null,
        filters,
      },
    }))

    try {
      const response = await axios.get(route("settings.groups.index"), { params: filters })
      set((state) => ({
        groups: {
          ...state.groups,
          data: response.data,
          isLoading: false,
          error: null,
        },
      }))
    } catch (error) {
      set((state) => ({
        groups: {
          ...state.groups,
          error: error.message || "Failed to fetch groups.",
          isLoading: false,
        },
      }))
    }
  },
}))