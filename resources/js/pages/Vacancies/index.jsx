import PageTitle from "@/components/PageTitle"
import axios from "axios"
import { useState, useEffect, useMemo, useRef } from "react"
import { useHasRole, useHasPermission } from "@/hooks/useAuth"
import { Head, usePage, router, useForm } from "@inertiajs/react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogClose
  } from "@/components/ui/dialog"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils.jsx"
import { AlertCircleIcon, Send, CheckCircle, XCircle, FileCheck, Undo2, Loader2 } from "lucide-react"
import Filter from "./Filter"
import ApplicantSummaryDialog from "./Applicants/ApplicantSummaryDialog"
import useCrudTable from "@/hooks/useCrudTable"
import StatusBadge from '@/components/StatusBadge'
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import RichTextEditor from "@/components/RichTextEditor"

const formatCountWithPercentage = (count, total) => {
  const safeCount = Number(count ?? 0)
  const safeTotal = Number(total ?? 0)

  if (safeTotal <= 0) {
    return `${safeCount} (0%)`
  }

  const percentage = ((safeCount / safeTotal) * 100).toFixed(1)
  return `${safeCount} (${percentage}%)`
}

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

    const canViewVacancy = useHasPermission("HRIS_recruitment.vacancies.view")
    const canCreateVacancy = useHasPermission("HRIS_recruitment.vacancies.create")
    const canEditVacancy = useHasPermission("HRIS_recruitment.vacancies.update")
    const canDeleteVacancy = useHasPermission("HRIS_recruitment.vacancies.delete")

    const [summaryDialog, setSummaryDialog] = useState({
        open: false,
        type: null,
        vacancyId: null,
        items: [],
        page: 1,
        lastPage: 1,
        loading: false,
        loadingMore: false,
    })
    const summaryScrollRef = useRef(null)
    const [selectedSummaryApplicant, setSelectedSummaryApplicant] = useState(null)
    const canViewApplicantsSummary = useHasPermission("HRIS_recruitment.vacancies.applicants.view")


const vacancySummaryTypes = {
    applicants: {
        label: "Applicants",
        description: "Submitted applicants for this vacancy.",
    },
    prescreened: {
        label: "Pre-screened",
        description: "Applicants who have undergone secretariat assessment.",
    },
    shortlisted: {
        label: "Total Shortlisted",
        description: "Applicants who passed the HRMPSB assessment.",
    },
}


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


    const openSummaryDialog = async (type, vacancyId) => {
        const summaryConfig = vacancySummaryTypes[type] || vacancySummaryTypes.applicants

        setSummaryDialog({
            open: true,
            type,
            vacancyId,
            items: [],
            page: 1,
            lastPage: 1,
            loading: true,
            loadingMore: false,
        })

        try {
            const { data } = await axios.get(
                route("vacancies.applicants.summary", { vacancy: vacancyId, type }),
                { params: { page: 1, per_page: 20 } }
            )

            setSummaryDialog((prev) => ({
                ...prev,
                open: true,
                type,
                vacancyId,
                items: data.data || [],
                page: data.meta?.current_page || 1,
                lastPage: data.meta?.last_page || 1,
                loading: false,
                loadingMore: false,
            }))
        } catch (error) {
            setSummaryDialog((prev) => ({
                ...prev,
                loading: false,
                loadingMore: false,
            }))
            toast({
                title: "Unable to load applicant list",
                description: error.response?.data?.message || `Could not load ${summaryConfig.label.toLowerCase()}.`,
                variant: "destructive",
            })
        }
    }

    const loadMoreSummaryItems = async () => {
        if (!summaryDialog.open || summaryDialog.loading || summaryDialog.loadingMore) return
        if (summaryDialog.page >= summaryDialog.lastPage) return

        const nextPage = summaryDialog.page + 1

        setSummaryDialog((prev) => ({ ...prev, loadingMore: true }))

        try {
            const { data } = await axios.get(
                route("vacancies.applicants.summary", { vacancy: summaryDialog.vacancyId, type: summaryDialog.type }),
                { params: { page: nextPage, per_page: 20 } }
            )

            setSummaryDialog((prev) => ({
                ...prev,
                items: [...prev.items, ...(data.data || [])],
                page: data.meta?.current_page || nextPage,
                lastPage: data.meta?.last_page || nextPage,
                loadingMore: false,
            }))
        } catch (error) {
            setSummaryDialog((prev) => ({ ...prev, loadingMore: false }))
            toast({
                title: "Unable to load more applicants",
                description: error.response?.data?.message || "Please try again.",
                variant: "destructive",
            })
        }
    }

    const handleSummaryScroll = (event) => {
        const target = event.currentTarget
        if (target.scrollTop + target.clientHeight >= target.scrollHeight - 80) {
            loadMoreSummaryItems()
        }
    }

    const closeSummaryDialog = () => {
        setSummaryDialog({
            open: false,
            type: null,
            vacancyId: null,
            items: [],
            page: 1,
            lastPage: 1,
            loading: false,
            loadingMore: false,
        })
    }

    const renderSummaryPopover = (type, vacancyId, triggerContent, valueClassName = "") => {
        const summaryConfig = vacancySummaryTypes[type] || vacancySummaryTypes.applicants
        const isOpen = summaryDialog.open && summaryDialog.type === type && summaryDialog.vacancyId === vacancyId

        return (
            <Popover open={isOpen} onOpenChange={(open) => { if (!open) closeSummaryDialog() }}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        className={["h-auto w-full justify-start px-2 py-1 text-left", valueClassName].filter(Boolean).join(" ")}
                        onClick={() => openSummaryDialog(type, vacancyId)}
                    >
                        {triggerContent}
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="start" side="bottom" sideOffset={8} className="w-[320px] p-0">
                    <div className="border-b px-3 py-2">
                        <div className="text-sm font-semibold">{summaryConfig.label}</div>
                        <div className="text-xs text-muted-foreground">{summaryConfig.description}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                            {summaryDialog.items.length + " applicants"}
                        </div>
                    </div>
                    <div ref={summaryScrollRef} onScroll={handleSummaryScroll} className="max-h-64 overflow-y-auto p-2">
                        {summaryDialog.loading ? (
                            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading applicants...
                            </div>
                        ) : summaryDialog.items.length ? (
                            <div className="space-y-1">
                                {summaryDialog.items.map((item) => (
                                    <Button
                                        key={item.id}
                                        type="button"
                                        variant="ghost"
                                        className="h-auto w-full justify-start rounded-md px-2 py-1.5 text-left hover:bg-muted/60"
                                        onClick={() => {
                                            setSelectedSummaryApplicant(item)
                                            closeSummaryDialog()
                                        }}
                                    >
                                        <div className="flex w-full flex-col items-start">
                                            <div className="text-sm font-medium leading-tight">{item.name || "-"}</div>
                                            {item.date_submitted && (
                                                <div className="text-xs text-muted-foreground">
                                                    Submitted: {formatDate(item.date_submitted)}
                                                </div>
                                            )}
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                No applicants found.
                            </div>
                        )}

                        {summaryDialog.loadingMore && (
                            <div className="flex items-center justify-center py-3 text-xs text-muted-foreground">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading more...
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        )
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
                const { position_description, item_no, appointment_status, sg, monthly_salary } = row.original
                const salary = Number(monthly_salary ?? 0)

                return (
                    <div className="flex flex-col gap-1">
                        <span>{position_description}</span>
                        {appointment_status === 'Permanent' && <span>({item_no})</span>}
                        <span className="text-xs text-muted-foreground">
                            SG {sg} / {salary.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </span>
                    </div>
                )
            },
            meta: { enableSorting: true },
        },
        {
            header: "Applicants",
            accessorKey: "applicants_count",
            cell: ({ row }) => {
                const count = Number(row.original.applicants_count ?? 0)

                if (!canViewApplicantsSummary) {
                    return <span>{count}</span>
                }

                return renderSummaryPopover("applicants", row.original.id, count)
            },
            meta: { enableSorting: false },
        },
        {
            header: "Pre-screened",
            accessorKey: "prescreened_count",
            cell: ({ row }) => {
                const total = Number(row.original.applicants_count ?? 0)
                const count = Number(row.original.prescreened_count ?? 0)
                const label = formatCountWithPercentage(count, total)

                if (!canViewApplicantsSummary) {
                    return <span>{label}</span>
                }

                return renderSummaryPopover("prescreened", row.original.id, label)
            },
            meta: { enableSorting: false },
        },
        {
            header: "Shortlisted",
            accessorKey: "shortlisted_count",
            cell: ({ row }) => {
                const total = Number(row.original.applicants_count ?? 0)
                const count = Number(row.original.shortlisted_count ?? 0)
                const label = formatCountWithPercentage(count, total)

                if (!canViewApplicantsSummary) {
                    return <span>{label}</span>
                }

                return renderSummaryPopover("shortlisted", row.original.id, label)
            },
            meta: { enableSorting: false },
        },        {
            header: "Date Published",
            accessorKey: "date_published",
            cell: ({ row }) => {
                const datePublished = row.original.date_published

                return (
                    <div className="flex flex-col gap-1">
                        {datePublished ? (
                            <span className="text-xs font-medium mt-1">
                                {formatDate(datePublished)}
                            </span>
                        ) : (
                            <span className="text-xs text-gray-400">-</span>
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
    ], [user.ipms_id, canViewApplicantsSummary, renderSummaryPopover])

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
            enableAdd: canCreateVacancy,
            enableEdit: (row) => canDeleteVacancy && Number(row.original.applicants_count ?? 0) === 0, 
            enableView: false,
            enableViewAsLink: canViewVacancy,
            enableDelete: (row) => canDeleteVacancy && Number(row.original.applicants_count ?? 0) === 0, 
            enableBulkDelete: true,
            enableSearching: true,
            enableFiltering: true,
            enableRowSelection: row => canDeleteVacancy && Number(row.original.applicants_count ?? 0) === 0,
            enableGenerateReport: true,
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
            <ApplicantSummaryDialog
                open={Boolean(selectedSummaryApplicant)}
                applicant={selectedSummaryApplicant}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedSummaryApplicant(null)
                    }
                }}
            />
        </div>
    )
}

export default Vacancies









