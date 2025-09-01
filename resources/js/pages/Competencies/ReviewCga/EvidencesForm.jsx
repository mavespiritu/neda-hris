import { useState, useEffect, useMemo } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogClose
  } from "@/components/ui/dialog"
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
import { store } from './store'
import { useTable } from '@/hooks/useTable'
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import EvidenceDescription from "../MyCga/EvidenceDescription"
import AttachmentList from "../MyCga/AttachmentList"
import PaginationControls from "@/components/PaginationControls"
import { parse, format, isValid } from 'date-fns'
import { flexRender } from "@tanstack/react-table"
import { cn } from "@/lib/utils"


const evidenceTypes = [
  "Training", 
  "Award", 
  "Performance", 
  "Others"
];


const EvidencesForm = ({ indicator, open, onClose, onSuccess }) => {

    if (!indicator) return null

    const {
      selectedSubmittedIndicatorData,
      setSelectedSubmittedIndicatorData,
      fetchSelectedSubmittedIndicator
    } = store()

    const {
        data,
        current_page,
        last_page: pageCount,
        total,
        per_page: perPage,
    } = selectedSubmittedIndicatorData?.data || {}

    const currentPageSafe = current_page ?? 1
    const perPageSafe = perPage ?? 20

    const [hoveredRowId, setHoveredRowId] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedEvidenceTypes, setSelectedEvidenceTypes] = useState([])

    const filters = useMemo(() => ({
        emp_id: indicator?.emp_id ?? null,
        position_id: indicator?.position_id ?? null,
        indicator_id: indicator?.indicator_id ?? null
    }), [indicator])

    const extraQuery = useMemo(() => ({
        filters,
        selectedEvidenceTypes
    }), [filters, selectedEvidenceTypes])

    const columns = useMemo(() => [
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
        routeName: route('cga.indicator-evidences', indicator?.id),
        columns,
        extraQuery,
        responseType: 'json',
        onJsonResponse: (response) => {
            setSelectedSubmittedIndicatorData((old) => ({
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
        if (indicator?.id) {
            fetchSelectedSubmittedIndicator({
                id: indicator.id,
                filters
            })
           
        }
    }, [indicator.id])

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="grid grid-rows-[auto,1fr,auto] gap-4 h-[800px] max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>Evidences</DialogTitle>
            <DialogDescription>
              Browse here the listed evidences of the selected indicator.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 min-h-0">
            <div className="flex flex-col gap-1 text-xs">
              <span className="text-muted-foreground w-[40%]">Indicator (Level {indicator?.proficiency}):</span>
              <span>{indicator?.indicator}</span>
            </div>

            <div className="flex-1 min-h-0 overflow-x-hidden">
              <ScrollArea className="h-full w-full border rounded-lg">
                <Table>
                  <TableHeader className="text-xs">
                    {table.getHeaderGroups().map(headerGroup => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <TableHead
                            key={header.id}
                            className={cn("sticky top-0 text-black bg-secondary", header.column.columnDef.meta?.className)}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
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
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
              </ScrollArea>
            </div>
          </div>

          <PaginationControls
            pageIndex={pageIndex}
            pageCount={pageCount}
            setPageIndex={setPageIndex}
            selectedRowsLength={selectedRows.length}
          />
        </DialogContent>
      </Dialog>
    )
}

export default EvidencesForm