import PageTitle from "@/components/PageTitle"
import useCrudTable from "@/hooks/useCrudTable"
import { useForm } from '@inertiajs/react'
import { useState, useEffect, useMemo } from "react"
import Form from "./Form"
import Filter from "./Filter"
import { useHasRole } from "@/hooks/useAuth"
import { store } from './store'
import { Loader2 } from "lucide-react"

const index = () => {

    const {
        competencies,
        setCompetencies,
        fetchCompetencies
    } = store()

    const [filters, setFilters] = useState({})

    useEffect(() => {
        fetchCompetencies()
    }, [])

    const canModify = useHasRole(["HRIS_HR"])

    const columns = useMemo(() => [
        {
            header: "Competency",
            accessorKey: "competency",
            meta: { enableSorting: true },
        },
        {
            header: "Type",
            accessorKey: "comp_type_value",
            meta: { enableSorting: true },
        },
        {
            header: "Description",
            accessorKey: "description",
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
        routeName: route('competencies.index'),
        initialData: competencies.data,
        filters,
        responseType: "json",
        onJsonResponse: (response) => {
            setCompetencies((old) => ({
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
            enableFiltering: true,
            enableRowSelection: true,
            canModify,
        },
        endpoints: {
            deleteEndpoint: (id) => route('competencies.destroy', id),
            bulkDeleteEndpoint: route('competencies.bulk-destroy')
        },
    })

    return (
        <div className="flex flex-col h-full gap-4">
            <PageTitle
                pageTitle="Competencies"
                description="Manage library of competencies here."
            />
            <div className="overflow-x-auto">
                <div className="relative">
                {competencies.isLoading && (
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
                    onClose={() => {
                        handleCloseForm()
                        reloadTable()
                    }}
                />
            )}
            {isFilterOpen && (
                <Filter
                    open={isFilterOpen}
                    onClose={handleCloseFilter}
                    onApply={(appliedFilters) => setFilters(appliedFilters)}
                    initialValues={filters}
                />
            )}
        </div>
    )
}

export default index
