import { useState, useEffect, useMemo } from 'react'
import TextArea from "@/components/TextArea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Link } from '@inertiajs/react'
import SingleComboBox from "@/components/SingleComboBox"
import PaginationControls from "@/components/PaginationControls"
import { flexRender } from "@tanstack/react-table"
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
    Search, 
    ThumbsUp, 
    Plus, 
    ThumbsDown, 
    Trash2, 
    Pencil, 
    Send, 
    Undo2,
} from 'lucide-react'
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
import { cn } from "@/lib/utils"
import { useTable } from '@/hooks/useTable'
import { usePage } from '@inertiajs/react'
import { parse, format, isValid } from 'date-fns'

const Questions = ({onEdit, onDelete}) => {

  const { vacancy, competencies, questions } = usePage().props
  
  const [hoveredRowId, setHoveredRowId] = useState(null)
  const [competencySelected, setCompetencySelected] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const elements = ['Scope/Context', 'Complexity', 'Autonomy and Responsibility']

  const {
        data,
        current_page,
        last_page: pageCount,
        total,
        per_page: perPage,
    } = questions

  const columns = useMemo(() => [
        {
            header: "#",
            cell: ({ row }) => row.index + 1,
            meta: { width: 'w-[50px]' },
        },
        {
            header: "Competencies",
            accessorKey: "competencies",
            meta: { width: 'w-[150px]' },
        },
        {
            header: "Question",
            accessorKey: "question",
            cell: ({ getValue }) => (
                <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: getValue() }}
                />
            ),
            meta: { width: 'w-[300px]' },
        },
        ...elements.map(el => ({
        header: el,
        accessorKey: `ratings_${el}`,
        meta: { width: 'w-[300px]' },
        cell: ({ row }) => {
          const ratings = row.original.ratings?.filter(r => r.element === el) || []
          return (
            <div className="text-sm space-y-1">
              {ratings.map(rating => (
                <div key={rating.score} className="border rounded px-2 py-1">
                  <div className="font-semibold">{rating.title}</div>
                  <div className="italic text-muted-foreground text-xs">
                    <span>Score: {rating.score}</span>
                  </div>
                  <div className="text-xs">{rating.description}</div>
                </div>
              ))}
            </div>
          )
        },
      })),
      {
          header: "Created by",
          accessorKey: "creator",
          meta: { width: 'w-[180px]' },
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 p-0"
                      onClick={() => onEdit(row.original)}
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
                            This action cannot be undone. This will permanently delete the question.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-0">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={() => onDelete({ id: row.original.id })}
                          >
                            Yes, delete it
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
      pageSize: 20,
      currentPage: current_page,
      searchQuery: searchQuery,
      routeName: route('vacancies.show', vacancy.id),
      columns,
      extraQuery: {
        competency: competencySelected 
      },
  })

  useEffect(() => {
      setPageIndex(0)
  }, [competencySelected])

  const handleCompetencyChange = (id) => {
      setCompetencySelected(id)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between">
        <div className="w-1/2">
            <SingleComboBox 
                items={competencies}
                onChange={handleCompetencyChange}
                placeholder="Filter by competency"
                name="competency"
                id="competency"
                value={competencySelected}
                width="w-fit"
                className="w-full"
            />
        </div>
        <div className="relative pl-2">
            <Search className="absolute left-4 top-3 h-4 w-4 text-muted-foreground" />
            <Input
                autoFocus
                placeholder="Type to search..."
                type="search"
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value)
                    setSearchQuery(e.target.value)
                    setPageIndex(0)
                }}
                className="pl-8 w-full max-w-xs text-sm rounded"
            />
        </div>
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
                                <TableCell 
                                  key={cell.id}
                                  className={cn(
                                    "align-top",
                                    cell.column.columnDef.meta?.width
                                  )}
                                >
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
    </div>
  )
}

export default Questions