import { create } from 'zustand'
import { format } from 'date-fns'
import { 
    getCgaEnableUpdatingDates,
    getAccount,
    getOrganization,
    getRecruitment,
    getCgaSubmissionSchedules
} from '@/pages/Settings/api'

const useSettingsStore = create((set, get) => ({
    toast: null,
    setToast: (toastInstance) => set({ toast: toastInstance }),
    activeFormModal: null,
    accountState: {
        last_name: '',
        first_name: '',
        middle_name: '',
        signature: null,
    },
    organizationState: {
        agency_main_name_long: '',
        agency_main_name_short: '',
        agency_name_long: '',
        agency_name_short: '',
        agency_head: '',
        agency_head_position: '',
        agency_sub_head: '',
        agency_sub_head_position: '',
        agency_address: '',
    },
    recruitmentState: {
        requirements: [],
    },
    competenciesState: {
        enableUpdatingState: {
            startDate: null,
            endDate: null,
            isFormOpen: false
        },
        schedulesState: {
            data: null,
            isLoading: false,
            isFormOpen: false,
        },
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

    openCgaSubmissionWindowForm: () => set(state => ({
        competenciesState: {
            ...state.competenciesState,
            schedulesState: {
                ...state.competenciesState.schedulesState,
                isFormOpen: true
            }
        },
    })),

    closeCgaSubmissionWindowForm: () => set((state) => ({
        competenciesState: {
            ...state.competenciesState,
            schedulesState: {
                ...state.competenciesState.schedulesState,
                isFormOpen: false
            }
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

    fetchAccount: async () => {
        const { 
            setToast,
        } = get()
        try {
            const response = await getAccount()

            const data = response.data

            if(response.status === 200)
            {
                set((state) => ({
                    accountState: {
                        ...state.accountState,
                        last_name: data.last_name,
                        first_name: data.first_name,
                        middle_name: data.middle_name,
                        signature: data.signature,
                        digital_sig: data.digital_sig,
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

    fetchOrganization: async () => {
        const { 
            setToast,
        } = get()
        try {
            const response = await getOrganization()

            const data = response.data

            if(response.status === 200)
            {
                set((state) => ({
                    organizationState: {
                        ...state.organizationState,
                        agency_main_name_long: data.agency_main_name_long,
                        agency_main_name_short: data.agency_main_name_short,
                        agency_name_long: data.agency_name_long,
                        agency_name_short: data.agency_name_short,
                        agency_head: data.agency_head,
                        agency_head_position: data.agency_head_position,
                        agency_sub_head: data.agency_sub_head,
                        agency_sub_head_position: data.agency_sub_head_position,
                        agency_address: data.agency_address,
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

    fetchRecruitment: async () => {
        const { 
            setToast,
        } = get()
        try {
            const response = await getRecruitment()

            const requirements = response.data.requirements

            if(response.status === 200)
            {
                set(() => ({
                    recruitmentState: {
                        requirements: requirements,
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

    fetchCgaSubmissionSchedules: async () => {
        const { 
            setToast,
        } = get()

        set((state) => ({
            competenciesState: {
                ...state.competenciesState,
                schedulesState: {
                    ...state.competenciesState.schedulesState,
                    isLoading: true
                }
            },
        }))

        try {
            const response = await getCgaSubmissionSchedules()

            const data = response.data

            set((state) => ({
                competenciesState: {
                    ...state.competenciesState,
                    schedulesState: {
                        ...state.competenciesState.schedulesState,
                        data,
                        isLoading: false
                    }
                },
            }))
            
        } catch (error) {
            setToast({
                title: "Uh oh! Something went wrong.",
                description: error.message,
                variant: "destructive"
            });
        }
    },

}))

export default useSettingsStore