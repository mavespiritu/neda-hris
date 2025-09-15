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

const Vacancies = () => {

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

    const { auth: { user }, data: { vacancies } } = usePage().props

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

    const performAction = (e) => {

        e.preventDefault()

        if (!confirmAction || !selectedRow) return

        const id = selectedRow.original.id

        const actionMap = {
            Submit: {
                route: "vacancies.submit",
                notification: "notification.submit-vacancy",
            },
            Approve: {
                route: "vacancies.approve",
                notification: "notification.approve-vacancy",
            },
            "Needs Revision": {
                route: "vacancies.return",
                notification: "notification.return-vacancy",
            },
            Disapprove: {
                route: "vacancies.disapprove",
                notification: "notification.disapprove-vacancy",
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
            header: "Ref No.",
            accessorKey: "reference_no",
            meta: { enableSorting: true },
        },
        {
            header: "Division",
            accessorKey: "division",
            meta: { enableSorting: true },
        },
        {
            header: "Appointment Status",
            accessorKey: "appointment_status",
            meta: { enableSorting: true },
        },
        {
            header: "Position",
            accessorKey: "position_description",
            cell: ({ row }) => {
                const { position_description, item_no, appointment_status } = row.original

                return (
                    <div className="flex flex-col gap-1">
                        <span>{position_description}</span>
                        {appointment_status === 'Permanent' && <span>({item_no})</span>}
                    </div>
                )
            },
            meta: { enableSorting: true },
        },
        {
            header: "SG / Monthly Salary",
            accessorKey: "monthly_salary",
            cell: ({ row }) => {
                const sg = row.original.sg
                const salary = row.original.monthly_salary
                return (
                    <span>{sg} / {parseFloat(salary).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}</span>
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
        /* {
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
                                Date: {formatDate(dateActed)}
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
        }, */
        /* {
            header: "Actions",
            cell: ({ row }) => {
            const { props } = usePage()
            const roles = props.auth.user?.roles || [] 
            const status = row.original.status

            let actions = []

            if ([null, "Draft", "Needs Revision"].includes(status) && roles.includes("HRIS_ADC", "HRIS_DC", "HRIS_HR")) {
                actions.push({ label: "Submit", icon: <Send className="h-2 w-2" /> })
            }
            if (status === "Submitted" && roles.some(r => ["HRIS_ARD", "HRIS_HR"].includes(r))) {
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
        } */
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
        routeName: route('vacancies.index'),
        initialData: vacancies,
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
            enableRowSelection: row => !row.original.isLocked || canSelectVacancy,
            enableGenerateReport: true,
            canModify: canSelectVacancy
        },
        endpoints: {
            viewEndpoint: (id) => route('vacancies.show', id),
            addEndpoint: route('vacancies.create'),
            editEndpoint: (id) => route('vacancies.edit', id),
            deleteEndpoint: (id) => route('vacancies.destroy', id),
            //generateReportEndpoint: (id) => route('vacancies.generate', id),
            bulkDeleteEndpoint: route('vacancies.bulk-destroy'),
            /* bulkSubmitEndpoint: route('rto.bulk-submit'),
            bulkEndorseEndpoint: route('rto.bulk-endorse'),
            bulkApproveEndpoint: route('rto.bulk-approve'),
            bulkDisapproveEndpoint: route('rto.bulk-disapprove'), */
        },
    })

    return (
        <div className="h-full flex flex-col">
            <Head title="Vacancies" />
            <PageTitle 
                pageTitle="Vacancies" 
                description="Manage information about your requested vacancies here." 
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
                        Are you sure you want to <b>{confirmAction}</b> this vacancy?
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

export default Vacancies

