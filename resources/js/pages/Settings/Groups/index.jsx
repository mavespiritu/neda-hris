import PageTitle from "@/components/PageTitle"
import useCrudTable from "@/hooks/useCrudTable"
import { useEffect, useMemo } from "react"
import Form from "./Form"
import { useHasRole } from "@/hooks/useAuth"
import { store } from "./store"
import { Loader2 } from "lucide-react"

const Groups = () => {
  const { groups, setGroups, fetchGroups } = store()
  useEffect(() => {
    fetchGroups()
  }, [])

  const canModify = useHasRole(["HRIS_HR", "HRIS_Administrator"])

  const columns = useMemo(
    () => [
      { header: "Name", accessorKey: "name", meta: { enableSorting: true } },
      { header: "Description", accessorKey: "description", meta: { enableSorting: true } },
      {
        header: "Members",
        accessorKey: "members_count",
        cell: ({ row }) => {
          const count = row.original.members_count ?? row.original.members?.length ?? 0
          return count > 0 ? `${count} member${count === 1 ? "" : "s"}` : "-"
        },
      },
    ],
    []
  )

  const { TableView, isFormOpen, formMode, selectedItem, handleCloseForm, reloadTable } = useCrudTable({
    columns,
    routeName: route("settings.groups.index"),
    initialData: groups.data,
    filters: groups.filters,
    responseType: "json",
    onJsonResponse: (response) => {
      setGroups((old) => ({
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
      deleteEndpoint: (id) => route("settings.groups.destroy", id),
      bulkDeleteEndpoint: route("settings.groups.bulk-destroy"),
    },
  })

  return (
    <div className="flex h-full flex-col gap-4">
      <PageTitle pageTitle="Groups" description="Manage employee groups used for success indicator assignments." />
      <div className="overflow-x-auto">
        <div className="relative">
          {groups.isLoading && (
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

export default Groups