import { useState, useEffect, useMemo } from 'react'
import { usePage } from '@inertiajs/react'
import { store } from './store'
import CompetenciesLoading from "@/components/skeletons/CompetenciesLoading"
import PaginationControls from "@/components/PaginationControls"
import SelectedSubmission from "./SelectedSubmission"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import StatusBadge from '@/components/StatusBadge'
import { Input } from "@/components/ui/input"
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
    SlidersHorizontal,
    Calendar,
    Clock,
    Briefcase,
    User
} from 'lucide-react'

import { parse, format, isValid } from 'date-fns'
import { flexRender } from "@tanstack/react-table"
import { cn } from "@/lib/utils"
import { useTable } from '@/hooks/useTable'
import { formatDateWithTime } from "@/lib/utils.jsx"

const Submissions = () => {

  const { toast } = useToast()

  const {
      selectedStaff,
      fetchSubmissions,
      submissions,
      setSubmissions,
      setSelectedSubmission,
      selectedSubmission,
      deleteSubmission,
      deleteSubmissions,
      fetchProposedTrainings
  } = store()

  const {value: emp_id} = selectedStaff

  const initialFilters = {
    status: null,
  }

  const [filters, setFilters] = useState(initialFilters)

  const {
      data,
      current_page,
      last_page: pageCount,
      total,
      per_page: perPage,
  } = submissions?.data || {}

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

            if (status !== null) {
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
        header: "Submissions",
        cell: ({ row }) => {
          const { position, position_id, date_created, status } = row.original

          const formatted = formatDateWithTime(date_created)
          const [datePart, timePart] = formatted.split(/ (?=\d{2}:\d{2}:\d{2})/)

          return (
            <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm leading-tight">{position}</span>
                    </div>
                    <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                    <span className="text-xs">{datePart}</span>
                    </div>
                    <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                    <span className="text-xs">{timePart}</span>
                    </div>
                </div>

                <StatusBadge status={status} />
            </div>
          )
        },
    },
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
        routeName: emp_id ? route('cga.submissions', emp_id) : null,
        columns,
        extraQuery: {
          ...filters,
        },
        enableRowSelection: row => row.original.status === null,
        responseType: 'json',
        onJsonResponse: (response) => {
            setSubmissions((old) => ({
                ...old,
                data: response,
                isLoading: false,
                error: null
            }))
        }
    })

  useEffect(() => {
    fetchSubmissions({
      id: emp_id,
      filters
    })
  }, [filters, emp_id])

  return (
    <div className="grid grid-rows-[auto,1fr,auto] gap-2 h-full">
        <div>
            <h3 className="font-bold text-lg">Submissions</h3>
            <p className="text-muted-foreground text-sm">You can view the submissions and its competencies' ratings and proposed trainings by clicking a row below.</p>
        </div>
        <div className="mt-4 flex flex-col md:flex-row justify-between gap-4">
            <div className="flex gap-2">
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
                                deleteSubmissions({
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
                {JSON.stringify(filters) !== JSON.stringify(initialFilters) && (
                <Button variant="ghost" onClick={() => setFilters(initialFilters)}>
                    Clear Filters
                </Button>
                )}
                {/* <SubmissionsFilter 
                onApplyFilters={(newFilters) => {
                    setFilters(newFilters)
                    setPageIndex(0)
                }} 
                filters={filters}
                /> */}
            </div>
        </div>
        <div className="flex flex-col gap-2 ">
            <div className="flex flex-col md:flex-row md:gap-x-6 gap-y-4 min-h-screen">
                
                {/* Left: Submissions List */}
                <div className="w-full md:w-[30%] flex flex-col gap-4">
                    <span className="text-sm font-medium">
                    {!data || data.length === 0 ? (
                        <>Showing 0 items</>
                        ) : (
                        <>
                            {(() => {
                            const currentPage = Number(pageIndex) || 0;
                            return (
                                <>Showing {(currentPage * perPage) + 1} - {Math.min((currentPage + 1) * perPage, total)} of {total} items</>
                            );
                            })()}
                        </>
                    )}
                    </span>
                <div className="border rounded-lg max-h-[calc(100vh-200px)] overflow-auto">
                    <Table className="min-w-full">
                        <TableHeader className="bg-muted sticky top-0 z-10 text-xs">
                            {table.getHeaderGroups().map(headerGroup => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                <TableHead
                                    key={header.id}
                                    className={cn("text-black", header.column.columnDef.meta?.className)}
                                >
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
                                className={cn(
                                    "cursor-pointer transition-colors duration-150",
                                    selectedSubmission?.id === row.original.id && "bg-muted/50 font-medium"
                                )}
                                >
                                {row.getVisibleCells().map(cell => (
                                    <TableCell
                                    key={cell.id}
                                    className={cell.column.columnDef.meta?.className}
                                    onClick={() => {
                                        if (cell.column.id !== 'select') {
                                            setSelectedSubmission(row.original)
                                            window.scrollTo({ top: 0, behavior: 'smooth' })
                                        }
                                    }}
                                    >
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                                </TableRow>
                            ))
                            ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="text-center">
                                No submissions found.
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

                {/* Right: Submission Info */}
                {selectedSubmission && <SelectedSubmission />}
            </div>
            </div>
    </div>
  )
}

export default Submissions