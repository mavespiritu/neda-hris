import { useEffect, useState, useCallback } from 'react'
import { useForm, router } from '@inertiajs/react'
import { useDebounce } from 'use-debounce'
import { useReactTable, getCoreRowModel } from '@tanstack/react-table'
import axios from 'axios'

export const useTable = ({
  data = [],
  pageCount,
  pageSize,
  currentPage,
  searchQuery = '',
  routeName,
  columns,
  extraQuery = {},
  enableRowSelection,
  responseType = 'inertia',
  onJsonResponse = null,
}) => {
  const [search, setSearch] = useState(searchQuery)
  const [debouncedSearch] = useDebounce(search, 500)
  const [pageIndex, setPageIndex] = useState(currentPage - 1)
  const [rowSelection, setRowSelection] = useState({})
  const [sorting, setSorting] = useState([])
  const [isMounted, setIsMounted] = useState(false)

  const form = useForm({ ids: [] })

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      pagination: { pageIndex, pageSize },
      rowSelection,
      sorting,
    },
    manualPagination: true,
    manualFiltering: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: row => row.id,
    enableRowSelection,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
  })

  // 🔥 Keep form data in sync with selected rows
  useEffect(() => {
    form.setData(
      'ids',
      table.getSelectedRowModel().rows.map(r => r.original.id)
    )
  }, [rowSelection])

  // 🔥 Shared fetch function
  const fetchData = useCallback(() => {
    const sortParam =
      sorting.length > 0
        ? { sort: sorting[0].id, direction: sorting[0].desc ? 'desc' : 'asc' }
        : {}

    if (responseType === 'json') {
      axios
        .get(routeName, {
          params: {
            page: pageIndex + 1,
            search: debouncedSearch,
            ...extraQuery,
            ...sortParam,
          },
        })
        .then(res => {
          const response = res.data
            if (response?.current_page && response.current_page - 1 !== pageIndex) {
                setPageIndex(response.current_page - 1)
            }
            if (onJsonResponse) onJsonResponse(response)
        })
        .catch(console.error)
    } else {
      router.get(
        routeName,
        {
          page: pageIndex + 1,
          search: debouncedSearch,
          ...extraQuery,
          ...sortParam,
        },
        {
          preserveState: true,
          preserveScroll: true,
          replace: true,
        }
      )
    }
  }, [
    routeName,
    pageIndex,
    debouncedSearch,
    JSON.stringify(extraQuery),
    JSON.stringify(sorting),
    responseType,
  ])

  // 🔥 Fetch when state changes (pagination/search/sorting)
  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
      return
    }
    fetchData()
  }, [fetchData])

  return {
    table,
    form,
    search,
    setSearch,
    pageIndex,
    setPageIndex,
    rowSelection,
    sorting,
    setSorting,
    selectedRows: table.getSelectedRowModel().rows,
    reloadTable: fetchData, // 👈 expose this so forms can refresh data
  }
}
