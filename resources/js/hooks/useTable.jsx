import { useEffect, useState } from 'react'
import { useForm } from '@inertiajs/react'
import { useDebounce } from 'use-debounce'
import { useReactTable, getCoreRowModel } from '@tanstack/react-table'
import { router } from '@inertiajs/react'
import axios from 'axios'   

export const useTable = ({
    data = [],
    pageCount,
    pageSize,
    currentPage,
    searchQuery = '',
    routeName,
    columns,
    extraQuery,
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

    // Sync selected rows into form
    useEffect(() => {
        const selectedIds = table.getSelectedRowModel().rows.map(row => row.original.id)
        form.setData('ids', selectedIds)
    }, [rowSelection])

    // Fetch data on search/page change
    useEffect(() => {
        if (!isMounted) {
            setIsMounted(true)
            return
        }

        const sortParam = sorting.length > 0
        ? { sort: sorting[0].id, direction: sorting[0].desc ? 'desc' : 'asc' }
        : {}

        if (responseType === 'json') {
            axios.get(routeName, {
                params: {
                    page: pageIndex + 1,
                    search: debouncedSearch,
                    ...extraQuery,
                    ...sortParam,
                }
            })
            .then((res) => {
                if (onJsonResponse) onJsonResponse(res.data)
            })
    .catch(console.error)
        } else {
            router.get(routeName,
            { 
                page: pageIndex + 1, 
                search: debouncedSearch,
                ...extraQuery,
                ...sortParam,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true
            })
        }

    }, [pageIndex, debouncedSearch, JSON.stringify(extraQuery), JSON.stringify(sorting)])

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
        selectedRows: table.getSelectedRowModel().rows
    }
}
