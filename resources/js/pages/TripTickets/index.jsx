import { useMemo, useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import useCrudTable from "@/hooks/useCrudTable"
import Form from "./Form"
import Filter from "./Filter"
import { store } from "./store"
import { formatDateRange } from "@/lib/utils.jsx"
import StatusBadge from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import CompleteTripForm from "./CompleteTripForm"
import PageTitle from "@/components/PageTitle"
import { Head, usePage, router, useForm } from "@inertiajs/react"

const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Trip Tickets', href: route('trip-tickets.index') },
]

const TripTickets = () => {
  const { tripTickets, setTripTickets, fetchTripTickets } = store()
  const [filters, setFilters] = useState({})

  const [isCompleteOpen, setIsCompleteOpen] = useState(false)
  const [completeTarget, setCompleteTarget] = useState(null)

  const vehicleLabelMap = useMemo(() => {
    const items = Array.isArray(tripTickets.filter_options?.vehicles)
      ? tripTickets.filter_options.vehicles
      : Object.values(tripTickets.filter_options?.vehicles ?? {})

    return Object.fromEntries(
      items.map((item) => [
        String(item.value ?? item.id ?? item.vehicle_id ?? "").trim(),
        item.label ?? item.name ?? item.vehicle_name ?? "",
      ])
    )
  }, [tripTickets.filter_options?.vehicles])

  const driverLabelMap = useMemo(() => {
    const items = Array.isArray(tripTickets.filter_options?.drivers)
      ? tripTickets.filter_options.drivers
      : Object.values(tripTickets.filter_options?.drivers ?? {})

    return Object.fromEntries(
      items.map((item) => [
        String(item.value ?? item.id ?? item.driver_id ?? "").trim(),
        item.label ?? item.name ?? item.driver_name ?? "",
      ])
    )
  }, [tripTickets.filter_options?.drivers])

  const dispatcherLabelMap = useMemo(() => {
    const items = Array.isArray(tripTickets.filter_options?.dispatchers)
      ? tripTickets.filter_options.dispatchers
      : Object.values(tripTickets.filter_options?.dispatchers ?? {})

    return Object.fromEntries(
      items.map((item) => [
        String(item.value ?? item.id ?? item.dispatcher_id ?? "").trim(),
        item.label ?? item.name ?? item.dispatcher_name ?? "",
      ])
    )
  }, [tripTickets.filter_options?.dispatchers])

  const clearFilter = useCallback((key) => {
    setFilters((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const handleOpenComplete = useCallback((row) => {
    setCompleteTarget(row.original)
    setIsCompleteOpen(true)
  }, [])

  useEffect(() => {
    fetchTripTickets({ filters })
  }, [])

  const columns = useMemo(
    () => [
      { header: "Trip Ticket No.", accessorKey: "reference_no", meta: { enableSorting: true } },
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
      { header: "Travel Request No.", accessorKey: "to_reference_no", meta: { enableSorting: true } },
      { header: "Purpose of Travel", accessorKey: "purpose", meta: { enableSorting: true } },
      {
        header: "Travel Date",
        accessorKey: "start_date",
        cell: ({ row }) => (
          <span>{formatDateRange(row.original.start_date, row.original.end_date)}</span>
        ),
        meta: { enableSorting: true },
      },
      {
        header: "Status",
        id: "status",
        cell: ({ row }) => {
          const hasStart = !!row.original.odo_start
          const hasEnd = !!row.original.odo_end
          const status = hasEnd ? "Completed" : hasStart ? "In Progress" : "Not Started"

          return <StatusBadge status={status} />
        },
        meta: { enableSorting: false },
      },
      {
        header: "Ticket Created",
        accessorKey: "created_at",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span>{row.original.created_by_name || "-"}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.created_at
                ? format(new Date(row.original.created_at), "MMMM d, yyyy")
                : "-"}
            </span>
          </div>
        ),
        meta: { enableSorting: true },
      },
      {
        header: "",
        id: "complete_trip",
        cell: ({ row }) =>
          <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-xs"
              onClick={() => handleOpenComplete(row)}
            >
              Complete Trip
            </Button>,
        meta: { enableSorting: false },
      },
    ],
    []
  )

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
    routeName: route("trip-tickets.index.data"),
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
    filterLabelMaps: {
      vehicle_id: vehicleLabelMap,
      driver_id: driverLabelMap,
      dispatcher_id: dispatcherLabelMap,
    },
    filterKeyLabels: {
      vehicle_id: "Vehicle",
      driver_id: "Driver",
      dispatcher_id: "Dispatcher",
    },
    onClearFilter: clearFilter,
  })

  return (
    <div className="h-full flex flex-col">
      <Head title="Trip Tickets" />
      <PageTitle 
          pageTitle="Trip Tickets" 
          description="Manage information about the trip tickets here." 
          breadcrumbItems={breadcrumbItems} 
      />

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

      {isCompleteOpen && (
        <CompleteTripForm
          open={isCompleteOpen}
          ticket={completeTarget}
          onClose={() => {
            setIsCompleteOpen(false)
            setCompleteTarget(null)
          }}
          onSuccess={() => {
            setIsCompleteOpen(false)
            setCompleteTarget(null)
            reloadTable()
          }}
        />
      )}

      {isFilterOpen && (
        <Filter
          open={isFilterOpen}
          onClose={handleCloseFilter}
          onApply={(appliedFilters) => {
            setFilters((prev) => ({
              ...prev,
              ...appliedFilters,
            }))
          }}
          initialValues={filters}
          options={tripTickets.filter_options}
        />
      )}
    </div>
  )
}

export default TripTickets
