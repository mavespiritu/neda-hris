import { useState, useEffect, useMemo } from "react"
import { useForm, router } from '@inertiajs/react'
import { Loader2, FileSpreadsheet, FileText, ChevronDown } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import DatePicker from "@/components/DatePicker"
import { formatDate } from "@/lib/utils.jsx"
import useCrudTable from "@/hooks/useCrudTable"
import { useHasRole } from "@/hooks/useAuth"
import Form from "./Form"

const Vehicles = () => {
  const { data, setData } = useForm({
      vehicles: []
  })

  const [loading, setLoading] = useState(false)

  const fetchVehicles = async () => {
    setLoading(true)
    try {
      const res = await fetch(route('settings.travel-orders.vehicles'))
      const json = await res.json()
      setData("vehicles", json.data.vehicles || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
      fetchVehicles()
  }, [])

  const canModify = useHasRole(["HRIS_PRU", "HRIS_Administrator"])

  const columns = useMemo(() => [
    {
        header: "Vehicle",
        accessorKey: "vehicle",
        meta: { enableSorting: true },
    },
    {
        header: "Plate No.",
        accessorKey: "plate_no",
        meta: { enableSorting: true },
        cell: ({ row }) => {
          return row.original.plate_no ?? ""
        }
    },
    {
        header: "Average Fuel Consumption",
        accessorKey: "avg_consumption",
        meta: { enableSorting: true },
        cell: ({ row }) => {
          return row.original.avg_consumption ?? ""
        }
    },
    {
        header: "Fuel Type",
        accessorKey: "fuel_type",
        meta: { enableSorting: true },
        cell: ({ row }) => {
          return row.original.fuel_type ?? ""
        }
    },
  ], [])
  
  const [filters, setFilters] = useState({})

  const { 
    TableView,
    isFormOpen,
    isFilterOpen,
    isViewOpen,
    formMode,
    selectedItem,
    handleCloseForm,
    handleCloseFilter,
    reloadTable
  } = useCrudTable({
    columns,
    routeName: route('settings.travel-orders.vehicles'),
    initialData: data.vehicles,
    filters,
    responseType: "json",
    onJsonResponse: (response) => {
        const vehicles = response?.data?.vehicles ?? response?.vehicles ?? response
        
        if (vehicles) setData("vehicles", vehicles)
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
        deleteEndpoint: (id) => route('settings.travel-orders.vehicles.destroy', id),
        bulkDeleteEndpoint: route('settings.travel-orders.vehicles.bulk-destroy')
    },
  })

  return (
    <div>
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

export default Vehicles