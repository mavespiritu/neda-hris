import PageTitle from "@/components/PageTitle"
import { useState, useMemo } from "react"
import { Head, usePage } from "@inertiajs/react"
import { formatDate } from "@/lib/utils.jsx"
import useCrudTable from "@/hooks/useCrudTable"
import StatusBadge from '@/components/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { formatDateRange } from "@/lib/utils.jsx"
import { format } from "date-fns"
import Filter from './Filter'

const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Travel Requests', href: route('travel-requests.index') },
]

const TravelOrders = () => {
    const { auth: { user }, data: { travelOrders, filterOptions }, can } = usePage().props
    const [filters, setFilters] = useState({
        employee_id: "",
        travel_type: "",
        travel_category_id: "",
    })

    const employeeLabelMap = useMemo(() => {
        const items = Array.isArray(filterOptions?.employees)
            ? filterOptions.employees
            : Object.values(filterOptions?.employees ?? {})

        return Object.fromEntries(
            items.map((employee) => [
                String(employee.value ?? employee.emp_id ?? employee.id ?? "").trim(),
                employee.label ?? employee.name ?? "",
            ])
        )
    }, [filterOptions?.employees])

    const travelTypeLabelMap = useMemo(() => {
        const items = Array.isArray(filterOptions?.travel_types)
            ? filterOptions.travel_types
            : Object.values(filterOptions?.travel_types ?? {})

        return Object.fromEntries(
            items.map((item) => [
                String(item.value ?? item.id ?? item.travel_type ?? "").trim(),
                item.label ?? item.name ?? "",
            ])
        )
    }, [filterOptions?.travel_types])

    const travelCategoryLabelMap = useMemo(() => {
        const items = Array.isArray(filterOptions?.travel_categories)
            ? filterOptions.travel_categories
            : Object.values(filterOptions?.travel_categories ?? {})

        return Object.fromEntries(
            items.map((item) => [
                String(item.value ?? item.id ?? item.travel_category_id ?? "").trim(),
                item.label ?? item.name ?? "",
            ])
        )
    }, [filterOptions?.travel_categories])

    const clearFilter = (key) => {
        setFilters((prev) => {
            const next = { ...prev }
            delete next[key]
            return next
        })
        setPageIndex(0)
    }

    const columns = useMemo(() => [
        {
            header: "Reference No.",
            accessorKey: "reference_no",
            meta: { enableSorting: true },
        },
        {
            header: "Type",
            accessorKey: "travel_type",
            meta: { enableSorting: true },
        },
        {
            header: "Vehicle Request",
            accessorKey: "isRequestingVehicle",
            cell: ({ row }) => {
                const hasVehicleRequest = !!row.original?.isRequestingVehicle

                return (
                    <Badge variant={hasVehicleRequest ? "default" : "secondary"} className="whitespace-nowrap">
                        {hasVehicleRequest ? "Yes" : "No"}
                    </Badge>
                )
            },
            meta: { enableSorting: false },
        },
        {
            header: "Purpose",
            accessorKey: "purpose",
            meta: { enableSorting: true },
        },
        {
            header: "Date of Travel",
            accessorKey: "start_date",
            cell: ({ row }) => {
                const { start_date, end_date } = row.original

                return (
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium mt-1">
                    {formatDateRange(start_date, end_date)}
                    </span>
                </div>
                )
            },
            meta: { enableSorting: true },
        },
        {
            header: "Request Created",
            accessorKey: "creator",
            cell: ({ row }) => (
              <div className="flex flex-col">
                <span>{row.original.creator || "-"}</span>
                <span className="text-xs text-muted-foreground">
                  {row.original.date_created
                    ? format(new Date(row.original.date_created), "MMMM d, yyyy")
                    : "-"}
                </span>
              </div>
            ),
            meta: { enableSorting: true },
        },
        {
            header: "Status",
            accessorKey: "status",
            meta: { enableSorting: true, className: "w-[15%]" },
            cell: ({ row }) => {
                const status = row.original.status
                const actedBy = row.original.acted_by
                const actedByName = row.original.acted_by_name
                const dateActed = row.original.date_acted
                const remarks = row.original.remarks
                return (
                    <div className="flex flex-col gap-1">
                        <StatusBadge status={status} />
                        {actedBy && actedBy !== user.ipms_id && (
                            <span className="text-xs text-gray-400 mt-1">
                                By: {actedByName}
                            </span>
                        )}
                        {dateActed && status !== "Draft" && (
                            <span className="text-xs text-gray-400">
                                Date: {format(new Date(dateActed), "MMMM d, yyyy")}
                            </span>
                        )}
                        {remarks && (
                            <span className="text-xs text-gray-400">
                                Remarks: 
                                <div
                                    dangerouslySetInnerHTML={{ __html: remarks }}
                                />
                            </span>
                        )}
                    </div>
                )
            }
        }
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
        setPageIndex,
        reloadTable
        } = useCrudTable({
        columns,
        routeName: route('travel-requests.index'),
        initialData: travelOrders,
        filters,
        options: {
            enableAdd: can?.create,
            enableEdit: (row) => !!row.original?.can?.edit,
            enableDelete: (row) => !!row.original?.can?.delete,
            enableViewAsLink: (row) => !!row.original?.can?.view,
            enableBulkDelete: true,
            enableSearching: true,
            enableFiltering: true,
            enableRowSelection: (row) => !!row.original?.can?.delete,
            enableGenerateReport: (row) => !!row.original?.can?.generate,
        },
        endpoints: {
            addEndpoint: route('travel-requests.create'),
            viewEndpoint: (id) => route('travel-requests.show', id),
            editEndpoint: (id) => route('travel-requests.edit', id),
            deleteEndpoint: (id) => route('travel-requests.destroy', id),
            bulkDeleteEndpoint: route('travel-requests.bulk-destroy'),
            generateReportEndpoint: (id) => route('travel-requests.generate', id),
        },
        filterLabelMaps: {
            employee_id: employeeLabelMap,
            travel_type: travelTypeLabelMap,
            travel_category_id: travelCategoryLabelMap,
        },
        filterKeyLabels: {
            travel_category_id: "Travel Category",
        },
        onClearFilter: clearFilter,
    })

    return (
        <div className="h-full flex flex-col">
            <Head title="Travel Requests" />
            <PageTitle 
                pageTitle="Travel Requests" 
                description="Manage information about the travel request here." 
                breadcrumbItems={breadcrumbItems} 
            />

            <TableView />

            {isFilterOpen && (
            <Filter
                open={isFilterOpen}
                onClose={handleCloseFilter}
                onApply={(appliedFilters) => {
                    setFilters((prev) => ({
                        ...prev,
                        ...appliedFilters,
                    }))
                    setPageIndex(0)
                }}
                initialValues={filters}
                options={filterOptions}
            />
            )}
        </div>
    )
}

export default TravelOrders