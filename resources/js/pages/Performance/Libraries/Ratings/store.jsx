import axios from "axios"
import { create } from "zustand"

export const store = create((set) => ({
  ratings: {
    data: { data: [], meta: {} },
    isLoading: false,
    error: null,
  },
  setRatings: (updater) => set((state) => ({ ratings: typeof updater === "function" ? updater(state.ratings) : updater })),
  fetchRatings: async () => {
    set((state) => ({ ratings: { ...state.ratings, isLoading: true, error: null } }))
    try {
      const response = await axios.get(route("performance.ratings.index"))
      set((state) => ({
        ratings: {
          ...state.ratings,
          data: response.data,
          isLoading: false,
          error: null,
        },
      }))
    } catch (error) {
      set((state) => ({
        ratings: {
          ...state.ratings,
          isLoading: false,
          error,
        },
      }))
    }
  },
}))
