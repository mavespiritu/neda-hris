import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { useHasRole } from "@/hooks/useAuth"
import PageTitle from "@/components/PageTitle"
import useCrudTable from "@/hooks/useCrudTable"
import Form from "./Form"
import { store } from "./store"

const index = () => {
  const { indicators, setIndicators, fetchIndicators } = store()
  const [filters] = useState({})

  useEffect(() => {
    fetchIndicators()
  }, [])

  const canModify = useHasRole(["HRIS_HR", "HRIS_Administrator"])

  const columns = useMemo(
    () => [
      { header: "Level", accessorKey: "level", meta: { enableSorting: true } },
      { header: "Category", accessorKey: "category", meta: { enableSorting: true } },
      {
        header: "Activity/Output",
        id: "activity_output",
        cell: ({ row }) => (
          <span className="whitespace-normal break-words text-sm text-slate-700">
            {row.original.activity?.activity_output ?? row.original.activity_output ?? "-"}
          </span>
        ),
      },
      { header: "Target", accessorKey: "target", meta: { enableSorting: true } },
      {
        header: "Matrix",
        accessorKey: "matrix_payload",
        cell: ({ row }) => (
          <span className="whitespace-normal break-words text-sm text-slate-700">
            {Array.isArray(row.original.matrix_payload) && row.original.matrix_payload.length > 0
              ? `${row.original.matrix_payload.length} block${row.original.matrix_payload.length > 1 ? "s" : ""}`
              : "-"}
          </span>
        ),
      },
    ],
    []
  )

  const { TableView, isFormOpen, formMode, selectedItem, handleCloseForm, reloadTable } = useCrudTable({
    columns,
    routeName: route("performance.success-indicators.index"),
    initialData: indicators.data,
    filters,
    responseType: "json",
    onJsonResponse: (response) => {
      setIndicators((old) => ({
        ...old,
        data: response,
        isLoading: false,
        error: null,
      }))
    },
    options: {
      enableAdd: true,
      enableEdit: true,
      enableView: false,
      enableViewAsLink: false,
      enableDelete: true,
      enableBulkDelete: true,
      enableSearching: true,
      enableFiltering: false,
      enableRowSelection: true,
      canModify,
    },
    endpoints: {
      deleteEndpoint: (id) => route("performance.success-indicators.destroy", id),
      bulkDeleteEndpoint: route("performance.success-indicators.bulk-destroy"),
    },
  })

  return (
    <div className="flex h-full flex-col gap-4">
      <PageTitle pageTitle="Success Indicators" description="Manage library of performance success indicators here." />
      <div className="overflow-x-auto">
        <div className="relative">
          {indicators.isLoading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
          <TableView />
        </div>
      </div>
      {isFormOpen && (
        <Form
          open={isFormOpen}
          mode={formMode}
          data={selectedItem}
          onClose={() => {
            handleCloseForm()
            reloadTable()
          }}
        />
      )}
    </div>
  )
}

export default index
