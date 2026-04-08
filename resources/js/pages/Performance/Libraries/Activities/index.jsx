import PageTitle from "@/components/PageTitle"
import useCrudTable from "@/hooks/useCrudTable"
import { useEffect, useMemo, useState } from "react"
import Form from "./Form"
import { useHasRole } from "@/hooks/useAuth"
import { store } from "./store"
import { Loader2 } from "lucide-react"

const index = () => {
  const { activities, setActivities, fetchActivities } = store()
  const [filters] = useState({})

  useEffect(() => {
    fetchActivities()
  }, [])

  const canModify = useHasRole(["HRIS_HR", "HRIS_Administrator"])

  const columns = useMemo(
    () => [
      { header: "Activity/Output", accessorKey: "activity_output", meta: { enableSorting: true } },
      { header: "Description", accessorKey: "description", meta: { enableSorting: true } },
    ],
    []
  )

  const { TableView, isFormOpen, formMode, selectedItem, handleCloseForm, reloadTable } = useCrudTable({
    columns,
    routeName: route("performance.activities.index"),
    initialData: activities.data,
    filters,
    responseType: "json",
    onJsonResponse: (response) => {
      setActivities((old) => ({
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
      deleteEndpoint: (id) => route("performance.activities.destroy", id),
      bulkDeleteEndpoint: route("performance.activities.bulk-destroy"),
    },
  })

  return (
    <div className="flex h-full flex-col gap-4">
      <PageTitle pageTitle="Activities/Outputs" description="Manage activities and outputs here." />
      <div className="overflow-x-auto">
        <div className="relative">
          {activities.isLoading && (
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
