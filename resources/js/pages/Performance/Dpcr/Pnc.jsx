import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { Loader2, Pencil, Plus, Star, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import SearchableComboBox from "@/components/SearchableComboBox"
import { useHasPermission } from "@/hooks/useAuth"
import { hydrateOpcrTree } from "../Opcr/utils/hydrateOpcrTree"
import { buildPreviewOpcrRows } from "../Opcr/utils/buildPreviewOpcrRows"
import { previewHierarchyBadgeStyles, previewHierarchyStyles } from "../Opcr/utils/previewHierarchyStyles"
import SuccessIndicatorMatrixSheet from "../Libraries/SuccessIndicators/SuccessIndicatorMatrixSheet"

const monthFields = [
  { key: "jan", label: "J" },
  { key: "feb", label: "F" },
  { key: "mar", label: "M" },
  { key: "apr", label: "A" },
  { key: "may", label: "M" },
  { key: "jun", label: "J" },
  { key: "jul", label: "J" },
  { key: "aug", label: "A" },
  { key: "sep", label: "S" },
  { key: "oct", label: "O" },
  { key: "nov", label: "N" },
  { key: "dec", label: "D" },
]

const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") return "-"
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value
}

const formatText = (value, fallback = "-") => {
  const text = String(value ?? "").trim()
  return text.length ? text : fallback
}

const formatFixedNumber = (value, digits = 2) => {
  if (value === null || value === undefined || value === "") return "-"
  const numeric = Number(value)
  return Number.isFinite(numeric)
    ? numeric.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })
    : value
}

const formatAssignmentLabel = (value, groupMap = {}, employeeMap = {}, divisionMap = {}) => {
  const raw = String(value ?? "").trim()
  if (!raw) return ""

  const hasKindPrefix = raw.includes(":")
  const [kind, id] = hasKindPrefix ? raw.split(":", 2) : ["", raw]

  if (!hasKindPrefix) {
    if (id === "all") return "All Divisions"
    return divisionMap[id] || groupMap[id] || employeeMap[id] || id
  }

  if (kind === "division") return id === "all" ? "All Divisions" : divisionMap[id] || id
  if (kind === "group") return groupMap[id] || id
  if (kind === "employee") return employeeMap[id] || id
  if (kind === "division" && id === "all") return "All Divisions"
  return id
}

const formatAssignments = (values = [], groupMap = {}, employeeMap = {}, divisionMap = {}) => {
  if (!Array.isArray(values) || values.length === 0) return "-"

  const formatted = values
    .map((value) => formatAssignmentLabel(value, groupMap, employeeMap, divisionMap))
    .filter(Boolean)
    .join(", ")

  return formatted.length ? formatted : "-"
}

const rowVisibilityStorageKey = "performance.dpcr.pnc.rowVisibility"

const dpcrPreviewHierarchyBadgeStyles = {
  ...previewHierarchyBadgeStyles,
  prexcActivity: "inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800",
  prexcSubActivity: "inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800",
  dpcrSuccessIndicator: "inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800",
}

const dpcrPreviewHierarchyStyles = {
  ...previewHierarchyStyles,
  prexcActivity: "border-l-4 border-l-blue-300 bg-blue-100 hover:bg-blue-200/70",
  prexcSubActivity: "border-l-4 border-l-orange-300 bg-orange-100 hover:bg-orange-200/70",
  dpcrSuccessIndicator: "border-l-4 border-l-rose-300 bg-rose-100 hover:bg-rose-200/70",
}

const dpcrLegendInteractiveClassName = "rounded-full transition-transform duration-150 hover:scale-[1.02] active:scale-95"

export default function Pnc({
  record = null,
  sourceRecord = null,
  dpcrRecord = null,
  viewMode = "dpcr",
  onAddSuccessIndicator,
  onAddSpecificAO,
  onEditSuccessIndicator,
  onRemoveSuccessIndicator,
  groupMap = {},
  employeeMap = {},
  divisionMap = {},
  categories = [],
  selectedDivisionLabel = "",
  ppmpHierarchy = [],
}) {
  const rows = Array.isArray(sourceRecord?.items) ? sourceRecord.items.filter((item) => item?.success_indicator_id) : []
  const canEdit = useHasPermission("HRIS_performance.dpcr.edit")
  const [pickerOpenId, setPickerOpenId] = useState(null)
  const [rowVisibility, setRowVisibility] = useState(() => ({
    category: true,
    program: true,
    pap: true,
    prexcActivity: true,
    prexcSubActivity: true,
  }))
  const [matrixSheetOpen, setMatrixSheetOpen] = useState(false)
  const [selectedMatrixIndicator, setSelectedMatrixIndicator] = useState(null)
  const [isTableLoading, setIsTableLoading] = useState(false)
  const [flashType, setFlashType] = useState(null)
  const flashTimerRef = useRef(null)
  const tableLoadingTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) {
        window.clearTimeout(flashTimerRef.current)
      }
      if (tableLoadingTimerRef.current) {
        window.clearTimeout(tableLoadingTimerRef.current)
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

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(rowVisibilityStorageKey)
      if (!stored) return

      const parsed = JSON.parse(stored)
      setRowVisibility((current) => ({
        ...current,
        ...(typeof parsed === "object" && parsed ? parsed : {}),
      }))
    } catch {
      // Ignore malformed localStorage values and keep defaults.
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(rowVisibilityStorageKey, JSON.stringify(rowVisibility))
    } catch {
      // Ignore storage write failures.
    }
  }, [rowVisibility])

  const toggleRowVisibility = (type, checked) => {
    setRowVisibility((current) => ({
      ...current,
      [type]: checked === true,
    }))
  }

  const openMatrixSheet = (indicator) => {
    setSelectedMatrixIndicator(indicator ?? null)
    setMatrixSheetOpen(true)
  }

  const flashRows = (type) => {
    const nodes = document.querySelectorAll(`[data-preview-row="${type}"]`)
    if (!nodes.length) return

    nodes.forEach((node) => {
      node.classList.add("ring-4", "ring-inset", "ring-slate-700/45", "animate-pulse")
    })

    window.setTimeout(() => {
      nodes.forEach((node) => {
        node.classList.remove("ring-4", "ring-inset", "ring-slate-700/45", "animate-pulse")
      })
    }, 700)
  }
  const opcrPreviewRows = useMemo(() => {
    const hydratedCategories = hydrateOpcrTree(categories, Array.isArray(sourceRecord?.items) ? sourceRecord.items : [])
    return buildPreviewOpcrRows(hydratedCategories)
  }, [categories, sourceRecord?.items])
  const visiblePreviewRows = useMemo(() => {
    return opcrPreviewRows.filter((row) => {
      if (row.type === "category") return rowVisibility.category
      if (row.type === "program") return rowVisibility.program
      if (row.type === "pap") return rowVisibility.pap
      return true
    })
  }, [opcrPreviewRows, rowVisibility])
  const dpcrSuccessIndicatorsBySourceItemId = useMemo(() => {
    const map = new Map()

    ;(Array.isArray(dpcrRecord?.items) ? dpcrRecord.items : []).forEach((item) => {
      const sourceOpcrItemId = String(item?.source_opcr_item_id ?? "").trim()
      if (!sourceOpcrItemId) return

      if (!map.has(sourceOpcrItemId)) {
        map.set(sourceOpcrItemId, [])
      }

      map.get(sourceOpcrItemId).push(item)
    })

    return map
  }, [dpcrRecord?.items])
  const prexcCodeMaps = useMemo(() => {
    const activityCodeMap = new Map()
    const subActivityCodeMap = new Map()
    const normalizeCode = (value) => String(value ?? "").trim()

    const buildPrefix = (context = {}) => {
      const shortCode = normalizeCode(context.papShortCode)
      if (shortCode) {
        return shortCode
      }

      return [
        context.costStructureCode,
        context.outcomeCode,
        context.programCode,
        context.subProgramCode,
        context.identifierCode,
        context.papCode,
      ]
        .map(normalizeCode)
        .filter(Boolean)
        .join("")
    }

    const walk = (nodes = [], context = {}) => {
      nodes.forEach((node) => {
        const nextContext = {
          ...context,
          costStructureCode: normalizeCode(node?.code) || context.costStructureCode || "",
        }

        ;(node?.outcomes ?? []).forEach((outcome) => {
          const outcomeContext = {
            ...nextContext,
            outcomeCode: normalizeCode(outcome?.code) || nextContext.outcomeCode || "",
          }

          ;(outcome?.programs ?? []).forEach((program) => {
            const programContext = {
              ...outcomeContext,
              programCode: normalizeCode(program?.code) || outcomeContext.programCode || "",
            }

            ;(program?.sub_programs ?? []).forEach((subProgram) => {
              const subProgramContext = {
                ...programContext,
                subProgramCode: normalizeCode(subProgram?.code) || programContext.subProgramCode || "",
              }

              ;(subProgram?.identifiers ?? []).forEach((identifier) => {
                const identifierContext = {
                  ...subProgramContext,
                  identifierCode: normalizeCode(identifier?.code) || subProgramContext.identifierCode || "",
                }

                ;(identifier?.paps ?? []).forEach((pap) => {
                  const papContext = {
                    ...identifierContext,
                    papShortCode: normalizeCode(pap?.short_code),
                    papCode: normalizeCode(pap?.code) || identifierContext.papCode || "",
                  }
                  const papPrefix = buildPrefix(papContext)

                  ;(pap?.activities ?? []).forEach((activity) => {
                    const activityKey = String(activity?.id ?? "")
                    const activityCode = normalizeCode(activity?.code)
                    const activityDisplayCode = [papPrefix, activityCode].filter(Boolean).join("-")

                    if (activityKey && !activityCodeMap.has(activityKey)) {
                      activityCodeMap.set(activityKey, activityDisplayCode)
                    }

                    ;(activity?.sub_activities ?? []).forEach((subActivity) => {
                      const subActivityKey = String(subActivity?.id ?? "")
                      const subActivityCode = normalizeCode(subActivity?.code)
                      const subActivityDisplayCode = [papPrefix, subActivityCode].filter(Boolean).join("-")

                      if (subActivityKey && !subActivityCodeMap.has(subActivityKey)) {
                        subActivityCodeMap.set(subActivityKey, subActivityDisplayCode)
                      }
                    })
                  })
                })
              })
            })
          })
        })
      })
    }

    walk(Array.isArray(ppmpHierarchy) ? ppmpHierarchy : [])

    return { activityCodeMap, subActivityCodeMap }
  }, [ppmpHierarchy])

  useEffect(() => {
    setIsTableLoading(true)

    if (tableLoadingTimerRef.current) {
      window.clearTimeout(tableLoadingTimerRef.current)
    }

    tableLoadingTimerRef.current = window.setTimeout(() => setIsTableLoading(false), 220)
  }, [visiblePreviewRows, rowVisibility])
  const groupedRows = useMemo(() => {
    const groupMap = new Map()

    rows.forEach((item) => {
      const key = String(item.pap_id ?? item.pap_title ?? item.pap ?? item.title ?? item.id ?? "")
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          key,
          papTitle: item.pap_title ?? item.pap_label ?? item.pap ?? item.title ?? "",
          items: [],
          weight: 0,
          budget: 0,
          assignments: [],
          sourceItem: item,
        })
      }

      const group = groupMap.get(key)
      group.items.push(item)
      group.weight += Number(item.weight ?? 0) || 0
      group.budget += Number(item.allocated_budget ?? item.budget ?? 0) || 0
      group.assignments.push(
        ...(Array.isArray(item.group_assignments) ? item.group_assignments.map((value) => `group:${String(value)}`) : []),
        ...(Array.isArray(item.employee_assignments) ? item.employee_assignments.map((value) => `employee:${String(value)}`) : [])
      )
    })

    return Array.from(groupMap.values())
  }, [rows])

  if (viewMode === "opcr") {
    return (
      <Card className="border border-slate-200 bg-white shadow-none">
        <CardHeader className="border-b border-slate-200 bg-slate-50/60 px-3 py-3">
          <div className="space-y-1">
            <CardTitle className="text-base">Planning and Commitment</CardTitle>
            <CardDescription>
              Read-only preview of the OPCR tree assigned to the selected division and year{selectedDivisionLabel ? ` - ${selectedDivisionLabel}` : ""}.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/70 px-3 py-2 text-[11px] text-slate-600">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold uppercase tracking-wide text-slate-500">Legend</span>
              {rowVisibility.category && (
                <button type="button" onClick={() => triggerFlash("category")} className={dpcrLegendInteractiveClassName}>
                  <span className={previewHierarchyBadgeStyles.category}>
                    Category
                  </span>
                </button>
              )}
              {rowVisibility.program && (
                <button type="button" onClick={() => triggerFlash("program")} className={dpcrLegendInteractiveClassName}>
                  <span className={previewHierarchyBadgeStyles.program}>
                    Program
                  </span>
                </button>
              )}
              {rowVisibility.pap && (
                <button type="button" onClick={() => triggerFlash("pap")} className={dpcrLegendInteractiveClassName}>
                  <span className={previewHierarchyBadgeStyles.pap}>
                    MFO/PAP
                  </span>
                </button>
              )}
              <button type="button" onClick={() => triggerFlash("successIndicator")} className={dpcrLegendInteractiveClassName}>
                <span className={previewHierarchyBadgeStyles.successIndicator}>
                  Success Indicator (OPCR Level)
                </span>
              </button>
              {rowVisibility.prexcActivity && (
                <button type="button" onClick={() => triggerFlash("prexcActivity")} className={dpcrLegendInteractiveClassName}>
                  <span className={previewHierarchyBadgeStyles.prexcActivity}>
                    PREXC Activity
                  </span>
                </button>
              )}
              {rowVisibility.prexcSubActivity && (
                <button type="button" onClick={() => triggerFlash("prexcSubActivity")} className={dpcrLegendInteractiveClassName}>
                  <span className={previewHierarchyBadgeStyles.prexcSubActivity}>
                    PREXC Sub-activity
                  </span>
                </button>
              )}
              <button type="button" onClick={() => triggerFlash("dpcrSuccessIndicator")} className="rounded-full">
                <span className={previewHierarchyBadgeStyles.dpcrSuccessIndicator}>
                  Success Indicator (DPCR Level)
                </span>
              </button>
            </div>
          </div>
          <div className="relative">
            <ScrollArea className={`h-[72vh] min-h-0 flex-1 rounded-b-lg ${isTableLoading ? "blur-sm" : ""}`}>
            <Table className="w-full table-fixed">
              <TableHeader className="sticky top-0 z-10 bg-slate-50/90">
                <TableRow>
                  <TableHead className="w-[90px] px-3 py-2 text-xs">No.</TableHead>
                  <TableHead className="w-[180px] px-3 py-2 text-xs">Category</TableHead>
                  <TableHead className="w-[320px] px-3 py-2 text-xs">Major Final Outputs/Programs, Activities, and Projects</TableHead>
                  <TableHead className="w-[320px] px-3 py-2 text-xs">Success Indicator</TableHead>
                  <TableHead className="w-[240px] px-3 py-2 text-xs">Division/Group/Staff Accountable</TableHead>
                  <TableHead className="w-[130px] px-3 py-2 text-right text-xs">Weight</TableHead>
                  <TableHead className="w-[160px] px-3 py-2 text-right text-xs">Allocated Budget</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opcrPreviewRows.length > 0 ? (
                  opcrPreviewRows.map((row) => {
                    const rowClassName =
                      row.type === "category"
                        ? "border-l-4 border-l-sky-300 bg-sky-50/80 hover:bg-sky-100/70"
                        : row.type === "program"
                          ? "border-l-4 border-l-amber-300 bg-amber-50/70 hover:bg-amber-100/60"
                          : row.type === "pap"
                            ? "border-l-4 border-l-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/50"
                            : row.type === "successIndicator"
                              ? "border-l-4 border-l-violet-300 bg-violet-50/70 hover:bg-violet-100/60"
                              : "border-l-4 border-l-sky-300 bg-sky-50/80 hover:bg-sky-100/70"

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
                    const assignments = row.assignments?.length ? formatAssignments(row.assignments, groupMap, employeeMap, divisionMap) : ""

                    return (
                      <TableRow key={row.key} className={rowClassName}>
                        <TableCell className="align-middle px-3 py-1 text-xs text-slate-500">{row.rowNumber}</TableCell>
                        <TableCell className="align-middle px-3 py-1 text-sm font-medium text-slate-900 whitespace-normal break-words">
                          {row.type === "category" ? formatText(row.categoryLabel) : ""}
                        </TableCell>
                        {row.type === "successIndicator" ? (
                          <>
                            <TableCell className="align-middle px-3 py-1" />
                            <TableCell className="w-[320px] align-middle px-3 py-1 text-sm text-slate-900 whitespace-normal break-words">
                              {row.indicatorLabel ? (
                                <div className="flex items-center gap-2" style={{ paddingLeft: `${(row.indicatorDepth + 1) * 1.25}rem` }}>
                                  <span className="whitespace-normal break-words">{formatText(row.indicatorLabel)}</span>
                                </div>
                              ) : (
                                ""
                              )}
                            </TableCell>
                            <TableCell className="align-middle px-3 py-1 text-xs text-slate-700 whitespace-normal break-words">
                              {assignments}
                            </TableCell>
                          </>
                        ) : (
                          <TableCell colSpan={3} className="align-middle px-3 py-1 text-sm text-slate-900 whitespace-normal break-words">
                            {row.type === "program" ? (
                              <div className="flex items-center gap-2" style={{ paddingLeft: `${row.papDepth * 1.25}rem` }}>
                                <span className="whitespace-normal break-words font-semibold uppercase tracking-wide text-slate-600">
                                  {formatText(row.papLabel)}
                                </span>
                              </div>
                            ) : row.type === "pap" ? (
                              <div className="flex items-center gap-2" style={{ paddingLeft: `${row.papDepth * 1.25}rem` }}>
                                <span className="whitespace-normal break-words">{formatText(row.papLabel)}</span>
                              </div>
                            ) : (
                              ""
                            )}
                          </TableCell>
                        )}
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
                    <TableCell colSpan={7} className="py-8 text-center text-sm text-slate-500">
                      No assigned OPCR items available for preview.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (viewMode === "dpcr") {
    return (
    <TooltipProvider delayDuration={0}>
      <Card className="border border-slate-200 bg-white shadow-none">
        <CardHeader className="border-b border-slate-200 bg-slate-50/60 px-3 py-3">
          <div className="space-y-1">
            <CardTitle className="text-base">Planning and Commitment</CardTitle>
            <CardDescription>
              During this stage, success indicators are determined. Success indicators are performance level yardsticks
              consisting of performance measures and performance targets. These shall serve as bases in the office&apos;s
              and individual employee&apos;s preparation of their performance contract and rating form.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/70 px-3 py-2 text-[11px] text-slate-600">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold uppercase tracking-wide text-slate-500">Legend</span>
              {rowVisibility.category && (
                <button type="button" onClick={() => triggerFlash("category")} className={dpcrLegendInteractiveClassName}>
                  <span className={dpcrPreviewHierarchyBadgeStyles.category}>
                    Category
                  </span>
                </button>
              )}
              {rowVisibility.program && (
                <button type="button" onClick={() => triggerFlash("program")} className={dpcrLegendInteractiveClassName}>
                  <span className={dpcrPreviewHierarchyBadgeStyles.program}>
                    Program
                  </span>
                </button>
              )}
              {rowVisibility.pap && (
                <button type="button" onClick={() => triggerFlash("pap")} className={dpcrLegendInteractiveClassName}>
                  <span className={dpcrPreviewHierarchyBadgeStyles.pap}>
                    MFO/PAP
                  </span>
                </button>
              )}
              <button type="button" onClick={() => triggerFlash("successIndicator")} className={dpcrLegendInteractiveClassName}>
                <span className={dpcrPreviewHierarchyBadgeStyles.successIndicator}>
                  Success Indicator (OPCR Level)
                </span>
              </button>
              {rowVisibility.prexcActivity && (
                <button type="button" onClick={() => triggerFlash("prexcActivity")} className={dpcrLegendInteractiveClassName}>
                  <span className={dpcrPreviewHierarchyBadgeStyles.prexcActivity}>
                    PREXC Activity
                  </span>
                </button>
              )}
              {rowVisibility.prexcSubActivity && (
                <button type="button" onClick={() => triggerFlash("prexcSubActivity")} className={dpcrLegendInteractiveClassName}>
                  <span className={dpcrPreviewHierarchyBadgeStyles.prexcSubActivity}>
                    PREXC Sub-activity
                  </span>
                </button>
              )}
              <button type="button" onClick={() => triggerFlash("dpcrSuccessIndicator")} className={dpcrLegendInteractiveClassName}>
                <span className={dpcrPreviewHierarchyBadgeStyles.dpcrSuccessIndicator}>
                  Success Indicator (DPCR Level)
                </span>
              </button>
            </div>

            <div className="ml-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="h-8 gap-2 px-3 text-xs">
                    Show/Hide Rows
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 p-3">
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Row Visibility</div>
                      <div className="text-xs text-slate-500">Toggle the hierarchy rows shown in the DPCR table.</div>
                    </div>
                    <div className="space-y-2">
                      {[
                        { key: "category", label: "Category" },
                        { key: "program", label: "Program" },
                        { key: "pap", label: "MFO/PAP" },
                        { key: "prexcActivity", label: "PREXC Activity" },
                        { key: "prexcSubActivity", label: "PREXC Sub-activity" },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Checkbox
                            checked={rowVisibility[item.key]}
                            onCheckedChange={(checked) => toggleRowVisibility(item.key, checked)}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <ScrollArea className="h-[72vh] min-h-0 flex-1 rounded-b-lg">
            <Table className="w-full table-fixed">
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead rowSpan={2} className="w-[90px] px-3 py-2 text-xs align-middle">
                    No.
                  </TableHead>
                  <TableHead rowSpan={2} className="px-3 py-2 text-xs align-middle">
                    Success Indicator
                  </TableHead>
                  <TableHead rowSpan={2} className="px-3 py-2 text-xs align-middle">
                    Specific Activity/Output
                  </TableHead>
                  <TableHead colSpan={12} className="px-3 py-2 text-center text-xs align-middle">
                    Monthly Targets
                  </TableHead>
                  <TableHead rowSpan={2} className="px-3 py-2 text-xs align-right">
                    Group/Staff Accountable
                  </TableHead>
                  <TableHead rowSpan={2} className="w-[110px] px-3 py-2 text-right text-xs align-middle">
                    Weight
                  </TableHead>
                  <TableHead rowSpan={2} className="w-[140px] px-3 py-2 text-right text-xs align-middle">
                    Allocated Budget
                  </TableHead>
                  <TableHead rowSpan={2} className="w-[112px] px-3 py-2 text-right text-xs align-middle">
                    Actions
                  </TableHead>
                </TableRow>
                <TableRow>
                  {monthFields.map((field) => (
                    <TableHead
                      key={field.key}
                      className="w-[2%] px-1 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {field.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visiblePreviewRows.length > 0 ? (
                  visiblePreviewRows.map((row) => {
                    const rowClassName =
                      row.type === "category"
                        ? dpcrPreviewHierarchyStyles.category
                        : row.type === "program"
                          ? dpcrPreviewHierarchyStyles.program
                          : row.type === "pap"
                            ? dpcrPreviewHierarchyStyles.pap
                            : row.type === "successIndicator"
                              ? row.sourceItem?.dpcr_level
                                ? dpcrPreviewHierarchyStyles.dpcrSuccessIndicator
                                : dpcrPreviewHierarchyStyles.successIndicator
                              : dpcrPreviewHierarchyStyles.category

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
                    const childDpcrIndicators =
                      row.type === "successIndicator"
                        ? dpcrSuccessIndicatorsBySourceItemId.get(String(row.sourceItem?.opcr_item_id ?? row.sourceItem?.id ?? "")) ?? []
                        : []

                    const childDpcrRows =
                      row.type === "successIndicator"
                        ? childDpcrIndicators.flatMap((indicator, indicatorIndex) => {
                            const childAssignments = formatAssignments(
                              [
                                ...(Array.isArray(indicator.group_assignments) ? indicator.group_assignments : []),
                                ...(Array.isArray(indicator.employee_assignments) ? indicator.employee_assignments : []),
                              ],
                              groupMap,
                              employeeMap,
                              divisionMap
                            )

                            const childWeight =
                              indicator.weight === null || indicator.weight === undefined
                                ? "-"
                                : `${formatFixedNumber(indicator.weight)}%`
                            const childBudget =
                              indicator.allocated_budget === null || indicator.allocated_budget === undefined
                                ? "-"
                                : formatFixedNumber(indicator.allocated_budget)
                            const childRowNumber = `${row.rowNumber}.${indicatorIndex + 1}`
                            const activityRowNumber = `${childRowNumber}.1`
                            const subActivityRowNumber = `${activityRowNumber}.1`
                            const childActivityCode = prexcCodeMaps.activityCodeMap.get(String(indicator.activity_id ?? "")) ?? ""
                            const childSubActivityCode = prexcCodeMaps.subActivityCodeMap.get(String(indicator.sub_activity_id ?? "")) ?? ""
                            const childActivityLabel = formatText(indicator.activity_title, "Activity")
                            const childSubActivityLabel = formatText(indicator.sub_activity_title, "Sub-activity")
                            const childActivityFlashClassName =
                              flashType === "prexcActivity"
                                ? "ring-4 ring-inset ring-slate-700/45 bg-white/70 shadow-[inset_0_0_0_9999px_rgba(255,255,255,0.18)] animate-pulse"
                                : ""
                            const childSubActivityFlashClassName =
                              flashType === "prexcSubActivity"
                                ? "ring-4 ring-inset ring-slate-700/45 bg-white/70 shadow-[inset_0_0_0_9999px_rgba(255,255,255,0.18)] animate-pulse"
                                : ""
                            const childDpcrFlashClassName =
                              flashType === "dpcrSuccessIndicator"
                                ? "ring-4 ring-inset ring-slate-700/45 bg-white/70 shadow-[inset_0_0_0_9999px_rgba(255,255,255,0.18)] animate-pulse"
                                : ""

                            const childRows = []

                            if (rowVisibility.prexcActivity) {
                              childRows.push(
                                <TableRow
                                  key={`${indicator.id}-activity`}
                                  className={`${dpcrPreviewHierarchyStyles.prexcActivity} ${childActivityFlashClassName}`}
                                  data-preview-row="prexcActivity"
                                >
                                  <TableCell className="align-middle px-3 py-1 text-xs text-slate-500">{activityRowNumber}</TableCell>
                                  <TableCell colSpan={17} className="align-middle px-3 py-2 text-xs text-slate-900 whitespace-normal break-words">
                                    <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
                                      {childActivityCode ? <span className="font-medium text-slate-500">{childActivityCode}</span> : null}
                                      {childActivityCode ? <span className="text-slate-400">:</span> : null}
                                      <span className="font-medium text-slate-900">{childActivityLabel}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="align-middle px-3 py-1" />
                                </TableRow>
                              )
                            }

                            if (rowVisibility.prexcSubActivity) {
                              childRows.push(
                                <TableRow
                                  key={`${indicator.id}-sub-activity`}
                                  className={`${dpcrPreviewHierarchyStyles.prexcSubActivity} ${childSubActivityFlashClassName}`}
                                  data-preview-row="prexcSubActivity"
                                >
                                  <TableCell className="align-middle px-3 py-1 text-xs text-slate-500">{subActivityRowNumber}</TableCell>
                                  <TableCell colSpan={17} className="align-middle px-3 py-2 text-xs text-slate-900 whitespace-normal break-words">
                                    <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
                                      {childSubActivityCode ? <span className="font-medium text-slate-500">{childSubActivityCode}</span> : null}
                                      {childSubActivityCode ? <span className="text-slate-400">:</span> : null}
                                      <span className="font-medium text-slate-900">{childSubActivityLabel}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="align-middle px-3 py-1" />
                                </TableRow>
                              )
                            }

                            childRows.push(
                              <TableRow
                                key={indicator.id}
                                className={`${dpcrPreviewHierarchyStyles.dpcrSuccessIndicator} ${childDpcrFlashClassName}`}
                                data-preview-row="dpcrSuccessIndicator"
                              >
                                <TableCell className="align-middle px-3 py-1 text-xs text-slate-500">{childRowNumber}</TableCell>
                                <TableCell colSpan={14} className="align-middle px-3 py-2 text-sm text-slate-900 whitespace-normal break-words">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="pl-8">
                                      <div className="break-words font-medium text-slate-900">{formatText(indicator.success_indicator_title)}</div>
                                    </div>
                                    {canEdit && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-8 gap-2 px-3 text-xs"
                                            onClick={() => onAddSpecificAO?.(indicator)}
                                            aria-label={`Add Specific Activity/Output: ${formatText(indicator.success_indicator_title)}`}
                                          >
                                            <Plus className="h-4 w-4" />
                                            Add Specific Activity/Output
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{`Add Specific Activity/Output: ${formatText(indicator.success_indicator_title)}`}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="align-right px-3 py-1 text-xs text-slate-700 whitespace-normal break-words">
                                  {childAssignments || "-"}
                                </TableCell>
                                <TableCell className="align-middle px-3 py-1 text-right text-xs font-normal text-slate-900 tabular-nums">
                                  {childWeight}
                                </TableCell>
                                <TableCell className="align-middle px-3 py-1 text-right text-xs font-normal text-slate-900 tabular-nums">
                                  {childBudget}
                                </TableCell>
                                <TableCell className="align-middle px-3 py-1 text-right">
                                  {canEdit ? (
                                    <div className="ml-auto flex w-full items-center justify-end gap-1.5">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => onEditSuccessIndicator?.(indicator)}
                                            aria-label={`Edit Success Indicator: ${formatText(indicator.success_indicator_title)}`}
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{`Edit Success Indicator: ${formatText(indicator.success_indicator_title)}`}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-red-600 hover:text-red-700"
                                            onClick={() => onRemoveSuccessIndicator?.(indicator)}
                                            aria-label={`Remove Success Indicator: ${formatText(indicator.success_indicator_title)}`}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{`Remove Success Indicator: ${formatText(indicator.success_indicator_title)}`}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => openMatrixSheet(indicator)}
                                            aria-label={`View Rating Matrix: ${formatText(indicator.success_indicator_title)}`}
                                          >
                                            <Star className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{`View Rating Matrix: ${formatText(indicator.success_indicator_title ?? indicator.title ?? indicator.label)}`}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                  ) : null}
                                </TableCell>
                              </TableRow>
                            )

                            return childRows
                          })
                        : []

                    const flashClassName =
                      flashType === row.type ? "ring-4 ring-inset ring-slate-700/45 bg-white/70 shadow-[inset_0_0_0_9999px_rgba(255,255,255,0.18)] animate-pulse" : ""

                    return (
                      <Fragment key={row.key}>
                        <TableRow
                          className={rowClassName}
                          data-preview-row={row.type}
                          style={flashType === row.type ? { boxShadow: "inset 0 0 0 9999px rgba(255,255,255,0.08)" } : undefined}
                        >
                          <TableCell className="align-middle px-3 py-1 text-xs text-slate-500">{row.rowNumber}</TableCell>
                          <TableCell
                            colSpan={15}
                            className={`align-middle px-3 py-1 text-sm text-slate-900 whitespace-normal break-words ${flashClassName}`}
                            data-preview-row={row.type}
                          >
                            {row.type === "category" ? (
                              <div className="flex items-center gap-2">
                                <span className="whitespace-normal break-words text-xs font-medium text-slate-900">{formatText(row.categoryLabel)}</span>
                              </div>
                            ) : row.type === "program" ? (
                              <div className="flex items-center gap-2" style={{ paddingLeft: `${row.papDepth * 1.25}rem` }}>
                                <span className="whitespace-normal break-words text-xs font-semibold uppercase tracking-wide text-slate-600">
                                  {formatText(row.papLabel)}
                                </span>
                              </div>
                            ) : row.type === "pap" ? (
                              <div className="flex items-center gap-2" style={{ paddingLeft: `${row.papDepth * 1.25}rem` }}>
                                <span className="whitespace-normal break-words text-xs text-slate-900">{formatText(row.papLabel)}</span>
                              </div>
                            ) : row.type === "successIndicator" ? (
                              <div className="flex items-center justify-between gap-3">
                                <div
                                  className="flex items-center gap-2"
                                  style={row.sourceItem?.dpcr_level ? { paddingLeft: `${(row.indicatorDepth + 1) * 1.25}rem` } : undefined}
                                >
                                  <span className="whitespace-normal break-words font-semibold text-slate-900">{formatText(row.indicatorLabel)}</span>
                                </div>
                                {canEdit && (
                                  <Popover
                                    open={pickerOpenId === String(row.sourceItem?.opcr_item_id ?? row.sourceItem?.id)}
                                    onOpenChange={(open) =>
                                      setPickerOpenId(open ? String(row.sourceItem?.opcr_item_id ?? row.sourceItem?.id ?? "") : null)
                                    }
                                  >
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <PopoverTrigger asChild>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-8 gap-2 px-3 text-xs"
                                            aria-label={`Add Success Indicator: ${formatText(row.indicatorLabel)}`}
                                          >
                                            <Plus className="h-4 w-4" />
                                            Add Success Indicator
                                          </Button>
                                        </PopoverTrigger>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{`Add Success Indicator: ${formatText(row.indicatorLabel)}`}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                    <PopoverContent align="start" className="w-[420px] p-3">
                                      <div className="space-y-3">
                                        <div>
                                          <div className="text-sm font-semibold text-slate-900">Select Success Indicator</div>
                                          <div className="text-xs text-slate-500">
                                            Choose an existing DPCR success indicator or add a new one if it is not encoded yet.
                                          </div>
                                        </div>
                                        <SearchableComboBox
                                          name={`dpcr_success_indicator_${row.key}`}
                                          placeholder="Search success indicators..."
                                          apiUrl={route("dpcrs.success-indicators.index", {
                                            recordId: dpcrRecord?.id,
                                          })}
                                          canAdd
                                          onChange={(val, selectedItem) => {
                                            if (!val || !selectedItem) return
                                            onAddSuccessIndicator?.(
                                              row.sourceItem,
                                              selectedItem,
                                              selectedItem?.success_indicator_title ?? selectedItem?.title ?? ""
                                            )
                                            setPickerOpenId(null)
                                          }}
                                          onAdd={(term) => {
                                            onAddSuccessIndicator?.(row.sourceItem, null, term)
                                            setPickerOpenId(null)
                                          }}
                                          invalidMessage={null}
                                        />
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                )}
                              </div>
                            ) : (
                              ""
                            )}
                          </TableCell>
                          <TableCell className={`align-middle px-3 py-1 text-right ${metricClassName}`}>
                            {row.showCategory ? categoryWeight : indicatorWeight}
                          </TableCell>
                          <TableCell className={`align-middle px-3 py-1 text-right ${metricClassName}`}>
                            {row.showCategory ? categoryAmount : indicatorAmount}
                          </TableCell>
                          <TableCell className="align-middle px-3 py-1 text-right">
                            {row.type === "successIndicator" && canEdit ? (
                              <div className="ml-auto flex w-full items-center justify-end gap-1.5">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => openMatrixSheet(row.sourceItem)}
                                      aria-label={`View Rating Matrix: ${formatText(row.indicatorLabel)}`}
                                    >
                                      <Star className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{`View Rating Matrix: ${formatText(row.indicatorLabel)}`}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            ) : null}
                          </TableCell>
                        </TableRow>
                        {childDpcrRows}
                      </Fragment>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={19} className="py-4 text-center text-sm text-slate-500">
                      No success indicators assigned for this scope.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </ScrollArea>
            <SuccessIndicatorMatrixSheet
              open={matrixSheetOpen}
              onOpenChange={(open) => {
                setMatrixSheetOpen(open)
                if (!open) {
                  setSelectedMatrixIndicator(null)
                }
              }}
              title={`Rating Matrix: ${formatText(
                selectedMatrixIndicator?.success_indicator_title ?? selectedMatrixIndicator?.title ?? selectedMatrixIndicator?.label ?? "Success Indicator"
              )}`}
              description="Read-only preview of the rating matrix for this success indicator."
              ratingRows={selectedMatrixIndicator?.rating_rows ?? []}
            />
            {isTableLoading && (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-b-lg bg-white/35">
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading table...
                </div>
              </div>
            )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
  }
}
