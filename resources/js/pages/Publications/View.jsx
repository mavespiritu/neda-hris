import { Head } from '@inertiajs/react'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useHasRole } from '@/hooks/useAuth'
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Link } from '@inertiajs/react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table"
import { parse, format, isValid } from 'date-fns'
import { 
    Search, 
    ThumbsUp, 
    Plus, 
    ThumbsDown, 
    Trash2, 
    Pencil, 
    ChevronLeft, 
    Printer, 
    Settings, 
    ChevronDown,
    Eye,
    EyeOff 
} from 'lucide-react'
import { store } from './store'
import RequestForm from './RequestForm'
import VacancyForm from './VacancyForm'
import { cn } from "@/lib/utils"
import { usePage, router } from '@inertiajs/react'
import CsForm from './CsForm'
import { usePrinter } from '@/hooks/usePrinter'
import { useTable } from '@/hooks/useTable'
import { useDebounce } from 'use-debounce'

const View = () => {

    const { toast } = useToast()

    const { 
        publication, 
        vacancies, 
        allVacancies,
        signatoryName, 
        signatoryPosition,
        agencyAddress,
        requirements 
    } = usePage().props

    const { print } = usePrinter()

    console.log(allVacancies)

    const handlePrintCsForm = () => {
        print({
            content: <CsForm 
                publication={publication}
                vacancies={allVacancies.filter(v => v.appointment_status === 'Permanent')}
                signatoryName={signatoryName}
                signatoryPosition={signatoryPosition}
                agencyAddress={agencyAddress}
                requirements={requirements}
            />,
            paperSize: "legal",
            orientation: "landscape"
        })
    }

    const {
        openRequestForm,
        openVacancyForm,
        removeVacancy,
        removeVacancies,
        setSelectedItem,
        deleteRequest,
        toggleVisibility,
    } = store()

    /* const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'RSP', href: '#' },
        { label: 'Request for Publications', href: '/publications' },
        { label: `Publication No. ${publication.reference_no}`, href: `/publications/${publication.id}` },
    ] */

    const {
        data,
        current_page,
        last_page: pageCount,
        total,
        per_page: perPage,
    } = vacancies

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
            cell: ({ row }) => row.index + 1,
        },
        {
            header: "Division",
            accessorKey: "division",
        },
        {
            header: "Appointment Status",
            accessorKey: "appointment_status",
        },
        {
            header: "Position",
            cell: ({ row }) => {
                const { position_description, item_no, appointment_status } = row.original

                return (
                    <div>
                        {position_description}
                        {appointment_status === 'Permanent' && (
                            <>
                                <br />
                                ({item_no})
                            </>
                        )}
                    </div>
                )
            }
        },
        {
            header: "Salary Grade",
            cell: ({ row }) => {
                return row.original.sg
            }
        },
        {
            header: "Monthly Salary",
            cell: ({ row }) => {
                const salary = row.original.monthly_salary
                return parseFloat(salary).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })
            }
        },
        {
            header: "Last Status",
            accessorKey: "actor",
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
            header: "Included by",
            accessorKey: "creator",
            cell: ({ row }) => {
              const creator = row.original.creator
              const createdAt = row.original.date_created
              const date = createdAt ? new Date(createdAt) : null
              const formattedDate = date ? format(date, 'MMMM d, yyyy') : ''
          
              return (
                <div className="flex flex-col">
                  <span className="font-medium">{creator}</span>
                  {formattedDate && (
                    <span className="text-xs italic text-muted-foreground">{formattedDate}</span>
                  )}
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
                    {/* <Link
                        href={route("vacancies.edit", { id: row.original.id })}
                        onClick={() => setSelectedItem(row.original)}
                        className="h-8 w-8 p-0 flex items-center justify-center hover:bg-muted rounded"
                        >
                        <Pencil className="h-4 w-4" />
                    </Link> */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="text-xs">Remove from list</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently remove the vacancy in the publication request.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-0">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={() => {
                                removeVacancy({
                                    id: publication.id, 
                                    vacancy_id: row.original.id,
                                    form, 
                                    toast
                                })
                            }}
                          >
                            Yes, remove it
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    </div>
            
                    <Link
                        href={`/vacancies/${row.original.id}`}
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
        routeName: route('publications.show', publication.id),
        routeParams: { id: publication.id },
        columns
    })

    const dateStr = publication.date_closed
    const timeStr = publication.time_closed

    const date = dateStr ? new Date(dateStr) : null
    const time = timeStr ? parse(timeStr, 'HH:mm:ss', new Date()) : null

    const formattedDate = date ? format(date, 'MMMM d, yyyy') : ''
    const formattedTime = time && isValid(time) ? format(time, 'hh:mm a') : ''
    const closingDate = formattedDate
    const closingTime = formattedTime ? ' ' + formattedTime : ''

    return (
        <div className="flex flex-col gap-2">
            <Head title={`Publication No. ${publication.reference_no}`} />

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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                variant="outline"
                                size="sm"
                                className="flex items-center" 
                            >
                                <span className="sr-only sm:not-sr-only">More Actions</span>
                                <ChevronDown className="h-8 w-8" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>This Publication</DropdownMenuLabel>
                            <DropdownMenuGroup>
                                <DropdownMenuItem 
                                    className="flex justify-between"
                                    onClick={() => {
                                        setSelectedItem(publication)
                                        openRequestForm()
                                    }}
                                >
                                    <span>Edit</span> 
                                    <Pencil className="h-4 w-4" />
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    className="flex justify-between"
                                    onClick={handlePrintCsForm}
                                >
                                    <span>Print</span> 
                                    <Printer className="h-4 w-4" />
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <div
                                            className="flex justify-between items-center px-2 py-1.5 text-sm text-destructive cursor-pointer hover:bg-destructive/10 rounded-sm"
                                            role="menuitem"
                                        >
                                            <span>Delete</span>
                                            <Trash2 className="h-4 w-4" />
                                        </div>
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
                                        onClick={() => {
                                            deleteRequest({
                                            id: publication.id,
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
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <HoverCard>
                <HoverCardTrigger asChild>
                    <Button 
                        variant="link"
                        className="w-fit flex justify-start mb-2 pl-0"
                    >
                        <div className="flex items-center gap-2 text-left">
                            <div>
                                <h1 className="text-lg font-semibold md:text-xl">
                                    {`Publication No. ${publication.reference_no}`}
                                </h1>
                                {/*  */}
                            </div>
                            <ChevronDown className="w-5 h-5" />
                        </div>
                    </Button>
                </HoverCardTrigger>
                <HoverCardContent align="start" className="w-80">
                    <div className="gap-y-4">
                        <h1 className="text-sm font-semibold md:text-lg">
                            {`Publication No. ${publication.reference_no}`}
                        </h1>
                        <span className="text-sm text-muted-foreground">
                            Monitor request for publications here.
                        </span>
                        <hr className="border-t border-muted my-2" />
                        <h3 className="font-medium">Publication info</h3>
                        <div className="flex flex-col gap-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Label className="text-muted-foreground">Reference No.</Label>
                                <span className="text-sm font-medium">{publication.reference_no}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Label className="text-muted-foreground">Posting Date</Label>
                                <span className="text-sm font-medium">{format(publication.date_published, 'MMMM d, yyyy')}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Label className="text-muted-foreground">Closing Date</Label>
                                <span className="text-sm font-medium flex flex-col">
                                    <span>{closingDate}</span>
                                    <span>{closingTime}</span>
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Label className="text-muted-foreground">Status</Label>
                                <span className="text-sm font-medium">
                                    {publication.is_public ? (
                                        <div className="flex items-center gap-1">
                                            <div className="h-3 w-3 bg-green-500 rounded-full" />
                                            <span className="text-xs text-green-700">Published</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1">
                                            <div className="h-3 w-3 bg-red-500 rounded-full" />
                                            <span className="text-xs text-red-500">Unpublished</span>
                                        </div>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                </HoverCardContent>
            </HoverCard>

            <div className="w-full flex items-center gap-1 mb-2">
                <Button
                    variant=""
                    className="flex items-center rounded-md disabled:opacity-50"
                    size="sm"
                    onClick={openVacancyForm}
                >
                    <Plus className="h-6 w-6" />
                    <span className="text-xs">Include Vacancy</span>
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
                            disabled={selectedRows.length === 0}
                            size="sm"
                        >
                        <Trash2 className="h-8 w-8" />
                        <span className="text-xs">Remove Selected</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Removal of Vacancies</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the selected vacancies on the publication. This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel className="border-0">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                removeVacancies({
                                    id: publication.id,
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

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleVisibility({id:publication.id, toast})}
                            >
                                {publication.is_public ? (
                                    <>
                                        <EyeOff className="h-4 w-4 mr-1" />
                                        <span className="text-xs">Hide from Public</span>
                                    </>
                                ) : (
                                    <>
                                        <Eye className="h-4 w-4 mr-1" />
                                        <span className="text-xs">Show to Public</span>
                                    </>
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {publication.is_public ? 'Currently visible to the public' : 'Currently hidden from the public'}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
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

            <VacancyForm id={publication.id} />
            <RequestForm />
        </div>
    )
}

export default View

