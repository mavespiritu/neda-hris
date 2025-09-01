import PageTitle from "@/components/PageTitle"
import useCrudTable from "@/hooks/useCrudTable"
import { usePage } from '@inertiajs/react'
import { useState, useMemo } from "react"
import Form from "./Form"
import Filter from "./Filter"
import { useHasRole } from "@/hooks/useAuth"

const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Competencies', href: '#' },
    { label: 'Libraries', href: '#' },
    { label: 'Competencies', href: '/competencies' },
]

const index = () => {
    const { competencies } = usePage().props

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

    const [filters, setFilters] = useState({})

    const { 
        TableView,
        isFormOpen,
        isFilterOpen,
        isViewOpen,
        formMode,
        selectedItem,
        handleCloseForm,
        handleCloseFilter,
     } = useCrudTable({
        columns,
        routeName: route('competencies.index'),
        initialData: competencies,
        filters,
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
                breadcrumbItems={breadcrumbItems}
            />
            <TableView />
            {isFormOpen && (
                <Form
                    open={isFormOpen}
                    mode={formMode}
                    data={selectedItem}
                    onClose={handleCloseForm}
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
