import { Fragment } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import SearchableComboBox from "@/components/SearchableComboBox"
import { Eye, Pencil, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { previewHierarchyBadgeStyles } from "../utils/previewHierarchyStyles"

export default function OpcrTreeTable({
  canManage,
  categoryRows = [],
  addCategoryOpen,
  setAddCategoryOpen,
  handleSelectCategory,
  handleOpenCreateCategory,
  categoryWeightTotal,
  categoryWeightIsBalanced,
  categoryWeightBalance,
  hasAnyExplicitCategoryCap,
  formatNumber,
  formatFixedNumber,
  formatText,
  formatAssignments,
  getCategoryDisplayWeight,
  getCategoryDisplayAmount,
  getPapDisplayTotals,
  draggedTreeNode,
  handleTreeDragStart,
  handleTreeDragEnd,
  reorderCategoryRows,
  movePapNode,
  isPapDescendantInCategory,
  reorderPapWithinCategory,
  reorderSuccessIndicatorWithinPap,
  moveSuccessIndicatorNode,
  openPapPicker,
  closePapPicker,
  papPickerOpen,
  papPickerCategoryId,
  papPickerParentPapId,
  handleSelectPap,
  handleOpenCreatePap,
  successIndicatorPickerOpen,
  successIndicatorPickerCategoryId,
  successIndicatorPickerPapId,
  openSuccessIndicatorPicker,
  closeSuccessIndicatorPicker,
  handleSelectSuccessIndicator,
  handleOpenCreateSuccessIndicator,
  openCategoryEdit,
  promptRemoveCategory,
  openPapEdit,
  promptRemovePap,
  openSuccessIndicatorEdit,
  promptRemoveSuccessIndicator,
  onPreviewOpen,
  autosaveStatus = "idle",
}) {
  const showActionsColumn = Boolean(canManage)
  const getCategoryRowClassName = () =>
    "border-l-4 border-l-sky-300 bg-sky-100 hover:bg-sky-200/60"

  const getProgramRowClassName = () =>
    "border-l-4 border-l-amber-300 bg-amber-100 hover:bg-amber-200/60"

  const getPapRowClassName = (level = 1) => {
    if (level === 1) {
      return "border-l-4 border-l-emerald-300 bg-emerald-100 hover:bg-emerald-200/60"
    }

    if (level === 2) {
      return "border-l-4 border-l-emerald-400 bg-emerald-100 hover:bg-emerald-200/60"
    }

    return "border-l-4 border-l-emerald-500 bg-emerald-100 hover:bg-emerald-200/60"
  }

  const getSuccessIndicatorRowClassName = (level = 1) => {
    if (level === 1) {
      return "border-l-4 border-l-violet-300 bg-violet-100 hover:bg-violet-200/60"
    }

    if (level === 2) {
      return "border-l-4 border-l-violet-400 bg-violet-100 hover:bg-violet-200/60"
    }

    return "border-l-4 border-l-violet-500 bg-violet-100 hover:bg-violet-200/60"
  }

  const getCategoryMetricClassName = () => "text-sm font-semibold text-slate-900 tabular-nums"

  const getPapMetricClassName = () => "text-sm font-semibold text-slate-900 tabular-nums"

  const getSuccessIndicatorMetricClassName = () => "text-xs font-normal text-slate-900 tabular-nums"

  const flashRows = (type) => {
    const nodes = document.querySelectorAll(`[data-preview-row="${type}"]`)
    if (!nodes.length) return

    nodes.forEach((node) => {
      node.classList.add("ring-2", "ring-inset", "ring-slate-500/35", "animate-pulse")
    })

    window.setTimeout(() => {
      nodes.forEach((node) => {
        node.classList.remove("ring-2", "ring-inset", "ring-slate-500/35", "animate-pulse")
      })
    }, 700)
  }

  const getProgramGroupKey = (pap = {}) => {
    const title = String(pap.program_title ?? "").trim().toLowerCase()
    if (title) {
      return `title:${title}`
    }

    const programId = String(pap.program_id ?? "").trim()
    return programId ? `id:${programId}` : ""
  }

  const renderSuccessIndicatorRows = (category, pap, successIndicators = [], level = 1, pathPrefix = "", parentPapName = "") =>
    (Array.isArray(successIndicators) ? successIndicators : []).map((indicator, indicatorIndex) => {
      const rowNumber = `${pathPrefix}.${indicatorIndex + 1}`
      const rowClassName = getSuccessIndicatorRowClassName(level)
      const indicatorParentLabel = parentPapName || pap.activity || category.category
      const accountabilityLabel = formatAssignments([
        ...(indicator.division_assignments ?? []),
        ...(indicator.group_assignments ?? []),
        ...(indicator.employee_assignments ?? []),
      ])
      const accountabilityDisplay = accountabilityLabel !== "-" ? accountabilityLabel : formatText(indicator.accountable, "-")
      const weightValue = Number(indicator.weight ?? 0)
      const amountValue = Number(indicator.amount ?? indicator.budget ?? 0)

      return (
        <TableRow
          key={`${category.id}-${pap.id}-si-${indicator.id ?? rowNumber}`}
          className={rowClassName}
          data-preview-row="successIndicator"
          draggable={canManage}
          onDragStart={() =>
            handleTreeDragStart({
              type: "successIndicator",
              categoryId: category.id,
              papId: pap.id,
              indicatorId: indicator.id ?? indicator.value,
              node: indicator,
            })
          }
          onDragOver={(event) => {
            if (draggedTreeNode?.type) {
              event.preventDefault()
            }
          }}
          onDrop={(event) => {
            event.preventDefault()

            if (!draggedTreeNode) return

            if (draggedTreeNode.type === "successIndicator") {
              const draggedIndicatorId = draggedTreeNode.indicatorId
              if (String(draggedTreeNode.categoryId) === String(category.id) && String(draggedTreeNode.papId) === String(pap.id)) {
                reorderSuccessIndicatorWithinPap(category.id, pap.id, draggedIndicatorId, indicator.id ?? indicator.value)
                handleTreeDragEnd()
                return
              }

              moveSuccessIndicatorNode({
                sourceCategoryId: draggedTreeNode.categoryId,
                sourcePapId: draggedTreeNode.papId,
                targetCategoryId: category.id,
                targetPapId: pap.id,
                indicatorNode: draggedTreeNode.node,
                beforeIndicatorId: indicator.id ?? indicator.value,
              })
              handleTreeDragEnd()
              return
            }

            if (draggedTreeNode.type === "pap") {
              movePapNode({
                sourceCategoryId: draggedTreeNode.categoryId,
                targetCategoryId: category.id,
                papNode: draggedTreeNode.node,
                targetParentPapId: pap.id,
              })
              handleTreeDragEnd()
            }
          }}
          onDragEnd={handleTreeDragEnd}
        >
          <TableCell className="align-middle px-3 py-1 text-xs text-slate-400">{rowNumber}</TableCell>
          <TableCell className="align-middle px-3 py-1 text-sm text-slate-400 whitespace-normal break-words" />
          <TableCell className="align-middle px-3 py-1 text-xs text-slate-500 whitespace-normal break-words">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${(level + 1) * 1.25}rem` }}>
              <span className="whitespace-normal break-words">{formatText(pap.activity)}</span>
            </div>
          </TableCell>
          <TableCell className="align-middle px-3 py-1 text-sm text-slate-900 whitespace-normal break-words">
            <div className="whitespace-normal break-words">{formatText(indicator.target ?? indicator.title)}</div>
          </TableCell>
          <TableCell className="align-middle px-3 py-1 text-xs text-slate-700 whitespace-normal break-words">
            <div className="whitespace-normal break-words">{accountabilityDisplay}</div>
          </TableCell>
          <TableCell className={`align-middle px-3 py-1 text-right ${getSuccessIndicatorMetricClassName()}`}>
            {`${formatFixedNumber(weightValue)}%`}
          </TableCell>
          <TableCell className={`align-middle px-3 py-1 text-right ${getSuccessIndicatorMetricClassName()}`}>
            {formatFixedNumber(amountValue)}
          </TableCell>
          {showActionsColumn && (
            <TableCell className="align-middle px-3 py-1 text-right">
              <div className="ml-auto flex w-full items-center justify-end gap-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => openSuccessIndicatorEdit(category, pap, indicator)}
                      aria-label={`Edit Success Indicator: ${formatText(indicator.target ?? indicator.title)}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{`Edit Success Indicator: ${formatText(indicator.target ?? indicator.title ?? indicator.label)}`}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-600 hover:text-red-700"
                      onClick={() => promptRemoveSuccessIndicator(category, pap, indicator)}
                      aria-label={`Remove Success Indicator: ${formatText(indicator.target ?? indicator.title)}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{`Remove Success Indicator: ${formatText(indicator.target ?? indicator.title ?? indicator.label)}`}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TableCell>
          )}
        </TableRow>
      )
    })

  const renderPapRows = (category, paps = [], level = 1, parentPapId = null, parentPapName = "", pathPrefix = "", categoryNumber = "") => {
    let lastProgramKey = null

    return (Array.isArray(paps) ? paps : []).reduce((rows, pap, papIndex) => {
      const rowNumber = pathPrefix ? `${pathPrefix}.${papIndex + 1}` : `${categoryNumber}.${papIndex + 1}`
      const childPaps = Array.isArray(pap.children) ? pap.children : []
      const successIndicators = Array.isArray(pap.successIndicators) ? pap.successIndicators : []
      const childLevel = level > 1
      const papTotals = getPapDisplayTotals(pap)
      const rowClassName = level === 1 ? "bg-slate-50/60" : level === 2 ? "bg-slate-100/50" : "bg-slate-100/70"
      const programKey = getProgramGroupKey(pap)
      const programLabel = formatText(pap.program_title, "")
      const shouldRenderProgramRow = programLabel !== "-" && programKey && programKey !== lastProgramKey

      if (shouldRenderProgramRow) {
        lastProgramKey = programKey
        rows.push(
          <TableRow key={`${category.id}-${pap.id}-${rowNumber}-program`} className={getProgramRowClassName()} data-preview-row="program">
            <TableCell className="align-middle px-3 py-1 text-xs text-slate-400" />
            <TableCell className="align-middle px-3 py-1 text-sm text-slate-400 whitespace-normal break-words" />
            <TableCell className="align-middle px-3 py-1 text-sm font-semibold uppercase tracking-wide text-slate-600 whitespace-normal break-words">
              <div className="flex min-w-0 items-center gap-2" style={{ paddingLeft: `${level * 1.25}rem` }}>
                <span className="text-slate-300">-</span>
                <span className="capitalize">{formatText(programLabel)}</span>
              </div>
            </TableCell>
            <TableCell className="align-middle px-3 py-1 text-sm text-slate-500">-</TableCell>
            <TableCell className="align-middle px-3 py-1 text-sm text-slate-500">-</TableCell>
            <TableCell className="align-middle px-3 py-1 text-right text-xs text-slate-500">-</TableCell>
            <TableCell className="align-middle px-3 py-1 text-right text-xs text-slate-500">-</TableCell>
            {showActionsColumn && <TableCell className="align-middle px-3 py-1 text-right" />}
          </TableRow>
        )
      }

      rows.push(
        <Fragment key={`${category.id}-${pap.id}-${rowNumber}`}>
          <TableRow
            className={getPapRowClassName(level)}
            data-preview-row="pap"
            draggable={canManage}
            onDragStart={() =>
              handleTreeDragStart({
                type: "pap",
                categoryId: category.id,
                parentPapId,
                papId: pap.id,
                node: pap,
              })
            }
            onDragEnd={handleTreeDragEnd}
            onDragOver={(event) => {
              if (draggedTreeNode?.type) {
                event.preventDefault()
              }
            }}
            onDrop={(event) => {
              event.preventDefault()

              if (!draggedTreeNode) return

              if (draggedTreeNode.type === "pap") {
                if (
                  String(draggedTreeNode.categoryId) === String(category.id) &&
                  String(draggedTreeNode.parentPapId ?? null) === String(parentPapId ?? null)
                ) {
                  reorderPapWithinCategory(category.id, parentPapId ?? null, draggedTreeNode.papId, pap.id)
                  handleTreeDragEnd()
                  return
                }

                if (isPapDescendantInCategory(draggedTreeNode.categoryId, draggedTreeNode.papId, pap.id)) {
                  handleTreeDragEnd()
                  return
                }

                movePapNode({
                  sourceCategoryId: draggedTreeNode.categoryId,
                  targetCategoryId: category.id,
                  papNode: draggedTreeNode.node,
                  targetParentPapId: pap.id,
                })
                handleTreeDragEnd()
                return
              }

              if (draggedTreeNode.type === "successIndicator") {
                moveSuccessIndicatorNode({
                  sourceCategoryId: draggedTreeNode.categoryId,
                  sourcePapId: draggedTreeNode.papId,
                  targetCategoryId: category.id,
                  targetPapId: pap.id,
                  indicatorNode: draggedTreeNode.node,
                })
                handleTreeDragEnd()
              }
            }}
          >
            <TableCell className="align-middle px-3 py-1 text-xs text-slate-400">{rowNumber}</TableCell>
            <TableCell className="align-middle px-3 py-1 text-xs text-slate-500 whitespace-normal break-words min-w-0">
              <div className="flex min-w-0 items-center gap-2" style={{ paddingLeft: `${level * 1.25}rem` }}>
                {childLevel ? (
                  <div className="flex min-w-0 flex-col">
                    <span className="break-words text-xs text-slate-500">{formatText(parentPapName)}</span>
                  </div>
                ) : (
                  <span className="whitespace-normal break-words">{formatText(category.category)}</span>
                )}
              </div>
            </TableCell>
            <TableCell className="align-middle px-3 py-1 text-xs text-slate-500 whitespace-normal break-words min-w-0">
              <div className="flex min-w-0 items-center gap-2" style={{ paddingLeft: `${level * 1.25}rem` }}>
                <div className="min-w-0">
                  <div className="whitespace-normal break-words text-sm font-semibold text-slate-700">{formatText(pap.activity)}</div>
                </div>
              </div>
            </TableCell>
            <TableCell className="align-middle px-3 py-1 text-sm text-slate-900 whitespace-normal break-words">
              {canManage && childPaps.length === 0 ? (
                <div className="flex justify-start">
                  <Popover
                    open={successIndicatorPickerOpen && String(successIndicatorPickerCategoryId) === String(category.id) && String(successIndicatorPickerPapId) === String(pap.id)}
                    onOpenChange={(open) => {
                      if (open) {
                        openSuccessIndicatorPicker(category.id, pap.id)
                      } else if (String(successIndicatorPickerCategoryId) === String(category.id) && String(successIndicatorPickerPapId) === String(pap.id)) {
                        closeSuccessIndicatorPicker()
                      }
                    }}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" size="sm" className="gap-2 px-2 text-xs">
                            <Plus className="h-4 w-4" />
                            Add Success Indicator
                          </Button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{`Add Success Indicator: ${formatText(pap.activity ?? pap.title ?? pap.label)}`}</p>
                      </TooltipContent>
                    </Tooltip>
                    <PopoverContent align="start" className="w-[420px] p-3">
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Select Success Indicator</div>
                          <div className="text-xs text-slate-500">Choose an existing success indicator or add a new one if it is not in the library yet.</div>
                        </div>
                        <SearchableComboBox
                          name="pap_id"
                          placeholder="Search success indicators..."
                          apiUrl={route("performance.success-indicators.index")}
                          canAdd
                          onChange={(val, item) => {
                            handleSelectSuccessIndicator(
                              category.id,
                              pap.id,
                              { ...item, value: val, label: item?.label || item?.activity }
                            )
                          }}
                          onAdd={handleOpenCreateSuccessIndicator}
                          invalidMessage={null}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              ) : (
                <span className="text-slate-500">-</span>
              )}
            </TableCell>
            <TableCell className="align-middle px-3 py-1 text-sm text-slate-500">-</TableCell>
            <TableCell className={`align-middle px-3 py-1 text-right ${getPapMetricClassName()}`}>{`${formatFixedNumber(papTotals.weight)}%`}</TableCell>
            <TableCell className={`align-middle px-3 py-1 text-right ${getPapMetricClassName()}`}>{formatFixedNumber(papTotals.amount)}</TableCell>
            {showActionsColumn && (
              <TableCell className="align-middle px-3 py-1 text-right">
                <div className="ml-auto flex w-full items-center justify-end gap-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => openPapEdit(category, pap, parentPapId)}
                        aria-label={`Edit MFO/PAP: ${formatText(pap.activity)}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{`Edit MFO/PAP: ${formatText(pap.activity ?? pap.title ?? pap.label)}`}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-600 hover:text-red-700"
                        onClick={() => promptRemovePap(category.id, { ...pap, parentPapId })}
                        aria-label={`Remove MFO/PAP: ${formatText(pap.activity)}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{`Remove MFO/PAP: ${formatText(pap.activity ?? pap.title ?? pap.label)}`}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TableCell>
            )}
          </TableRow>

          {renderSuccessIndicatorRows(category, pap, successIndicators, level, rowNumber, parentPapName)}

          {childPaps.length > 0 ? renderPapRows(category, childPaps, level + 1, pap.id, pap.activity, rowNumber, categoryNumber) : null}
        </Fragment>
      )
      return rows
    }, [])
  }

  return (
    <Card className="border border-slate-200 bg-white shadow-none">
      <CardHeader className="border-b border-slate-200 bg-slate-50/60 px-3 py-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base">Planning and Commitment</CardTitle>
            <CardDescription>
              {canManage ? "During this stage, success indicators are determined. Success indicators are performance level yardsticks consisting of performance measures and performance targets. These shall serve as bases in the office’s and individual employee’s preparation of their performance contract and rating form." : "You have view-only access."}
            </CardDescription>
            {canManage && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span
                  className={`rounded-full border px-2 py-0.5 font-medium ${
                    autosaveStatus === "saving"
                      ? "border-slate-200 bg-slate-100 text-slate-700"
                      : autosaveStatus === "saved"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : autosaveStatus === "dirty"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-slate-200 bg-slate-50 text-slate-500"
                  }`}
                >
                  {autosaveStatus === "saving"
                    ? "Autosaving..."
                    : autosaveStatus === "saved"
                      ? "Saved"
                      : autosaveStatus === "dirty"
                        ? "Unsaved changes"
                    : "Idle"}
                </span>
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
              <span className="font-semibold uppercase tracking-wide text-slate-500">Legend</span>
              <button type="button" onClick={() => flashRows("category")} className="rounded-full">
                <Badge variant="secondary" className={previewHierarchyBadgeStyles.category}>
                  Category
                </Badge>
              </button>
              <button type="button" onClick={() => flashRows("program")} className="rounded-full">
                <Badge variant="secondary" className={previewHierarchyBadgeStyles.program}>
                  Program
                </Badge>
              </button>
              <button type="button" onClick={() => flashRows("pap")} className="rounded-full">
                <Badge variant="secondary" className={previewHierarchyBadgeStyles.pap}>
                  MFO/PAP
                </Badge>
              </button>
              <button type="button" onClick={() => flashRows("successIndicator")} className="rounded-full">
                <Badge variant="secondary" className={previewHierarchyBadgeStyles.successIndicator}>
                  Success Indicator
                </Badge>
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span
                className={`rounded-full border px-2 py-0.5 font-medium ${
                  categoryWeightTotal > 100.0001
                    ? "border-red-200 bg-red-50 text-red-700"
                    : categoryWeightIsBalanced
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {hasAnyExplicitCategoryCap ? "Total Weight" : "Rolled-up Weight"}: {formatNumber(categoryWeightTotal)}%
              </span>
              <span className="text-slate-500">
                {hasAnyExplicitCategoryCap
                  ? categoryWeightIsBalanced
                    ? "Balanced at 100%"
                    : `Remaining: ${formatNumber(categoryWeightBalance)}%`
                  : "Computed from the current MFO/PAP tree"}
              </span>
            </div>
          </div>
          <div className="flex items-start md:items-end">
            {canManage && typeof onPreviewOpen === "function" && (
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={onPreviewOpen}>
                <Eye className="h-4 w-4" />
                Preview OPCR
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-0 p-0">
        <Table className="w-full table-fixed">
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              <TableHead className="w-[90px] px-3 py-2 text-xs">No.</TableHead>
              <TableHead className="px-3 py-2 text-xs">Category</TableHead>
              <TableHead className="px-3 py-2 text-xs">Major Final Outputs/Programs, Activities, and Projects</TableHead>
              <TableHead className="px-3 py-2 text-xs">Success Indicator</TableHead>
            <TableHead className="px-3 py-2 text-xs">Division/Group/Staff Accountable</TableHead>
            <TableHead className="w-[110px] px-3 py-2 text-xs">Weight</TableHead>
            <TableHead className="w-[140px] px-3 py-2 text-right text-xs">Allocated Budget</TableHead>
            {showActionsColumn && <TableHead className="w-[120px] px-3 py-2 text-right text-xs">Action</TableHead>}
          </TableRow>
          </TableHeader>
          <TableBody>
            {categoryRows.length > 0 ? (
              categoryRows.map((category, index) => (
                <Fragment key={category.id}>
                    <TableRow
                      draggable={canManage}
                    onDragStart={() =>
                      handleTreeDragStart({
                        type: "category",
                        categoryId: category.id,
                        node: category,
                      })
                    }
                    onDragEnd={handleTreeDragEnd}
                    onDragOver={(event) => {
                      if (draggedTreeNode?.type) {
                        event.preventDefault()
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault()

                      if (draggedTreeNode?.type === "category") {
                        if (String(draggedTreeNode.categoryId) !== String(category.id)) {
                          reorderCategoryRows(draggedTreeNode.categoryId, category.id)
                        }
                        handleTreeDragEnd()
                        return
                      }

                      if (draggedTreeNode?.type === "pap") {
                        movePapNode({
                          sourceCategoryId: draggedTreeNode.categoryId,
                          targetCategoryId: category.id,
                          papNode: draggedTreeNode.node,
                        })
                        handleTreeDragEnd()
                      }
                    }}
                      className={getCategoryRowClassName()}
                      data-preview-row="category"
                    >
                    <TableCell className="align-middle px-3 py-1 text-xs text-slate-500">{index + 1}</TableCell>
                    <TableCell className="align-middle px-3 py-1 text-sm font-medium text-slate-900 whitespace-normal break-words">{formatText(category.category)}</TableCell>
                    <TableCell className="align-middle px-3 py-1 text-sm text-slate-900">
                      {canManage && (
                        <Popover
                          open={papPickerOpen && String(papPickerCategoryId) === String(category.id)}
                          onOpenChange={(open) => {
                            if (open) {
                              openPapPicker(category.id)
                            } else if (String(papPickerCategoryId) === String(category.id)) {
                              closePapPicker()
                            }
                          }}
                        >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <PopoverTrigger asChild>
                                  <Button type="button" variant="outline" size="sm" className="gap-2 px-2 text-xs">
                                    <Plus className="h-4 w-4" />
                                    Add MFO/PAP
                                  </Button>
                                </PopoverTrigger>
                              </TooltipTrigger>
                            <TooltipContent>
                              <p>{`Add MFO/PAP: ${formatText(category.category ?? category.label)}`}</p>
                            </TooltipContent>
                          </Tooltip>
                          <PopoverContent align="start" className="w-[420px] p-3">
                            <div className="space-y-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">Select MFO/PAP</div>
                                <div className="text-xs text-slate-500">Choose an existing item or add a new MFO/PAP if it is not in the library yet.</div>
                              </div>
                              <SearchableComboBox
                                name="pap_id"
                                placeholder="Search MFO/PAP..."
                                apiUrl={route("performance.ppas.index")}
                                canAdd
                                onChange={(val, item) => {
                                  handleSelectPap(
                                    category.id,
                                    { ...item, value: val, label: item?.label || item?.activity },
                                    papPickerParentPapId
                                  )
                                }}
                                onAdd={handleOpenCreatePap}
                                invalidMessage={null}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </TableCell>
                    <TableCell className="align-middle px-3 py-1 text-sm text-slate-500">-</TableCell>
                    <TableCell className="align-middle px-3 py-1 text-sm text-slate-500">-</TableCell>
                    <TableCell className={`align-middle px-3 py-1 text-right ${getCategoryMetricClassName()}`}>{`${formatFixedNumber(getCategoryDisplayWeight(category))}%`}</TableCell>
                    <TableCell className={`align-middle px-3 py-1 text-right ${getCategoryMetricClassName()}`}>{formatFixedNumber(getCategoryDisplayAmount(category))}</TableCell>
                    {showActionsColumn && (
                      <TableCell className="align-middle px-3 py-1 text-right">
                        <div className="ml-auto flex w-full items-center justify-end gap-1.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => openCategoryEdit(category)} aria-label={`Edit Category: ${formatText(category.category)}`}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{`Edit Category: ${formatText(category.category ?? category.label)}`}</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-600 hover:text-red-700" onClick={() => promptRemoveCategory(category)} aria-label={`Remove Category: ${formatText(category.category)}`}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{`Remove Category: ${formatText(category.category ?? category.label)}`}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                  {renderPapRows(category, category.paps ?? [], 1, null, "", "", String(index + 1))}
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={showActionsColumn ? 8 : 7} className="py-4 text-center text-sm text-slate-500">
                  No categories configured yet.
                </TableCell>
              </TableRow>
            )}

            {categoryRows.length > 0 && (
              <TableRow className="border-t border-slate-300 bg-slate-50 font-medium">
                <TableCell className="px-3 py-2" />
                <TableCell className="align-middle px-3 py-1 text-sm text-slate-900 whitespace-normal break-words">
                  {showActionsColumn && (
                    <Popover open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <PopoverTrigger asChild>
                            <Button type="button" variant="ghost" size="sm" className="gap-2 px-2 text-xs">
                              <Plus className="h-4 w-4" />
                              Add Category
                            </Button>
                          </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add Category</p>
                        </TooltipContent>
                      </Tooltip>
                      <PopoverContent align="end" className="w-96 p-3">
                        <div className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Search and add category</div>
                        <SearchableComboBox
                          apiUrl={route("performance.categories.index")}
                          placeholder="Search categories..."
                          addLabel="Add New Item"
                          canAdd
                          excludeValues={categoryRows.map((row) => row.id)}
                          onChange={(_, item) => {
                            if (item) {
                              handleSelectCategory(item)
                            }
                          }}
                          onAdd={handleOpenCreateCategory}
                          width="w-full"
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </TableCell>
                <TableCell className="px-3 py-2" />
                <TableCell className="px-3 py-2" />
                <TableCell className="text-right px-3 py-1 text-xs text-slate-600 font-semibold">Grand Total</TableCell>
                <TableCell className={`align-middle px-3 py-1 text-right ${getCategoryMetricClassName()}`}>{`${formatFixedNumber(categoryWeightTotal)}%`}</TableCell>
                <TableCell className={`align-middle px-3 py-1 text-right ${getCategoryMetricClassName()}`}>{formatFixedNumber(categoryRows.reduce((total, row) => total + getCategoryDisplayAmount(row), 0))}</TableCell>
                {showActionsColumn && <TableCell className="px-3 py-2" />}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
