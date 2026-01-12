import { useState, useEffect, useMemo } from 'react'
import { usePage } from '@inertiajs/react'
import { store } from './store'
import CompetenciesLoading from "@/components/skeletons/CompetenciesLoading"
import PaginationControls from "@/components/PaginationControls"
import ProposedTrainingForm from "./ProposedTrainingForm"
import ProposedTrainingFilter from "./ProposedTrainingFilter"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useHasRole } from '@/hooks/useAuth'
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

import { flexRender } from "@tanstack/react-table"
import { cn } from "@/lib/utils"
import { useTable } from '@/hooks/useTable'

const SubmissionTrainings = ({
    submission
}) => {

    const { toast } = useToast()

    const canAddTraining = useHasRole(['HRIS_HR'])

    const {
        fetchProposedTrainings,
        proposedTrainings,
        setProposedTrainings,
        isProposedTrainingFormOpen,
        setSelectedProposedTraining,
        openProposedTrainingForm,
        closeProposedTrainingForm,
        deleteProposedTrainings,
        deleteProposedTraining
    } = store()

    const initialFilters = {
        competency_id: null,
    }

    const [filters, setFilters] = useState(initialFilters)

    const {
        data,
        current_page,
        last_page: pageCount,
        total,
        per_page: perPage,
    } = proposedTrainings?.data || {}

    const currentPageSafe = current_page ?? 1
    const perPageSafe = perPage ?? 20

    const [hoveredRowId, setHoveredRowId] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')

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
        cell: ({ row }) => {
            const { status } = row.original

            if (status) {
              return null 
            }

            return (
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={() => row.toggleSelected()}
                className="peer border-neutral-400 dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              />
        )},
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
        header: "Competency Gap",
        meta: {
            className: "w-[30%]",
        },
        cell: ({ row }) => {
            const { 
                percentage,
                competency,
              } = row.original

            return (
              <div>
                {competency} {percentage ? `(${percentage}%)` : ''}
              </div>
            )
        },
    },
    {
        header: "Title of Training",
        accessorKey: "title",
    },
    {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const isHovered = row.id === hoveredRowId
          const { status } = row.original

          if (status) {
            return null
          }

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
                        setSelectedProposedTraining(row.original)
                        openProposedTrainingForm()
                      }}
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
                        This action cannot be undone. This will permanently delete the proposed training.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-0">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={() => {
                                deleteProposedTraining({
                                emp_id: submission.emp_id,
                                submission_id: submission.id,
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
            selectedRows
    } = useTable({
        data,
        pageCount,
        pageSize: 10,
        currentPage: current_page,
        searchQuery: searchQuery,
        routeName: submission.emp_id ? route('cga.proposed-trainings', submission.emp_id) : null,
        columns,
        extraQuery: {
        ...filters,
        review_id: submission.id ?? null
        },
        enableRowSelection: row => !row.original.status || canAddTraining,
        responseType: 'json',
        onJsonResponse: (response) => {
            setProposedTrainings((old) => ({
                ...old,
                data: response,
                isLoading: false,
                error: null
            }))
        }
    })

    useEffect(() => {
        if (!submission?.id || !submission.emp_id) return

        const newFilters = {
            ...filters,
            review_id: submission.id,
        }

        setFilters(newFilters)

        fetchProposedTrainings({
            id: submission.emp_id,
            filters: newFilters,
        })
    }, [])

    return (
        <div className="flex flex-col flex-grow gap-4 border rounded-lg p-4">
            <div
            className={cn(
                "mt-4 flex flex-col md:flex-row gap-4",
                (submission.status === null || canAddTraining)
                ? "justify-between"
                : "justify-end"
            )}
            >
                {(submission.status === null || canAddTraining) && (<div className="flex gap-2">
                    <Button variant="" onClick={() => openProposedTrainingForm()}>Add Training</Button>
                    <ProposedTrainingForm 
                        submission={submission}
                        open={isProposedTrainingFormOpen} 
                        onClose={() => {
                            closeProposedTrainingForm()
                        }} 
                    />
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="ghost"
                                className="flex items-center justify-center rounded-md hover:bg-muted disabled:opacity-50"
                                disabled={selectedRows.length === 0 || form.processing}
                            >
                            <Trash2 className="h-8 w-8" />
                            <span className="text-sm">{`Delete Selected (${selectedRows.length})`}</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the selected proposed trainings. This action cannot be undone.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel className="border-0">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-white hover:bg-destructive/90"
                                onClick={() => {
                                    deleteProposedTrainings({
                                        emp_id: submission.emp_id,
                                        submission_id: submission.id,
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
                </div>)}
                <div className="flex gap-2">
                    {JSON.stringify(filters) !== JSON.stringify(initialFilters) && (
                    <Button variant="ghost" onClick={() => setFilters(initialFilters)}>
                        Clear Filters
                    </Button>
                    )}
                    <ProposedTrainingFilter 
                        emp_id={submission.emp_id}
                        onApplyFilters={(newFilters) => {
                            setFilters(newFilters)
                            setPageIndex(0)
                        }} 
                    filters={filters}
                    />
                    <div className="relative">
                        <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            autoFocus
                            placeholder="Type to search trainings..."
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
                    <TableHeader className="bg-muted text-xs">
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
                                    No proposed trainings found.
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
        </div>
    )
}

export default SubmissionTrainings