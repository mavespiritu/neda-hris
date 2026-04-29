import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import AmountInput from "@/components/AmountInput"
import MultipleComboBox from "@/components/MultipleComboBox"
import SingleComboBox from "@/components/SingleComboBox"
import MatrixBuilder from "../../Libraries/SuccessIndicators/MatrixBuilder"
import { createMatrixBlock, normalizeMatrixPayload } from "../../Libraries/SuccessIndicators/matrixUtils"

const normalizeCode = (value) => String(value ?? "").trim()

const flattenActivities = (hierarchy = []) => {
  const activityMap = new Map()
  const subActivityMap = {}

  const buildLongActivityPrefix = ({
    costStructureCode = "",
    outcomeCode = "",
    programCode = "",
    subProgramCode = "",
    identifierCode = "",
    papShortCode = "",
    papCode = "",
  }) => {
    const shortCode = normalizeCode(papShortCode)
    if (shortCode) return shortCode

    return [
      costStructureCode,
      outcomeCode,
      programCode,
      subProgramCode,
      identifierCode,
      papCode,
    ]
      .map(normalizeCode)
      .filter(Boolean)
      .join("")
  }

  const pushActivity = (activity, context = {}) => {
    if (!activity?.id) return
    const key = String(activity.id)
    const activityCode = normalizeCode(activity.code)
    const papPrefix = buildLongActivityPrefix(context)

    if (!activityMap.has(key)) {
      activityMap.set(key, {
        value: key,
        label: activity.title ?? activity.label ?? key,
        subtitle: [papPrefix, activityCode].filter(Boolean).join("-"),
        searchValue: [[papPrefix, activityCode].filter(Boolean).join("-"), activity.title ?? activity.label ?? ""]
          .filter(Boolean)
          .join(" "),
      })
    }

    subActivityMap[key] = Array.isArray(activity.sub_activities)
      ? activity.sub_activities
          .filter((subActivity) => subActivity?.id)
          .map((subActivity) => ({
            value: String(subActivity.id),
            label: subActivity.title ?? subActivity.label ?? String(subActivity.id),
            subtitle: [papPrefix, normalizeCode(subActivity.code)].filter(Boolean).join("-"),
            searchValue: [
              [papPrefix, activityCode].filter(Boolean).join("-"),
              normalizeCode(subActivity.code),
              subActivity.title ?? subActivity.label ?? "",
            ]
              .filter(Boolean)
              .join(" "),
          }))
      : []
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

                ;(pap?.activities ?? []).forEach((activity) => {
                  pushActivity(activity, papContext)
                })
              })
            })
          })
        })
      })
    })
  }

  walk(Array.isArray(hierarchy) ? hierarchy : [])

  return {
    activityItems: Array.from(activityMap.values()).sort((left, right) => left.label.localeCompare(right.label)),
    subActivityMap,
  }
}

export default function DpcrSuccessIndicatorCreateDialog({
  open,
  onOpenChange,
  selectedDivisionLabel = "",
  selectedDivisionValue = "",
  ppmpHierarchy = [],
  groups = [],
  employees = [],
  ratingItems = [],
  initialSuccessIndicatorTitle = "",
  initialTemplateItem = null,
  mode = "create",
  onCancel,
  onCreate,
  creating = false,
}) {
  const [activityId, setActivityId] = useState(null)
  const [subActivityId, setSubActivityId] = useState(null)
  const [successIndicatorTitle, setSuccessIndicatorTitle] = useState("")
  const [weight, setWeight] = useState("")
  const [allocatedBudget, setAllocatedBudget] = useState("")
  const [assignmentValues, setAssignmentValues] = useState([])
  const [employeeOptions, setEmployeeOptions] = useState([])
  const [matrixSource, setMatrixSource] = useState("custom")
  const [selectedRating, setSelectedRating] = useState(null)
  const [matrixPayload, setMatrixPayload] = useState([createMatrixBlock()])

  useEffect(() => {
    if (!open) return

    if (initialTemplateItem) {
      setActivityId(initialTemplateItem.activity_id ? String(initialTemplateItem.activity_id) : null)
      setSubActivityId(initialTemplateItem.sub_activity_id ? String(initialTemplateItem.sub_activity_id) : null)
      setSuccessIndicatorTitle(initialTemplateItem.success_indicator_title || initialSuccessIndicatorTitle || "")
      setWeight(initialTemplateItem.weight ?? "")
      setAllocatedBudget(initialTemplateItem.allocated_budget ?? "")
      const assignments = [
        ...(Array.isArray(initialTemplateItem.division_assignments)
          ? initialTemplateItem.division_assignments.map((value) => `division:${String(value)}`)
          : []),
        ...(Array.isArray(initialTemplateItem.group_assignments)
          ? initialTemplateItem.group_assignments.map((value) => `group:${String(value)}`)
          : []),
        ...(Array.isArray(initialTemplateItem.employee_assignments)
          ? initialTemplateItem.employee_assignments.map((value) => `employee:${String(value)}`)
          : []),
      ]
      setAssignmentValues(assignments)
      const nextMatrixSource = initialTemplateItem.performance_rating_id ? "default" : "custom"
      const initialRating =
        nextMatrixSource === "default"
          ? ratingItems.find((item) => String(item.id) === String(initialTemplateItem.performance_rating_id ?? "")) ?? null
          : null
      setMatrixSource(nextMatrixSource)
      setSelectedRating(initialRating)
      setMatrixPayload(
        Array.isArray(initialTemplateItem.rating_rows) && initialTemplateItem.rating_rows.length
          ? normalizeMatrixPayload(initialTemplateItem.rating_rows)
          : initialRating?.matrix_rows?.length
            ? normalizeMatrixPayload(initialRating.matrix_rows)
            : [createMatrixBlock()]
      )
      return
    }

    setActivityId(null)
    setSubActivityId(null)
    setSuccessIndicatorTitle(initialSuccessIndicatorTitle || "")
    setWeight("")
    setAllocatedBudget("")
    setAssignmentValues([])
    const defaultRating = ratingItems[0] ?? null
    setMatrixSource(defaultRating ? "default" : "custom")
    setSelectedRating(defaultRating)
    setMatrixPayload(
      defaultRating?.matrix_rows?.length
        ? normalizeMatrixPayload(defaultRating.matrix_rows)
        : [createMatrixBlock()]
    )
  }, [open, initialSuccessIndicatorTitle, initialTemplateItem, ratingItems])

  const { activityItems, subActivityMap } = useMemo(() => flattenActivities(ppmpHierarchy), [ppmpHierarchy])
  const subActivityItems = activityId ? subActivityMap[String(activityId)] ?? [] : []
  const divisionKey = String(selectedDivisionValue ?? selectedDivisionLabel ?? "").trim()
  const isEditing = mode === "edit"

  useEffect(() => {
    let mounted = true

    if (!open) {
      setEmployeeOptions([])
      return () => {
        mounted = false
      }
    }

    axios
      .get(route("dpcrs.division-employees.index"), {
        params: {
          emp_type_id: "Permanent",
          division_id: divisionKey || undefined,
        },
      })
      .then((response) => {
        if (!mounted) return
        const payload = response?.data ?? response
        setEmployeeOptions(Array.isArray(payload) ? payload : [])
      })
      .catch(() => {
        if (mounted) setEmployeeOptions([])
      })

    return () => {
      mounted = false
    }
  }, [open, divisionKey])

  const assignmentItems = useMemo(
    () => [
      ...groups.map((group) => ({
        value: `group:${String(group.value ?? group.id ?? "")}`,
        label: group.label ?? String(group.value ?? group.id ?? ""),
      })),
      ...employeeOptions.map((employee) => ({
        value: employee.value ?? `employee:${String(employee.id ?? employee.emp_id ?? "")}`,
        label: employee.label ?? employee.name ?? employee.full_name ?? String(employee.value ?? employee.id ?? employee.emp_id ?? ""),
      })),
    ],
    [employeeOptions, groups]
  )
  const handleMatrixSourceChange = (value) => {
    const nextValue = value || "custom"
    setMatrixSource(nextValue)

    if (nextValue === "custom") {
      setSelectedRating(null)
      setMatrixPayload([createMatrixBlock()])
      return
    }

    const defaultRating = ratingItems[0] ?? null
    setSelectedRating(defaultRating)
    setMatrixPayload(
      defaultRating?.matrix_rows?.length
        ? normalizeMatrixPayload(defaultRating.matrix_rows)
        : [createMatrixBlock()]
    )
  }

  const handlePerformanceRatingChange = (value) => {
    const nextRating = ratingItems.find((item) => String(item.id) === String(value ?? "")) ?? null
    setSelectedRating(nextRating)
    setMatrixPayload(
      nextRating?.matrix_rows?.length
        ? normalizeMatrixPayload(nextRating.matrix_rows)
        : [createMatrixBlock()]
    )
  }

  const handleActivityChange = (value) => {
    setActivityId(value || null)
    setSubActivityId(null)
  }

  const handleSubmit = () => {
    if (!activityId || !subActivityId) return
    if (!successIndicatorTitle.trim()) return

    onCreate?.({
      activity_id: activityId,
      sub_activity_id: subActivityId,
      performance_rating_id: matrixSource === "default" ? selectedRating?.id ?? null : null,
      success_indicator_title: successIndicatorTitle.trim(),
      weight: weight.trim(),
      allocated_budget: allocatedBudget.trim(),
      assignment_values: assignmentValues,
      matrix_payload: matrixPayload,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[96vw] max-h-[92vh] overflow-hidden p-0">
        <div className="flex max-h-[92vh] flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
            <DialogHeader>
              <DialogTitle>{`${isEditing ? "Edit" : "Add"} Success Indicator`}</DialogTitle>
              <DialogDescription>
                Encode a DPCR success indicator for {selectedDivisionLabel || "the selected division"}.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>PREXC Activity</Label>
                  <SingleComboBox
                    items={activityItems}
                    value={activityId || ""}
                    onChange={(value) => handleActivityChange(value || null)}
                    placeholder="Select PREXC activity"
                    name="activity"
                    width="w-full"
                    contentClassName="!w-[360px] z-[70]"
                    renderLabel={(item) => (
                      <div className="flex flex-col items-start leading-tight">
                        {item?.subtitle ? <span className="text-[10px] text-slate-500">{item.subtitle}</span> : null}
                        <span className="text-sm text-slate-900">{item?.label}</span>
                      </div>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>PREXC Sub-activity</Label>
                  <SingleComboBox
                    items={subActivityItems}
                    value={subActivityId || ""}
                    onChange={(value) => setSubActivityId(value || null)}
                    placeholder={activityId ? "Select PREXC sub-activity" : "Select activity first"}
                    name="sub-activity"
                    width="w-full"
                    contentClassName="!w-[360px] z-[70]"
                    disabled={!activityId}
                    renderLabel={(item) => (
                      <div className="flex flex-col items-start leading-tight">
                        {item?.subtitle ? <span className="text-[10px] text-slate-500">{item.subtitle}</span> : null}
                        <span className="text-sm text-slate-900">{item?.label}</span>
                      </div>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Success Indicator</Label>
                <Textarea
                  value={successIndicatorTitle}
                  onChange={(event) => setSuccessIndicatorTitle(event.target.value)}
                  placeholder="Encode the success indicator"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Matrix Source</Label>
                <SingleComboBox
                  items={[
                    { value: "default", label: "Default Rating Matrix" },
                    { value: "custom", label: "Custom Matrix" },
                  ]}
                  value={matrixSource}
                  onChange={(value) => handleMatrixSourceChange(value || "custom")}
                  placeholder="Select matrix source"
                  name="matrix_source"
                  width="w-full"
                />
                <p className="text-xs text-slate-500">
                  Select whether this success indicator uses a default rating template or a custom matrix.
                </p>
              </div>

              {matrixSource === "default" && (
                <div className="space-y-2">
                  <Label>Default Rating Matrix</Label>
                  <SingleComboBox
                    items={ratingItems}
                    value={selectedRating ? String(selectedRating.id) : ""}
                    onChange={(value) => handlePerformanceRatingChange(value || null)}
                    placeholder="Select rating matrix"
                    name="performance_rating_id"
                    width="w-full"
                  />
                  {selectedRating ? (
                    <p className="text-xs font-medium text-emerald-600">
                      Using default rating: {selectedRating.name}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600">Select a default rating template to load its matrix.</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>Rating Matrix</Label>
                  {matrixSource === "default" && (
                    <span className="text-xs font-medium text-slate-500">Read-only when using default rating</span>
                  )}
                </div>
                <MatrixBuilder
                  value={matrixPayload}
                  onChange={setMatrixPayload}
                  disabled={matrixSource === "default"}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Weight</Label>
                  <AmountInput
                    value={weight}
                    onChange={(value) => setWeight(value ?? "")}
                    placeholder="Enter weight"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Allocated Budget</Label>
                  <AmountInput
                    value={allocatedBudget}
                    onChange={(value) => setAllocatedBudget(value ?? "")}
                    placeholder="Enter allocated budget"
                  />
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
                />
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
              disabled={creating || !activityId || !subActivityId || !successIndicatorTitle.trim()}
            >
              {creating ? "Saving..." : isEditing ? "Save Changes" : "Add Success Indicator"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
