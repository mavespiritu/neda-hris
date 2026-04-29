import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import MultipleComboBox from "@/components/MultipleComboBox"
import { cn } from "@/lib/utils"
import { Plus, Trash2 } from "lucide-react"

const monthOptions = [
  { value: "jan", label: "Jan" },
  { value: "feb", label: "Feb" },
  { value: "mar", label: "Mar" },
  { value: "apr", label: "Apr" },
  { value: "may", label: "May" },
  { value: "jun", label: "Jun" },
  { value: "jul", label: "Jul" },
  { value: "aug", label: "Aug" },
  { value: "sep", label: "Sep" },
  { value: "oct", label: "Oct" },
  { value: "nov", label: "Nov" },
  { value: "dec", label: "Dec" },
]

const monthPresetOptions = [
  { value: "all_months", label: "All months" },
  { value: "first_semester", label: "First Semester" },
  { value: "second_semester", label: "Second Semester" },
]

const targetFrequencyOptions = [
  { value: "every_minute", label: "Every minute" },
  { value: "every_hour", label: "Every hour" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "bi_monthly", label: "Bi-monthly" },
]

const targetFrequencyLabelMap = Object.fromEntries(targetFrequencyOptions.map((option) => [option.value, option.label]))

const monthOrder = Object.fromEntries(monthOptions.map((month, index) => [month.value, index]))

const monthSelections = [
  ...monthPresetOptions,
  ...monthOptions,
]

const resolveMonthSelection = (values = []) => {
  const normalized = Array.isArray(values) ? values : []

  if (normalized.includes("all_months")) {
    return monthOptions.map((month) => month.value)
  }

  if (normalized.includes("first_semester")) {
    return monthOptions.slice(0, 6).map((month) => month.value)
  }

  if (normalized.includes("second_semester")) {
    return monthOptions.slice(6).map((month) => month.value)
  }

  return normalizeMonthSelection(normalized)
}

const normalizeMonthSelection = (months = []) =>
  [...new Set((Array.isArray(months) ? months : []).filter((month) => Object.prototype.hasOwnProperty.call(monthOrder, month)))].sort(
    (left, right) => monthOrder[left] - monthOrder[right]
  )

const getMonthRange = (months = []) => {
  const normalized = normalizeMonthSelection(months)

  if (!normalized.length) {
    return null
  }

  for (let index = 1; index < normalized.length; index += 1) {
    if (monthOrder[normalized[index]] !== monthOrder[normalized[index - 1]] + 1) {
      return null
    }
  }

  return {
    start_month: normalized[0],
    end_month: normalized[normalized.length - 1],
    months: normalized,
  }
}

const expandMonthRange = (startMonth, endMonth) => {
  const startIndex = monthOrder[startMonth]
  const endIndex = monthOrder[endMonth]

  if (!Number.isInteger(startIndex) || !Number.isInteger(endIndex) || endIndex < startIndex) {
    return []
  }

  return monthOptions.slice(startIndex, endIndex + 1).map((month) => month.value)
}

const createTargetRow = () => ({
  id: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  months: ["jan"],
  start_month: "jan",
  end_month: "jan",
  target_mode: "group",
  target_value: "",
  unit_of_measure: "",
  target_frequency: "",
  as_need_arises: false,
})

const semesterDefinitions = [
  {
    key: "first",
    title: "First Semester",
    subtitle: "January to June",
    startIndex: 0,
    endIndex: 5,
  },
  {
    key: "second",
    title: "Second Semester",
    subtitle: "July to December",
    startIndex: 6,
    endIndex: 11,
  },
]

const formatTargetDisplay = (value, unit, frequency) =>
  [
    String(value ?? "").trim(),
    String(unit ?? "").trim(),
    (() => {
      const label = targetFrequencyLabelMap[String(frequency ?? "").trim()] ?? String(frequency ?? "").trim()
      return label ? `${label.charAt(0).toLowerCase()}${label.slice(1)}` : ""
    })(),
  ]
    .filter(Boolean)
    .join(" ")

const renderMonthLabel = (month) => monthOptions.find((item) => item.value === month)?.label ?? month

const buildSemesterPreview = (row, semester) => {
  const selectedMonths = normalizeMonthSelection(
    row.months?.length
      ? row.months
      : row.start_month && row.end_month
        ? expandMonthRange(row.start_month, row.end_month)
        : []
  )

  if (!selectedMonths.length) {
    return null
  }

  if (row.target_mode === "individual") {
    return {
      mode: "individual",
      visibleMonths: selectedMonths.filter((month) => {
        const monthIndex = monthOrder[month]
        return monthIndex >= semester.startIndex && monthIndex <= semester.endIndex
      }),
    }
  }

  const range = getMonthRange(selectedMonths)

  if (!range) {
    return null
  }

  const startIndex = monthOrder[range.start_month]
  const endIndex = monthOrder[range.end_month]
  const overlapStart = Math.max(startIndex, semester.startIndex)
  const overlapEnd = Math.min(endIndex, semester.endIndex)

  if (overlapStart > overlapEnd) {
    return {
      lead: semester.endIndex - semester.startIndex + 1,
      span: 0,
      trail: 0,
      hasOverlap: false,
      mode: "group",
    }
  }

  return {
    lead: Math.max(0, overlapStart - semester.startIndex),
    span: overlapEnd - overlapStart + 1,
    trail: Math.max(0, semester.endIndex - overlapEnd),
    hasOverlap: true,
    mode: "group",
  }
}

export default function SpecificActivityCreateDialog({
  open,
  onOpenChange,
  successIndicatorTitle = "",
  successIndicatorLabel = "",
  activityId = "",
  subActivityId = "",
  selectedDivisionLabel = "",
  groups = [],
  employees = [],
  onCancel,
  onCreate,
  creating = false,
}) {
  const [specificActivityOutput, setSpecificActivityOutput] = useState("")
  const [assignmentValues, setAssignmentValues] = useState([])
  const [targetForm, setTargetForm] = useState(createTargetRow())
  const [targetEntries, setTargetEntries] = useState([])
  const isTargetValueRequired = !targetForm.as_need_arises
  const isTargetValueMissing = isTargetValueRequired && !String(targetForm.target_value ?? "").trim()
  const isUnitMissing = isTargetValueRequired && !String(targetForm.unit_of_measure ?? "").trim()
  const isMonthsMissing = !(targetForm.months?.length)
  const isAssignmentMissing = assignmentValues.length === 0
  const isSpecificActivityMissing = !String(specificActivityOutput ?? "").trim()

  const assignmentItems = useMemo(
    () => [
      ...groups.map((group) => ({
        value: `group:${String(group.value ?? group.id ?? "")}`,
        label: group.label ?? String(group.value ?? group.id ?? ""),
      })),
      ...employees.map((employee) => ({
        value: employee.value ?? `employee:${String(employee.id ?? employee.emp_id ?? "")}`,
        label: employee.label ?? employee.name ?? employee.full_name ?? String(employee.value ?? employee.id ?? employee.emp_id ?? ""),
      })),
    ],
    [groups, employees]
  )

  const updateTargetRow = (rowId, updater) => {
    setTargetForm((current) => {
      if (current.id !== rowId) {
        return current
      }

      return updater(current)
    })
  }

  const commitTargetRow = () => {
    if (!isTargetRowValid(targetForm)) {
      return
    }

    setTargetEntries((current) => [
      ...current,
      {
        ...targetForm,
        isCommitted: true,
        months: normalizeMonthSelection(targetForm.months?.length ? targetForm.months : []),
      },
    ])
    setTargetForm(createTargetRow())
  }

  const isTargetRowValid = (row) => {
    const selectedMonths = row.months?.length
      ? row.months
      : row.start_month && row.end_month
        ? expandMonthRange(row.start_month, row.end_month)
        : []
    const normalizedMonths = normalizeMonthSelection(selectedMonths)

    if (!normalizedMonths.length) {
      return false
    }

    if (row.target_mode === "group" && !getMonthRange(normalizedMonths)) {
      return false
    }

    if (row.as_need_arises) {
      return true
    }

    return (
      String(row.target_value ?? "").trim().length > 0 &&
      String(row.unit_of_measure ?? "").trim().length > 0
    )
  }

  const hasCommittedTargets = targetEntries.some((row) => isTargetRowValid(row))
  const hasGroupOrStaffAccountable = assignmentValues.length > 0
  const canSubmitSpecificActivity =
    hasCommittedTargets &&
    hasGroupOrStaffAccountable &&
    String(specificActivityOutput ?? "").trim().length > 0 &&
    !targetEntries.some((row) => !isTargetRowValid(row))

  const normalizedTargetPlan = targetEntries.map((row) => {
    const selectedMonths = normalizeMonthSelection(
      row.months?.length
        ? row.months
        : row.start_month && row.end_month
          ? expandMonthRange(row.start_month, row.end_month)
          : []
    )
    const range = getMonthRange(selectedMonths)

    return {
      months: selectedMonths,
      start_month: row.target_mode === "individual" ? (selectedMonths[0] ?? "") : (range?.start_month ?? ""),
      end_month: row.target_mode === "individual" ? (selectedMonths[selectedMonths.length - 1] ?? "") : (range?.end_month ?? ""),
      target_mode: row.target_mode === "individual" ? "individual" : "group",
      target_value: String(row.target_value ?? "").trim(),
      unit_of_measure: String(row.unit_of_measure ?? "").trim(),
      target_frequency: String(row.target_frequency ?? "").trim(),
      as_need_arises: Boolean(row.as_need_arises),
    }
  })

  const renderSemesterPreviewTable = (semester) => {
    const semesterMonths = monthOptions.slice(semester.startIndex, semester.endIndex + 1)
    const hasDraftContent =
      Boolean(targetForm.target_value?.trim()) ||
      Boolean(targetForm.unit_of_measure?.trim()) ||
      Boolean(targetForm.target_frequency?.trim()) ||
      Boolean(targetForm.as_need_arises) ||
      (targetForm.months?.length && !(targetForm.months.length === 1 && targetForm.months[0] === "jan"))
    const draftRows = hasDraftContent
      ? [{
          ...targetForm,
          isDraft: true,
          months: normalizeMonthSelection(targetForm.months?.length ? targetForm.months : []),
        }]
      : []
    const semesterRows = targetEntries.filter((row) => {
      const preview = buildSemesterPreview(row, semester)
      return preview?.mode === "individual"
        ? Boolean(preview.visibleMonths?.length)
        : Boolean(preview?.hasOverlap)
    })

    return (
      <div key={semester.key} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">{semester.title}</div>
          <div className="text-xs text-slate-500">{semester.subtitle}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                {semesterMonths.map((month) => (
                  <th
                    key={month.value}
                    className="w-[8.333%] border-b border-r border-slate-200 px-2 py-2 text-center font-semibold last:border-r-0"
                  >
                    {month.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...draftRows, ...semesterRows].length ? [...draftRows, ...semesterRows].map((row) => {
                const preview = buildSemesterPreview(row, semester)
    const displayValue = formatTargetDisplay(row.target_value, row.unit_of_measure, row.target_frequency)
    const isCommitted = Boolean(row.isCommitted)

                return (
                  <tr key={`${semester.key}-${row.id}${row.isDraft ? "-draft" : ""}`} className="bg-white">
                    {preview?.mode === "individual" ? (
                      semesterMonths.map((month, monthIndex) => {
                        const isSelected = preview.visibleMonths?.includes(month.value)

                        return (
                          <td
                            key={`${semester.key}-${row.id}-${month.value}`}
                            className={cn(
                              "relative w-[8.333%] border-b border-r border-slate-200 px-2 py-3 text-center align-middle text-xs last:border-r-0",
                              isSelected ? "bg-sky-50 font-medium text-slate-900" : "bg-white text-slate-400"
                            )}
                          >
                            <span className="block whitespace-normal break-words text-[11px] leading-tight">
                              {isSelected ? (row.as_need_arises ? "As need arises" : displayValue || "-") : ""}
                            </span>
                            {isSelected && isCommitted && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1 h-7 w-7 text-red-600 hover:text-red-700"
                                onClick={() => {
                                  setTargetEntries((current) => current.filter((entry) => entry.id !== row.id))
                                }}
                                aria-label="Remove target"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        )
                      })
                    ) : preview?.hasOverlap ? (
                      <>
                        {preview.lead > 0 && (
                          <td colSpan={preview.lead} className="border-b border-r border-slate-200 bg-slate-50/50 px-2 py-3" />
                        )}
                        <td
                           colSpan={preview.span}
                          className="relative border-b border-r border-slate-200 bg-sky-50 px-2 py-3 text-center align-middle font-medium text-slate-900 last:border-r-0"
                        >
                          <div className="flex flex-col items-center gap-1 text-xs">
                            <span className="block whitespace-normal break-words text-[11px] leading-tight">
                              {row.as_need_arises ? "As need arises" : displayValue || "-"}
                            </span>
                          </div>
                          {isCommitted && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1 h-7 w-7 text-red-600 hover:text-red-700"
                              onClick={() => {
                                setTargetEntries((current) => current.filter((entry) => entry.id !== row.id))
                              }}
                              aria-label="Remove target"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                        {preview.trail > 0 && (
                          <td colSpan={preview.trail} className="border-b border-r border-slate-200 bg-slate-50/50 px-2 py-3" />
                        )}
                      </>
                    ) : (
                      <td
                        colSpan={semesterMonths.length}
                        className="w-[8.333%] border-b border-slate-200 px-2 py-3 text-center text-xs text-slate-400"
                      >
                        -
                      </td>
                    )}
                  </tr>
                )
              }) : (
                <tr>
                  <td
                    colSpan={semesterMonths.length}
                    className="border-b border-slate-200 px-2 py-6 text-center text-xs text-slate-400"
                  >
                    No targets added yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const handleSubmit = () => {
    if (!String(activityId ?? "").trim() || !String(subActivityId ?? "").trim()) return
    if (!specificActivityOutput.trim()) return
    if (!assignmentValues.length) return
    if (!targetEntries.length) return
    if (targetEntries.some((row) => !isTargetRowValid(row))) return

    onCreate?.({
      activity_id: activityId,
      sub_activity_id: subActivityId,
      specific_activity_output: specificActivityOutput.trim(),
      target_plan: normalizedTargetPlan,
      assignment_values: assignmentValues,
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
      onOpenChange?.(nextOpen)
      if (!nextOpen) {
        setSpecificActivityOutput("")
        setAssignmentValues([])
        setTargetForm(createTargetRow())
        setTargetEntries([])
      }
    }}
    >
      <DialogContent
        className="max-w-4xl w-[96vw] max-h-[92vh] overflow-hidden p-0"
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <div className="flex max-h-[92vh] flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
            <DialogHeader>
              <DialogTitle>{`Add Specific A/O: ${successIndicatorLabel || successIndicatorTitle || "Success Indicator"}`}</DialogTitle>
              <DialogDescription>
                Encode a specific activity/output under this success indicator for {selectedDivisionLabel || "the selected division"}.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 space-y-5">
              <div className="space-y-2">
                <Label>Specific Activity/Output</Label>
                <Textarea
                  value={specificActivityOutput}
                  onChange={(event) => setSpecificActivityOutput(event.target.value)}
                  placeholder="Encode the specific activity/output"
                  rows={4}
                  className={cn(isSpecificActivityMissing && "border-red-500 focus-visible:ring-red-500")}
                />
                {isSpecificActivityMissing && (
                  <div className="text-xs text-rose-600">Specific Activity/Output is required.</div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Monthly Targets</Label>
                    <p className="text-xs text-slate-500">
                      Add one row per merged month range. Example: Jan to Jun, then Jul to Dec.
                    </p>
                  </div>
                </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-slate-900">Target Form</div>
                  </div>

                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wide text-slate-500">Months Covered</Label>
                      <MultipleComboBox
                        items={monthSelections}
                        value={targetForm.months ?? []}
                        onChange={(values) => {
                          setTargetForm((current) => {
                            const normalizedMonths = resolveMonthSelection(values)
                            const range = getMonthRange(normalizedMonths)

                            return {
                              ...current,
                              months: normalizedMonths,
                              start_month: current.target_mode === "individual"
                                ? (normalizedMonths[0] ?? "")
                                : (range?.start_month ?? ""),
                              end_month: current.target_mode === "individual"
                                ? (normalizedMonths[normalizedMonths.length - 1] ?? "")
                                : (range?.end_month ?? ""),
                            }
                          })
                        }}
                        placeholder="Select one or more months"
                        name="month"
                        width="w-[420px]"
                        renderLabel={(item) => item.label}
                        invalidMessage={isMonthsMissing ? "Months Covered is required" : ""}
                      />
                      <div className="text-xs text-slate-500">
                        {targetForm.as_need_arises ? (
                          <span>Marked as need arises. Target value and unit of measure are disabled.</span>
                        ) : (
                          <span>
                            Months: {(targetForm.months?.length ? targetForm.months : []).map(renderMonthLabel).length
                              ? (targetForm.months?.length ? targetForm.months : []).map(renderMonthLabel).join(", ")
                              : "No months selected"}
                          </span>
                        )}
                      </div>
                      {isMonthsMissing && (
                        <div className="text-xs text-rose-600">Months Covered is required.</div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wide text-slate-500">Target Type</Label>
                      <RadioGroup
                        value={targetForm.target_mode}
                        onValueChange={(value) => {
                          setTargetForm((current) => ({
                            ...current,
                            target_mode: value === "individual" ? "individual" : "group",
                          }))
                        }}
                        className="flex flex-wrap gap-4"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="group" id={`target-mode-group-${targetForm.id}`} />
                          <Label htmlFor={`target-mode-group-${targetForm.id}`} className="cursor-pointer text-sm font-normal text-slate-700">
                            Grouped months
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="individual" id={`target-mode-individual-${targetForm.id}`} />
                          <Label htmlFor={`target-mode-individual-${targetForm.id}`} className="cursor-pointer text-sm font-normal text-slate-700">
                            Individual per month
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                    {targetForm.target_mode === "group" && targetForm.months?.length > 0 && !getMonthRange(targetForm.months) && (
                      <div className="text-xs text-rose-600">Selected months must be consecutive for a group target.</div>
                    )}

                    <div className="grid gap-2 md:grid-cols-[25%_55%_auto]">
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wide text-slate-500">Target Value</Label>
                        <Input
                          value={targetForm.target_value}
                          onChange={(event) =>
                            setTargetForm((current) => ({
                              ...current,
                              target_value: event.target.value,
                            }))
                          }
                          placeholder="e.g. 100, 75%"
                          disabled={targetForm.as_need_arises}
                          className={cn(
                            "min-w-0",
                            isTargetValueMissing && "border-red-500 focus-visible:ring-red-500"
                          )}
                        />
                        {isTargetValueMissing && (
                          <div className="text-xs text-rose-600">Target Value is required.</div>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          <Checkbox
                            checked={Boolean(targetForm.as_need_arises)}
                            onCheckedChange={(checked) => {
                              setTargetForm((current) => ({
                                ...current,
                                as_need_arises: Boolean(checked),
                                target_frequency: checked ? "" : current.target_frequency,
                              }))
                            }}
                            id={`as-need-arises-${targetForm.id}`}
                          />
                          <Label
                            htmlFor={`as-need-arises-${targetForm.id}`}
                            className="cursor-pointer text-sm font-normal text-slate-600"
                          >
                            As need arises
                          </Label>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wide text-slate-500">Unit of Measure</Label>
                        <Input
                          value={targetForm.unit_of_measure}
                          onChange={(event) =>
                            setTargetForm((current) => ({
                              ...current,
                              unit_of_measure: event.target.value,
                            }))
                          }
                          placeholder="e.g. reports, sessions, persons"
                          disabled={targetForm.as_need_arises}
                          className={cn(
                            "min-w-0",
                            isUnitMissing && "border-red-500 focus-visible:ring-red-500"
                          )}
                        />
                        {isUnitMissing && (
                          <div className="text-xs text-rose-600">Unit of Measure is required.</div>
                        )}
                      </div>

                      <div className="space-y-1.5 min-w-0">
                        <Label className="text-xs uppercase tracking-wide text-slate-500">Frequency</Label>
                        <Select
                          value={targetForm.target_frequency || undefined}
                          disabled={targetForm.as_need_arises}
                          onValueChange={(value) => {
                            setTargetForm((current) => ({
                              ...current,
                              target_frequency: value,
                            }))
                          }}
                        >
                          <SelectTrigger className="w-full min-w-0">
                            <SelectValue placeholder="Frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            {targetFrequencyOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={commitTargetRow}
                        aria-label="Add target"
                      >
                        <Plus className="h-4 w-4" />
                        Add Target
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Target Preview</Label>
                  <p className="text-xs text-slate-500">
                    Merged target ranges are shown below. The target value, frequency, and unit of measure are rendered together inside each merged cell.
                  </p>
                </div>
                <div className="space-y-4">
                  {semesterDefinitions.map((semester) => renderSemesterPreviewTable(semester))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Group/Staff Accountable</Label>
                <MultipleComboBox
                  items={assignmentItems}
                  value={assignmentValues}
                  onChange={setAssignmentValues}
                  placeholder="Select group or employee"
                  name="assignment"
                  width="w-full"
                  invalidMessage={isAssignmentMissing ? "Group/Staff Accountable is required" : ""}
                />
                {isAssignmentMissing && (
                  <div className="text-xs text-rose-600">Group/Staff Accountable is required.</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-background px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onCancel?.()
              }}
            >
              Cancel
            </Button>
              <Button
                type="button"
                className="bg-slate-900 hover:bg-slate-800"
                onClick={handleSubmit}
                disabled={creating || !canSubmitSpecificActivity || isSpecificActivityMissing || isAssignmentMissing}
              >
              {creating ? "Saving..." : "Add Specific A/O"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
