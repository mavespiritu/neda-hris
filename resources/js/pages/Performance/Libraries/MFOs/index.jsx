import PageTitle from "@/components/PageTitle"
import useCrudTable from "@/hooks/useCrudTable"
import { useEffect, useMemo, useState } from "react"
import Form from "./Form"
import { useHasRole } from "@/hooks/useAuth"
import { store } from "./store"
import { Loader2 } from "lucide-react"

const index = () => {
  const { mfos, setMfos, fetchMfos } = store()
  const [filters] = useState({})

  useEffect(() => {
    fetchMfos()
  }, [])

  const canModify = useHasRole(["HRIS_HR", "HRIS_Administrator"])

  const columns = useMemo(
    () => [
      {
        header: "MFO",
        accessorKey: "mfo",
        meta: { enableSorting: true },
      },
      {
        header: "Description",
        accessorKey: "description",
        meta: { enableSorting: true },
      },
    ],
    []
  )

  const { TableView, isFormOpen, formMode, selectedItem, handleCloseForm, reloadTable } = useCrudTable({
    columns,
    routeName: route("performance.mfos.index"),
    initialData: mfos.data,
    filters,
    responseType: "json",
    onJsonResponse: (response) => {
      setMfos((old) => ({
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
      deleteEndpoint: (id) => route("performance.mfos.destroy", id),
      bulkDeleteEndpoint: route("performance.mfos.bulk-destroy"),
    },
  })

  return (
    <div className="flex h-full flex-col gap-4">
      <PageTitle pageTitle="MFOs" description="Manage the MFO library here without hierarchical selection fields." />
      <div className="overflow-x-auto">
        <div className="relative">
          {mfos.isLoading && (
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
