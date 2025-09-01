import { useState } from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTable } from '@/hooks/useTable'
import { usePage } from '@inertiajs/react'
import { User, Briefcase, Clock, ChevronRight } from 'lucide-react'
import PaginationControls from '@/components/PaginationControls'
import StatusBadge from '@/components/StatusBadge'
import { Input } from "@/components/ui/input"
import { store } from "./store"
import { 
    Search, 
} from 'lucide-react'

const SubmissionList = () => {
  const { submissions } = usePage().props

  const {
        selectedSubmission,
        setSelectedSubmission,
    } = store()

  const {
    data,
    current_page,
    last_page: pageCount,
    total,
    per_page: perPage,
  } = submissions

  const [hoveredRowId, setHoveredRowId] = useState(null)
  const [showSearch, setShowSearch] = useState(false)

  const {
    pageIndex,
    setPageIndex,
    selectedRows,
    search,
    setSearch
  } = useTable({
    data,
    pageCount,
    pageSize: perPage,
    currentPage: current_page,
    searchQuery: '',
    routeName: route('cga.review'),
    columns: []
  })

  return (
    <div className="h-full">
      <div className="flex-grow grid grid-rows-[auto,auto,1fr,auto] h-full gap-4 p-2">
        <div className="w-full flex gap-4">
            <div className="relative w-full">
                <Search className="absolute left-4 top-2.5 h-3 w-3 text-muted-foreground" />
                <Input
                    autoFocus
                    placeholder="Type to search..."
                    type="search"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        setPageIndex(0)
                    }}
                    onBlur={() => setShowSearch(false)}
                    className="pl-8 w-full text-xs rounded-m h-8"
                />
            </div>
        </div>
        <span className="text-xs font-medium">
            {!data || data.length === 0 ? (
                <>Showing 0 items</>
                ) : (
                <>
                    Showing {(pageIndex * perPage) + 1} - {Math.min((pageIndex + 1) * perPage, total)} of {total} items
                </>
            )}
        </span>
        <ScrollArea className="h-full border rounded-lg p-4">
          <div className="h-12 space-y-4">
            {data.length > 0 ? (
              data.map((submission) => (
                <div
                  key={submission.id}
                  onClick={() => setSelectedSubmission(submission)}
                  onMouseEnter={() => setHoveredRowId(submission.id)}
                  onMouseLeave={() => setHoveredRowId(null)}
                  className={`p-4 border rounded-lg shadow-sm hover:shadow-md transition cursor-pointer ${
                    selectedSubmission?.id === submission.id ? 'bg-muted' : 'bg-white'
                }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>{submission.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Briefcase className="w-3.5 h-3.5 text-gray-500" />
                        <span>{submission.position}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                        <span>{submission.date_submitted}</span>
                      </div>
                      <div className="pt-1">
                        <StatusBadge status={submission.status} />
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 mt-1 text-gray-400" />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center text-sm text-gray-500 h-full">
                No submissions found
              </div>
            )}
          </div>
        </ScrollArea>
        <PaginationControls
          pageIndex={pageIndex}
          pageCount={pageCount}
          setPageIndex={setPageIndex}
          selectedRowsLength={selectedRows.length}
        />
      </div>
    </div>
  )
}

export default SubmissionList
