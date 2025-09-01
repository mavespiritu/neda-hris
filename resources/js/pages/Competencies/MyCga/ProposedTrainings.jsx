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

import { parse, format, isValid } from 'date-fns'
import { flexRender } from "@tanstack/react-table"
import { cn } from "@/lib/utils"
import { useTable } from '@/hooks/useTable'
import { formatDateWithTime } from "@/lib/utils.jsx"

const ProposedTrainings = () => {

  const { toast } = useToast()

  const {
      selectedStaff,
      fetchProposedTrainings,
      proposedTrainings,
      setProposedTrainings,
      setSelectedProposedTraining,
      deleteProposedTraining,
      deleteProposedTrainings,
      isProposedTrainingFormOpen,
      openProposedTrainingForm,
      closeProposedTrainingForm,
  } = store()

  const {value: emp_id} = selectedStaff

  const submission = {
    id: null,
    emp_id: selectedStaff.value ?? null,
    position_id: selectedStaff.item_no ?? null,
    position: selectedStaff.position ?? null,
  }

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
        cell: ({ row }) => (
          Number(row.index ?? 0) + 1 + ((Number(currentPageSafe ?? 1) - 1) * Number(perPageSafe ?? 20))
        )
    },
    {
        header: "Position",
        cell: ({ row }) => {
            const { 
                position,
                position_id,
              } = row.original

            return (
              <div>
                {position} ({position_id})
              </div>
            )
        },
    },
    {
        header: "Competency Gap",
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
        header: "Date Submitted",
        meta: {
            className: "w-[20%]",
        },
        cell: ({ row }) => {
          const { date_created } = row.original

          if (!date_created) {
              return <Badge variant="destructive">For Submission</Badge>
          }

          const formatted = formatDateWithTime(date_created)
          const [datePart, timePart] = formatted.split(/ (?=\d{2}:\d{2}:\d{2})/)

          return (
              <div className="flex flex-col">
                  <span>{datePart}</span>
                  <span className="text-muted-foreground text-xs">{timePart}</span>
              </div>
          )
      }
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
        routeName: emp_id ? route('cga.proposed-trainings', emp_id) : null,
        columns,
        extraQuery: {
          ...filters,
        },
        enableRowSelection: row => !row.original.status,
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
    fetchProposedTrainings({
      id: emp_id,
      filters
    })
  }, [filters, emp_id])

  
  return (
    <div className="flex flex-col flex-grow gap-4">
      <div>
          <h3 className="font-bold text-lg">Proposed Trainings</h3>
          <p className="text-muted-foreground text-sm">These trainings are collected to address gaps in your competencies, equipping you with the necessary skills and knowledge to meet the required standards effectively.</p>
      </div>
      <div className="mt-4 flex flex-col md:flex-row justify-between gap-4">
          <div className="flex gap-2">
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
          </div>
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

export default ProposedTrainings