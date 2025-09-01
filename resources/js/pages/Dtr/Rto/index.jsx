import PageTitle from "@/components/PageTitle"
import { useState, useEffect, useMemo } from "react"
import { useHasRole } from "@/hooks/useAuth"
import { Head, usePage, router, useForm } from "@inertiajs/react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuGroup } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogClose
  } from "@/components/ui/dialog"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDateWithTime, formatTime12 } from "@/lib/utils.jsx"
import { CalendarDays } from "lucide-react"
import { AlertCircleIcon, Send, CheckCircle, XCircle, FileCheck, Undo2, Loader2 } from "lucide-react"
import Form from "./Form"
import Filter from "./Filter"
import useCrudTable from "@/hooks/useCrudTable"
import { format } from "date-fns"
import StatusBadge from '@/components/StatusBadge'
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import RichTextEditor from "@/components/RichTextEditor"

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Flexiplace" },
  { label: "RTO", href: "/rto" },
]

const Rto = () => {

    const { toast } = useToast()

    const { auth: { user }, data: { targets, employees, dates } } = usePage().props

    const canSelectStaff = useHasRole(["HRIS_HR", "HRIS_DC", "HRIS_ADC"])

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
                route: "rto.submit",
                notification: "notification.submit-rto",
            },
            Endorse: {
                route: "rto.endorse",
                notification: "notification.endorse-rto",
            },
            Approve: {
                route: "rto.approve",
                notification: "notification.approve-rto",
            },
            "Needs Revision": {
                route: "rto.return",
                notification: "notification.return-rto",
            },
            Disapprove: {
                route: "rto.disapprove",
                notification: "notification.disapprove-rto",
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
            header: "Date of Flexiplace",
            accessorKey: "date",
            meta: { enableSorting: true },
            cell: ({ row }) => {
            const date = row.original.date
            return date ? format(new Date(date), "MMMM d, yyyy") : ""
            },
        },
        {
            header: "Type of Flexiplace",
            accessorKey: "type",
            meta: { enableSorting: true },
            cell: ({ row }) => {
            const type = row.original.type
            const otherType = row.original.other_type
            return type === 'Other' ? otherType : type
            },
        },
        {
            header: "Name of Staff",
            accessorKey: "employee_name",
            meta: { enableSorting: true },
        },
        {
            header: "Target Outputs",
            accessorKey: "outputs",
            meta: { className: "w-[25%]" },
            cell: ({ row }) => {
                const outputs = row.original.outputs || []
                return (
                <ol className="list-decimal list-inside space-y-1">
                    {outputs.map((output, i) => (
                    <li key={i}>{output.output}</li>
                    ))}
                </ol>
                )
            },
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
                        {actedBy && (
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
                        )}
                    </div>
                )
            }
        },
        {
            header: "Actions",
            cell: ({ row }) => {
            const { props } = usePage()
            const roles = props.auth.user?.roles || [] 
            const status = row.original.status

            let actions = []

            if (["Draft", "Needs Revision"].includes(status) && roles.includes("HRIS_Staff", "HRIS_HR")) {
                actions.push({ label: "Submit", icon: <Send className="h-2 w-2" /> })
            }
            if (status === "Submitted" && roles.some(r => ["HRIS_ADC", "HRIS_DC"].includes(r))) {
                actions.push({ label: "Endorse", icon: <FileCheck className="h-2 w-2" /> })
                actions.push({ label: "Needs Revision", icon: <Undo2 className="h-2 w-2" /> })
            }
            if (status === "Endorsed" && roles.some(r => ["HRIS_ARD", "HRIS_HR"].includes(r))) {
                actions.push({ label: "Approve", icon: <CheckCircle className="h-2 w-2" /> })
                actions.push({ label: "Needs Revision", icon: <Undo2 className="h-2 w-2" /> })
                actions.push({ label: "Disapprove", icon: <XCircle className="h-2 w-2" /> })
            }
            if (["Approved", "Disapproved"].includes(status) && roles.some(r => ["HRIS_ARD", "HRIS_HR"].includes(r))) {
                actions.push({ label: "Needs Revision", icon: <Undo2 className="h-2 w-2" /> })
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
        routeName: route('rto.index'),
        initialData: targets,
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
            enableRowSelection: row => !row.original.isLocked || canSelectStaff,
            enableGenerateReport: true,
            canModify: canSelectStaff
        },
        endpoints: {
            //editEndpoint: (id) => route('rto.edit', id),
            deleteEndpoint: (id) => route('rto.destroy', id),
            generateReportEndpoint: (id) => route('rto.generate', id),
            bulkDeleteEndpoint: route('rto.bulk-destroy'),
            /* bulkSubmitEndpoint: route('rto.bulk-submit'),
            bulkEndorseEndpoint: route('rto.bulk-endorse'),
            bulkApproveEndpoint: route('rto.bulk-approve'),
            bulkDisapproveEndpoint: route('rto.bulk-disapprove'), */
        },
    })

    return (
        <div className="h-full flex flex-col">
            <Head title="Flexiplace RTO" />
            <PageTitle
                pageTitle="Flexiplace RTO"
                description="Record your itemized target outputs here if you are under flexiplace arrangement"
                breadcrumbItems={breadcrumbItems}
            />
            <TableView />
            {isFormOpen && (
                <Form
                    open={isFormOpen}
                    mode={formMode}
                    data={selectedItem}
                    onClose={handleCloseForm}
                    employees={employees}
                    dates={dates}
                />
            )}
            {isFilterOpen && (
                <Filter
                    open={isFilterOpen}
                    onClose={handleCloseFilter}
                    onApply={(appliedFilters) => setFilters(appliedFilters)}
                    initialValues={filters}
                    employees={employees}
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
                        Are you sure you want to <b>{confirmAction}</b> this RTO?
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

export default Rto
