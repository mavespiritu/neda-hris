import { useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { buildPreviewOpcrRows } from "../utils/buildPreviewOpcrRows"

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

        <div className="rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-600">
          MFO/PAP and Success Indicator rows are shown in hierarchy order. The preview hides all edit actions.
        </div>

        <ScrollArea className="h-[72vh] min-h-0 flex-1 rounded-md border border-slate-200 bg-white">
          <Table className="w-full table-fixed">
            <TableHeader className="sticky top-0 z-10 bg-slate-50/90">
              <TableRow>
                <TableHead className="w-[90px] px-3 py-2 text-xs">No.</TableHead>
                <TableHead className="px-3 py-2 text-xs">Category</TableHead>
                <TableHead className="px-3 py-2 text-xs">Major Final Outputs/Programs, Activities, and Projects</TableHead>
                <TableHead className="px-3 py-2 text-xs">Success Indicator</TableHead>
                <TableHead className="px-3 py-2 text-xs">Division/Group/Staff Accountable</TableHead>
                <TableHead className="w-[130px] px-3 py-2 text-right text-xs">Weight</TableHead>
                <TableHead className="w-[160px] px-3 py-2 text-right text-xs">Allocated Budget</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.length > 0 ? (
                previewRows.map((row) => {
                  const categoryWeight =
                    row.categoryWeight === null || row.categoryWeight === undefined ? "-" : `${formatFixedNumber(row.categoryWeight)}%`
                  const categoryAmount = row.categoryAmount === null || row.categoryAmount === undefined ? "-" : formatFixedNumber(row.categoryAmount)
                  const indicatorWeight =
                    row.weight === null || row.weight === undefined ? "-" : `${formatFixedNumber(row.weight)}%`
                  const indicatorAmount = row.amount === null || row.amount === undefined ? "-" : formatFixedNumber(row.amount)
                  const assignments = row.assignments?.length ? formatAssignments(row.assignments) : "-"

                  return (
                    <TableRow key={row.key} className={row.showCategory ? "bg-white" : "bg-slate-50/50"}>
                      <TableCell className="align-middle px-3 py-1 text-xs text-slate-500">{row.rowNumber}</TableCell>
                      <TableCell className="align-middle px-3 py-1 text-sm font-medium text-slate-900 whitespace-normal break-words">
                        {row.showCategory ? formatText(row.categoryLabel) : ""}
                      </TableCell>
                      <TableCell className="align-middle px-3 py-1 text-sm text-slate-900 whitespace-normal break-words">
                        {row.papLabel ? (
                          <div className="flex items-center gap-2" style={{ paddingLeft: `${row.papDepth * 1.25}rem` }}>
                            <span className="text-slate-300">-</span>
                            <span className="whitespace-normal break-words">{formatText(row.papLabel)}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="align-middle px-3 py-1 text-sm text-slate-900 whitespace-normal break-words">
                        {row.indicatorLabel ? (
                          <div className="flex items-center gap-2" style={{ paddingLeft: `${row.indicatorDepth * 1.25}rem` }}>
                            <span className="text-slate-300">-</span>
                            <span className="whitespace-normal break-words">{formatText(row.indicatorLabel)}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="align-middle px-3 py-1 text-xs text-slate-700 whitespace-normal break-words">
                        {assignments}
                      </TableCell>
                      <TableCell className="align-middle px-3 py-1 text-right text-xs font-semibold text-slate-900 tabular-nums">
                        {row.showCategory ? categoryWeight : indicatorWeight}
                      </TableCell>
                      <TableCell className="align-middle px-3 py-1 text-right text-xs font-semibold text-slate-900 tabular-nums">
                        {row.showCategory ? categoryAmount : indicatorAmount}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-slate-500">
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
