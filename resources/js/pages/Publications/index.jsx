import PageTitle from "@/components/PageTitle"
import { useState, useEffect, useMemo } from 'react'
import { useHasRole } from '@/hooks/useAuth'
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Link } from '@inertiajs/react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import PaginationControls from "@/components/PaginationControls"
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
import { flexRender } from "@tanstack/react-table"
import { useTable } from '@/hooks/useTable'
import { parse, format, isValid } from 'date-fns'
import { 
    Search, 
    ThumbsUp, 
    Plus, 
    ThumbsDown, 
    Trash2, 
    Pencil, 
    Send, 
    Undo2,
    Circle 
} from 'lucide-react'
import { store } from './store'
import RequestForm from './RequestForm'
import { cn } from "@/lib/utils"
import { usePage } from '@inertiajs/react'

const Publications = () => {

    const { toast } = useToast()

    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'RSP', href: '#' },
        { label: 'Request for Publications', href: '/publications' },
    ]

    const { publications } = usePage().props

    const {
        data,
        current_page,
        last_page: pageCount,
        total,
        per_page: perPage,
    } = publications

    const {
        openRequestForm,
        setSelectedItem,
        deleteRequest,
        deleteRequests,
        approveRequests,
        disapproveRequests
    } = store()

    const [hoveredRowId, setHoveredRowId] = useState(null)
    const [showSearch, setShowSearch] = useState(false)

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
            cell: ({ row }) => {
                return (row.index + 1) + ((current_page - 1) * perPage)
            },
        },
        {
            header: "Reference No.",
            accessorKey: "reference_no",
        },
        {
            header: "No. of Vacancies",
            accessorKey: "vacancy_count",
        },
        {
            header: "Posting Date",
            accessorKey: "date_published",
            cell: ({ row }) => {
                const date = new Date(row.getValue('date_published'))
                return format(date, 'MMMM d, yyyy')
            }
        },
        {
            header: "Closing Date",
            accessorFn: row => `${row.date_closed} ${row.time_closed}`, 
            cell: ({ row }) => {
                const dateStr = row.original.date_closed
                const timeStr = row.original.time_closed
        
                const date = dateStr ? new Date(dateStr) : null
                const time = timeStr ? parse(timeStr, 'HH:mm:ss', new Date()) : null
        
                const formattedDate = date ? format(date, 'MMMM d, yyyy') : ''
                const formattedTime = time && isValid(time) ? format(time, 'hh:mm a') : ''
        
                return `${formattedDate} ${formattedTime ? ' ' + formattedTime : ''}`
            }
        },
        {
            header: "Last Action",
            accessorKey: "creator",
            cell: ({ row }) => {
              const actor = row.original.actor
              const actedAt = row.original.date_acted
              const date = actedAt ? new Date(actedAt) : null
              const formattedDate = date ? format(date, 'MMMM d, yyyy') : ''
          
              return (
                <div className="flex flex-col">
                  <Badge className="w-fit inline-flex mb-1">{row.original.status}</Badge>
                  <span className="font-medium">{actor}</span>
                  {formattedDate && (
                    <span className="text-xs italic text-muted-foreground">{formattedDate}</span>
                  )}
                </div>
              )
            },
        },
        {
            header: "Status",
            accessorKey: "is_public",
            cell: ({ row }) => {
                const isPublic = row.getValue("is_public")
                return isPublic ? (
                    <div className="flex items-center gap-1">
                        <div className="h-3 w-3 bg-green-500 rounded-full" />
                        <span className="text-xs text-green-700">Published</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1">
                        <div className="h-3 w-3 bg-red-500 rounded-full" />
                        <span className="text-xs text-red-500">Unpublished</span>
                    </div>
                )
            },
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => {
              const isHovered = row.id === hoveredRowId
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
                        setSelectedItem(row.original)
                        openRequestForm()
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
                            This action cannot be undone. This will permanently delete the publication request.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-0">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={() => {
                                deleteRequest({
                                id: row.original.id,
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
            
                    <Link
                        href={route('publications.show', row.original.id)}
                        className="h-8 gap-2 text-xs inline-flex items-center justify-center rounded-md px-3 py-1 bg-primary text-white hover:bg-primary/90 transition"
                    >
                        View
                    </Link>
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
        searchQuery: '',
        routeName: route('publications.index'),
        columns
    })

    const selectedStatuses = selectedRows.map(row => row.original.status)
    
    const canAllowSubmit = selectedStatuses.length > 0 && selectedStatuses.every(status => ['Draft', 'Changes Requested'].includes(status))
    const canAllowApprove = selectedStatuses.length > 0 && selectedStatuses.every(status => ['Ready for Approval', 'Submitted'].includes(status))
    const canAllowDisapprove = selectedStatuses.length > 0 && selectedStatuses.every(status => ['Submitted'].includes(status))
    const canAllowDelete = selectedStatuses.length > 0 && selectedStatuses.every(status => ['Draft'].includes(status))
    const canAllowRequestChanges = selectedStatuses.length > 0 && selectedStatuses.every(status => ['Ready for Approval', 'Submitted'].includes(status))

    return (
        <div className="flex flex-col gap-4">
            <PageTitle pageTitle="Request for Publications" description="Monitor request for publications here." breadcrumbItems={breadcrumbItems} />

            <div className="w-full flex items-center gap-1">
                <Button
                    variant=""
                    className="flex items-center rounded-md disabled:opacity-50"
                    size="sm"
                    onClick={() => {
                        setSelectedItem(null)
                        openRequestForm()
                    }}
                >
                    <Plus className="h-6 w-6" />
                    <span className="text-xs">New Publication</span>
                </Button>
                {!showSearch && (
                    <Button
                        variant="ghost"
                        className="flex items-center justify-center hover:bg-muted disabled:opacity-50"
                        size="sm"
                        onClick={() => setShowSearch(true)}
                    >
                        <Search className="h-6 w-6" />
                        <span className="text-xs">Search</span>
                    </Button>
                )}

                {showSearch && (
                    <div className="relative px-2">
                        <Search className="absolute left-4 top-2.5 h-3 w-3 text-muted-foreground" />
                        <Input
                            autoFocus
                            placeholder="Type to search..."
                            type="search"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setPageIndex(0)
                            }}
                            onBlur={() => setShowSearch(false)}
                            className="pl-8 w-full max-w-xs text-sm rounded h-8"
                        />
                    </div>
                )}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex items-center justify-center rounded-md hover:bg-muted disabled:opacity-50"
                            disabled={!canAllowDelete}
                            size="sm"
                        >
                        <Trash2 className="h-8 w-8" />
                        <span className="text-xs">Delete Selected</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the selected publication requests. This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel className="border-0">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={() => {
                                deleteRequests({
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
                {/* <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                        variant="ghost"
                        className="flex items-center justify-center hover:bg-muted disabled:opacity-50"
                        size="sm"
                        disabled={!canAllowSubmit}
                        >
                        <Send className="h-8 w-8" />
                        <span className="text-xs">Submit</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Submit Publications</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will notify the reviewer to review your submission.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel className="border-0">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                            //sendDraftsForApproval({ toast })
                            }}
                        >
                            Confirm
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                        variant="ghost"
                        className="flex items-center justify-center hover:bg-muted disabled:opacity-50"
                        size="sm"
                        disabled={!canAllowRequestChanges}
                        >
                        <Undo2 className="h-8 w-8" />
                        <span className="text-xs">Request Changes</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Request changes for publications</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will notify the sender to revise the submitted publications.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel className="border-0">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                            //sendDraftsForApproval({ toast })
                            }}
                        >
                            Confirm
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex items-center justify-center hover:bg-muted disabled:opacity-50"
                            disabled={!canAllowApprove}
                            size="sm"
                        >
                        <ThumbsUp className="h-8 w-8" />
                        <span className="text-xs">Approve</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Bulk Approval</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently approve the selected publication requests. This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel className="border-0">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                approveRequests({
                                    form,
                                    toast,
                                })
                            }}
                        >
                            Continue
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex items-center justify-center hover:bg-muted disabled:opacity-50"
                            disabled={!canAllowDisapprove}
                            size="sm"
                        >
                        <ThumbsDown className="h-8 w-8" />
                        <span className="text-xs">Disapprove</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Bulk Disapproval</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently disapprove the selected publication requests. This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel className="border-0">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                disapproveRequests({
                                    form,
                                    toast,
                                })
                            }}
                        >
                            Continue
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog> */}
            </div>

            <span className="text-sm font-medium">
                {!data || data.length === 0 ? (
                    <>Showing 0 items</>
                    ) : (
                    <>
                        Showing {(pageIndex * perPage) + 1} - {Math.min((pageIndex + 1) * perPage, total)} of {total} items
                    </>
                )}
            </span>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader className="bg-gray-100">
                    {table.getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                            <TableHead key={header.id} className="px-4 py-2 font-medium text-gray-700">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            </TableHead>
                        ))}
                        </TableRow>
                    ))}
                    </TableHeader>
                    <TableBody className="font-medium">
                        {data?.length > 0 ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow 
                                    key={row.id}
                                    onMouseEnter={() => setHoveredRowId(row.id)}
                                    onMouseLeave={() => setHoveredRowId(null)}
                                    className={cn(
                                        "transition hover:bg-muted/50",
                                        row.getIsSelected() && "bg-muted"
                                    )}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="p-4 text-center">
                                    No data found.
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

            <RequestForm />
        </div>
    )
}

export default Publications

