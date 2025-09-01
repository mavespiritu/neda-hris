import { create } from 'zustand'
import { format } from 'date-fns'
import { router } from '@inertiajs/react'

export const store = create((set, get) => ({
    isLoading: false,
    isRequestFormOpen: false,
    isVacancyFormOpen: false,
    selectedItem: null,
    selectedVacancy: null,

    initialValues: {
        status: "",
        date_published: "",
        date_closed: "",
        time_closed: "",
    },

    setSelectedItem: (item) => set({ selectedItem: item }),

    setSelectedVacancy: (vacancy) => set({ selectedVacancy: vacancy }),

    openRequestForm: () => set({ isRequestFormOpen: true }),

    closeRequestForm: () => set({ isRequestFormOpen: false }),

    openVacancyForm: () => set({ isVacancyFormOpen: true }),

    closeVacancyForm: () => set({ isVacancyFormOpen: false }),

    submitRequest: async ({ form, toast }) => {
        const { 
            closeRequestForm,
            selectedItem,
            setSelectedItem,
        } = get()
    
        const onDone = () => {
            form.reset()
            form.clearErrors()
            closeRequestForm()
            setSelectedItem(null)    
        }
    
        if (selectedItem) {
            form.put(route('publications.update', selectedItem.id), {
                onSuccess: () => {
                    toast({
                        title: "Success!",
                        description: "The request has been updated successfully",
                    })
                    onDone()
                    setSelectedItem(null)
                },
                onError: () => {},
            })
        } else {
            form.post(route('publications.store'), {
                onSuccess: () => {
                    toast({
                        title: "Success!",
                        description: "The request has been saved successfully",
                    })
                    onDone()
                },
                onError: () => {},
            })
        }
    },

    deleteRequest: async ({ id, form, toast }) => {
    
        form.delete(route('publications.destroy', id), {
            onSuccess: () => {
                toast({
                    title: "Success!",
                    description: "The request was deleted successfully.",
                });
            },
            onError: () => {
                toast({
                    title: 'Error',
                    description: 'Failed to delete the publication request.',
                    variant: 'destructive',
                })
            },
        });
    },

    deleteRequests: async ({form, toast}) => {

        form.post(route('publications.bulk-destroy'), {
            onSuccess: () => {
                toast({
                    title: "Success!",
                    description: "The selected request(s) deleted successfully",
                })
            },
            onError: () => {
                toast({
                    title: 'Error',
                    description: 'Failed to delete selected publication request(s).',
                    variant: 'destructive',
                })
            },
        })
    },

    approveRequests: async ({form, toast}) => {

        form.post(route('publications.bulk-approve'), {
            onSuccess: () => {
                toast({
                    title: "Success!",
                    description: "The selected request(s) approved successfully",
                })
            },
            onError: () => {
                toast({
                    title: 'Error',
                    description: 'Failed to approve selected publication request(s).',
                    variant: 'destructive',
                })
            },
        })
    },

    disapproveRequests: async ({form, toast}) => {

        form.post(route('publications.bulk-disapprove'), {
            onSuccess: () => {
                toast({
                    title: "Success!",
                    description: "The selected request(s) disapproved successfully",
                })
            },
            onError: () => {
                toast({
                    title: 'Error',
                    description: 'Failed to disapprove selected publication request(s).',
                    variant: 'destructive',
                })
            },
        })
    },

    removeVacancy: async ({id, vacancy_id, toast}) => {

        router.delete(route('publications.vacancies.destroy', id), {
            data: {
                id: vacancy_id,
            },
            preserveScroll: true,
            onSuccess: () => {
                toast({
                    title: 'Success!',
                    description: 'The vacancy has been removed successfully',
                })
            },
            onError: () => {
                toast({
                    title: 'Error',
                    description: 'Failed to remove vacancy.',
                    variant: 'destructive',
                })
            },
        })
    },

    removeVacancies: async ({id, form, toast}) => {

        form.post(route('publications.vacancies.bulk-destroy', id), {
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

    toggleVisibility: async ({id, toast}) => {
        try {
            router.patch(route('publications.toggle-visibility', id))
            toast({
                title: 'Success!',
                description: 'Visibility has been updated.',
            })
        } catch (error) {
            toast({
                title: 'Error!',
                description: 'Something went wrong while toggling visibility.',
                variant: 'destructive',
            })
        }
    }
}))