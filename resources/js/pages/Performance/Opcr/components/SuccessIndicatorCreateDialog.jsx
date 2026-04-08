import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import AmountInput from "@/components/AmountInput"
import MultipleComboBox from "@/components/MultipleComboBox"
import SingleComboBox from "@/components/SingleComboBox"
import MatrixBuilder from "../../Libraries/SuccessIndicators/MatrixBuilder"

export default function SuccessIndicatorCreateDialog({
  open,
  onOpenChange,
  title = "Add Success Indicator",
  description = "Type the success indicator details for this MFO/PAP row.",
  activityId,
  target,
  weight,
  amount,
  assignmentValues = [],
  onActivityChange,
  onTargetChange,
  onWeightChange,
  onAmountChange,
  onAssignmentsChange,
  onCancel,
  onCreate,
  submitLabel = "Create & Add Success Indicator",
  submittingLabel = "Creating...",
  creating = false,
  activities = [],
  divisions = [],
  groups = [],
  employees = [],
  activityMap = {},
  divisionMap = {},
  groupMap = {},
  employeeMap = {},
  matrixSource = "custom",
  matrixSources = [
    { value: "default", label: "Default Rating Matrix" },
    { value: "custom", label: "Custom Matrix" },
  ],
  ratingItems = [],
  selectedRating = null,
  onMatrixSourceChange,
  onPerformanceRatingChange,
  matrixPayload = [],
  onMatrixPayloadChange,
}) {
  const assignmentItems = [
    {
      value: "division:all",
      label: "All Divisions",
    },
    ...divisions.map((division) => ({
      value: `division:${String(division.value)}`,
      label: division.label ?? division.value,
    })),
    ...groups.map((group) => ({
      value: `group:${String(group.value)}`,
      label: group.label,
    })),
    ...employees,
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[96vw] max-h-[92vh] overflow-hidden p-0">
        <div className="flex max-h-[92vh] flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>

            <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label>Activity/Output</Label>
            <SingleComboBox
              items={activities}
              value={activityId || ""}
              onChange={(value) => onActivityChange?.(value || null)}
              placeholder="Select activity/output"
              name="activity"
              width="w-full"
              renderLabel={(item) => activityMap[String(item.value)] ?? item.label}
            />
          </div>

          <div className="space-y-2">
            <Label>Target</Label>
            <Textarea
              value={target}
              onChange={(event) => onTargetChange(event.target.value)}
              rows={4}
              placeholder="Enter target"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Weight</Label>
              <AmountInput
                value={weight}
                onChange={(value) => onWeightChange(value ?? "")}
                placeholder="Enter weight"
              />
            </div>

            <div className="space-y-2">
              <Label>Allocated Budget</Label>
              <AmountInput
                value={amount}
                onChange={(value) => onAmountChange(value ?? "")}
                placeholder="Enter allocated budget"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Division/Group/Staff Accountable</Label>
            <MultipleComboBox
              items={assignmentItems}
              value={assignmentValues}
              onChange={onAssignmentsChange}
              placeholder="Select assignments"
              name="assignment"
              width="w-full"
              renderLabel={(item) => {
                const raw = String(item.value ?? "").trim()
                const [kind, id] = raw.includes(":") ? raw.split(":", 2) : ["", raw]

                if (!kind) {
                  if (id === "all") return "All Divisions"
                  if (divisions.some((division) => String(division.value) === id)) return id
                  if (groupMap[id]) return groupMap[id]
                  if (employeeMap[id]) return employeeMap[id]
                  return item.label
                }

                if (kind === "division" && id === "all") return "All Divisions"
                if (kind === "division") return divisionMap[id] ?? id
                if (kind === "group") return groupMap[id] ?? id
                if (kind === "employee") return employeeMap[id] ?? id
                return item.label
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Matrix Source</Label>
            <SingleComboBox
              items={matrixSources}
              value={matrixSource}
              onChange={(value) => onMatrixSourceChange?.(value || "custom")}
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
                onChange={(value) => onPerformanceRatingChange?.(value || null)}
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
              onChange={onMatrixPayloadChange}
              disabled={matrixSource === "default"}
            />
          </div>

            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-background px-6 py-4">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" className="bg-slate-900 hover:bg-slate-800" onClick={onCreate} disabled={creating}>
              {creating ? submittingLabel : submitLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
