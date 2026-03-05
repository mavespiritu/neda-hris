import { Button } from "@/components/ui/button"
import { ChevronsLeft, ChevronsRight } from "lucide-react"

const PaginationControls = ({
  pageIndex = 0,
  pageCount = 1,
  setPageIndex,
  selectedRowsLength = 0,
}) => {
  const safePageIndex = Number.isFinite(pageIndex) ? pageIndex : 0
  const safePageCount = Number.isFinite(pageCount) ? pageCount : 1

  const getVisiblePageNumbers = () => {
    const maxVisible = 5
    const pages = []

    if (safePageCount <= maxVisible + 2) {
      for (let i = 0; i < safePageCount; i++) pages.push(i)
    } else {
      pages.push(0)
      if (safePageIndex > 2) pages.push("dots-start")

      const start = Math.max(1, safePageIndex - 1)
      const end = Math.min(safePageCount - 2, safePageIndex + 1)
      for (let i = start; i <= end; i++) pages.push(i)

      if (safePageIndex < safePageCount - 3) pages.push("dots-end")
      pages.push(safePageCount - 1)
    }

    return pages
  }

  const visiblePages = getVisiblePageNumbers()

  return (
    <div className="flex justify-between items-center flex-wrap gap-2 mt-1">
      <div className="text-xs font-medium leading-none text-muted-foreground">
        Page {safePageIndex + 1} of {safePageCount}
        {selectedRowsLength > 0 && (
          <span className="ml-2">
            • {selectedRowsLength} selected {selectedRowsLength === 1 ? "row" : "rows"}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          onClick={() => setPageIndex(Math.max(safePageIndex - 1, 0))}
          disabled={safePageIndex === 0}
          variant={safePageIndex === 0 ? "default" : "outline"}
          className="h-7 min-w-7 px-2 text-[11px] leading-none disabled:opacity-50"
        >
          <ChevronsLeft className="size-3.5" />
        </Button>

        <div className="flex gap-1 flex-wrap">
          {visiblePages.map((page, idx) => {
            if (typeof page !== "number") {
              return (
                <span
                  key={`dots-${idx}`}
                  className="h-7 px-1.5 flex items-center text-[11px] text-muted-foreground"
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
                className="h-7 min-w-7 px-2 text-[11px] leading-none"
              >
                {String(page + 1)}
              </Button>
            )
          })}
        </div>

        <Button
          onClick={() => setPageIndex(Math.min(safePageIndex + 1, safePageCount - 1))}
          disabled={safePageIndex >= safePageCount - 1}
          variant={safePageIndex >= safePageCount - 1 ? "default" : "outline"}
          className="h-7 min-w-7 px-2 text-[11px] leading-none disabled:opacity-50"
        >
          <ChevronsRight className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

export default PaginationControls
