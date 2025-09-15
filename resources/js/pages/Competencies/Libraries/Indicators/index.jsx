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
        indicators,
        setIndicators,
        fetchIndicators
    } = store()

    const [filters, setFilters] = useState({})

    useEffect(() => {
        fetchIndicators()
    }, [])

    const canModify = useHasRole(["HRIS_HR"])

    const columns = useMemo(() => [
        {
            header: "Competency",
            accessorKey: "competency",
            meta: { enableSorting: true },
        },
        {
            header: "Proficiency",
            accessorKey: "proficiency",
            meta: { enableSorting: true },
        },
        {
            header: "Indicator",
            accessorKey: "indicator",
            meta: { enableSorting: true },
            cell: ({ row }) => (
                <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: row.original.indicator || "" }}
                />
            ),
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
        routeName: route('indicators.index'),
        initialData: indicators.data,
        filters,
        responseType: "json",
        onJsonResponse: (response) => {
            setIndicators((old) => ({
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
            deleteEndpoint: (id) => route('indicators.destroy', id),
            bulkDeleteEndpoint: route('indicators.bulk-destroy')
        },
    })

    return (
        <div className="flex flex-col h-full gap-4">
            <PageTitle
                pageTitle="Indicators"
                description="Manage library of indicators here."
            />
            <div className="overflow-x-auto">
                <div className="relative">
                {indicators.isLoading && (
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
