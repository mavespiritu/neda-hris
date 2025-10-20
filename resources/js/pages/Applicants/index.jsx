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
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { MoreVertical, Pencil } from "lucide-react"
import {staffTypes, genders, pdsSections } from "./selections"

const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Recruitment', href: '#' },
    { label: 'Applicants', href: '/applicants' },
]

const Applicants = () => {

    const { toast } = useToast()

    const { data: { applicants }, flash } = usePage().props

    useEffect(() => {
    if (flash?.message) {
      toast({
        title: flash.title || (flash.status === 'success' ? 'Success!' : 'Error'),
        description: flash.message,
        variant: flash.status === 'error' ? 'destructive' : 'default',
      })
    }
  }, [flash])

    const canSelectApplicant = useHasRole(["HRIS_HR", "HRIS_DC", "HRIS_ADC"])

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
            header: "Applicant Name",
            accessorKey: "name",
            meta: { enableSorting: true },
        },
        {
            header: "Birth Date",
            accessorKey: "birth_date",
            cell: ({ row }) => {
                return formatDate(row.original.birth_date)
            },
            meta: { enableSorting: true },
        },
        {
            header: "Email Address",
            accessorKey: "email_address",
            meta: { enableSorting: true },
        },
        {
            header: "Mobile No.",
            accessorKey: "mobile_no",
            meta: { enableSorting: true },
        },
        {
            header: "Sections",
            id: "sections",
            cell: ({ row }) => {
            const applicant = row.original

            return (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <Pencil className="h-4 w-4" />
                        Edit
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2">
                        <h4 className="font-medium text-sm mb-2">Edit Section</h4>
                        <div className="flex flex-col gap-1">
                        {pdsSections.map((section, index) => (
                            <Button
                            key={index}
                            variant="ghost"
                            size="sm"
                            className="justify-start"
                            onClick={() => {
                                router.visit(`/applicants/${applicant.id}/edit?step=${section.step}`)
                            }}
                            >
                            {section.label}
                            </Button>
                        ))}
                        </div>
                    </PopoverContent>
                </Popover>
            )
            },
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
        routeName: route('applicants.index'),
        initialData: applicants,
        filters,
        options: {
            enableAdd: true,
            enableEdit: false,
            enableView: false,
            enableViewAsLink: true,
            enableDelete: true, 
            enableBulkDelete: true,
            enableSearching: true,
            enableFiltering: true,
            enableRowSelection: row => !row.original.isLocked || canSelectApplicant,
            enableGenerateReport: false,
            canModify: canSelectApplicant
        },
        endpoints: {
            viewEndpoint: (id) => route('applicants.show', id),
            addEndpoint: route('applicants.create'),
            editEndpoint: (id) => route('applicants.edit', id),
            deleteEndpoint: (id) => route('applicants.destroy', id),
            //generateReportEndpoint: (id) => route('vacancies.generate', id),
            bulkDeleteEndpoint: route('applicants.bulk-destroy'),
            /* bulkSubmitEndpoint: route('rto.bulk-submit'),
            bulkEndorseEndpoint: route('rto.bulk-endorse'),
            bulkApproveEndpoint: route('rto.bulk-approve'),
            bulkDisapproveEndpoint: route('rto.bulk-disapprove'), */
        },
    })

    return (
        <div className="h-full flex flex-col">
            <Head title="Applicants" />
            <PageTitle 
                pageTitle="Applicants" 
                description="Manage applicant information here." 
                breadcrumbItems={breadcrumbItems} 
            />

            <TableView />
            {isFilterOpen && (
                <Filter
                    open={isFilterOpen}
                    onClose={handleCloseFilter}
                    onApply={(appliedFilters) => setFilters(appliedFilters)}
                    initialValues={filters}
                    genders={genders}
                    types={staffTypes}
                />
            )}
        </div>
    )
}

export default Applicants

