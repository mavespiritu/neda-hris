import PageTitle from "@/components/PageTitle"
import { useState, useEffect, useMemo } from "react"
import { useHasPermission, useHasRole } from "@/hooks/useAuth"
import { Head, usePage, router, useForm, Link } from "@inertiajs/react"
import { Button } from "@/components/ui/button"
import { formatDate, formatTime12 } from "@/lib/utils.jsx"
import { ChevronLeft, ChevronDown, Pencil, Trash2, FileText, CheckCircle2, XCircle, Plus, Printer } from "lucide-react"
import Form from "./Form"
import RequestForm from './RequestForm'
import VacancyForm from './VacancyForm'
import CsForm from './CsForm'
import useCrudTable from "@/hooks/useCrudTable"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import RichTextEditor from "@/components/RichTextEditor"
import { store } from './store'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogClose
  } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { usePrinter } from "@/hooks/usePrinter"

const View = () => {

    const { toast } = useToast()

    const {
        openRequestForm,
        openVacancyForm,
        removeVacancy,
        removeVacancies,
        setSelectedItem,
        deleteRequest,
        toggleVisibility,
    } = store()

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

    const { data } = usePage().props
    const {
        publication,
        vacancies,
        allVacancies = [],
        signatoryName = "",
        signatoryPosition = "",
        agencyAddress = "",
        requirements = [],
    } = data

    const { print } = usePrinter()
    const canDownloadPublication = useHasPermission("HRIS_recruitment.publications.download")
    const canPublishPublication = useHasPermission("HRIS_recruitment.publications.publish")
    const canEditPublication = useHasPermission("HRIS_recruitment.publications.update")
    const canDeletePublication = useHasPermission("HRIS_recruitment.publications.delete")
    const canSelectVacancy = useHasRole(["HRIS_HR"])
    const isPublished = Number(publication.is_public) === 1
    const deleteForm = useForm({})

    const breadcrumbItems = [
        { label: "Home", href: "/" },
        { label: "Recruitment", href: "#" },
        { label: "Publications", href: route("publications.index") },
        {
            label: `Publication No. ${publication.reference_no}`,
            href: route("publications.show", publication.id),
        },
    ]

    const handlePrintCsForm = () => {
        print({
            content: (
                <CsForm
                    publication={publication}
                    vacancies={allVacancies.filter((vacancy) => vacancy.appointment_status === "Permanent")}
                    signatoryName={signatoryName}
                    signatoryPosition={signatoryPosition}
                    agencyAddress={agencyAddress}
                    requirements={requirements}
                />
            ),
            paperSize: "legal",
            orientation: "landscape",
        })
    }

    const columns = useMemo(() => [
        {
            header: "Reference No.",
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
            header: "Salary Grade",
            accessorKey: "sg",
            meta: { enableSorting: true },
        },
        {
            header: "SG / Monthly Salary",
            accessorKey: "monthly_salary",
            cell: ({ row }) => {
                const salary = row.original.monthly_salary
                return (
                    <span>{parseFloat(salary).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}</span>
                )
            },
            meta: { enableSorting: true },
        },
    ], [])

    const [filters, setFilters] = useState({})
    const [isFormOpen, setIsFormOpen] = useState(false)

    const handleCloseForm = () => {
        setIsFormOpen(false)
    }

    const { 
        TableView,
        isFilterOpen,
        isViewOpen,
        formMode,
        selectedItem,
        handleCloseFilter,
        } = useCrudTable({
        columns,
        routeName: route('publications.show', publication.id),
        initialData: vacancies,
        filters,
        options: {
            enableAdd: canEditPublication && !isPublished,
            enableEdit: (row) => canSelectVacancy && !isPublished,
            enableView: false,
            enableViewAsLink: true,
            enableDelete: (row) => canSelectVacancy && !isPublished, 
            enableBulkDelete: canSelectVacancy && !isPublished,
            enableSearching: true,
            enableFiltering: false,
            enableRowSelection: row => !isPublished && (!row.original.isLocked || canSelectVacancy),
            enableGenerateReport: !isPublished,
            canModify: !isPublished && canSelectVacancy
        },
        endpoints: {
            viewEndpoint: (id) => {
                const vacancyRow = vacancies.data?.find((item) => String(item.id) === String(id))
                return route('vacancies.show', { id: vacancyRow?.vacancy_id ?? id })
            },
            deleteEndpoint: (id) => route('publications.vacancies.destroy', id),
            //generateReportEndpoint: (id) => route('vacancies.generate', id),
            bulkDeleteEndpoint: route('publications.vacancies.bulk-destroy', publication.id),
        },
    })

    return (
        <div className="h-full flex flex-col gap-2">
            <div className="flex justify-between">
                <Link
                    href={route('publications.index')}
                    className="hidden md:block"
                >
                    <Button
                        variant="ghost"
                        className="flex items-center rounded-md disabled:opacity-50"
                        size="sm"
                    >
                        <ChevronLeft className="h-8 w-8" />
                        <span className="sr-only sm:not-sr-only">Back to Publications</span>
                    </Button>
                </Link>
                <div className="flex gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button 
                            variant="outline"
                            size="sm"
                            className="flex items-center" 
                            >
                            <span className="sr-only sm:not-sr-only">More Actions</span>
                            <ChevronDown className="h-8 w-8" />
                            </Button>
                        </PopoverTrigger>

                        <PopoverContent align="end" className="w-56 p-2">
                            <div className="flex flex-col gap-1">
                            {canEditPublication && !isPublished && (
                                <button
                                    className="flex justify-between items-center px-2 py-1.5 text-sm hover:bg-accent rounded-md"
                                    onClick={() => {
                                    setSelectedItem(publication)
                                    setIsFormOpen(true)
                                    }}
                                >
                                    <span>Edit</span>
                                    <Pencil className="h-4 w-4" />
                                </button>
                            )}

                            {canPublishPublication && (
                                <button
                                    className="flex justify-between items-center px-2 py-1.5 text-sm hover:bg-accent rounded-md"
                                    onClick={() => toggleVisibility({ id: publication.id, toast })}
                                >
                                    <span>{isPublished ? "Unpublish" : "Publish"}</span>
                                    {isPublished ? (
                                        <XCircle className="h-4 w-4" />
                                    ) : (
                                        <CheckCircle2 className="h-4 w-4" />
                                    )}
                                </button>
                            )}

                            {canDownloadPublication && (
                                <button
                                    className="flex justify-between items-center px-2 py-1.5 text-sm hover:bg-accent rounded-md"
                                    onClick={handlePrintCsForm}
                                >
                                    <span>Download CS Form</span>
                                    <Printer className="h-4 w-4" />
                                </button>
                            )}

                            {canDeletePublication && !isPublished && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                    <button
                                        className="flex justify-between items-center px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded-md"
                                    >
                                        <span>Delete</span>
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                    </AlertDialogTrigger>

                                    <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the publication request.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                        className="bg-destructive text-white hover:bg-destructive/90"
                                        onClick={() => deleteRequest({ id: publication.id, form: deleteForm, toast })}
                                        >
                                        Yes, delete it
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
            <Head title={`Publication No. ${publication.reference_no}`} />
            <PageTitle
                pageTitle={`Publication No. ${publication.reference_no}`}
                description="Manage publication details and vacant positions here."
                breadcrumbItems={breadcrumbItems}
            />
            <div className="flex flex-col md:flex-row md:flex-wrap lg:gap-12 gap-4 my-2">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center">
                    <Label className="text-muted-foreground">Reference No.</Label>
                    <span className="text-sm font-medium">{publication.reference_no}</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center">
                    <Label className="text-muted-foreground">Posting Date</Label>
                    <span className="text-sm font-medium">{formatDate(publication.date_published)}</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center">
                    <Label className="text-muted-foreground">Closing Date</Label>
                    <span className="text-sm font-medium flex flex-col">
                    <span>{formatDate(publication.date_closed)}</span>
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center">
                    <Label className="text-muted-foreground">Status</Label>
                    <span className="text-sm font-medium">
                        {(() => {
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

                        const { icon: Icon, color, bg } = statusConfig[publication.status] || statusConfig.Draft

                        return (
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${bg} w-fit`}>
                            <Icon className={`w-4 h-4 ${color}`} />
                            <span className={`text-xs font-medium ${color}`}>{publication.status}</span>
                            </div>
                        )
                        })()}
                    </span>
                </div>
            </div>
            <div className="flex justify-between gap-2">
                <h2 className="text-lg font-semibold">List of Vacant Positions</h2>
                <Button
                    variant=""
                    className="flex items-center rounded-md disabled:opacity-50"
                    size="sm"
                    onClick={openVacancyForm}
                    disabled={!canEditPublication || isPublished}
                >
                    <Plus className="h-6 w-6" />
                    <span className="text-sm">Add Vacant Position</span>
                </Button>
            </div>
            <div className="border rounded-lg p-4">
                <TableView />
            </div>
            <VacancyForm id={publication.id} />
            <Form 
                mode="edit"
                data={publication}
                open={isFormOpen}
                onClose={(shouldReload) => {
                    handleCloseForm()
                    if (shouldReload) {
                    router.reload({ preserveScroll: true, preserveState: true })
                    }
                }}
            />
        </div>
    )
}

export default View








