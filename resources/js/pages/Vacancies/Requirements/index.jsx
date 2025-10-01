import PageTitle from "@/components/PageTitle"
import useCrudTable from "@/hooks/useCrudTable"
import { usePage } from '@inertiajs/react'
import { useState, useEffect, useMemo } from "react"
import Form from "./Form"
import Filter from "./Filter"
import { useHasRole } from "@/hooks/useAuth"
import { store } from './store'
import { Loader2 } from "lucide-react"


const Requirements = () => {

    const { vacancy } = usePage().props

    const {
        requirements,
        setRequirements,
        fetchRequirements
    } = store()

    const [filters, setFilters] = useState({})
    
        useEffect(() => {
            fetchRequirements(vacancy.id)
        }, [])
    
        const canModify = useHasRole(["HRIS_HR"])
    
        const columns = useMemo(() => [
            {
                header: "Requirement",
                accessorKey: "requirement",
                meta: { enableSorting: true },
            },
        ], [])
    
        const { 
            TableView,
            isFormOpen,
            isFilterOpen,
            isViewOpen,
            formMode,
            selectedItem,
            handleCloseForm,
            handleCloseFilter,
            reloadTable
         } = useCrudTable({
            columns,
            routeName: route('vacancy-requirements.index', {id: vacancy.id}),
            initialData: requirements.data,
            filters,
            responseType: "json",
            onJsonResponse: (response) => {
                setRequirements((old) => ({
                    ...old,
                    data: response,
                    isLoading: false,
                    error: null
                }))
            },
            options: {
                enableAdd: true,
                enableEdit: true,
                enableView: false,
                enableViewAsLink: false,
                enableDelete: true, 
                enableBulkDelete: true,
                enableSearching: true,
                enableFiltering: false,
                enableRowSelection: true,
                canModify,
            },
            endpoints: {
                deleteEndpoint: (id) => route('vacancy-requirements.destroy', id),
                bulkDeleteEndpoint: route('vacancy-requirements.bulk-destroy')
            },
        })

  return (
    <div className="flex flex-col h-full gap-4">
        <PageTitle
            pageTitle="Requirements"
            description="Manage the document requirements for this vacancy here."
        />
        <div className="overflow-x-auto">
            <div className="relative">
            {requirements.isLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
            )}
            <TableView />
            </div>
        </div>
        {isFormOpen && (
            <Form
                open={isFormOpen}
                mode={formMode}
                data={selectedItem}
                vacancyId={vacancy.id}
                onClose={() => {
                    handleCloseForm()
                    reloadTable()
                }}
            />
        )}
    </div>
  )
}

export default Requirements