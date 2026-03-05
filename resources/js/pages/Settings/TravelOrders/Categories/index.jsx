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

const Categories = () => {
  const { data, setData } = useForm({
      categories: []
  })

  const [loading, setLoading] = useState(false)

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await fetch(route('settings.travel-orders.categories'))
      const json = await res.json()
      setData("categories", json.data.categories || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
      fetchCategories()
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
    routeName: route('settings.travel-orders.categories'),
    initialData: data.categories,
    filters,
    responseType: "json",
    onJsonResponse: (response) => {
        const categories = response?.data?.categories ?? response?.categories ?? response
        
        if (categories) setData("categories", categories)
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
        deleteEndpoint: (id) => route('settings.travel-orders.categories.destroy', id),
        bulkDeleteEndpoint: route('settings.travel-orders.categories.bulk-destroy')
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

export default Categories