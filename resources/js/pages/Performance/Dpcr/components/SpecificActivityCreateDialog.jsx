import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import MultipleComboBox from "@/components/MultipleComboBox"
import SingleComboBox from "@/components/SingleComboBox"

const monthFields = [
  { key: "jan", label: "Jan" },
  { key: "feb", label: "Feb" },
  { key: "mar", label: "Mar" },
  { key: "apr", label: "Apr" },
  { key: "may", label: "May" },
  { key: "jun", label: "Jun" },
  { key: "jul", label: "Jul" },
  { key: "aug", label: "Aug" },
  { key: "sep", label: "Sep" },
  { key: "oct", label: "Oct" },
  { key: "nov", label: "Nov" },
  { key: "dec", label: "Dec" },
]

const createEmptyTargets = () =>
  Object.fromEntries(monthFields.map((field) => [field.key, ""]))

const flattenActivities = (hierarchy = []) => {
  const activityMap = new Map()
  const subActivityMap = {}

  const pushActivity = (activity) => {
    if (!activity?.id) return
    const key = String(activity.id)
    if (!activityMap.has(key)) {
      activityMap.set(key, {
        value: key,
        label: activity.title ?? activity.label ?? key,
      })
    }

    subActivityMap[key] = Array.isArray(activity.sub_activities)
      ? activity.sub_activities
          .filter((subActivity) => subActivity?.id)
          .map((subActivity) => ({
            value: String(subActivity.id),
            label: subActivity.title ?? subActivity.label ?? String(subActivity.id),
          }))
      : []
  }

  const walk = (nodes = []) => {
    nodes.forEach((node) => {
      ;(node?.outcomes ?? []).forEach((outcome) => {
        ;(outcome?.programs ?? []).forEach((program) => {
          ;(program?.sub_programs ?? []).forEach((subProgram) => {
            ;(subProgram?.identifiers ?? []).forEach((identifier) => {
              ;(identifier?.paps ?? []).forEach((pap) => {
                ;(pap?.activities ?? []).forEach((activity) => {
                  pushActivity(activity)
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

export default function SpecificActivityCreateDialog({
  open,
  onOpenChange,
  successIndicatorTitle = "",
  successIndicatorLabel = "",
  selectedDivisionLabel = "",
  ppmpHierarchy = [],
  groups = [],
  employees = [],
  onCancel,
  onCreate,
  creating = false,
}) {
  const [activityId, setActivityId] = useState(null)
  const [subActivityId, setSubActivityId] = useState(null)
  const [specificActivityOutput, setSpecificActivityOutput] = useState("")
  const [assignmentValues, setAssignmentValues] = useState([])
  const [targets, setTargets] = useState(createEmptyTargets())

  useEffect(() => {
    if (!open) return

    setActivityId(null)
    setSubActivityId(null)
    setSpecificActivityOutput("")
    setAssignmentValues([])
    setTargets(createEmptyTargets())
  }, [open])

  const { activityItems, subActivityMap } = useMemo(() => flattenActivities(ppmpHierarchy), [ppmpHierarchy])
  const subActivityItems = activityId ? subActivityMap[String(activityId)] ?? [] : []
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

  const handleActivityChange = (value) => {
    setActivityId(value || null)
    setSubActivityId(null)
  }

  const handleSubmit = () => {
    if (!activityId || !subActivityId) return
    if (!specificActivityOutput.trim()) return

    onCreate?.({
      activity_id: activityId,
      sub_activity_id: subActivityId,
      specific_activity_output: specificActivityOutput.trim(),
      assignment_values: assignmentValues,
      ...Object.fromEntries(monthFields.map((field) => [`target_${field.key}`, targets[field.key] ?? ""])),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[96vw] max-h-[92vh] overflow-hidden p-0">
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
                <Label>Activity</Label>
                <SingleComboBox
                  items={activityItems}
                  value={activityId || ""}
                  onChange={(value) => handleActivityChange(value || null)}
                  placeholder="Select activity"
                  name="activity"
                  width="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Sub-activity</Label>
                <SingleComboBox
                  items={subActivityItems}
                  value={subActivityId || ""}
                  onChange={(value) => setSubActivityId(value || null)}
                  placeholder={activityId ? "Select sub-activity" : "Select activity first"}
                  name="sub-activity"
                  width="w-full"
                  disabled={!activityId}
                />
              </div>

              <div className="space-y-2">
                <Label>Specific Activity/Output</Label>
                <Textarea
                  value={specificActivityOutput}
                  onChange={(event) => setSpecificActivityOutput(event.target.value)}
                  placeholder="Encode the specific activity/output"
                  rows={4}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Label>Monthly Targets</Label>
                  <span className="text-xs text-slate-500">Jan to Dec</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {monthFields.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wide text-slate-500">{field.label}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={targets[field.key]}
                        onChange={(event) =>
                          setTargets((current) => ({
                            ...current,
                            [field.key]: event.target.value,
                          }))
                        }
                        placeholder="0"
                      />
                    </div>
                  ))}
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
              disabled={creating || !activityId || !subActivityId || !specificActivityOutput.trim()}
            >
              {creating ? "Saving..." : "Add Specific A/O"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
