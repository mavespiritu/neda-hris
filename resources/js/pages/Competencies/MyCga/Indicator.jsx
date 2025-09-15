import { useState, useEffect, useMemo } from 'react'
import { usePage } from '@inertiajs/react'
import { store } from './store'
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import PaginationControls from "@/components/PaginationControls"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
    Search, 
    ThumbsUp, 
    Plus, 
    ThumbsDown, 
    Trash2, 
    Pencil, 
    Send, 
    Undo2,
    ChevronDown,
    Loader2,
    SlidersHorizontal
} from 'lucide-react'
import { parse, format, isValid } from 'date-fns'
import { flexRender } from "@tanstack/react-table"
import { cn } from "@/lib/utils"
import { useTable } from '@/hooks/useTable'
import EvidenceDescription from "./EvidenceDescription"
import AttachmentList from "./AttachmentList"
import TrainingForm from "./TrainingForm"
import AwardForm from "./AwardForm"
import PerformanceForm from "./PerformanceForm"
import OtherEvidenceForm from "./OtherEvidenceForm"

const evidenceTypes = [
  "Training", 
  "Award", 
  "Performance", 
  "Others"
];

const Indicator = ({
    emp_id,
    item_no
}) => {
    
    const { toast } = useToast()
    
    const {
        selectedIndicator,
        selectedStaff,
        selectedIndicatorData,
        fetchSelectedIndicator,
        closeEvidenceForm,
        setSelectedEvidence,
        selectedEvidenceType,
        setSelectedEvidenceType,
        deleteEvidence,
        deleteEvidences,
        setSelectedIndicatorData
    } = store()

    const {
        indicator,
        indicator_id,
        proficiency
    } = selectedIndicator

    const {
        data,
        current_page,
        last_page: pageCount,
        total,
        per_page: perPage,
    } = selectedIndicatorData?.data || {}

    const currentPageSafe = current_page ?? 1
    const perPageSafe = perPage ?? 20

    const [hoveredRowId, setHoveredRowId] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedEvidenceTypes, setSelectedEvidenceTypes] = useState([])

    const filters = useMemo(() => ({
        emp_id,
        position_id: item_no,
        indicator_id
    }), [selectedStaff, indicator_id])

    const extraQuery = useMemo(() => ({
        filters,
        selectedEvidenceTypes
    }), [filters, selectedEvidenceTypes])

    const columns = useMemo(() => [
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                checked={table.getIsAllRowsSelected()}
                onCheckedChange={() => table.toggleAllPageRowsSelected()}
                className="peer border-neutral-400 dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                />
            ),
            meta: {
                className: "w-[5%] text-center",
            },
            cell: ({ row }) => (
                <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={() => row.toggleSelected()}
                className="peer border-neutral-400 dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                />
            ),
        },
        {
            header: "#",
            meta: {
                className: "w-[5%] text-center",
            },
            cell: ({ row }) => {
                return (row.index + 1) + ((currentPageSafe - 1) * perPageSafe)
            },
        },
        {
            header: "Evidence",
            cell: ({ row }) => {
                const { 
                    title,
                    start_date,
                    end_date,
                    description,
                    reference,
                    files
                 } = row.original

                return (
                    <div className="flex flex-col gap-2">
                        <div>
                            <h5 className="font-semibold">{title}</h5>
                            <div className="text-xs font-medium">
                            {start_date && `${format(start_date, 'MMMM d, yyyy')} - ${format(end_date, 'MMMM d, yyyy')}`}
                            </div>
                        </div>
                        <EvidenceDescription text={description} />
                        
                        {files && files.length > 0 && (
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground font-medium">
                                    Supporting Documents:
                                </span>
                                <AttachmentList files={files} />
                            </div>
                        )}
                        
                        <div className="text-xs flex flex-col gap-1">
                            <span className="text-muted-foreground font-medium">Type of Evidence:</span>
                            <Badge variant="outline" className="rounded w-fit text-muted-foreground px-1.5">
                                {reference}
                            </Badge>
                        </div>
                    </div>
                )
            },
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => {
              const isHovered = row.id === hoveredRowId
              const { 
                    reference,
                 } = row.original

              return (
                <div className="flex gap-2 justify-end items-center w-full">
                  <div
                    className={`flex transition-opacity duration-150 ${
                      isHovered ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                            setSelectedEvidenceType(reference)
                            setSelectedEvidence(row.original)
                        }
                      }
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the evidence.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="border-0">
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction 
                                className="bg-destructive text-white hover:bg-destructive/90"
                                onClick={() => {
                                    deleteEvidence({
                                    id: row.original.id,
                                    form,
                                    toast,
                                    })
                                }}
                                disabled={form.processing}>
                                {form.processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        <span>Deleting</span>
                                    </>
                                ) : 'Yes, delete it'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    </div>
                </div>
              )
            },
        }
    ], [hoveredRowId])

    const {
        table,
        form,
        search,
        setSearch,
        pageIndex,
        setPageIndex,
        selectedRows,
        reloadTable
    } = useTable({
        data,
        pageCount,
        pageSize: 10,
        currentPage: current_page,
        searchQuery: searchQuery,
        routeName: route('cga.indicator-evidences', selectedIndicator.id),
        columns,
        extraQuery,
        responseType: 'json',
        onJsonResponse: (response) => {
            setSelectedIndicatorData((old) => ({
                ...old,
                data: response,
                isLoading: false,
                error: null
            }))
        }
    })

    const toggleFilter = (reference) => {
        setSelectedEvidenceTypes((prev) =>
            prev.includes(reference)
                ? prev.filter((r) => r !== reference)
                : [...prev, reference]
        )
        setPageIndex(0)
    }

    useEffect(() => {
        if (selectedIndicator?.id) {
            fetchSelectedIndicator({
                id: selectedIndicator.id,
                filters
            })
            setSelectedEvidenceType(null)
        }
    }, [selectedIndicator.id])

    return (
        <div className="flex flex-col gap-4 border rounded-lg p-4">
            <div>
                <h4 className="leading-normal text-sm">Evidences for Indicator:</h4>
                <h5 className="font-semibold"> {indicator}</h5>
                <p className="text-sm font-medium">Proficiency Level {proficiency} Indicator</p>
            </div>
            <div className="mt-4 flex flex-col md:flex-row justify-between gap-4">
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="" size="sm">
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap flex gap-2 items-center">
                                    <span>Add Evidence</span>
                                    <ChevronDown className="h-3 w-3" />
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="start">
                            <DropdownMenuLabel>Select Type</DropdownMenuLabel>
                            <DropdownMenuGroup>
                            {evidenceTypes.map((evidenceType) => (
                                <DropdownMenuItem 
                                key={evidenceType}
                                onClick={() => setSelectedEvidenceType(evidenceType)}
                                >
                                <span>{evidenceType}</span>
                                </DropdownMenuItem>
                            ))}
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="ghost"
                                className="flex items-center justify-center rounded-md hover:bg-muted disabled:opacity-50"
                                disabled={selectedRows.length === 0 || form.processing}
                                size="sm"
                            >
                            <Trash2 className="h-8 w-8" />
                            <span className="text-sm">{`Delete Selected (${selectedRows.length})`}</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the selected evidences. This action cannot be undone.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel className="border-0">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-white hover:bg-destructive/90"
                                onClick={() => {
                                    deleteEvidences({
                                        form,
                                        toast,
                                    })
                                }}
                            >
                                Yes, delete it
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto gap-2">
                            <SlidersHorizontal className="h-4 w-4" />
                            <span className="hidden md:block">Filter</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px]">
                            <DropdownMenuLabel className="text-sm">Filter by type</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {evidenceTypes.map((reference) => (
                            <DropdownMenuCheckboxItem
                                key={reference}
                                className="capitalize"
                                checked={selectedEvidenceTypes.includes(reference)}
                                onCheckedChange={() => toggleFilter(reference)}
                            >
                                {reference}
                            </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="relative">
                        <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            autoFocus
                            placeholder="Type to search evidence..."
                            type="search"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setSearchQuery(e.target.value)
                                setPageIndex(0)
                            }}
                            className="pl-9 w-full text-sm rounded"
                        />
                    </div>
                </div>
            </div>
            <div className="border rounded-lg">
                 <Table>
                        <TableHeader className="bg-muted">
                            {table.getHeaderGroups().map(headerGroup => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <TableHead key={header.id} className={cn("text-black", header.column.columnDef.meta?.className)}>
                                            {header.isPlaceholder ? null : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows.length ? (
                                table.getRowModel().rows.map(row => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                        onMouseEnter={() => setHoveredRowId(row.id)}
                                        onMouseLeave={() => setHoveredRowId(null)}
                                    >
                                        {row.getVisibleCells().map(cell => (
                                            <TableCell 
                                                key={cell.id}
                                                className={cell.column.columnDef.meta?.className}
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="text-center">
                                        No evidences found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                </Table>
            </div>

            <PaginationControls
                pageIndex={pageIndex}
                pageCount={pageCount}
                setPageIndex={setPageIndex}
                selectedRowsLength={selectedRows.length}
            />

            {selectedEvidenceType === 'Training' && (
                <TrainingForm 
                    open={true} 
                    onClose={() => {
                        setSelectedEvidence(null)
                        setSelectedEvidenceType(null)
                        closeEvidenceForm()
                        //reloadTable()
                    }} 
                />
            )}

            {selectedEvidenceType === 'Award' && (
                <AwardForm 
                    open={true} 
                    onClose={() => {
                        setSelectedEvidence(null)
                        setSelectedEvidenceType(null)
                        closeEvidenceForm()
                        //reloadTable()
                    }}  
                />
            )}

            {selectedEvidenceType === 'Performance' && (
                <PerformanceForm 
                    open={true} 
                    onClose={() => {
                        setSelectedEvidence(null)
                        setSelectedEvidenceType(null)
                        closeEvidenceForm()
                        //reloadTable()
                    }} 
                />
            )}

            {selectedEvidenceType === 'Others' && (
                <OtherEvidenceForm 
                    open={true} 
                    onClose={() => {
                        setSelectedEvidence(null)
                        setSelectedEvidenceType(null)
                        closeEvidenceForm()
                        //reloadTable()
                    }} 
                />
            )}
        </div>
    )
}

export default Indicator