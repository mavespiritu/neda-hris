import React, { useCallback, useMemo, useRef, useState } from "react"
import { router } from "@inertiajs/react"
import { AgGridReact } from "ag-grid-react"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  Pencil,
  Trash2,
  Wrench,
  Filter as FilterIcon,
  Printer,
  MoreHorizontal,
} from "lucide-react"

export default function useCrudTableAgGrid({
  columns = [],
  routeName,
  initialData,
  options = {},
  endpoints = {},
}) {
  const { toast } = useToast()
  const gridRef = useRef(null)

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
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [viewItem, setViewItem] = useState(null)

  const [quickFilter, setQuickFilter] = useState("")
  const [selectedRowsLength, setSelectedRowsLength] = useState(0)

  const [deleteMode, setDeleteMode] = useState(null) // single | bulk | null
  const [deleteTarget, setDeleteTarget] = useState(null)

  const rowData = initialData?.data ?? []
  const pageSize = Number(initialData?.per_page || 10)

  const resolveAbility = useCallback((ability, row) => {
    if (typeof ability === "function") return !!ability({ original: row })
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

  const handleView = useCallback((row) => {
    setViewItem(row)
    setIsViewOpen(true)
  }, [])

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false)
    setSelectedItem(null)
  }, [])

  const handleCloseFilter = useCallback(() => setIsFilterOpen(false), [])
  const handleCloseView = useCallback(() => {
    setIsViewOpen(false)
    setViewItem(null)
  }, [])

  const reloadTable = useCallback(() => {
    router.reload({ preserveScroll: true, preserveState: true })
  }, [])

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
    [deleteEndpoint, reloadTable, toast]
  )

  const handleBulkDelete = useCallback(() => {
    const rows = gridRef.current?.api?.getSelectedRows?.() ?? []
    if (!rows.length) return
    const ids = rows.map((r) => r.id)

    router.post(
      bulkDeleteEndpoint,
      { ids },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast({ title: "Success!", description: "Items deleted successfully." })
          reloadTable()
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to delete items.", variant: "destructive" })
        },
      }
    )
  }, [bulkDeleteEndpoint, reloadTable, toast])

  const ActionCell = useCallback(
    (params) => {
      const row = params.data
      const canRowEdit = resolveAbility(enableEdit, row) && (!row.isLocked || canModify)
      const canRowDelete = resolveAbility(enableDelete, row) && (!row.isLocked || canModify)
      const canRowView = resolveAbility(enableView, row)
      const canRowViewAsLink = resolveAbility(enableViewAsLink, row)
      const canRowGenerate = resolveAbility(enableGenerateReport, row) && !!generateReportEndpoint

      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {canRowGenerate && (
                <DropdownMenuItem onClick={() => window.open(generateReportEndpoint(row.id), "_blank")}>
                  <Printer className="mr-2 h-4 w-4" /> Print
                </DropdownMenuItem>
              )}
              {canRowEdit && (
                <DropdownMenuItem
                  onClick={() => (editEndpoint ? router.visit(editEndpoint(row.id)) : handleEdit(row))}
                >
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
              )}
              {canRowDelete && (
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => {
                    setDeleteTarget(row.id)
                    setDeleteMode("single")
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              )}
              {canRowView && <DropdownMenuItem onClick={() => handleView(row)}>View</DropdownMenuItem>}
              {canRowViewAsLink && (
                <DropdownMenuItem
                  onClick={() => {
                    const endpoint = typeof viewEndpoint === "function" ? viewEndpoint(row.id) : viewEndpoint
                    router.visit(endpoint)
                  }}
                >
                  View
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
    [
      canModify,
      editEndpoint,
      enableDelete,
      enableEdit,
      enableGenerateReport,
      enableView,
      enableViewAsLink,
      generateReportEndpoint,
      handleEdit,
      handleView,
      resolveAbility,
      viewEndpoint,
    ]
  )

  const agColumns = useMemo(() => {
    const mapped = columns.map((c) => ({
      headerName: typeof c.header === "string" ? c.header : c.accessorKey,
      field: c.accessorKey,
      sortable: !!c?.meta?.enableSorting,
      flex: 1,
      minWidth: 120,
      cellRenderer: c.cell
        ? (params) => c.cell({ row: { original: params.data } })
        : undefined,
    }))

    return [
      ...(enableRowSelection
        ? [
            {
              headerCheckboxSelection: true,
              checkboxSelection: true,
              width: 50,
              pinned: "left",
            },
          ]
        : []),
      {
        headerName: "#",
        width: 70,
        pinned: "left",
        valueGetter: (p) => p.node.rowIndex + 1,
      },
      ...mapped,
      {
        headerName: "",
        field: "__actions",
        width: 90,
        pinned: "right",
        cellRenderer: ActionCell,
      },
    ]
  }, [columns, enableRowSelection, ActionCell])

  const TableView = useMemo(
    () =>
      function TableView() {
        return (
          <div className="grid grid-rows-[auto,1fr] min-h-[calc(100vh-250px)] max-h-screen flex-1 overflow-hidden gap-2">
            <div className="flex justify-between gap-4">
              <div className="flex-1 gap-2 p-1">
                {enableSearching && (
                  <Input
                    type="search"
                    placeholder="Type to search..."
                    value={quickFilter}
                    onChange={(e) => {
                      const v = e.target.value
                      setQuickFilter(v)
                      gridRef.current?.api?.setGridOption?.("quickFilterText", v)
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
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                    <DropdownMenuGroup>
                      {enableBulkDelete && (
                        <DropdownMenuItem
                          disabled={selectedRowsLength === 0}
                          onClick={() => setDeleteMode("bulk")}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                {enableFiltering && (
                  <Button type="button" variant="outline" onClick={() => setIsFilterOpen(true)}>
                    <FilterIcon className="h-4 w-4" />
                    <span className="hidden md:block">Filters</span>
                  </Button>
                )}

                {enableAdd &&
                  (addEndpoint ? (
                    <Button type="button" onClick={() => router.visit(addEndpoint)}>
                      <Plus className="h-4 w-4" />
                      <span className="hidden md:block">Add New</span>
                    </Button>
                  ) : (
                    <Button type="button" onClick={handleAdd}>
                      <Plus className="h-4 w-4" />
                      <span className="hidden md:block">Add New</span>
                    </Button>
                  ))}
              </div>
            </div>

            <div className="ag-theme-quartz shadcn-grid h-full w-full rounded-lg overflow-hidden">
              <AgGridReact
                ref={gridRef}
                rowData={rowData}
                columnDefs={agColumns}
                pagination
                paginationPageSize={pageSize}
                rowSelection={enableRowSelection ? "multiple" : undefined}
                suppressRowClickSelection
                onSelectionChanged={() => {
                  const count = gridRef.current?.api?.getSelectedRows?.().length ?? 0
                  setSelectedRowsLength(count)
                }}
              />
            </div>

            <AlertDialog open={!!deleteMode} onOpenChange={() => setDeleteMode(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {deleteMode === "bulk" ? "Confirm Bulk Deletion" : "Are you sure?"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {deleteMode === "bulk"
                      ? "This will permanently delete selected items."
                      : "This will permanently delete the item."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-0">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    onClick={() => {
                      if (deleteMode === "single" && deleteTarget) handleDelete(deleteTarget)
                      if (deleteMode === "bulk") handleBulkDelete()
                      setDeleteTarget(null)
                      setDeleteMode(null)
                    }}
                  >
                    Yes, delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      },
    [
      addEndpoint,
      agColumns,
      deleteMode,
      deleteTarget,
      enableAdd,
      enableBulkDelete,
      enableFiltering,
      enableRowSelection,
      enableSearching,
      handleAdd,
      handleBulkDelete,
      handleDelete,
      pageSize,
      quickFilter,
      rowData,
      selectedRowsLength,
    ]
  )

  return {
    TableView,
    isFormOpen,
    isFilterOpen,
    isViewOpen,
    formMode,
    selectedItem,
    viewItem,
    handleCloseForm,
    handleCloseFilter,
    handleCloseView,
    reloadTable,
  }
}
