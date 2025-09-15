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
import { formatDate, formatTime12 } from "@/lib/utils.jsx"
import { CheckCircle, XCircle, Loader2, CheckCircle2, FileText } from "lucide-react"
import Form from "./Form"
import Filter from "./Filter"
import useCrudTable from "@/hooks/useCrudTable"
import StatusBadge from '@/components/StatusBadge'
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import RichTextEditor from "@/components/RichTextEditor"

const Publications = () => {

    const { toast } = useToast()

    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Recruitment', href: '#' },
        { label: 'Publications', href: '/publications' },
    ]

    const { auth: { user }, data: { publications } } = usePage().props

    const canSelectPublication = useHasRole(["HRIS_HR"])

    const [confirmAction, setConfirmAction] = useState(null)
    const [selectedRow, setSelectedRow] = useState(null)
    
    const { data, setData, post, patch, processing, reset, errors, clearErrors } = useForm({
        remarks: "",
    })

    const handleAction = (action, row) => {
        setConfirmAction(action)
        setSelectedRow(row)
    }

    const performAction = (e) => {

        e.preventDefault()

        if (!confirmAction || !selectedRow) return

        const id = selectedRow.original.id

        const actionMap = {
            Publish: {
                route: "publications.toggle-visibility",
            },
            Unpublish: {
                route: "publications.toggle-visibility",
            },
        }

        const { route: actionRoute, notification } = actionMap[confirmAction] || {}

        if (!actionRoute) return

        patch(route(actionRoute, id), {
            preserveScroll: true,
            onSuccess: () => {
                toast({
                    title: "Success!",
                    description: `${confirmAction} successful!`,
                })

                reset()
                setConfirmAction(null)
                setSelectedRow(null)
            },
        })
    }

    const columns = useMemo(() => [
        {
            header: "Reference No.",
            accessorKey: "reference_no",
            meta: { enableSorting: true },
        },
        {
            header: "No. of Vacancies",
            accessorKey: "vacancy_count",
            meta: { enableSorting: true },
        },
        {
            header: "Posting Date",
            accessorKey: "date_published",
            cell: ({ row }) => {
                return formatDate(row.original.date_published)
            },
            meta: { enableSorting: true },
        },
        {
            header: "Closing Date",
            accessorKey: "date_closed",
            cell: ({ row }) => {        
                return (
                    <div className="flex flex-col">
                        <span>{formatDate(row.original.date_closed)}</span>
                        <span>{formatTime12(row.original.time_closed)}</span>
                    </div>
                )
            },
            meta: { enableSorting: true },
        },
        {
            header: "Created by",
            accessorKey: "creator",
            cell: ({ row }) => {
                const createdBy = row.original.created_by
                const creator = row.original.creator
                const dateCreated = row.original.date_created

                return (
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium mt-1">
                            {createdBy === user.ipms_id ? "You" : creator}
                        </span>
                        {dateCreated && (
                            <span className="text-xs text-gray-400">
                                Date: {formatDate(dateCreated)}
                            </span>
                        )}
                    </div>
                )
            },
            meta: { enableSorting: true },
        },
        {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => {
            const status = row.getValue("status")

            const statusConfig = {
            Draft: {
                icon: FileText,
                color: "text-gray-600",
                bg: "bg-gray-200",
            },
            Published: {
                icon: CheckCircle2,
                color: "text-green-700",
                bg: "bg-green-100",
            },
            Closed: {
                icon: XCircle,
                color: "text-red-600",
                bg: "bg-red-100",
            },
            }

            const { icon: Icon, color, bg } = statusConfig[status] || statusConfig.Draft

            return (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${bg} w-fit`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className={`text-xs font-medium ${color}`}>{status}</span>
                </div>
                )
            },
        },
        {
            header: "Actions",
            cell: ({ row }) => {
            const { props } = usePage()
            const roles = props.auth.user?.roles || [] 
            const status = row.original.is_public

            let actions = []

            if (status === 0 && roles.includes("HRIS_HR")) {
                actions.push({ label: "Publish", icon: <CheckCircle className="h-2 w-2" /> })
            }
            if (status === 1 && roles.includes("HRIS_HR")) {
                actions.push({ label: "Unpublish", icon: <XCircle className="h-2 w-2" /> })
            }

            if (actions.length === 0) return null

            return (
                <div className="flex flex-col gap-2">
                {actions.map((action, i) => (
                    <Button
                    key={i}
                    size="xs"
                    variant="link"
                    title={action.label}
                    onClick={() => handleAction(action.label, row)}
                    className={`text-xs flex justify-start ${action.label === 'Unpublish' && 'text-red-500'}`}
                    >
                        {action.icon}
                        {action.label}
                    </Button>
                ))}
                </div>
            )
            }
        }
          
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
        routeName: route('publications.index'),
        initialData: publications,
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
            enableRowSelection: row => !row.original.isLocked || canSelectPublication,
            enableGenerateReport: true,
            canModify: canSelectPublication
        },
        endpoints: {
            viewEndpoint: (id) => route('publications.show', id),
            deleteEndpoint: (id) => route('publications.destroy', id),
            bulkDeleteEndpoint: route('publications.bulk-destroy'),
        },
    })

    return (
        <div className="h-full flex flex-col">
            <Head title="Publications" />
            <PageTitle 
                pageTitle="Publications" 
                description="Manage information about your requested publications here." 
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
            <Dialog 
                open={!!confirmAction}
                onOpenChange={(open) => {
                if (!open) {
                    setConfirmAction(null)
                    reset() 
                    clearErrors()
                }
            }}    
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm {confirmAction}</DialogTitle>
                        <DialogDescription>
                        Are you sure you want to <b>{confirmAction}</b> this publication?
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={performAction}>
                        {(confirmAction === "Needs Revision" || confirmAction === "Disapprove") && (
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="description">Remarks</Label>
                                <RichTextEditor 
                                    name="remarks" 
                                    onChange={(value => setData('remarks', value))}
                                    isInvalid={errors.remarks}
                                    id="remarks"
                                    value={data.remarks}
                                />
                                {errors?.remarks && <span className="text-red-500 text-xs">{errors.remarks}</span>}
                            </div>
                        )}

                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="ghost" onClick={() => setConfirmAction(null)}>Cancel</Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        <span>Please wait</span>
                                    </>
                                ) : 'Submit'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default Publications

