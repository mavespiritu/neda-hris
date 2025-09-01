import React, { useState, useCallback, useMemo, useRef } from "react"
import { flexRender } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useTable } from "@/hooks/useTable"
import PaginationControls from "@/components/PaginationControls"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuGroup,DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Plus, Search, Filter as FilterIcon, Pencil, Trash2, Wrench, ChevronsUpDown, ChevronUp, ChevronDown, ArrowUp, ArrowDown, CircleX, Printer } from "lucide-react"
import { useDebounce } from "use-debounce"
import { router } from "@inertiajs/react"
import { useToast } from "@/hooks/use-toast"

export default function useCrudTable({
  columns,
  routeName,
  initialData,
  options = {},
  endpoints = {},
  filters = {},
  responseType = "inertia",
  onJsonResponse = null,
}) {
  const { toast } = useToast()
  const { enableAdd, enableEdit, enableDelete, enableView, enableViewAsLink, enableSearching, enableFiltering, enableBulkDelete, enableRowSelection, enableGenerateReport, canModify } = options
  const { data, current_page: currentPage, last_page: pageCount, per_page: perPage } = initialData
  const { editEndpoint, deleteEndpoint, generateReportEndpoint, bulkDeleteEndpoint } = endpoints

  const [hoveredRowId, setHoveredRowId] = useState(null)
  const [formMode, setFormMode] = useState("add")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [rowSelection, setRowSelection] = useState({})
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [viewItem, setViewItem] = useState(null)
  const [deleteMode, setDeleteMode] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const handleAdd = useCallback(() => {
    setFormMode("add")
    setSelectedItem(null)
    setIsFormOpen(true)
  }, [])

  const handleEdit = useCallback((row) => {
    setFormMode("edit")
    setSelectedItem(row)
    setIsFormOpen(true)
  }, [])

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false)
    setSelectedItem(null)
  }, [])

  const handleOpenFilter = useCallback(() => {
    setIsFilterOpen(true)
  }, [])

  const handleCloseFilter = useCallback(() => {
    setIsFilterOpen(false)
  }, [])

  const handleView = useCallback((row) => {
    setViewItem(row)
    setIsViewOpen(true)
  }, [])

  const handleCloseView = useCallback(() => {
    setViewItem(null)
    setIsViewOpen(false)
  }, [])

  const finalColumns = useMemo(() => {
    const selectionColumn = enableRowSelection
      ? [
          {
            id: "select",
            header: ({ table }) => (
              <Checkbox
                checked={table.getIsAllRowsSelected()}
                onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
                className="peer border-neutral-400 dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              />
            ),
            cell: ({ row }) => {

              if(!(enableEdit && (!row.original.isLocked || canModify))){
                return null
              }

              return (
                <Checkbox
                  checked={row.getIsSelected()}
                  onCheckedChange={(v) => row.toggleSelected(!!v)}
                  className="peer border-neutral-400 dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                />
              )
            },
            meta: { className: "w-[10px]" },
          },
        ]
      : []

    const rowNumberColumn = [
      {
        id: "rowNumber",
        header: "#",
        cell: ({ row }) => row.index + 1 + (currentPage - 1) * perPage,
        meta: { className: "w-[10px]" },
      },
    ]

    const actionsColumn = [
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const isHovered = row.id === hoveredRowId
          return (
            <div className="flex gap-1 justify-end items-center w-full">
              <div className={`flex transition-opacity duration-150 ${isHovered ? "opacity-100" : "opacity-0"}`}>
                {enableGenerateReport && (
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 p-0">
                    <Printer className="h-4 w-4" />
                  </Button>
                )}
                {enableEdit && (
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={() => handleEdit(row.original)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {enableDelete && (
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 p-0">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          )
        },
      },
    ]

    return [...selectionColumn, ...rowNumberColumn, ...columns, ...actionsColumn]
  }, [columns, enableRowSelection, currentPage, perPage, hoveredRowId, handleEdit])

  const { table, form, search, setSearch, pageIndex, setPageIndex, selectedRows } = useTable({
    data,
    pageSize: perPage || 20,
    currentPage,
    routeName,
    columns: finalColumns,
    extraQuery: filters,
    responseType,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    enableRowSelection,
    onJsonResponse: (response) => {
      onJsonResponse?.((old) => ({ ...old, data: response, isLoading: false, error: null }))
    },
  })

  const [debouncedSearch] = useDebounce(search, 500)

  const handleDelete = useCallback(
    (id) => {
      router.delete(deleteEndpoint(id), {
        preserveScroll: true,
        onSuccess: () => {
          toast({ title: "Deleted!", description: "Item was successfully deleted." })
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to delete item.", variant: "destructive" })
        },
      })
    },
    [deleteEndpoint, toast]
  )

  const handleBulkDelete = useCallback(() => {
    if (!selectedRows || selectedRows.length === 0) return

    const ids = selectedRows.map((row) => row.original.id)

    router.post(bulkDeleteEndpoint, {
      ids,
      preserveScroll: true,
      onSuccess: () => {
        toast({
          title: "Success!",
          description: "The items were deleted successfully.",
        })
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to delete the items.",
          variant: "destructive",
        })
      },
    })
  }, [bulkDeleteEndpoint, selectedRows, toast])

  const Row = useMemo(
    () =>
      React.memo(function Row({ row, isSelected }) {
        return (
          <TableRow className={cn("group transition hover:bg-muted/50", isSelected && "bg-muted")}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {cell.column.id === "actions" ? (
                  <div className="flex gap-1 justify-end items-center w-full opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    {enableGenerateReport && generateReportEndpoint && (!row.original.isLocked || canModify) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0"
                        onClick={() => window.location.href = generateReportEndpoint(row.original.id)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    )}

                    {(enableEdit && (!row.original.isLocked || canModify)) && (
                      editEndpoint
                      ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0"
                          onClick={() => router.visit(editEndpoint(row.original.id))}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(row.original)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )
                    )}
                    
                    {(enableDelete && (!row.original.isLocked || canModify)) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setDeleteTarget(row.original.id)
                          setDeleteMode("single")
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}

                    {enableView && (
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 gap-2 text-xs inline-flex items-center justify-center rounded-md px-3 py-1 bg-primary text-white hover:bg-primary/90 transition"
                        onClick={() => handleView(row.original)}
                      >
                        View
                      </Button>
                    )}

                    {enableViewAsLink && (
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 gap-2 text-xs inline-flex items-center justify-center rounded-md px-3 py-1 bg-primary text-white hover:bg-primary/90 transition"
                        onClick={() => router.visit(`/your-route/${row.original.id}`)}
                      >
                        View
                      </Button>
                    )}
                  </div>
                ) : (
                  flexRender(cell.column.columnDef.cell, cell.getContext())
                )}
              </TableCell>
            ))}
          </TableRow>
        )
      }),
    [handleEdit]
  )

  const view = useRef({})
  view.current = {
    enableAdd,
    enableBulkDelete,
    enableFiltering,
    enableSearching,
    form,
    handleAdd,
    handleBulkDelete,
    pageCount,
    pageIndex,
    search,
    selectedRowsLength: selectedRows.length,
    setPageIndex,
    setSearch,
    table,
    finalColumns,
    Row,
    deleteMode,
    setDeleteMode,
    deleteTarget,
    setDeleteTarget,
  }

  const TableView = useMemo(() => {
    return function TableView() {
      const {
        enableAdd,
        enableBulkDelete,
        enableFiltering,
        enableSearching,
        form,
        handleAdd,
        handleBulkDelete,
        pageCount,
        pageIndex,
        search,
        selectedRowsLength,
        setPageIndex,
        setSearch,
        table,
        finalColumns,
        Row,
        deleteMode,
        setDeleteMode,
        deleteTarget,
        setDeleteTarget,
        internalFilters,
        setInternalFilters
      } = view.current

      return (
        <div className="grid grid-rows-[auto,1fr,auto] h-screen flex-1 overflow-hidden gap-4">
          <div className="flex justify-between gap-4">
            <div className="flex-1 gap-2 p-1">
              {enableSearching && (
                <Input
                  type="search"
                  placeholder="Type to search..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPageIndex(0)
                  }}
                  className="w-full max-w-md text-sm rounded-md" 
                />
              )}
            </div>

            <div className="flex gap-2 p-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Wrench className="h-4 w-4" />
                    <span className="hidden md:block">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                  <DropdownMenuGroup>
                  {enableBulkDelete && (
                    <DropdownMenuItem
                      disabled={selectedRowsLength === 0 || form.processing}
                      onSelect={(e) => {
                        e.preventDefault()
                        setDeleteMode("bulk")
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                  </DropdownMenuGroup>
                  
                </DropdownMenuContent>
              </DropdownMenu>
              {enableFiltering && (
                <Button type="button" variant="outline" onClick={handleOpenFilter}>
                  <FilterIcon className="h-4 w-4" />
                  <span className="hidden md:block">Filters</span>
                </Button>
              )}
              
              {enableAdd && (
                <Button type="button" onClick={handleAdd}>
                  <Plus className="h-4 w-4" />
                  <span className="hidden md:block">Add New</span>
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="h-full w-full border rounded-lg">
            <div className="h-12">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className={cn(
                            "sticky top-0 text-black select-none bg-secondary",
                            header.column.columnDef.meta?.className
                          )}
                        >
                          {header.column.columnDef.meta?.enableSorting === true ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <div className="flex gap-2 w-fit items-center cursor-pointer rounded px-2 py-1 hover:bg-gray-100">
                                  {header.isPlaceholder
                                    ? null
                                    : flexRender(header.column.columnDef.header, header.getContext())}

                                  {{
                                    asc: <ChevronUp className="h-4 w-4" />,
                                    desc: <ChevronDown className="h-4 w-4" />,
                                  }[header.column.getIsSorted()] ?? (
                                    <ChevronsUpDown className="h-4 w-4 text-gray-500" />
                                  )}
                                </div>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => header.column.toggleSorting(false)}>
                                  <div className="flex items-center gap-2">
                                    <ArrowUp className="h-4 w-4" /> Asc
                                  </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => header.column.toggleSorting(true)}>
                                  <div className="flex items-center gap-2">
                                    <ArrowDown className="h-4 w-4" /> Desc
                                  </div>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => header.column.clearSorting()}>
                                  <div className="flex items-center gap-2">
                                    <CircleX className="h-4 w-4" /> Clear
                                  </div>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            // if sorting not enabled, just render plain label
                            <div>
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())}
                            </div>
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>

                <TableBody>
                  {table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <Row key={row.original.id ?? row.id} row={row} isSelected={row.getIsSelected()} />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={finalColumns.length} className="p-4 text-center">
                        No data found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>

          <AlertDialog open={!!deleteMode} onOpenChange={() => setDeleteMode(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {deleteMode === "bulk" ? "Confirm Bulk Deletion" : "Are you sure?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {deleteMode === "bulk"
                    ? "This will permanently delete the selected items. This action cannot be undone."
                    : "This action cannot be undone. This will permanently delete the item."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-0">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={() => {
                    if (deleteMode === "single" && deleteTarget) {
                      handleDelete({ id: deleteTarget })
                    } else if (deleteMode === "bulk") {
                      handleBulkDelete()
                    }
                    setDeleteMode(null)
                    setDeleteTarget(null)
                  }}
                >
                  Yes, delete {deleteMode === "bulk" ? "items" : "it"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <PaginationControls
            pageIndex={pageIndex}
            pageCount={pageCount}
            setPageIndex={setPageIndex}
            selectedRowsLength={selectedRowsLength}
          />
        </div>
      )
    }
  }, [])

  return {
    TableView,
    isFormOpen,
    isFilterOpen,
    isViewOpen,
    formMode,
    selectedItem,
    handleCloseForm,
    handleCloseFilter,
    handleCloseView,
  }
}
