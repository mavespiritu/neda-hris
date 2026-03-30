import PageTitle from "@/components/PageTitle"
import { useState, useMemo } from "react"
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
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, FileText, Paperclip } from "lucide-react"
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
  { label: "RAA", href: "/raa" },
]

const Raa = () => {

    const { toast } = useToast()

    const { auth: { user }, data: { targets, employees, divisions, dates, statuses, filters: serverFilters } } = usePage().props

    const canUseOwnershipTabs = useHasRole(["HRIS_HR", "HRIS_DC", "HRIS_ADC", "HRIS_RD", "HRIS_ARD"])
    const canFilterByStaff = canUseOwnershipTabs
    const canFilterByDivision = useHasRole(["HRIS_HR", "HRIS_RD", "HRIS_ARD"])
    const canSelectStaff = useHasRole(["HRIS_HR", "HRIS_DC", "HRIS_ADC"])
    const canModifyRow = canSelectStaff

    const [confirmAction, setConfirmAction] = useState(null)
    const [selectedRow, setSelectedRow] = useState(null)
    const [detailRow, setDetailRow] = useState(null)
    
    const { data, setData, post, processing, reset, errors, clearErrors } = useForm({
        remarks: "",
    })

    const handleAction = (action, row) => {
        setConfirmAction(action)
        setSelectedRow(row)
    }

    const stripHtml = (value) =>
        String(value || "")
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim()

    const countAccomplishments = (outputs = []) =>
        outputs.reduce((total, output) => total + (output.accomplishments?.length || 0), 0)

    const countFiles = (outputs = []) =>
        outputs.reduce(
            (total, output) =>
                total +
                (output.accomplishments || []).reduce(
                    (accTotal, accomplishment) => accTotal + (accomplishment.files?.length || 0),
                    0
                ),
            0
        )

    const performAction = (e) => {

        e.preventDefault()

        if (!confirmAction || !selectedRow) return

        const id = selectedRow.original.id

        const actionMap = {
            Submit: {
                route: "raa.submit",
                notification: "notification.submit-raa",
            },
            Endorse: {
                route: "raa.endorse",
                notification: "notification.endorse-raa",
            },
            Approve: {
                route: "raa.approve",
                notification: "notification.approve-raa",
            },
            "Needs Revision": {
                route: "raa.return",
                notification: "notification.return-raa",
            },
            Disapprove: {
                route: "raa.disapprove",
                notification: "notification.disapprove-raa",
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
            header: "Date of RTO",
            accessorKey: "date",
            meta: { enableSorting: true },
            cell: ({ row }) => {
            const date = row.original.date
            return date ? format(new Date(date), "MMMM d, yyyy") : ""
            },
        },
        {
            header: "Name of Staff",
            accessorKey: "employee_name",
            meta: { enableSorting: true },
        },
        {
            header: "Accomplishments",
            accessorKey: "outputs",
            meta: { className: "w-[20%]" },
            cell: ({ row }) => {
                return (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-full justify-center text-xs"
                        onClick={() => setDetailRow(row.original)}
                    >
                        <Eye className="mr-2 h-4 w-4" />
                        View accomplishments
                    </Button>
                )
            },
        },
        {
            header: "Status",
            accessorKey: "status",
            meta: { enableSorting: true, className: "w-[15%]" },
            cell: ({ row }) => {
                const status = row.original.raa_status
                const actedBy = row.original.raa_acted_by
                const actedByName = row.original.raa_acted_by_name
                const dateActed = row.original.raa_date_acted
                const remarks = row.original.raa_remarks
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
            const status = row.original.raa_status
            const outputs = row.original.outputs || []
            const skipEndorsement = !!row.original.skip_endorsement

            // Check if there are any accomplishments encoded
            const hasAccomplishments = outputs.some(output => (output.accomplishments || []).length > 0)

            let actions = []

            if ([null, "Draft", "Needs Revision"].includes(status) && roles.some(r => ["HRIS_Staff", "HRIS_HR"].includes(r)) && hasAccomplishments) {
                actions.push({ label: "Submit", icon: <Send className="h-2 w-2" /> })
            }
            if (status === "Submitted" && skipEndorsement && roles.some(r => ["HRIS_ARD", "HRIS_RD"].includes(r))) {
                actions.push({ label: "Approve", icon: <CheckCircle className="h-2 w-2" /> })
                actions.push({ label: "Needs Revision", icon: <Undo2 className="h-2 w-2" /> })
                actions.push({ label: "Disapprove", icon: <XCircle className="h-2 w-2" /> })
            } else if (status === "Submitted" && !skipEndorsement && roles.some(r => ["HRIS_ADC", "HRIS_DC"].includes(r))) {
                actions.push({ label: "Endorse", icon: <FileCheck className="h-2 w-2" /> })
                actions.push({ label: "Needs Revision", icon: <Undo2 className="h-2 w-2" /> })
            }
            if (status === "Endorsed" && roles.some(r => ["HRIS_ARD", "HRIS_RD", "HRIS_HR"].includes(r))) {
                actions.push({ label: "Approve", icon: <CheckCircle className="h-2 w-2" /> })
                actions.push({ label: "Needs Revision", icon: <Undo2 className="h-2 w-2" /> })
                actions.push({ label: "Disapprove", icon: <XCircle className="h-2 w-2" /> })
            }
            if (["Approved", "Disapproved"].includes(status) && roles.some(r => ["HRIS_ARD", "HRIS_RD", "HRIS_HR"].includes(r))) {
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

    const [filters, setFilters] = useState(serverFilters || {})

    const activeScope = canUseOwnershipTabs ? (filters.scope || "my") : null
    const divisionLabelMap = useMemo(
        () => Object.fromEntries((divisions || []).map((division) => [String(division.value), division.label])),
        [divisions]
    )
    const employeeLabelMap = useMemo(
        () => Object.fromEntries((employees || []).map((employee) => [String(employee.value), employee.label])),
        [employees]
    )
    const statusLabelMap = useMemo(
        () => Object.fromEntries((statuses || []).map((status) => [String(status.value), status.label])),
        [statuses]
    )

    const activeFilterChips = useMemo(() => {
        const chips = []

        if (filters.emp_id) {
            chips.push({
                key: "emp_id",
                label: `Staff: ${employeeLabelMap[String(filters.emp_id)] || filters.emp_id}`,
            })
        }

        if (filters.division_id) {
            chips.push({
                key: "division_id",
                label: `Division: ${divisionLabelMap[String(filters.division_id)] || filters.division_id}`,
            })
        }

        if (filters.date) {
            chips.push({
                key: "date",
                label: `Date: ${format(new Date(filters.date), "MMM d, yyyy")}`,
            })
        }

        if (filters.status) {
            chips.push({
                key: "status",
                label: `Status: ${statusLabelMap[String(filters.status)] || filters.status}`,
            })
        }

        return chips
    }, [divisionLabelMap, employeeLabelMap, filters.date, filters.division_id, filters.emp_id, filters.status, statusLabelMap])

    const updateFilters = (updater) => {
        setFilters((prev) => {
            const next = typeof updater === "function" ? updater(prev) : updater
            return next
        })
        setPageIndex(0)
    }

    const clearFilter = (key) => {
        updateFilters((prev) => {
            const next = { ...prev }
            delete next[key]
            return next
        })
    }

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
        } = useCrudTable({
        columns,
        routeName: route('raa.index'),
        initialData: targets,
        filters,
        options: {
            enableAdd: false,
            enableEdit: true,
            enableView: false,
            enableViewAsLink: false,
            enableDelete: false, 
            enableBulkDelete: false,
            enableSearching: true,
            enableFiltering: true,
            enableRowSelection: false,
            enableGenerateReport: true,
            canModify: canModifyRow
        },
        endpoints: {
            editEndpoint: (id) => route('raa.edit', id),
            generateReportEndpoint: (id) => route('raa.generate', id),
        },
        filterChips: activeFilterChips,
        onClearFilter: clearFilter,
    })

    return (
        <div className="h-full flex flex-col">
            <Head title="Flexiplace RAA" />
            <PageTitle
                pageTitle="Flexiplace RAA"
                description="Browse RTOs here to accomplish RAA"
                breadcrumbItems={breadcrumbItems}
            />
            <div className="space-y-4">
                {canUseOwnershipTabs && (
                    <Tabs
                        value={activeScope || "my"}
                        onValueChange={(value) => updateFilters((prev) => ({ ...prev, scope: value }))}
                        className="w-full"
                    >
                        <TabsList className="grid w-full max-w-md grid-cols-2">
                            <TabsTrigger value="my">My RAA</TabsTrigger>
                            <TabsTrigger value="others">Staff RAA</TabsTrigger>
                        </TabsList>
                    </Tabs>
                )}

                <div className="rounded-xl border border-border/70 bg-background p-3 sm:p-4 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Filter by status:</span>
                        <Button
                            variant={!filters.status ? "default" : "outline"}
                            size="sm"
                            type="button"
                            className="h-7 rounded-full px-3 text-xs"
                            onClick={() => updateFilters((prev) => ({ ...prev, status: "" }))}
                        >
                            All
                        </Button>
                        {statuses.map((statusOption) => (
                            <Button
                                key={statusOption.value}
                                variant={filters.status === statusOption.value ? "default" : "outline"}
                                size="sm"
                                type="button"
                                className="h-7 rounded-full px-3 text-xs"
                                onClick={() => updateFilters((prev) => ({ ...prev, status: statusOption.value }))}
                            >
                                {statusOption.label}
                            </Button>
                        ))}
                    </div>

                    <TableView />
                </div>
            </div>
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
                    onApply={(appliedFilters) => {
                        updateFilters((prev) => ({
                            ...appliedFilters,
                            scope: prev.scope || (canUseOwnershipTabs ? "my" : ""),
                        }))
                    }}
                    initialValues={filters}
                    employees={employees}
                    divisions={divisions}
                    showStaffFilter={canFilterByStaff}
                    showDivisionFilter={canFilterByDivision}
                />
            )}

            <Sheet
                open={!!detailRow}
                onOpenChange={(open) => {
                    if (!open) {
                        setDetailRow(null)
                    }
                }}
            >
                <SheetContent side="right" className="w-full sm:max-w-3xl">
                    <SheetHeader className="pr-10 text-left">
                        <SheetTitle>RAA Details</SheetTitle>
                        <SheetDescription>
                            {detailRow?.employee_name}
                            {detailRow?.date ? ` - ${format(new Date(detailRow.date), "MMMM d, yyyy")}` : ""}
                        </SheetDescription>
                    </SheetHeader>

                    {detailRow && (
                        <div className="mt-6 space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="rounded-full">
                                    {detailRow.outputs?.length || 0} target{(detailRow.outputs?.length || 0) === 1 ? "" : "s"}
                                </Badge>
                                <Badge variant="secondary" className="rounded-full">
                                    {countAccomplishments(detailRow.outputs || [])} accomplishment{countAccomplishments(detailRow.outputs || []) === 1 ? "" : "s"}
                                </Badge>
                                <Badge variant="secondary" className="rounded-full">
                                    {countFiles(detailRow.outputs || [])} file{countFiles(detailRow.outputs || []) === 1 ? "" : "s"}
                                </Badge>
                            </div>

                            <div className="flex items-center gap-2">
                                <StatusBadge status={detailRow.raa_status} />
                                {detailRow.raa_date_acted && (
                                    <span className="text-xs text-muted-foreground">
                                        Updated {format(new Date(detailRow.raa_date_acted), "MMMM d, yyyy")}
                                    </span>
                                )}
                            </div>

                            <Separator />

                            <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
                                <Accordion
                                    type="multiple"
                                    key={detailRow.id}
                                    defaultValue={(detailRow.outputs || []).slice(0, 1).map((_, index) => `output-${index}`)}
                                    className="w-full"
                                >
                                    {(detailRow.outputs || []).length > 0 ? (
                                        detailRow.outputs.map((output, outputIndex) => (
                                            <AccordionItem key={output.id || outputIndex} value={`output-${outputIndex}`}>
                                                <AccordionTrigger className="items-start gap-3 text-left no-underline hover:no-underline">
                                                    <div className="flex flex-col items-start gap-1 text-left">
                                                        <span className="font-semibold">
                                                            Target Output # {outputIndex + 1}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {stripHtml(output.output) || "No target description"}
                                                        </span>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="space-y-3">
                                                        {output.accomplishments?.length > 0 ? (
                                                            output.accomplishments.map((acc, accIndex) => {
                                                                const parts = String(acc.accomplishment || "")
                                                                    .split(/<\/p>/i)
                                                                    .map((part) => part.replace(/<p[^>]*>/i, "").trim())
                                                                    .filter(Boolean)

                                                                return (
                                                                    <div key={acc.id || `${outputIndex}-${accIndex}`} className="rounded-lg border p-3">
                                                                        <div className="mb-2 flex items-center gap-2">
                                                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                                                            <span className="text-sm font-medium">
                                                                                Actual Accomplishment # {accIndex + 1}
                                                                            </span>
                                                                        </div>

                                                                        <div className="space-y-2">
                                                                            {parts.length > 0 ? (
                                                                                parts.map((part, partIndex) => (
                                                                                    <div
                                                                                        key={`${acc.id || accIndex}-${partIndex}`}
                                                                                        className="text-sm text-foreground"
                                                                                        dangerouslySetInnerHTML={{ __html: part }}
                                                                                    />
                                                                                ))
                                                                            ) : (
                                                                                <div className="text-sm text-muted-foreground">
                                                                                    No accomplishment entered.
                                                                                </div>
                                                                            )}

                                                                            {acc.remarks && (
                                                                                <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                                                                                    <span className="font-medium text-foreground">
                                                                                        Remarks/Justification:
                                                                                    </span>{" "}
                                                                                    <span dangerouslySetInnerHTML={{ __html: acc.remarks }} />
                                                                                </div>
                                                                            )}

                                                                            {acc.files?.length > 0 && (
                                                                                <div className="space-y-1">
                                                                                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                                                        Files
                                                                                    </div>
                                                                                    <div className="flex flex-col gap-1">
                                                                                        {acc.files.map((file) => (
                                                                                            <a
                                                                                                key={file.id}
                                                                                                href={file.path}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                                                                                aria-label={`Download ${file.filename}`}
                                                                                            >
                                                                                                <Paperclip className="h-3 w-3" />
                                                                                                {file.filename}
                                                                                            </a>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })
                                                        ) : (
                                                            <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                                                                No accomplishments submitted for this target output.
                                                            </div>
                                                        )}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))
                                    ) : (
                                        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                            No target outputs available for this RAA.
                                        </div>
                                    )}
                                </Accordion>
                            </ScrollArea>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

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
                        Are you sure you want to <b>{confirmAction}</b> this RAA?
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

export default Raa
