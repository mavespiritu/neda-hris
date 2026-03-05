import { useMemo, useState, useEffect } from "react"
import { format } from "date-fns"
import useCrudTable from "@/hooks/useCrudTable"
import TripTicketForm from "./TripTicketForm"
import TripTicketFilter from "./TripTicketFilter"
import { store } from "./store"

const TripTicket = ({ travelOrderId }) => {
  const { 
    tripTickets, 
    setTripTickets, 
    fetchTripTickets 
  } = store()

  const [filters, setFilters] = useState({})

  useEffect(() => {
    if (!travelOrderId) return
    fetchTripTickets({ travelOrderId, filters })
  }, [travelOrderId])

  const columns = useMemo(
    () => [
      { header: "Reference No.", accessorKey: "reference_no", meta: { enableSorting: true } },
      {
        header: "Vehicle",
        accessorKey: "vehicle_name",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span>{row.original.vehicle_name || "-"}</span>
            <span className="text-xs text-muted-foreground">{row.original.plate_no || "-"}</span>
          </div>
        ),
        meta: { enableSorting: true },
      },
      { header: "Driver", accessorKey: "driver_name", meta: { enableSorting: true } },
      {
        header: "Created",
        accessorKey: "created_at",
        cell: ({ row }) =>
          row.original.created_at ? format(new Date(row.original.created_at), "MMMM d, yyyy") : "-",
        meta: { enableSorting: true },
      },
    ],
    []
  )

  if (!travelOrderId) return null

  const {
    TableView,
    isFormOpen,
    isFilterOpen,
    formMode,
    selectedItem,
    handleCloseForm,
    handleCloseFilter,
    reloadTable,
  } = useCrudTable({
    columns,
    routeName: route("trip-tickets.index.data", { id: travelOrderId }),
    initialData: tripTickets.data,
    filters,
    responseType: "json",
    onJsonResponse: (response) => {
      const tt = response?.trip_tickets || {}

      setTripTickets((old) => ({
        ...old,
        data: {
          ...old.data,
          ...tt,
          current_page: Number(tt.current_page || 1),
          last_page: Number(tt.last_page || 1),
          per_page: Number(tt.per_page || 10),
          total: Number(tt.total || 0),
        },
        can: response?.can ?? old.can,
        filter_options: response?.filter_options ?? old.filter_options,
      }))
    },
    options: {
      enableAdd: !!tripTickets.can?.create,
      enableEdit: (row) => !!row?.original?.can?.edit && !!row?.original?.id,
      enableDelete: (row) => !!row?.original?.can?.delete && !!row?.original?.id,
      enableBulkDelete: !!tripTickets.can?.delete,
      enableSearching: true,
      enableFiltering: true,
      enableRowSelection: (row) => !!row?.original?.can?.delete && !!row?.original?.id,
      enableGenerateReport: (row) => !!row?.original?.can?.generate && !!row?.original?.id,
      canModify: true,
    },
    endpoints: {
      deleteEndpoint: (id) => route("trip-tickets.destroy", id),
      generateReportEndpoint: (id) => route("trip-tickets.generate", id),
      bulkDeleteEndpoint: route("trip-tickets.bulk-destroy"),
    },
  })

  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">Trip Ticket</h3>
      </div>

      <TableView />

      {isFormOpen && (
        <TripTicketForm
          open={isFormOpen}
          mode={formMode}
          data={selectedItem}
          travelOrderId={travelOrderId}
          onClose={() => {
            handleCloseForm()
            reloadTable()
          }}
        />
      )}

      {isFilterOpen && (
        <TripTicketFilter
          open={isFilterOpen}
          onClose={handleCloseFilter}
          onApply={(appliedFilters) =>
            setFilters((prev) => ({
              ...prev,
              ...appliedFilters,
            }))
          }
          initialValues={filters}
          options={tripTickets.filter_options}
        />
      )}
    </>
  )
}

export default TripTicket
