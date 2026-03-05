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
import useCrudTable from "@/hooks/useCrudTable"
import StatusBadge from '@/components/StatusBadge'
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import RichTextEditor from "@/components/RichTextEditor"
import { formatDateRange } from "@/lib/utils.jsx"
import { format } from "date-fns"
import Filter from "./Filter"


const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Travel Requests', href: route('travel-requests.index') },
]

const TravelOrders = () => {

    const { toast } = useToast()

    const { auth: { user }, data: { travelOrders, filterOptions }, can } = usePage().props

    const [filters, setFilters] = useState({
    employee_id: "",
    travel_type: "",
    travel_category_id: "",
    })

    const canSelectStaff = useHasRole(["HRIS_PRU", "HRIS_DC", "HRIS_ADC"])

    const [confirmAction, setConfirmAction] = useState(null)
    const [selectedRow, setSelectedRow] = useState(null)
    
    const { data, setData, post, processing, reset, errors, clearErrors } = useForm({
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
            Submit: {
                route: "travel-requests.submit",
                notification: "notification.submit-travel-request",
            },
        }

        const { route: actionRoute, notification } = actionMap[confirmAction] || {}

        if (!actionRoute) return

        post(route(actionRoute, id), {
            preserveScroll: true,
            onSuccess: () => {
                toast({
                    title: "Success!",
                    description: `${confirmAction} successful!`,
                })

                if (["Endorse", "Approve", "Needs Revision", "Disapprove"].includes(confirmAction)) {
                    router.post(route(notification, { id, userId: user.ipms_id }))
                } else {
                    router.post(route(notification, id))
                }

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
            header: "Type",
            accessorKey: "travel_type",
            meta: { enableSorting: true },
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
                        {/* {actedBy && (
                            <span className="text-xs text-gray-400 mt-1">
                                By: {actedBy === user.ipms_id ? "You" : actedByName}
                            </span>
                        )}
                        {dateActed && (
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
                        )} */}
                    </div>
                )
            }
        },
        {
            header: "Actions",
            cell: ({ row }) => {
            
                const can = row.original?.can || {}
                const actions = []

                if (can.submit)  actions.push({ label: "Submit", icon: <Send className="h-2 w-2" /> })

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
                        className={`text-xs flex justify-start ${action.label === 'Disapprove' && 'text-red-500'}`}
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
            enableGenerateReport: (row) => !!row.original?.can?.view,
            canModify: canSelectStaff
        },
        endpoints: {
            addEndpoint: route('travel-requests.create'),
            viewEndpoint: (id) => route('travel-requests.show', id),
            editEndpoint: (id) => route('travel-requests.edit', id),
            deleteEndpoint: (id) => route('travel-requests.destroy', id),
            bulkDeleteEndpoint: route('travel-requests.bulk-destroy'),
            generateReportEndpoint: (id) => route('travel-requests.generate', id),
        },
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
                onApply={(appliedFilters) =>
                setFilters((prev) => ({
                    ...prev,
                    ...appliedFilters,
                }))
                }
                initialValues={filters}
                options={filterOptions}
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
                        Are you sure you want to <b>{confirmAction}</b> this travel order?
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={performAction}>
                        {["Return", "Disapprove"].includes(confirmAction) && (
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

export default TravelOrders

