import { Fragment, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import SingleComboBox from "@/components/SingleComboBox"
import { Switch } from "@/components/ui/switch"
import { Pencil } from "lucide-react"
import {
  buildMatrixRowAnalysis,
  conditionTypes,
  createMatrixBlock,
  normalizeMatrixPayload,
  timingOptions,
  unitOptions,
} from "./matrixUtils"

const scoreBands = [5, 4, 3, 2, 1]
const dimensionLabel = (dimension) =>
  dimension === "Q" ? "Quality" : dimension === "E" ? "Efficiency" : "Timeliness"

const dimensionOptions = ["Q", "E", "T"].map((dimension) => ({
  value: dimension,
  label: dimensionLabel(dimension),
}))

const MatrixRowEditorDialog = ({
  open,
  onOpenChange,
  section,
  row,
  onChange,
  disabled = false,
}) => {
  if (!section || !row) return null

  const sectionDisabled = disabled || section.enabled === false
  const [draftRow, setDraftRow] = useState(row)
  const ruleAnalysis = buildMatrixRowAnalysis(draftRow)

  useEffect(() => {
    if (open) {
      setDraftRow(row)
    }
  }, [open, row])

  const handleSave = () => {
    onChange?.(draftRow)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[96vw] overflow-hidden p-0">
        <div className="flex max-h-[92vh] flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            <DialogHeader>
              <DialogTitle>
                Edit {dimensionLabel(section.rating_dimension)} - Score {draftRow.score}
              </DialogTitle>
              <DialogDescription>
                Edit the meaning, condition, and threshold values for this rating row.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <Textarea
                  value={draftRow.meaning}
                  onChange={(e) =>
                    setDraftRow((current) => ({
                      ...current,
                      meaning: e.target.value,
                    }))
                  }
                  placeholder="Enter the description of this score"
                  rows={4}
                  disabled={sectionDisabled}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Condition</label>
                <SingleComboBox
                  items={conditionTypes}
                  value={draftRow.condition_type}
                  onChange={(value) =>
                    setDraftRow((current) => ({
                      ...current,
                      condition_type: value || "",
                      condition_text: value === "text" ? current.condition_text : "",
                    }))
                  }
                  placeholder="Condition"
                  name="condition"
                  width="w-full"
                  contentClassName="z-[70]"
                  disabled={sectionDisabled}
                />
              </div>

              {draftRow.condition_type === "text" && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Condition Text</label>
                  <Textarea
                    value={draftRow.condition_text}
                    onChange={(e) =>
                      setDraftRow((current) => ({
                        ...current,
                        condition_text: e.target.value,
                      }))
                    }
                    placeholder="Describe the text condition"
                    rows={3}
                    disabled={sectionDisabled}
                  />
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">From</label>
                  <Input
                    type="number"
                    step="any"
                    value={draftRow.value_from}
                    onChange={(e) =>
                      setDraftRow((current) => ({
                        ...current,
                        value_from: e.target.value,
                      }))
                    }
                    placeholder="From"
                    disabled={sectionDisabled}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">To</label>
                  <Input
                    type="number"
                    step="any"
                    value={draftRow.value_to}
                    onChange={(e) =>
                      setDraftRow((current) => ({
                        ...current,
                        value_to: e.target.value,
                      }))
                    }
                    placeholder="To"
                    disabled={sectionDisabled}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Unit</label>
                  <SingleComboBox
                    items={unitOptions}
                    value={draftRow.unit}
                    onChange={(value) =>
                      setDraftRow((current) => ({
                        ...current,
                        unit: value || "",
                      }))
                    }
                    placeholder="Unit"
                    name="unit"
                    width="w-full"
                    contentClassName="z-[70]"
                    disabled={sectionDisabled}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Timing</label>
                  <SingleComboBox
                    items={timingOptions}
                    value={draftRow.timing}
                    onChange={(value) =>
                      setDraftRow((current) => ({
                        ...current,
                        timing: value || "",
                      }))
                    }
                    placeholder="Timing"
                    name="timing"
                    width="w-full"
                    side="top"
                    align="start"
                    contentClassName="z-[70]"
                    disabled={sectionDisabled}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Rule Analysis</p>
                    <p className="text-xs text-slate-500">
                      This is the interpreted meaning of the condition settings.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDraftRow((current) => ({
                        ...current,
                        meaning: ruleAnalysis,
                      }))
                    }
                    disabled={sectionDisabled || !ruleAnalysis}
                  >
                    Use as Description
                  </Button>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{ruleAnalysis}</p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-background px-6 py-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={sectionDisabled}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={sectionDisabled}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const MatrixCopyDialog = ({
  open,
  onOpenChange,
  targetSection,
  sourceDimension,
  sourceOptions,
  onSourceDimensionChange,
  onCopy,
  disabled = false,
}) => {
  if (!targetSection) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-[96vw] overflow-hidden p-0">
        <div className="flex max-h-[85vh] flex-col">
          <div className="overflow-y-auto px-6 py-6">
            <DialogHeader>
              <DialogTitle>Copy {dimensionLabel(targetSection.rating_dimension)} Matrix</DialogTitle>
              <DialogDescription>
                Select a source rating dimension. Its 5-to-1 rows will replace the current matrix for{" "}
                {dimensionLabel(targetSection.rating_dimension)}.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Source Rating Dimension</label>
                <SingleComboBox
                  items={sourceOptions}
                  value={sourceDimension}
                  onChange={onSourceDimensionChange}
                  placeholder="Select source dimension"
                  name="source_dimension"
                  width="w-full"
                  disabled={disabled}
                />
              </div>

              <p className="text-xs text-slate-500">
                The selected source dimension will overwrite the rows in {dimensionLabel(targetSection.rating_dimension)}.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={disabled}>
                  Cancel
                </Button>
                <Button type="button" onClick={onCopy} disabled={disabled || !sourceDimension}>
                  Copy Matrix
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const MatrixBuilder = ({ value, onChange, disabled = false, showControls = true }) => {
  const [editingTarget, setEditingTarget] = useState(null)
  const [copyTarget, setCopyTarget] = useState(null)
  const [copySourceDimension, setCopySourceDimension] = useState("")
  const matrix = normalizeMatrixPayload(value)[0] ?? createMatrixBlock()

  const emitChange = (next) => onChange?.([next])

  const updateSection = (sectionIndex, updater) => {
    emitChange({
      ...matrix,
      sections: matrix.sections.map((section, currentIndex) =>
        currentIndex === sectionIndex ? updater(section) : section
      ),
    })
  }

  const updateRow = (sectionIndex, rowIndex, updater) => {
    updateSection(sectionIndex, (section) => ({
      ...section,
      rows: section.rows.map((row, currentIndex) =>
        currentIndex === rowIndex ? updater(row) : row
      ),
    }))
  }

  const copySectionFromDimension = (targetSectionIndex, sourceDimension) => {
    const sourceSection = matrix.sections.find(
      (section) => String(section?.rating_dimension ?? "").toUpperCase() === String(sourceDimension).toUpperCase()
    )

    if (!sourceSection) return

    const sourceRows = Array.isArray(sourceSection.rows) ? sourceSection.rows : []
    updateSection(targetSectionIndex, (section) => ({
      ...section,
      rows: sourceRows.map((row) => ({
        ...row,
        score: row.score,
        condition_type: row.condition_type || "",
        condition_text: row.condition_text || "",
        meaning: row.meaning || "",
        value_from: row.value_from ?? "",
        value_to: row.value_to ?? "",
        unit: row.unit || "",
        timing: row.timing || "",
      })),
    }))
  }

  const summaryRows = useMemo(
    () =>
      matrix.sections.map((section) => ({
        rating_dimension: section.rating_dimension,
        enabled: section.enabled !== false,
      })),
    [matrix]
  )

  const currentSection =
    editingTarget !== null ? matrix.sections[editingTarget.sectionIndex] : null
  const currentRow =
    editingTarget !== null
      ? matrix.sections[editingTarget.sectionIndex]?.rows?.[editingTarget.rowIndex] ?? null
      : null
  const copyTargetSection =
    copyTarget !== null ? matrix.sections[copyTarget.sectionIndex] ?? null : null
  const copySourceOptions = useMemo(
    () =>
      dimensionOptions.filter(
        (dimension) =>
          copyTargetSection === null ||
          String(dimension.value).toUpperCase() !== String(copyTargetSection.rating_dimension ?? "").toUpperCase()
      ),
    [copyTargetSection]
  )

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Rating Matrix</p>
            <p className="text-xs text-slate-500">
              The matrix is shown per dimension below. Use the pencil icon to edit each rating row.
            </p>
          </div>
        </div>

        <div className="space-y-4 px-4 py-4">
          {matrix.sections.map((section, sectionIndex) => {
            const summary = summaryRows[sectionIndex] ?? {}

            return (
              <div key={section.rating_dimension} className="overflow-hidden rounded-lg border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {dimensionLabel(section.rating_dimension)}
                    </p>
                    <p className="text-xs text-slate-500">
                      5-to-1 rows for this dimension. Use the pencil on each row to edit.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${summary.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {summary.enabled ? "Enabled" : "Disabled"}
                    </span>
                    {showControls && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCopyTarget({ sectionIndex })
                            setCopySourceDimension("")
                          }}
                          disabled={disabled || section.enabled === false}
                        >
                          Copy
                        </Button>
                        <Switch
                          checked={section.enabled !== false}
                          onCheckedChange={(checked) =>
                            updateSection(sectionIndex, (current) => ({
                              ...current,
                              enabled: Boolean(checked),
                            }))
                          }
                          disabled={disabled}
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Score</th>
                        <th className="px-4 py-3 text-left font-semibold">Description</th>
                        <th className="px-4 py-3 text-left font-semibold">Condition</th>
                        <th className="px-4 py-3 text-left font-semibold">From</th>
                        <th className="px-4 py-3 text-left font-semibold">To</th>
                        <th className="px-4 py-3 text-left font-semibold">Unit</th>
                        <th className="px-4 py-3 text-left font-semibold">Timing</th>
                        {showControls && <th className="px-4 py-3 text-left font-semibold">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {scoreBands.map((score, rowIndex) => {
                        const row = section.rows[rowIndex] ?? {}

                        return (
                          <tr key={`${section.rating_dimension}-${score}`} className={section.enabled === false ? "opacity-60" : ""}>
                            <td className="px-4 py-3 font-semibold text-slate-900">{row.score}</td>
                            <td className="px-4 py-3 text-slate-700">
                              {row.meaning ? row.meaning : "-"}
                            </td>
                            <td className="px-4 py-3 text-slate-700">
                              {row.condition_type
                                ? `${conditionTypes.find((item) => item.value === row.condition_type)?.label ?? row.condition_type}${
                                    row.condition_type === "text" && row.condition_text ? `: ${row.condition_text}` : ""
                                  }`
                                : "-"}
                            </td>
                            <td className="px-4 py-3 text-slate-700">{row.value_from || "-"}</td>
                            <td className="px-4 py-3 text-slate-700">{row.value_to || "-"}</td>
                            <td className="px-4 py-3 text-slate-700">
                              {unitOptions.find((item) => item.value === row.unit)?.label ?? row.unit ?? "-"}
                            </td>
                            <td className="px-4 py-3 text-slate-700">
                              {timingOptions.find((item) => item.value === row.timing)?.label ?? row.timing ?? "-"}
                            </td>
                            {showControls && (
                              <td className="px-4 py-3">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    setEditingTarget({
                                      sectionIndex,
                                      rowIndex,
                                    })
                                  }
                                  disabled={disabled || section.enabled === false}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </td>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showControls && (
        <>
          <MatrixRowEditorDialog
            open={editingTarget !== null}
            onOpenChange={(open) => {
              if (!open) setEditingTarget(null)
            }}
            section={currentSection}
            row={currentRow}
            onChange={(nextRow) => {
              if (editingTarget === null) return
              updateRow(editingTarget.sectionIndex, editingTarget.rowIndex, () => nextRow)
            }}
            disabled={disabled}
          />

          <MatrixCopyDialog
            open={copyTarget !== null}
            onOpenChange={(open) => {
              if (!open) {
                setCopyTarget(null)
                setCopySourceDimension("")
              }
            }}
            targetSection={copyTargetSection}
            sourceDimension={copySourceDimension}
            sourceOptions={copySourceOptions}
            onSourceDimensionChange={setCopySourceDimension}
            onCopy={() => {
              if (copyTarget === null || !copySourceDimension) return
              copySectionFromDimension(copyTarget.sectionIndex, copySourceDimension)
              setCopyTarget(null)
              setCopySourceDimension("")
            }}
            disabled={disabled}
          />
        </>
      )}
    </div>
  )
}

export default MatrixBuilder
