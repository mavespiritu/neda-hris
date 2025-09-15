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

const Schedules = () => {
  const { data, setData } = useForm({
      schedules: []
  })

  const [loading, setLoading] = useState(false)

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const res = await fetch(route('settings.cga.submission-schedules'))
      const json = await res.json()
      setData("schedules", json.data.schedules || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
      fetchSchedules()
  }, [data.schedules])

  const canModify = useHasRole(["HRIS_HR"])

  const columns = useMemo(() => [
    {
        header: "Year",
        accessorKey: "year",
        meta: { enableSorting: true },
    },
    {
        header: "Start Date",
        accessorKey: "from_date",
        meta: { enableSorting: true },
        cell: ({ row }) => {
          return formatDate(row.original.from_date) ?? ""
        }
    },
    {
        header: "End Date",
        accessorKey: "end_date",
        meta: { enableSorting: true },
        cell: ({ row }) => {
          return formatDate(row.original.end_date) ?? ""
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
  } = useCrudTable({
    columns,
    routeName: route('settings.cga.submission-schedules'),
    initialData: data.schedules,
    filters,
    responseType: "json",
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
        deleteEndpoint: (id) => route('settings.cga.submission-schedules.destroy', id),
        bulkDeleteEndpoint: route('settings.cga.submission-schedules.bulk-destroy')
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
              }}
          />
      )}
    </div>
  )
}

export default Schedules