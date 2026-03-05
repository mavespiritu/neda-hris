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

const Prioritizations = () => {
  const { data, setData } = useForm({
      prioritizations: []
  })

  const [loading, setLoading] = useState(false)

  const fetchPrioritizations = async () => {
    setLoading(true)
    try {
      const res = await fetch(route('settings.travel-orders.prioritizations'))
      const json = await res.json()
      setData("prioritizations", json.data.prioritizations || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
      fetchPrioritizations()
  }, [])

  const canModify = useHasRole(["HRIS_PRU", "HRIS_Administrator"])

  const columns = useMemo(() => [
    {
        header: "Reason",
        accessorKey: "reason",
        meta: { enableSorting: true },
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
    routeName: route('settings.travel-orders.prioritizations'),
    initialData: data.prioritizations,
    filters,
    responseType: "json",
    onJsonResponse: (response) => {
        const prioritizations = response?.data?.prioritizations ?? response?.prioritizations ?? response
        
        if (prioritizations) setData("prioritizations", prioritizations)
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
        deleteEndpoint: (id) => route('settings.travel-orders.prioritizations.destroy', id),
        bulkDeleteEndpoint: route('settings.travel-orders.prioritizations.bulk-destroy')
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

export default Prioritizations