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

const FundSources = () => {
  const { data, setData } = useForm({
      fundSources: []
  })

  const [loading, setLoading] = useState(false)

  const fetchFundSources = async () => {
    setLoading(true)
    try {
      const res = await fetch(route('settings.travel-orders.fund-sources'))
      const json = await res.json()
      setData("fundSources", json.data.fundSources || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
      fetchFundSources()
  }, [])

  const canModify = useHasRole(["HRIS_PRU", "HRIS_Administrator"])

  const columns = useMemo(() => [
    {
        header: "Title",
        accessorKey: "title",
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
    routeName: route('settings.travel-orders.fund-sources'),
    initialData: data.fundSources,
    filters,
    responseType: "json",
    onJsonResponse: (response) => {
        const fundSources = response?.data?.fundSources ?? response?.fundSources ?? response
        
        if (fundSources) setData("fundSources", fundSources)
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
        deleteEndpoint: (id) => route('settings.travel-orders.fund-sources.destroy', id),
        bulkDeleteEndpoint: route('settings.travel-orders.fund-sources.bulk-destroy')
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

export default FundSources