import PageTitle from "@/components/PageTitle"
import { useState, useEffect, useMemo } from "react"
import { useHasRole } from "@/hooks/useAuth"
import { Head, usePage, router, useForm } from "@inertiajs/react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogClose
  } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils.jsx"
import { AlertCircleIcon, Send, CheckCircle, XCircle, FileCheck, Undo2, Loader2 } from "lucide-react"
import Filter from "./Filter"
import useCrudTable from "@/hooks/useCrudTable"
import StatusBadge from '@/components/StatusBadge'
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import RichTextEditor from "@/components/RichTextEditor"

const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Travel Orders', href: route('travel-orders.index') },
]

const TravelOrders = () => {

    const { toast } = useToast()

    const appointmentStatuses = useMemo(() => [
        { label: 'Permanent', value: 'Permanent'},
        { label: 'Casual', value: 'Casual'},
        { label: 'Contractual', value: 'Contractual'},
        { label: 'Contract of Service', value: 'Contract of Service'},
        { label: 'Job Order', value: 'Job Order'},
        { label: 'Temporary', value: 'Temporary'},
    ], [])

    const divisions = useMemo(() => [
        { value: 'DRD', label: 'Development Research, Communication, and Advocacy Division', },
        { value: 'FAD', label: 'Finance and Administrative Division'},
        { value: 'ORD', label: 'Office of the Regional Director'},
        { value: 'PMED', label: 'Monitoring and Evaluation Division'},
        { value: 'PDIPBD', label: 'Project Development, Investment Programming and Budgeting Division'},
        { value: 'PFPD', label: 'Policy Formulation and Planning Division'},
    ], [])

    const { auth: { user }, data: { travelOrders } } = usePage().props

    const handleAction = (action, row) => {
        setConfirmAction(action)
        setSelectedRow(row)
    }

    const columns = useMemo(() => [
        {
            header: "Reference No.",
            accessorKey: "reference_no",
            meta: { enableSorting: true },
        },
        {
            header: "Purpose",
            accessorKey: "purpose",
            meta: { enableSorting: true },
        },
        {
            header: "Division",
            accessorKey: "division",
            meta: { enableSorting: true },
        },

        {
            header: "Requested by",
            accessorKey: "creator",
            meta: { enableSorting: true },
        },
        {
            header: "Date Requested",
            accessorKey: "date_submitted",
            cell: ({ row }) => {
                const dateSubmitted = row.original.date_created

                return (
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium mt-1">
                            {dateSubmitted && formatDate(dateSubmitted)}
                        </span>
                    </div>
                )
            },
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
        reloadTable
        } = useCrudTable({
        columns,
        routeName: route('travel-orders.index'),
        initialData: travelOrders,
        filters,
        options: {
            enableAdd: true,
            enableEdit: true,
            enableView: false,
            enableViewAsLink: true,
            enableDelete: true, 
            enableBulkDelete: true,
            enableSearching: true,
            enableFiltering: true,
            enableRowSelection: row => !row.original.isLocked,
            enableGenerateReport: false,
            canModify: true
        },
        endpoints: {
            addEndpoint: route('travel-orders.create'),
            viewEndpoint: (id) => route('travel-orders.show', id),
            deleteEndpoint: (id) => route('travel-orders.destroy', id),
            bulkDeleteEndpoint: route('travel-orders.bulk-destroy'),
        },
    })

    return (
        <div className="h-full flex flex-col">
            <Head title="Travel Orders" />
            <PageTitle 
                pageTitle="Travel Orders" 
                description="Manage information about the travel orders here." 
                breadcrumbItems={breadcrumbItems} 
            />

            <TableView />

            {isFilterOpen && (
                <Filter
                    open={isFilterOpen}
                    onClose={handleCloseFilter}
                    onApply={(appliedFilters) => setFilters(appliedFilters)}
                    initialValues={filters}
                    divisions={divisions}
                    appointmentStatuses={appointmentStatuses}
                />
            )}
        </div>
    )
}

export default TravelOrders

