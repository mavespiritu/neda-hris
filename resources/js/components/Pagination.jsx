import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

const Pagination = ({ page, totalPages, setPage }) => {

    const total = totalPages - 1

    const firstPage = (e) => {
        setPage(0)
        e.preventDefault()
    }

    const previousPage = (e) => {
        let pPage = page - 1
        if (pPage < 0) pPage = 0
        setPage(pPage)
        e.preventDefault()
    }

    const nextPage = (e) => {
        let nPage = page + 1
        if (nPage > total) nPage = total
        setPage(nPage)
        e.preventDefault()
    }

    const lastPage = (e) => {
        setPage(total)
        e.preventDefault()
    } 

  return (
    <div className="mt-4">
        <div className="flex items-center justify-between">
            <nav className="mx-auto relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <a
                    href="#!"
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-200 text-sm font-medium hover:bg-yellow-400"
                    onClick={(e) => firstPage(e)}
                >
                    <span className="sr-only">First</span>
                    <ChevronsLeft className="h-5 w-5" aria-hidden="true" />
                </a>                    
                <a
                    href="#!"
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-200 text-sm font-medium hover:bg-yellow-400"
                    onClick={(e) => previousPage(e)}
                >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </a>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-medium">
                    {page+1}
                </span>
                <a
                    href="#!"
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-200 text-sm font-medium hover:bg-yellow-400"
                    onClick={(e) => nextPage(e)}
                >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </a>
                <a
                    href="#!"
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-200 text-sm font-medium hover:bg-yellow-400"
                    onClick={(e) => lastPage(e)}
                >
                    <span className="sr-only">Last</span>
                    <ChevronsRight className="h-5 w-5" aria-hidden="true" />
                </a>                    
            </nav>
        </div>
    </div>
  )

}

export default Pagination