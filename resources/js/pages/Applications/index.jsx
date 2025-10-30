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
    { label: 'Recruitment', href: '#' },
    { label: 'Vacancies', href: '/vacancies' },
]

const Applications = () => {

    const { toast } = useToast()

    /* const appointmentStatuses = useMemo(() => [
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
    ], []) */

    const { auth: { user }, data: { applications } } = usePage().props

    const canSelectVacancy = useHasRole(["HRIS_HR", "HRIS_DC", "HRIS_ADC"])

    const [confirmAction, setConfirmAction] = useState(null)
    const [selectedRow, setSelectedRow] = useState(null)
    
    const { data, setData, post, processing, reset, errors, clearErrors } = useForm({
        remarks: "",
    })

    const handleAction = (action, row) => {
        setConfirmAction(action)
        setSelectedRow(row)
    }

    const columns = useMemo(() => [
        {
            header: "Publication No.",
            accessorKey: "publication.reference_no",
            meta: { enableSorting: true },
        },
        {
            header: "Position",
            accessorKey: "vacancy.position_description",
            cell: ({ row }) => {
                const { vacancy } = row.original

                return (
                    <div className="flex flex-col gap-1">
                        <span>{vacancy.position_description}</span>
                        {vacancy.appointment_status === 'Permanent' && <span>({vacancy.item_no})</span>}
                    </div>
                )
            },
            meta: { enableSorting: true },
        },
        {
            header: "Applicant",
            accessorKey: "name",
            meta: { enableSorting: true },
        },
        {
            header: "Date Submitted",
            accessorKey: "date_submitted",
            cell: ({ row }) => {
                const dateSubmitted = row.original.date_submitted

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
        } = useCrudTable({
        columns,
        routeName: route('applications.index'),
        initialData: applications,
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
            enableGenerateReport: true,
            canModify: true
        },
        endpoints: {
            viewEndpoint: (id) => route('applications.show', id),
            addEndpoint: route('applications.create'),
            editEndpoint: (id) => route('applications.edit', id),
            deleteEndpoint: (id) => route('applications.destroy', id),
            bulkDeleteEndpoint: route('applications.bulk-destroy'),
        },
    })

    return (
        <div className="h-full flex flex-col">
            <Head title="Vacancies" />
            <PageTitle 
                pageTitle="Applications" 
                description="Manage information about the applications here." 
                breadcrumbItems={breadcrumbItems} 
            />

            <TableView />
            {isFilterOpen && (
                <Filter
                    open={isFilterOpen}
                    onClose={handleCloseFilter}
                    onApply={(appliedFilters) => setFilters(appliedFilters)}
                    initialValues={filters}
                    /* divisions={divisions}
                    appointmentStatuses={appointmentStatuses} */
                />
            )}
        </div>
    )
}

export default Applications

