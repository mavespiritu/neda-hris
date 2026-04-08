import PageTitle from "@/components/PageTitle"
import useCrudTable from "@/hooks/useCrudTable"
import { useEffect, useMemo, useState } from "react"
import Form from "./Form"
import { useHasRole } from "@/hooks/useAuth"
import { store } from "./store"
import { Loader2 } from "lucide-react"

const index = () => {
  const { categories, setCategories, fetchCategories } = store()
  const [filters] = useState({})

  useEffect(() => {
    fetchCategories()
  }, [])

  const canModify = useHasRole(["HRIS_HR", "HRIS_Administrator"])

  const columns = useMemo(
    () => [
      {
        header: "Category",
        accessorKey: "category",
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
    routeName: route("performance.categories.index"),
    initialData: categories.data,
    filters,
    responseType: "json",
    onJsonResponse: (response) => {
      setCategories((old) => ({
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
      deleteEndpoint: (id) => route("performance.categories.destroy", id),
      bulkDeleteEndpoint: route("performance.categories.bulk-destroy"),
    },
  })

  return (
    <div className="flex h-full flex-col gap-4">
      <PageTitle pageTitle="Categories" description="Manage performance categories here." />
      <div className="overflow-x-auto">
        <div className="relative">
          {categories.isLoading && (
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
