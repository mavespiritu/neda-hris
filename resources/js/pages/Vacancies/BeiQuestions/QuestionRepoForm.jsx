import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogDescription, 
    DialogClose,
    DialogFooter 
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useState, useEffect, useMemo } from 'react'
import { usePage, useForm } from '@inertiajs/react'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import SingleComboBox from "@/components/SingleComboBox"
import { useToast } from "@/hooks/use-toast"
import PaginationControls from "@/components/PaginationControls"
import { flexRender } from "@tanstack/react-table"
import { useTable } from '@/hooks/useTable'
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
    Search, 
} from 'lucide-react'

const QuestionRepoForm = ({ 
    isOpen, 
    setIsOpen, 
    setData 
}) => {

    const { toast } = useToast()
    const { vacancy } = usePage().props

    const [competencies, setCompetencies] = useState([])
    const [questions, setQuestions] = useState([])
    const [competencySelected, setCompetencySelected] = useState(null)
    const [hoveredRowId, setHoveredRowId] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    
    const fetchCompetencies = async () => {
        try {
            const response = await axios(route('vacancies.get-competencies'))

            setCompetencies(response.data)

        } catch (err) {
            console.log(err)
            toast({
                title: "Uh oh! Something went wrong.",
                description: "There was a problem with your request",
            })
        }
    }

    const {
        data,
        current_page,
        last_page: pageCount,
        total,
        per_page: perPage,
    } = questions

    const columns = useMemo(() => [
        {
            header: "#",
            cell: ({ row }) => row.index + 1,
        },
        {
            header: "Competencies",
            accessorKey: "competencies",
        },
        {
            header: "Question",
            accessorKey: "question",
            cell: ({ getValue }) => (
                <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: getValue() }}
                />
            ),
        },
    ], [hoveredRowId])

    const {
        table,
        form,
        search,
        setSearch,
        pageIndex,
        setPageIndex,
        selectedRows
    } = useTable({
        data,
        pageCount,
        pageSize: 10,
        currentPage: current_page,
        searchQuery: searchQuery,
        routeName: route('vacancies.get-questions'),
        columns,
        extraQuery: {
            competency: competencySelected 
        },
        responseType: 'json',
        onJsonResponse: setQuestions
    })

    useEffect(() => {
        if(isOpen){
            fetchCompetencies()
        }
    }, [isOpen])

    useEffect(() => {
        setPageIndex(0)
    }, [competencySelected])

    const handleCompetencyChange = (id) => {
        setCompetencySelected(id)
    }

  return (
    <Dialog 
        open={isOpen}
        onOpenChange={(open) => {
            if (!open) {
                setIsOpen(false)
            }
        }}
    >
        <DialogContent className="max-w-4xl w-full">
            <DialogHeader>
                <DialogTitle>Questions Repository</DialogTitle>
                <DialogDescription>Look for existing questions and re-use it by clicking the row.</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
                <div className="flex justify-between">
                    <div className="w-1/2">
                        <SingleComboBox 
                            items={competencies}
                            onChange={handleCompetencyChange}
                            placeholder="Filter by competency"
                            name="competency"
                            id="competency"
                            value={competencySelected}
                            width="w-fit"
                            className="w-full"
                        />
                    </div>
                    <div className="relative pl-2">
                        <Search className="absolute left-4 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            autoFocus
                            placeholder="Type to search..."
                            type="search"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setSearchQuery(e.target.value)
                                setPageIndex(0)
                            }}
                            className="pl-8 w-full max-w-xs text-sm rounded"
                        />
                    </div>
                </div>
                <div className="border rounded-lg">
                    <ScrollArea className="h-[400px]">
                        <Table>
                            <TableHeader className="bg-gray-100">
                            {table.getHeaderGroups().map(headerGroup => (
                                <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <TableHead key={header.id} className="px-4 py-2 font-medium text-gray-700">
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                                </TableRow>
                            ))}
                            </TableHeader>
                            <TableBody className="font-medium">
                                {data?.length > 0 ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow 
                                            key={row.id}
                                            onClick={() => {
                                                table.resetRowSelection()
                                                row.toggleSelected(true)
                                            }}
                                            onMouseEnter={() => setHoveredRowId(row.id)}
                                            onMouseLeave={() => setHoveredRowId(null)}
                                            className={cn(
                                                "transition cursor-pointer",
                                                row.getIsSelected() ? "bg-primary/20" : "bg-white"
                                            )}
                                            >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="p-4 text-center">
                                            No data found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>

                <PaginationControls
                    pageIndex={pageIndex}
                    pageCount={pageCount}
                    setPageIndex={setPageIndex}
                    selectedRowsLength={selectedRows.length}
                />

                <DialogFooter className="justify-end pt-4">
                    <DialogClose asChild>
                        <Button variant="ghost">Close</Button>
                    </DialogClose>
                    <Button
                        onClick={() => {
                            if (selectedRows.length > 0) {
                                const selected = selectedRows[0].original
                                setData(prev => ({
                                    ...prev,
                                    question: selected.question,
                                    ratings: selected.ratings,
                                    competencies: selected.competencyIds,
                                }))
                                setIsOpen(false)
                            } else {
                                toast({
                                    title: "No selection",
                                    description: "Please select a question first.",
                                })
                            }
                        }}
                        disabled={selectedRows.length === 0}
                    >
                        Save changes
                    </Button>
                </DialogFooter>
            </div>

        </DialogContent>
    </Dialog>
  )
}

export default QuestionRepoForm