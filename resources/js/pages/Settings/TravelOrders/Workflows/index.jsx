import { useMemo, useState, useEffect } from "react"
import { useForm } from "@inertiajs/react"
import { useHasRole } from "@/hooks/useAuth"
import useCrudTable from "@/hooks/useCrudTable"
import { Badge } from "@/components/ui/badge"
import Form from "./Form"

const Workflows = () => {
  const { data, setData } = useForm({ workflowTransitions: [] })
  const [loading, setLoading] = useState(false)

  const fetchWorkflowTransitions = async () => {
    setLoading(true)
    try {
      const res = await fetch(route("settings.travel-orders.workflows"))
      const json = await res.json()
      setData("workflowTransitions", json?.data?.workflowTransitions || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkflowTransitions()
  }, [])

  const canModify = useHasRole(["HRIS_Administrator"])

  const columns = useMemo(
    () => [
      {
        header: "Process",
        accessorKey: "process_key",
        cell: ({ row }) => (
          <div>
            <div className="font-semibold">{row.original.process_key}</div>
            <div className="text-xs text-muted-foreground">Order {row.original.sort_order ?? 0}</div>
          </div>
        ),
      },
      {
        header: "Transition",
        accessorKey: "transition_label",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.transition_label}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.notification_label || "No notification label"}
            </div>
          </div>
        ),
      },
      {
        header: "Expected Actor",
        accessorKey: "expected_actor_type",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.expected_actor_type}</div>
            <div className="text-xs text-muted-foreground">{row.original.actor_scope_label}</div>
          </div>
        ),
      },
      {
        header: "Expected Action",
        accessorKey: "expected_action",
      },
      {
        header: "Recipient",
        accessorKey: "recipient_role",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.recipient_role || "-"}</div>
            <div className="text-xs text-muted-foreground">{row.original.recipient_scope_label}</div>
          </div>
        ),
      },
      {
        header: "Flags",
        accessorKey: "flags_label",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {String(row.original.flags_label || "").split(", ").map((flag) => (
              <Badge key={flag} variant={flag === "Active" ? "secondary" : "outline"}>
                {flag}
              </Badge>
            ))}
          </div>
        ),
      },
    ],
    []
  )

  const [filters, setFilters] = useState({})

  const { TableView, isFormOpen, formMode, selectedItem, handleCloseForm, reloadTable } = useCrudTable({
    columns,
    routeName: route("settings.travel-orders.workflows"),
    initialData: data.workflowTransitions,
    filters,
    responseType: "json",
    onJsonResponse: (response) => {
      const workflowTransitions = response?.data?.workflowTransitions ?? response?.workflowTransitions ?? response
      if (workflowTransitions) setData("workflowTransitions", workflowTransitions)
    },
    options: {
      enableAdd: true,
      enableEdit: true,
      enableView: false,
      enableViewAsLink: false,
      enableDelete: true,
      enableBulkDelete: true,
      enableSearching: false,
      enableFiltering: false,
      enableRowSelection: true,
      canModify,
    },
    endpoints: {
      deleteEndpoint: (id) => route("settings.travel-orders.workflows.destroy", id),
      bulkDeleteEndpoint: route("settings.travel-orders.workflows.bulk-destroy"),
    },
  })

  return (
    <div>
      {loading && <div className="mb-3 text-xs text-muted-foreground">Loading workflow transitions...</div>}
      <TableView />
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

export default Workflows
