import { create } from "zustand"
import axios from "axios"

const emptyPager = {
  data: [],
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
  links: [],
}

export const store = create((set) => ({
  tripTickets: {
    data: emptyPager,
    can: {},
    filter_options: { vehicles: [], drivers: [], dispatchers: [] },
    isLoading: false,
    error: null,
    filters: {},
  },

  setTripTickets: (updater) =>
    set((state) => ({
      tripTickets:
        typeof updater === "function" ? updater(state.tripTickets) : updater,
    })),

  fetchTripTickets: async ({ travelOrderId, filters = {} } = {}) => {
    if (!travelOrderId) return

    set((state) => ({
      tripTickets: {
        ...state.tripTickets,
        isLoading: true,
        error: null,
        filters,
      },
    }))

    try {
      const response = await axios.get(
        route("trip-tickets.index.data.by-id", { id: travelOrderId }),
        { params: filters }
      )

      const payload = response?.data || {}
      const tt = payload?.trip_tickets || {}

      set((state) => ({
        tripTickets: {
          ...state.tripTickets,
          data: {
            ...emptyPager,
            ...tt,
            current_page: Number(tt.current_page || 1),
            last_page: Number(tt.last_page || 1),
            per_page: Number(tt.per_page || 10),
            total: Number(tt.total || 0),
          },
          can: payload?.can ?? {},
          filter_options: payload?.filter_options ?? state.tripTickets.filter_options,
          filters: payload?.filters ?? state.tripTickets.filters,
          isLoading: false,
          error: null,
        },
      }))
    } catch (error) {
      set((state) => ({
        tripTickets: {
          ...state.tripTickets,
          isLoading: false,
          error: error?.message || "Failed to fetch trip tickets.",
        },
      }))
    }
  },
}))
