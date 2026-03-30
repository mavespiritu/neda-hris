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
import { travelRequestActionMap as actionMap } from "./actions"

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

    const [confirmAction, setConfirmAction] = useState(null)
    const confirmForm = useForm({ remarks: "" })
    const [selectedRow, setSelectedRow] = useState(null)

    const openConfirm = (action) => {
        setConfirmAction(action)
        confirmForm.setData("remarks", "")
        confirmForm.clearErrors()
    }

    const closeConfirm = () => {
        setConfirmAction(null)
        confirmForm.reset()
        confirmForm.clearErrors()
    }

    const handleAction = (action, row) => {
        setConfirmAction(action)
        setSelectedRow(row)
        confirmForm.setData("remarks", "")
        confirmForm.clearErrors()
    }

    const currentActionConfig = actionMap[confirmAction] ?? {}
    const dialogTitle = currentActionConfig.title ?? `Confirm ${confirmAction ?? "Action"}`
    const dialogDescription =
        currentActionConfig.description ??
        `Are you sure you want to ${confirmAction ?? "perform this action"} this travel request?`
    const actionNote = currentActionConfig.note ?? null
    const needsRemarks = Boolean(currentActionConfig.needsRemarks)

    const performConfirmAction = (e) => {

        e.preventDefault()

        if (!confirmAction || !selectedRow) return

        const id = selectedRow.original.id
        const cfg = actionMap[confirmAction]
        if (!cfg) return

        confirmForm.post(route(cfg.route, id), {
            preserveScroll: true,
            onSuccess: () => {
            toast({
                title: "Success!",
                description: `${confirmAction} successful!`,
            })
            setSelectedRow(null)
            closeConfirm()
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
            
                const can = row.original?.can || {}
                const actions = []

                if (can.submit) actions.push({ label: "Submit", icon: <Send className="h-2 w-2" /> })
                if (can.return) actions.push({ label: "Return", icon: <Undo2 className="h-2 w-2" /> })
                if (can.resubmit) actions.push({ label: "Resubmit", icon: <FileCheck className="h-2 w-2" /> })


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

            <Dialog open={!!confirmAction} onOpenChange={(open) => (!open ? closeConfirm() : null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{dialogTitle}</DialogTitle>
                        <DialogDescription>{dialogDescription}</DialogDescription>

                        {actionNote && (
                            <div className="rounded-md bg-muted p-3 text-xs flex flex-col gap-1 border-l-4 border-muted-foreground/30 mt-2">
                                Note: {actionNote}
                            </div>
                        )}
                    </DialogHeader>
                    <form onSubmit={performConfirmAction}>
                        {needsRemarks && (
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="remarks">Remarks</Label>
                            <RichTextEditor
                            name="remarks"
                            id="remarks"
                            value={confirmForm.data.remarks}
                            isInvalid={confirmForm.errors.remarks}
                            onChange={(value) => confirmForm.setData("remarks", value)}
                            />
                            {confirmForm.errors?.remarks && (
                            <span className="text-red-500 text-xs">{confirmForm.errors.remarks}</span>
                            )}
                        </div>
                        )}

                        <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" type="button" onClick={closeConfirm}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={confirmForm.processing} className="flex items-center gap-2">
                            {confirmForm.processing && <Loader2 className="h-4 w-4 animate-spin" />}
                            Submit
                        </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default TravelOrders

