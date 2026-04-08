import PageTitle from "@/components/PageTitle"
import useCrudTable from "@/hooks/useCrudTable"
import { useEffect, useMemo, useState } from "react"
import Form from "./Form"
import { useHasRole } from "@/hooks/useAuth"
import { store } from "./store"
import { Loader2 } from "lucide-react"

const index = () => {
  const { ppas, setPpas, fetchPpas } = store()
  const [filters] = useState({})

  useEffect(() => {
    fetchPpas()
  }, [])

  const canModify = useHasRole(["HRIS_HR", "HRIS_Administrator"])

  const columns = useMemo(
    () => [
      { header: "Short Code", accessorKey: "short_code", meta: { enableSorting: true } },
      { header: "Title", accessorKey: "title", meta: { enableSorting: true } },
      { header: "Label", accessorKey: "label", meta: { enableSorting: true } },
    ],
    []
  )

  const { TableView, isFormOpen, formMode, selectedItem, handleCloseForm, reloadTable } = useCrudTable({
    columns,
    routeName: route("performance.ppas.index"),
    initialData: ppas.data,
    filters,
    responseType: "json",
    onJsonResponse: (response) => {
      setPpas((old) => ({
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
      deleteEndpoint: (id) => route("performance.ppas.destroy", id),
      bulkDeleteEndpoint: route("performance.ppas.bulk-destroy"),
    },
  })

  return (
    <div className="flex h-full flex-col gap-4">
      <PageTitle pageTitle="MFO/PAP" description="Manage the MFO/PAP library here." />
      <div className="overflow-x-auto">
        <div className="relative">
          {ppas.isLoading && (
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
