import { create } from 'zustand'
import { format } from 'date-fns'
import { 
    getCgaEnableUpdatingDates
} from '@/pages/Settings/api'

const useSettingsStore = create((set, get) => ({
    toast: null,
    setToast: (toastInstance) => set({ toast: toastInstance }),
    activeFormModal: null,
    competenciesState: {
        enableUpdatingState: {
            startDate: null,
            endDate: null,
            isFormOpen: false
        }
    },

    openCgaEnableUpdatingForm: () => set(state => ({
        competenciesState: {
            ...state.competenciesState,
            enableUpdatingState: {
                ...state.competenciesState.enableUpdatingState,
                isFormOpen: true
            }
        },
    })),

    closeCgaEnableUpdatingForm: () => set((state) => ({
        competenciesState: {
            ...state.competenciesState,
            enableUpdatingState: {
                ...state.competenciesState.enableUpdatingState,
                isFormOpen: false,
            },
        },
    })),

    loadCgaEnableUpdatingDates: async () => {
        const { 
            setToast,
        } = get()
        try {
            const response = await getCgaEnableUpdatingDates()

            if(response.status === 200)
            {
                set((state) => ({
                    competenciesState: {
                      ...state.competenciesState,
                      enableUpdatingState: {
                        ...state.competenciesState.enableUpdatingState,
                        startDate: response.data.startDate,
                        endDate: response.data.endDate,
                      },
                    },
                }))
            } else {
                setToast({
                    title: "Uh oh! Something went wrong.",
                    description: "There was a problem with your request.",
                    variant: "destructive"
                })
            }
            
        } catch (error) {
            setToast({
                title: "Uh oh! Something went wrong.",
                description: error.message,
                variant: "destructive"
            });
        }
    },

    updateCgaEnableUpdatingDates: (startDate, endDate) => {
        set((state) => ({
            competenciesState: {
                ...state.competenciesState,
                enableUpdatingState: {
                    ...state.competenciesState.enableUpdatingState,
                    startDate,
                    endDate,
                },
            },
        }))
    },

}))

export default useSettingsStore