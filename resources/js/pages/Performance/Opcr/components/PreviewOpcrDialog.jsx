import { useEffect, useMemo, useRef, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { buildPreviewOpcrRows } from "../utils/buildPreviewOpcrRows"
import { previewHierarchyBadgeStyles, previewHierarchyStyles } from "../utils/previewHierarchyStyles"

export default function PreviewOpcrDialog({
  open,
  onOpenChange,
  categoryRows = [],
  periodLabel = "",
  formatText,
  formatFixedNumber,
  formatAssignments,
}) {
  const previewRows = useMemo(() => buildPreviewOpcrRows(categoryRows), [categoryRows])
  const [flashType, setFlashType] = useState(null)
  const flashTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) {
        window.clearTimeout(flashTimerRef.current)
      }
    }
  }, [])

  const triggerFlash = (type) => {
    setFlashType(type)
    if (flashTimerRef.current) {
      window.clearTimeout(flashTimerRef.current)
    }
    flashTimerRef.current = window.setTimeout(() => setFlashType(null), 700)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92vh] w-full max-w-[96vw] flex-col overflow-hidden">
        <DialogHeader className="space-y-2">
          <DialogTitle>OPCR Preview{periodLabel ? ` - ${periodLabel}` : ""}</DialogTitle>
          <DialogDescription>
            Read-only preview of the saved Planning and Commitment tree. Category totals are shown only on category
            rows.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/70 px-3 py-2 text-[11px] text-slate-600">
          <span className="font-semibold uppercase tracking-wide text-slate-500">Legend</span>
          <button type="button" onClick={() => triggerFlash("category")} className="rounded-full">
            <Badge variant="secondary" className={previewHierarchyBadgeStyles.category}>
              Category
            </Badge>
          </button>
          <button type="button" onClick={() => triggerFlash("program")} className="rounded-full">
            <Badge variant="secondary" className={previewHierarchyBadgeStyles.program}>
              Program
            </Badge>
          </button>
          <button type="button" onClick={() => triggerFlash("pap")} className="rounded-full">
            <Badge variant="secondary" className={previewHierarchyBadgeStyles.pap}>
              MFO/PAP
            </Badge>
          </button>
          <button type="button" onClick={() => triggerFlash("successIndicator")} className="rounded-full">
            <Badge variant="secondary" className={previewHierarchyBadgeStyles.successIndicator}>
              Success Indicator
            </Badge>
          </button>
        </div>

        <ScrollArea className="h-[72vh] min-h-0 flex-1 rounded-md border border-slate-200 bg-white">
          <Table className="w-full table-fixed">
            <TableHeader className="sticky top-0 z-10 bg-slate-50/90">
              <TableRow>
                <TableHead className="w-[90px] px-3 py-2 text-xs">No.</TableHead>
                <TableHead className="px-3 py-2 text-xs">Success Indicator</TableHead>
                <TableHead className="w-[240px] px-3 py-2 text-xs">Division/Group/Staff Accountable</TableHead>
                <TableHead className="w-[130px] px-3 py-2 text-right text-xs">Weight</TableHead>
                <TableHead className="w-[160px] px-3 py-2 text-right text-xs">Allocated Budget</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.length > 0 ? (
                previewRows.map((row) => {
                    const rowClassName =
                      row.type === "category"
                        ? previewHierarchyStyles.category
                        : row.type === "program"
                          ? previewHierarchyStyles.program
                          : row.type === "pap"
                            ? previewHierarchyStyles.pap
                            : row.type === "successIndicator"
                              ? previewHierarchyStyles.successIndicator
                              : previewHierarchyStyles.category
                    const flashClassName =
                      flashType === row.type ? "ring-2 ring-inset ring-slate-500/35 animate-pulse" : ""
                  const metricClassName =
                    row.type === "successIndicator"
                      ? "text-xs font-normal text-slate-900 tabular-nums"
                      : "text-sm font-semibold text-slate-900 tabular-nums"
                  const categoryWeight =
                    row.categoryWeight === null || row.categoryWeight === undefined ? "-" : `${formatFixedNumber(row.categoryWeight)}%`
                  const categoryAmount = row.categoryAmount === null || row.categoryAmount === undefined ? "-" : formatFixedNumber(row.categoryAmount)
                  const indicatorWeight =
                    row.weight === null || row.weight === undefined ? "-" : `${formatFixedNumber(row.weight)}%`
                  const indicatorAmount = row.amount === null || row.amount === undefined ? "-" : formatFixedNumber(row.amount)
                  const assignments = row.assignments?.length ? formatAssignments(row.assignments) : ""

                  return (
                    <TableRow key={row.key} className={`${rowClassName} ${flashClassName}`} data-preview-row={row.type}>
                      <TableCell className="align-middle px-3 py-1 text-xs text-slate-500">{row.rowNumber}</TableCell>
                      <TableCell className="align-middle px-3 py-1 text-sm font-medium text-slate-900 whitespace-normal break-words">
                        {row.type === "category" ? (
                          formatText(row.categoryLabel)
                        ) : row.type === "program" ? (
                          <div className="flex items-center gap-2" style={{ paddingLeft: `${row.papDepth * 1.25}rem` }}>
                            <span className="whitespace-normal break-words font-semibold uppercase tracking-wide text-slate-600">
                              {formatText(row.papLabel)}
                            </span>
                          </div>
                        ) : row.type === "pap" ? (
                          <div className="flex items-center gap-2" style={{ paddingLeft: `${row.papDepth * 1.25}rem` }}>
                            <span className="whitespace-normal break-words">{formatText(row.papLabel)}</span>
                          </div>
                        ) : row.type === "successIndicator" ? (
                          <div className="flex items-center gap-2" style={{ paddingLeft: `${(row.indicatorDepth + 1) * 1.25}rem` }}>
                            <span className="whitespace-normal break-words">{formatText(row.indicatorLabel)}</span>
                          </div>
                        ) : (
                          ""
                        )}
                      </TableCell>
                      <TableCell className="align-middle px-3 py-1 text-xs text-slate-700 whitespace-normal break-words">
                        {row.type === "successIndicator" ? assignments : ""}
                      </TableCell>
                      <TableCell className={`align-middle px-3 py-1 text-right ${metricClassName}`}>
                        {row.showCategory ? categoryWeight : indicatorWeight}
                      </TableCell>
                      <TableCell className={`align-middle px-3 py-1 text-right ${metricClassName}`}>
                        {row.showCategory ? categoryAmount : indicatorAmount}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-slate-500">
                    No saved OPCR tree available for preview.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
