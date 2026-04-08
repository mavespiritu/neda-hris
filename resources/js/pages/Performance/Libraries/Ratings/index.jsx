import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { useHasRole } from "@/hooks/useAuth"
import PageTitle from "@/components/PageTitle"
import useCrudTable from "@/hooks/useCrudTable"
import Form from "./Form"
import { store } from "./store"

const Ratings = () => {
  const { ratings, setRatings, fetchRatings } = store()
  const [filters] = useState({})

  useEffect(() => {
    fetchRatings()
  }, [])

  const canModify = useHasRole(["HRIS_HR", "HRIS_Administrator"])

  const columns = useMemo(
    () => [
      { header: "Name", accessorKey: "name", meta: { enableSorting: true } },
      { header: "Category", accessorKey: "category", meta: { enableSorting: true } },
    ],
    []
  )

  const { TableView, isFormOpen, formMode, selectedItem, handleCloseForm, reloadTable } = useCrudTable({
    columns,
    routeName: route("performance.ratings.index"),
    initialData: ratings.data,
    filters,
    responseType: "json",
    onJsonResponse: (response) => {
      setRatings((old) => ({
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
      deleteEndpoint: (id) => route("performance.ratings.destroy", id),
      bulkDeleteEndpoint: route("performance.ratings.bulk-destroy"),
    },
  })

  return (
    <div className="flex h-full flex-col gap-4">
      <PageTitle pageTitle="Ratings" description="Manage default rating matrices for success indicators here." />
      <div className="overflow-x-auto">
        <div className="relative">
          {ratings.isLoading && (
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

export default Ratings
