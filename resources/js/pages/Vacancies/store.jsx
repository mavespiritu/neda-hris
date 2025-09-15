import { create } from 'zustand'
import { format } from 'date-fns'
import { 
    getVacancies,
    getPositions,
    getCompetenciesPerPosition,
} from './api'
import { useForm, router } from '@inertiajs/react'

export const store = create((set, get) => ({
    data: [],
    positions: [],
    isLoading: false,
    pageIndex: 0,
    pageCount: 0,
    perPage: 0,
    total: 0,
    search: '',
    isRequestFormOpen: false,
    selectedItem: null,
    isCompetencyFormOpen: false,
    selectedCompetency: null,
    activeCompetencyType: null,

    initialValues: {
        type: "New",
        appointment_status: "",
        item_no: "",
        position_description: "",
        position: "",
        sg: "",
        monthly_salary: "",
        division: "",
        reports_to: "",
        positions_supervised: "",
        classification: "",
        prescribed_education: "",
        prescribed_experience: "",
        prescribed_training: "",
        prescribed_eligibility: "",
        preferred_education: "",
        preferred_experience: "",
        preferred_training: "",
        preferred_eligibility: "",
        preferred_skills: "",
        examination: "",
        summary: "",
        output: "",
        responsibility: "",
        competencies: {
            "organizational": [],
            "leadership": [],
            "functional": [],
        },
        remarks: "",
    },

    positions: {
        data: [],
        isLoading: false,
        error: null,
    },

    vacancyOptions: {
        data: [],
        isLoading: false,
        error: null,
    },

    openCompetencyForm: (type) => set(() => ({
        isCompetencyFormOpen: true,
        activeCompetencyType: type,
    })),

    closeCompetencyForm: () => set(() => ({
        isCompetencyFormOpen: false,
        activeCompetencyType: null,
    })),

    setPageIndex: (pageIndex) => {
        set({ pageIndex })
    },
    
    setSearch: (search) => {
        set({ search, pageIndex: 0 })
    },

    setSelectedItem: (item) => set({ selectedItem: item }),

    submitVacancy: async ({ form, toast }) => {

        const isEditMode = !!form.data.id

        const url = isEditMode
            ? route('vacancies.update', form.data.id)
            : route('vacancies.store')

        const method = isEditMode ? form.put : form.post
        const successMessage = isEditMode
            ? "The vacancy has been updated successfully"
            : "The vacancy has been saved successfully"

        method(url, {
            onSuccess: () => {
                toast({
                    title: "Success!",
                    description: successMessage,
                })
            },
            onError: () => {},
        })
    },

    deleteVacancy: async ({ id, form, toast }) => {

        form.delete(route('vacancies.destroy', id), {
            onSuccess: () => {
                toast({
                    title: "Success!",
                    description: "The vacancy was deleted successfully.",
                });
                fetchData()
            },
            onError: () => {
                toast({
                    title: 'Error',
                    description: 'Failed to delete the vacancy.',
                    variant: 'destructive',
                })
            },
        });
    },

    deleteVacancies: async ({form, toast}) => {

        form.post(route('vacancies.bulk-destroy'), {
            onSuccess: () => {
                toast({
                    title: "Success!",
                    description: "The selected vacancies deleted successfully",
                })
            },
            onError: () => {
                toast({
                    title: 'Error',
                    description: 'Failed to delete selected publication vacancies.',
                    variant: 'destructive',
                })
            },
        })
    },

    approveVacancies: async ({form, toast}) => {
        
        form.post(route('vacancies.bulk-approve'), {
            onSuccess: () => {
                toast({
                    title: "Success!",
                    description: "The selected vacancies approved successfully",
                })
            },
            onError: () => {
                toast({
                    title: 'Error',
                    description: 'Failed to approve selected vacancies.',
                    variant: 'destructive',
                })
            },
        })
    },

    disapproveVacancies: async ({form, toast}) => {
        
        form.post(route('vacancies.bulk-disapprove'), {
            onSuccess: () => {
                toast({
                    title: "Success!",
                    description: "The selected vacancies disapproved successfully",
                })
            },
            onError: () => {
                toast({
                    title: 'Error',
                    description: 'Failed to disapprove selected vacancies.',
                    variant: 'destructive',
                })
            },
        })
    },

    fetchPositions: async () => {
        set((state) => ({
            positions: {
                ...state.positions,
                isLoading: true,
                error: null,
            },
        }))

        try {

            const response = await getPositions()

            const data = response.data

            set((state) => ({
                positions: {
                    ...state.positions,
                    data,
                    isLoading: false,
                    error: null,
                },
            }))
        } catch (error) {
            set((state) => ({
                positions: {
                    ...state.positions,
                    error: error.message || 'Failed to fetch positions.',
                    isLoading: false,
                },
            }))
        }
    },

    fetchCompetenciesPerPosition: async (id, setData) => {

        try {

            const response = await getCompetenciesPerPosition({id})

            const data = response.data

            const updated = {
                organizational: data.filter(c => c.comp_type === 'org'),
                leadership: data.filter(c => c.comp_type === 'mnt'),
                functional: data.filter(c => c.comp_type === 'func'),
            }

            setData((prev) => ({
                ...prev,
                competencies: updated
            }))

        } catch (error) {
            
        }
    }
}))