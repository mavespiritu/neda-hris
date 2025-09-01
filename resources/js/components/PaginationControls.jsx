import { Button } from "@/components/ui/button"
import { ChevronsLeft, ChevronsRight } from "lucide-react"

const PaginationControls = ({
  pageIndex = 0,
  pageCount = 1,
  setPageIndex,
  selectedRowsLength = 0
}) => {
  const safePageIndex = Number.isFinite(pageIndex) ? pageIndex : 0
  const safePageCount = Number.isFinite(pageCount) ? pageCount : 1

  //if (safePageCount <= 1) return null

  const getVisiblePageNumbers = () => {
    const maxVisible = 5
    const pages = []

    if (safePageCount <= maxVisible + 2) {
      for (let i = 0; i < safePageCount; i++) pages.push(i)
    } else {
      pages.push(0) // Always show first

      if (safePageIndex > 2) pages.push("dots-start")

      const start = Math.max(1, safePageIndex - 1)
      const end = Math.min(safePageCount - 2, safePageIndex + 1)
      for (let i = start; i <= end; i++) pages.push(i)

      if (safePageIndex < safePageCount - 3) pages.push("dots-end")

      pages.push(safePageCount - 1) // Always show last
    }

    return pages
  }

  const visiblePages = getVisiblePageNumbers()

  return (
    <div className="flex justify-between items-center flex-wrap gap-2 mt-4">
    
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <Button
          onClick={() => setPageIndex(Math.max(safePageIndex - 1, 0))}
          disabled={safePageIndex === 0}
          variant={safePageIndex === 0 ? "default" : "outline"}
          className="disabled:opacity-50 h-8 px-3 text-sm"
        >
          <ChevronsLeft className="size-4" />
        </Button>

        {/* Page Buttons */}
        <div className="flex gap-1 flex-wrap">
          {visiblePages.map((page, idx) => {
            if (typeof page !== "number") {
              return (
                <span
                  key={`dots-${idx}`}
                  className="h-8 px-2 flex items-center text-xs text-gray-500"
                >
                  ...
                </span>
              )
            }

            return (
              <Button
                key={`page-${page}`}
                onClick={() => setPageIndex(page)}
                variant={page === safePageIndex ? "default" : "outline"}
                className="h-8 px-3 text-xs"
              >
                {String(page + 1)}
              </Button>
            )
          })}
        </div>

        {/* Next Button */}
        <Button
          onClick={() =>
            setPageIndex(Math.min(safePageIndex + 1, safePageCount - 1))
          }
          disabled={safePageIndex >= safePageCount - 1}
          variant={
            safePageIndex >= safePageCount - 1 ? "default" : "outline"
          }
          className="disabled:opacity-50 h-8 px-3 text-sm"
        >
          <ChevronsRight className="size-4" />
        </Button>
      </div>

      {selectedRowsLength > 0 && (
        <span className="text-sm font-medium">
          {selectedRowsLength} selected{" "}
          {selectedRowsLength === 1 ? "row" : "rows"}
        </span>
      )}
    </div>
  )
}

export default PaginationControls
