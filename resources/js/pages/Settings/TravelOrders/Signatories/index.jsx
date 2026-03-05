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

const Signatories = () => {
  const { data, setData } = useForm({
      signatories: []
  })

  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState([])

  const fetchSignatories = async () => {
    setLoading(true)
    try {
      const res = await fetch(route('settings.travel-orders.signatories'))
      const json = await res.json()
      setData("signatories", json.data.signatories || [])
      setEmployees(json.data.employees || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
      fetchSignatories()
  }, [])

  const canModify = useHasRole(["HRIS_PRU", "HRIS_Administrator"])

  const columns = useMemo(() => [
    {
        header: "Role",
        accessorKey: "type",
        meta: { enableSorting: true },
    },
    {
        header: "Division",
        accessorKey: "division",
        meta: { enableSorting: true },
        cell: ({ row }) => {
          return row.original.division ?? ""
        }
    },
    {
        header: "Name",
        accessorKey: "name",
        meta: { enableSorting: true },
        cell: ({ row }) => {
          return row.original.name ?? ""
        }
    },
    {
        header: "Designation",
        accessorKey: "designation",
        meta: { enableSorting: true },
        cell: ({ row }) => {
          return row.original.designation ?? ""
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
    routeName: route('settings.travel-orders.signatories'),
    initialData: data.signatories,
    filters,
    responseType: "json",
    onJsonResponse: (response) => {
        const signatories = response?.data?.signatories ?? response?.signatories ?? response
        
        if (signatories) setData("signatories", signatories)
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
        deleteEndpoint: (id) => route('settings.travel-orders.signatories.destroy', id),
        bulkDeleteEndpoint: route('settings.travel-orders.signatories.bulk-destroy')
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
              employees={employees}
              onClose={() => {
                handleCloseForm()
                reloadTable()
              }}
          />
      )}
    </div>
  )
}

export default Signatories