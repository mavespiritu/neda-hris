import React, { useState, useCallback, useMemo, useRef } from "react"
import {
  Table,
  TableBody,
  TableCell,
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
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  Pencil,
  Trash2,
  Wrench,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  CircleX,
  Printer,
  MoreHorizontal,
  Filter as FilterIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTable } from "@/hooks/useTable"
import PaginationControls from "@/components/PaginationControls"
import { useDebounce } from "use-debounce"
import { router } from "@inertiajs/react"
import { useToast } from "@/hooks/use-toast"
import { flexRender } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"

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

  const {
    enableAdd,
    enableEdit,
    enableDelete,
    enableView,
    enableViewAsLink,
    enableSearching,
    enableFiltering,
    enableBulkDelete,
    enableRowSelection,
    enableGenerateReport,
    canModify,
  } = options

  const {
    data,
    current_page: currentPage,
    last_page: pageCount,
    per_page: perPage,
  } = initialData

  const {
    viewEndpoint,
    addEndpoint,
    editEndpoint,
    deleteEndpoint,
    generateReportEndpoint,
    bulkDeleteEndpoint,
  } = endpoints

  const [formMode, setFormMode] = useState("add")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  const [rowSelection, setRowSelection] = useState({})
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [viewItem, setViewItem] = useState(null)

  const [deleteMode, setDeleteMode] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const resolveAbility = useCallback((ability, row) => {
    if (typeof ability === "function") return !!ability(row)
    return !!ability
  }, [])

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

  const handleOpenFilter = useCallback(() => setIsFilterOpen(true), [])
  const handleCloseFilter = useCallback(() => setIsFilterOpen(false), [])

  const handleView = useCallback((row) => {
    setViewItem(row)
    setIsViewOpen(true)
  }, [])

  const handleCloseView = useCallback(() => {
    setViewItem(null)
    setIsViewOpen(false)
  }, [])

  const getMobileLabel = useCallback((column) => {
    const metaLabel = column.columnDef?.meta?.mobileLabel
    if (typeof metaLabel === "string" && metaLabel.trim()) return metaLabel

    const hdr = column.columnDef?.header
    if (typeof hdr === "string" && hdr.trim()) return hdr

    return column.id
  }, [])

  const finalColumns = useMemo(() => {
    const selectionColumn = enableRowSelection
      ? [
          {
            id: "select",
            header: ({ table }) => (
              <Checkbox
                checked={(() => {
                  const selectableRows = table.getRowModel().rows.filter((row) => {
                    return (
                      resolveAbility(enableRowSelection, row) &&
                      (!row.original.isLocked || canModify) &&
                      resolveAbility(enableDelete, row)
                    )
                  })
                  if (selectableRows.length === 0) return false
                  return selectableRows.every((row) => row.getIsSelected())
                })()}
                onCheckedChange={(v) => {
                  const checked = !!v
                  table.getRowModel().rows.forEach((row) => {
                    const canSelect =
                      resolveAbility(enableRowSelection, row) &&
                      (!row.original.isLocked || canModify) &&
                      resolveAbility(enableDelete, row)
                    if (canSelect) row.toggleSelected(checked)
                  })
                }}
                className="size-4 rounded-[4px] border"
              />
            ),
            cell: ({ row }) => {
              const canSelect =
                resolveAbility(enableRowSelection, row) &&
                (!row.original.isLocked || canModify) &&
                resolveAbility(enableDelete, row)

              if (!canSelect) return null

              return (
                <Checkbox
                  checked={row.getIsSelected()}
                  onCheckedChange={(v) => row.toggleSelected(!!v)}
                  className="size-4 rounded-[4px] border"
                />
              )
            },
            meta: { className: "w-[10px]", mobileLabel: "" },
          },
        ]
      : []

    const rowNumberColumn = [
      {
        id: "rowNumber",
        header: "#",
        cell: ({ row }) => row.index + 1 + (currentPage - 1) * perPage,
        meta: { className: "w-[10px]", mobileLabel: "" },
      },
    ]

    const actionsColumn = [
      {
        id: "actions",
        header: "",
        cell: () => null,
        meta: { className: "w-[10px]", mobileLabel: "" },
      },
    ]

    return [...selectionColumn, ...rowNumberColumn, ...columns, ...actionsColumn]
  }, [columns, enableRowSelection, enableDelete, currentPage, perPage, canModify, resolveAbility])

  const {
    table,
    form,
    search,
    setSearch,
    pageIndex,
    setPageIndex,
    selectedRows,
    reloadTable,
  } = useTable({
    data,
    pageSize: perPage || 20,
    currentPage,
    routeName,
    columns: finalColumns,
    extraQuery: filters,
    responseType,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    enableRowSelection: !!enableRowSelection,
    onJsonResponse,
  })

  useDebounce(search, 500)

  const handleDelete = useCallback(
    (id) => {
      router.delete(deleteEndpoint(id), {
        preserveScroll: true,
        onSuccess: () => {
          toast({ title: "Deleted!", description: "Item was successfully deleted." })
          reloadTable()
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to delete item.", variant: "destructive" })
        },
      })
    },
    [deleteEndpoint, toast, reloadTable]
  )

  const handleBulkDelete = useCallback(() => {
    if (!selectedRows?.length) return
    const ids = selectedRows.map((r) => r.original.id)

    router.post(
      bulkDeleteEndpoint,
      { ids },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast({ title: "Success!", description: "The items were deleted successfully." })
          reloadTable()
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to delete the items.", variant: "destructive" })
        },
      }
    )
  }, [bulkDeleteEndpoint, selectedRows, toast, reloadTable])

  const Row = useMemo(
    () =>
      React.memo(function Row({ row, isSelected }) {
        const canRowEdit = resolveAbility(enableEdit, row) && (!row.original.isLocked || canModify)
        const canRowDelete = resolveAbility(enableDelete, row) && (!row.original.isLocked || canModify)
        const canRowView = resolveAbility(enableView, row)
        const canRowViewAsLink = resolveAbility(enableViewAsLink, row)
        const canRowGenerateReport =
          resolveAbility(enableGenerateReport, row) &&
          !!generateReportEndpoint &&
          (!row.original.isLocked || canModify)

        return (
          <TableRow
            className={cn(
              "group transition",
              row.index % 2 === 1 ? "bg-muted/70" : "bg-background",
              isSelected ? "bg-primary/15 hover:bg-primary/20" : "hover:bg-muted/90",
              "block border-b p-2 sm:table-row sm:border-0 sm:p-0"
            )}
          >
            {row.getVisibleCells().map((cell) => {
              const colId = cell.column.id
              const isNoLabel = colId === "select" || colId === "rowNumber" || colId === "actions"
              const label = getMobileLabel(cell.column)

              return (
                <TableCell
                  key={cell.id}
                  data-label={label}
                  className={cn(
                    "font-medium leading-tight",
                    colId === "actions"
                      ? "text-[12px]"
                      : "text-[12px] [&_*]:!text-[12px] [&_*]:!leading-tight",
                    "block sm:table-cell",
                    "py-1 sm:py-1.5",
                    !isNoLabel &&
                      "before:content-[attr(data-label)] before:block sm:before:hidden before:text-[9px] before:uppercase before:tracking-wide before:text-muted-foreground before:mb-0.5",
                    isNoLabel && "before:content-none"
                  )}
                >
                  {colId === "actions" ? (
                    <div className="flex justify-end w-full">
                      <div className="sm:hidden">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            {canRowGenerateReport && (
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault()
                                  window.open(generateReportEndpoint(row.original.id), "_blank", "noopener,noreferrer")
                                }}
                              >
                                <Printer className="mr-2 h-4 w-4" /> Print
                              </DropdownMenuItem>
                            )}
                            {canRowEdit && (
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault()
                                  if (editEndpoint) router.visit(editEndpoint(row.original.id))
                                  else handleEdit(row.original)
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                            )}
                            {canRowDelete && (
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onSelect={(e) => {
                                  e.preventDefault()
                                  setDeleteTarget(row.original.id)
                                  setDeleteMode("single")
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            )}
                            {(canRowView || canRowViewAsLink) && <DropdownMenuSeparator />}
                            {canRowView && (
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault()
                                  handleView(row.original)
                                }}
                              >
                                View
                              </DropdownMenuItem>
                            )}
                            {canRowViewAsLink && (
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault()
                                  const endpoint =
                                    typeof viewEndpoint === "function" ? viewEndpoint(row.original.id) : viewEndpoint
                                  router.visit(endpoint)
                                }}
                              >
                                View
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="hidden sm:flex gap-1">
                        {canRowGenerateReport && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 p-0"
                            onClick={() => window.open(generateReportEndpoint(row.original.id), "_blank", "noopener,noreferrer")}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        )}
                        {canRowEdit &&
                          (editEndpoint ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 p-0"
                              onClick={() => router.visit(editEndpoint(row.original.id))}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 p-0"
                              onClick={() => handleEdit(row.original)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          ))}
                        {canRowDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              setDeleteTarget(row.original.id)
                              setDeleteMode("single")
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                        {canRowView && (
                          <Button type="button" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleView(row.original)}>
                            View
                          </Button>
                        )}
                        {canRowViewAsLink && (
                          <Button
                            type="button"
                            size="sm"
                            className="h-7 text-[11px] px-2"
                            onClick={() => {
                              const endpoint =
                                typeof viewEndpoint === "function" ? viewEndpoint(row.original.id) : viewEndpoint
                              router.visit(endpoint)
                            }}
                          >
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    flexRender(cell.column.columnDef.cell, cell.getContext())
                  )}
                </TableCell>
              )
            })}
          </TableRow>
        )
      }),
    [
      canModify,
      editEndpoint,
      enableDelete,
      enableEdit,
      enableGenerateReport,
      enableView,
      enableViewAsLink,
      generateReportEndpoint,
      getMobileLabel,
      handleEdit,
      handleView,
      resolveAbility,
      viewEndpoint,
    ]
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
      } = view.current

      return (
        <div className="grid grid-rows-[auto,1fr,auto] min-h-[calc(100vh-250px)] max-h-screen flex-1 overflow-hidden gap-2">
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
                  className="w-full max-w-md text-sm rounded-md h-8"
                />
              )}
            </div>

            <div className="flex gap-2 p-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-8">
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
                <Button type="button" variant="outline" onClick={handleOpenFilter} className="h-8">
                  <FilterIcon className="h-4 w-4" />
                  <span className="hidden md:block">Filters</span>
                </Button>
              )}

              {enableAdd &&
                (addEndpoint ? (
                  <Button type="button" onClick={() => router.visit(addEndpoint)} className="h-8">
                    <Plus className="h-4 w-4" />
                    <span className="hidden md:block">Add New</span>
                  </Button>
                ) : (
                  <Button type="button" onClick={handleAdd} className="h-8">
                    <Plus className="h-4 w-4" />
                    <span className="hidden md:block">Add New</span>
                  </Button>
                ))}
            </div>
          </div>

          <div className="h-full w-full border rounded-lg overflow-auto">
            <Table className="w-full">
              <TableHeader className="hidden sm:table-header-group">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={cn(
                          "sticky top-0 z-20 bg-secondary text-black select-none uppercase font-semibold text-[11px] py-1",
                          header.column.columnDef.meta?.className
                        )}
                      >
                        {header.column.columnDef.meta?.enableSorting === true ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <div className="flex gap-1.5 w-fit items-center cursor-pointer rounded px-1.5 py-0.5 hover:bg-gray-100">
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(header.column.columnDef.header, header.getContext())}
                                {(
                                  {
                                    asc: <ChevronUp className="h-4 w-4" />,
                                    desc: <ChevronDown className="h-4 w-4" />,
                                  }[header.column.getIsSorted()]
                                ) ?? <ChevronsUpDown className="h-4 w-4 text-gray-500" />}
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
                  <TableRow className="block sm:table-row">
                    <TableCell colSpan={finalColumns.length} className="p-3 text-center block sm:table-cell text-[12px]">
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
            selectedRowsLength={selectedRowsLength}
          />

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
                    if (deleteMode === "single" && deleteTarget) handleDelete(deleteTarget)
                    else if (deleteMode === "bulk") handleBulkDelete()
                    setDeleteMode(null)
                    setDeleteTarget(null)
                  }}
                >
                  Yes, delete {deleteMode === "bulk" ? "items" : "it"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
    reloadTable,
  }
}
