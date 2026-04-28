import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import axios from "axios"
import { router, useForm } from "@inertiajs/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import SearchableComboBox from "@/components/SearchableComboBox"
import { useToast } from "@/hooks/use-toast"
import { useHasPermission } from "@/hooks/useAuth"
import { Pencil, Plus, Trash2 } from "lucide-react"
import useOpcrLookups from "./hooks/useOpcrLookups"
import CategoryEditorSheet from "./components/CategoryEditorSheet"
import CategoryCreateDialog from "./components/CategoryCreateDialog"
import PapEditorSheet from "./components/PapEditorSheet"
import PapCreateDialog from "./components/PapCreateDialog"
import OpcrTreeTable from "./components/OpcrTreeTable"
import PreviewOpcrDialog from "./components/PreviewOpcrDialog"
import SuccessIndicatorCreateDialog from "./components/SuccessIndicatorCreateDialog"
import { createMatrixBlock, normalizeMatrixPayload } from "../Libraries/SuccessIndicators/matrixUtils"
import { serializeOpcrTree } from "./utils/serializeOpcrTree"
import { hydrateOpcrTree } from "./utils/hydrateOpcrTree"

const emptyForm = {
  category_id: "",
  pap_id: "",
  weight: "",
  allocated_budget: "",
  remarks: "",
  sort_order: "",
}

const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") return "-"
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value
}

const formatFixedNumber = (value, digits = 2) => {
  if (value === null || value === undefined || value === "") return "-"
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits }) : value
}

const formatText = (value, fallback = "-") => {
  const text = String(value ?? "").trim()
  return text.length ? text : fallback
}

const FieldBlock = ({ label, value, className = "" }) => (
  <div className={className}>
    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
    <div className="mt-0.5 text-sm text-slate-900">{value}</div>
  </div>
)

export default function Pnc({
  record,
  libraryOptions = {},
  categories = [],
  forceReadOnly = false,
  periodLabel = "",
}) {
  const { toast } = useToast()
  const canManage = !forceReadOnly && useHasPermission("HRIS_performance.opcr.edit")
  const items = record?.items || []
  const [itemRows, setItemRows] = useState(items)
  const [categoryRows, setCategoryRows] = useState(categories)
  const categoryOptions = categoryRows
  const ppas = libraryOptions.ppas || []
  const [ratings, setRatings] = useState(Array.isArray(libraryOptions.ratings) ? libraryOptions.ratings : [])
  const [ratingsLoading, setRatingsLoading] = useState(false)
  const [draggedItemId, setDraggedItemId] = useState(null)
  const previousRecordIdRef = useRef(record?.id)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [categoryCreateOpen, setCategoryCreateOpen] = useState(false)
  const [categoryCreateValue, setCategoryCreateValue] = useState("")
  const [categoryCreating, setCategoryCreating] = useState(false)
  const [papPickerOpen, setPapPickerOpen] = useState(false)
  const [papPickerCategoryId, setPapPickerCategoryId] = useState(null)
  const [papPickerParentPapId, setPapPickerParentPapId] = useState(null)
  const [preservePapCategoryOnClose, setPreservePapCategoryOnClose] = useState(false)
  const [papCreateOpen, setPapCreateOpen] = useState(false)
  const [papCreateValue, setPapCreateValue] = useState("")
  const [papCreateWeight, setPapCreateWeight] = useState("")
  const [papCreateAmount, setPapCreateAmount] = useState("")
  const [papCreateLocked, setPapCreateLocked] = useState(false)
  const [selectedPapToAdd, setSelectedPapToAdd] = useState(null)
  const [papCreating, setPapCreating] = useState(false)
  const [successIndicatorPickerOpen, setSuccessIndicatorPickerOpen] = useState(false)
  const [successIndicatorPickerCategoryId, setSuccessIndicatorPickerCategoryId] = useState(null)
  const [successIndicatorPickerPapId, setSuccessIndicatorPickerPapId] = useState(null)
  const [successIndicatorCreateOpen, setSuccessIndicatorCreateOpen] = useState(false)
  const [successIndicatorCreateValue, setSuccessIndicatorCreateValue] = useState("")
  const [successIndicatorCreateWeight, setSuccessIndicatorCreateWeight] = useState("")
  const [successIndicatorCreateAmount, setSuccessIndicatorCreateAmount] = useState("")
  const [successIndicatorCreateDivisionAssignments, setSuccessIndicatorCreateDivisionAssignments] = useState([])
  const [successIndicatorCreateGroupAssignments, setSuccessIndicatorCreateGroupAssignments] = useState([])
  const [successIndicatorCreateEmployeeAssignments, setSuccessIndicatorCreateEmployeeAssignments] = useState([])
  const [successIndicatorCreateActivityId, setSuccessIndicatorCreateActivityId] = useState(null)
  const [successIndicatorCreateMatrixSource, setSuccessIndicatorCreateMatrixSource] = useState("custom")
  const [successIndicatorCreatePerformanceRatingId, setSuccessIndicatorCreatePerformanceRatingId] = useState(null)
  const [successIndicatorCreateMatrixPayload, setSuccessIndicatorCreateMatrixPayload] = useState([createMatrixBlock()])
  const [successIndicatorCreateCategoryId, setSuccessIndicatorCreateCategoryId] = useState(null)
  const [successIndicatorCreatePapId, setSuccessIndicatorCreatePapId] = useState(null)
  const [selectedSuccessIndicatorToAdd, setSelectedSuccessIndicatorToAdd] = useState(null)
  const [successIndicatorCreating, setSuccessIndicatorCreating] = useState(false)
  const [successIndicatorEditOpen, setSuccessIndicatorEditOpen] = useState(false)
  const [editingSuccessIndicator, setEditingSuccessIndicator] = useState(null)
  const [pendingSuccessIndicatorRemoval, setPendingSuccessIndicatorRemoval] = useState(null)
  const [draggedTreeNode, setDraggedTreeNode] = useState(null)
  const [autosaveStatus, setAutosaveStatus] = useState("idle")
  const autosaveTimerRef = useRef(null)
  const autosaveStatusTimerRef = useRef(null)
  const lastSavedTreeRef = useRef("")
  const skipNextAutosaveRef = useRef(true)
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingPap, setEditingPap] = useState(null)
  const [pendingCategoryRemoval, setPendingCategoryRemoval] = useState(null)
  const [pendingPapRemoval, setPendingPapRemoval] = useState(null)
  const [categoryDraft, setCategoryDraft] = useState({
    weight: "",
    amount: "",
  })
  const [draftRows, setDraftRows] = useState([])

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({ ...emptyForm })
  const {
    activities,
    activityMap,
    divisions,
    groups,
    employees,
    divisionMap,
    groupMap,
    employeeMap,
  } = useOpcrLookups()

  const activeDivisionIds = useMemo(
    () => divisions.map((division) => String(division.value ?? division.division_id ?? "")).filter(Boolean),
    [divisions]
  )

  const ratingItems = useMemo(
    () =>
      ratings.map((rating) => ({
        value: String(rating.id),
        label: `${rating.name}${rating.category ? ` (${rating.category})` : ""}`,
      })),
    [ratings]
  )

  const ratingMap = useMemo(
    () => Object.fromEntries(ratings.map((rating) => [String(rating.id), rating])),
    [ratings]
  )

  useEffect(() => {
    if (Array.isArray(libraryOptions.ratings) && libraryOptions.ratings.length > 0) {
      setRatings(libraryOptions.ratings)
      return
    }

    let mounted = true

    const loadRatings = async () => {
      try {
        setRatingsLoading(true)
        const response = await axios.get(route("performance.ratings.index"), { params: { per_page: 1000 } })
        if (!mounted) return

        const payload = response?.data?.data ?? response?.data ?? []
        const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
        setRatings(rows)
      } catch (error) {
        if (mounted) {
          setRatings([])
        }
      } finally {
        if (mounted) {
          setRatingsLoading(false)
        }
      }
    }

    loadRatings()

    return () => {
      mounted = false
    }
  }, [libraryOptions.ratings])

  const combineSuccessIndicatorAssignments = (
    divisionAssignments = [],
    groupAssignments = [],
    employeeAssignments = []
  ) => {
    const normalizedDivisions = Array.isArray(divisionAssignments) ? divisionAssignments.map((value) => String(value)) : []
    const hasAllDivisions = normalizedDivisions.includes("all")

    return [
      ...(hasAllDivisions ? ["division:all"] : normalizedDivisions.map((value) => `division:${value}`)),
      ...groupAssignments.map((value) => `group:${String(value)}`),
      ...employeeAssignments.map((value) => `employee:${String(value)}`),
    ]
  }

  const normalizeSuccessIndicatorDivisionAssignments = (values = [], activeIds = activeDivisionIds) => {
    const normalized = (Array.isArray(values) ? values : []).map((value) => String(value)).filter(Boolean)
    if (normalized.includes("all")) return ["all"]

    const activeSet = new Set((Array.isArray(activeIds) ? activeIds : []).map((value) => String(value)).filter(Boolean))
    if (activeSet.size > 0 && normalized.length === activeSet.size && normalized.every((value) => activeSet.has(value))) {
      return ["all"]
    }

    return normalized
  }

  const splitSuccessIndicatorAssignments = (values = []) =>
    (Array.isArray(values) ? values : []).reduce(
      (acc, value) => {
        const nextValue = String(value)
        const [kind, rawId] = nextValue.split(":", 2)

        if (!rawId) return acc

        if (kind === "division") {
          if (rawId === "all") {
            acc.division_assignments = ["all"]
          } else if (!acc.division_assignments.includes("all")) {
            acc.division_assignments.push(rawId)
          }
        } else if (kind === "group") {
          acc.group_assignments.push(rawId)
        } else if (kind === "employee") {
          acc.employee_assignments.push(rawId)
        }

        return acc
      },
        { division_assignments: [], group_assignments: [], employee_assignments: [] }
      )

  const buildMatrixPayloadFromRows = (rows = []) => {
    const normalizedRows = Array.isArray(rows) ? rows : []

    return [
      {
        sections: ["Q", "E", "T"].map((dimension) => {
          const dimensionRows = normalizedRows.filter((row) => String(row?.rating_dimension ?? "").toUpperCase() === dimension)

          return {
            rating_dimension: dimension,
            enabled: dimensionRows.length ? dimensionRows.some((row) => row.enabled !== false) : true,
            rows: [5, 4, 3, 2, 1].map((score, rowIndex) => {
              const row = dimensionRows.find((item) => Number(item?.score ?? 0) === score) ?? {}

              return {
                score,
                condition_type: row.condition_type || "",
                condition_text: row.condition_text || "",
                meaning: row.meaning || "",
                value_from: row.value_from ?? "",
                value_to: row.value_to ?? "",
                unit: row.unit || "",
                timing: row.timing || "",
                sort_order: row.sort_order ?? rowIndex,
              }
            }),
          }
        }),
      },
    ]
  }

  const flattenMatrixPayload = (payload = []) => {
    const matrix = Array.isArray(payload) ? payload[0] : null
    const sections = Array.isArray(matrix?.sections) ? matrix.sections : []
    const rows = []

    sections.forEach((section, sectionIndex) => {
      const dimension = String(section?.rating_dimension ?? "Q").toUpperCase()
      const sectionRows = Array.isArray(section?.rows) ? section.rows : []

      sectionRows.forEach((row, rowIndex) => {
        rows.push({
          rating_dimension: dimension,
          score: Number(row?.score ?? (5 - rowIndex)),
          enabled: section?.enabled !== false,
          condition_type: row?.condition_type || "",
          condition_text: row?.condition_text || "",
          meaning: row?.meaning || "",
          value_from: row?.value_from ?? "",
          value_to: row?.value_to ?? "",
          unit: row?.unit || "",
          timing: row?.timing || "",
          sort_order: ((sectionIndex + 1) * 10) + rowIndex,
        })
      })
    })

    return rows
  }

  useEffect(() => {
    if (!successIndicatorCreateOpen && !successIndicatorEditOpen) return
    if (successIndicatorCreateMatrixSource !== "default") return
    if (successIndicatorCreatePerformanceRatingId) return
    if (!ratings.length) return

    const fallbackRating = ratings[0]
    setSuccessIndicatorCreatePerformanceRatingId(String(fallbackRating.id))
    setSuccessIndicatorCreateMatrixPayload(
      Array.isArray(fallbackRating.matrix_rows) && fallbackRating.matrix_rows.length
        ? normalizeMatrixPayload(fallbackRating.matrix_rows)
        : [createMatrixBlock()]
    )
  }, [
    ratings,
    successIndicatorCreateOpen,
    successIndicatorEditOpen,
    successIndicatorCreateMatrixSource,
    successIndicatorCreatePerformanceRatingId,
  ])

  useEffect(() => {
    setItemRows(items)
    setDraftRows((currentRows) =>
      currentRows.filter((draft) => !items.some((item) => String(item.category_id) === String(draft.category_id)))
    )
  }, [items])

  const normalizePapTree = (paps = []) =>
    (Array.isArray(paps) ? paps : []).map((pap) => ({
      ...pap,
      children: normalizePapTree(pap.children ?? pap.paps ?? []),
      successIndicators: normalizeSuccessIndicatorTree(pap.successIndicators ?? pap.success_indicators ?? []),
    }))

  const normalizeSuccessIndicatorTree = (successIndicators = []) =>
    (Array.isArray(successIndicators) ? successIndicators : []).map((indicator) => ({
      ...indicator,
      id: indicator.id ?? indicator.value,
      title: indicator.title ?? indicator.label ?? indicator.target ?? "",
      target: indicator.target ?? "",
      measurement: indicator.measurement ?? "",
      weight: indicator.weight ?? "",
      amount: indicator.amount ?? indicator.budget ?? "",
      performance_rating_id: indicator.performance_rating_id ?? null,
      division_assignments: Array.isArray(indicator.division_assignments) ? indicator.division_assignments.map((item) => String(item)) : [],
      group_assignments: Array.isArray(indicator.group_assignments) ? indicator.group_assignments.map((item) => String(item)) : [],
      employee_assignments: Array.isArray(indicator.employee_assignments) ? indicator.employee_assignments.map((item) => String(item)) : [],
      rating_rows: Array.isArray(indicator.rating_rows) ? indicator.rating_rows.map((row) => ({ ...row })) : [],
      sort_order: indicator.sort_order ?? 0,
    }))

  useEffect(() => {
    const hydratedCategories = hydrateOpcrTree(categories, items)
    setCategoryRows(hydratedCategories)
    lastSavedTreeRef.current = JSON.stringify(serializeOpcrTree(hydratedCategories))
    skipNextAutosaveRef.current = true
    setAutosaveStatus("idle")
  }, [categories, items])

  useEffect(() => {
    if (!editorOpen) {
      setEditingItem(null)
      reset()
      clearErrors()
    }
  }, [editorOpen])

  useEffect(() => {
    if (previousRecordIdRef.current === record?.id) return

    previousRecordIdRef.current = record?.id
    reset()
    clearErrors()
    setEditingItem(null)
    setEditorOpen(false)
    setPreviewOpen(false)
  }, [record?.id])



  const formatAssignmentLabel = (value) => {
    const raw = String(value ?? "").trim()
    if (!raw) return ""

    const hasKindPrefix = raw.includes(":")
    const [kind, id] = hasKindPrefix ? raw.split(":", 2) : ["", raw]

    if (!hasKindPrefix) {
      if (id === "all") return "All Divisions"
      if (divisionMap[id]) return divisionMap[id]
      if (groupMap[id]) return groupMap[id]
      if (employeeMap[id]) return employeeMap[id]
      return id
    }

    if (kind === "division" && id === "all") return "All Divisions"
    if (kind === "division") return divisionMap[id] ?? id ?? raw
    if (kind === "group") return groupMap[id] ?? id
    if (kind === "employee") return employeeMap[id] ?? id
    return id
  }

  const formatAssignments = (values = []) => {
    if (!Array.isArray(values) || values.length === 0) return "-"
    const formatted = values.map(formatAssignmentLabel).filter(Boolean).join(", ")
    return formatted.length ? formatted : "-"
  }
  const hasPositiveNumber = (value) => Number.isFinite(Number(value)) && Number(value) > 0

  const getSuccessIndicatorTotalsFromNode = (indicatorNode) => ({
    weight: hasPositiveNumber(indicatorNode?.weight) ? Number(indicatorNode.weight) : 0,
    amount: hasPositiveNumber(indicatorNode?.amount ?? indicatorNode?.budget) ? Number(indicatorNode.amount ?? indicatorNode.budget) : 0,
  })

  function getPapBranchTotalsFromNode(papNode) {
    if (!papNode) {
      return { weight: 0, amount: 0 }
    }

    const children = Array.isArray(papNode.children) ? papNode.children : []
    const successIndicators = Array.isArray(papNode.successIndicators) ? papNode.successIndicators : []
    const childTotals = getPapTotals(children)
    const successIndicatorTotals = successIndicators.reduce(
      (totals, indicator) => {
        const indicatorTotals = getSuccessIndicatorTotalsFromNode(indicator)
        return {
          weight: totals.weight + indicatorTotals.weight,
          amount: totals.amount + indicatorTotals.amount,
        }
      },
      { weight: 0, amount: 0 }
    )

    return {
      weight: (hasPositiveNumber(papNode.weight) ? Number(papNode.weight) : 0) + childTotals.weight + successIndicatorTotals.weight,
      amount: (hasPositiveNumber(papNode.amount ?? papNode.budget) ? Number(papNode.amount ?? papNode.budget) : 0) + childTotals.amount + successIndicatorTotals.amount,
    }
  }

  function getPapTotals(paps = []) {
    return (Array.isArray(paps) ? paps : []).reduce(
      (totals, pap) => {
        const branchTotals = getPapBranchTotalsFromNode(pap)
        return {
          weight: totals.weight + branchTotals.weight,
          amount: totals.amount + branchTotals.amount,
        }
      },
      { weight: 0, amount: 0 }
    )
  }

  function getPapDisplayTotals(papNode) {
    return {
      weight: hasPositiveNumber(papNode?.weight)
        ? Number(papNode.weight)
        : getPapBranchTotalsFromNode(papNode).weight,
      amount: hasPositiveNumber(papNode?.amount ?? papNode?.budget)
        ? Number(papNode.amount ?? papNode.budget)
        : getPapBranchTotalsFromNode(papNode).amount,
    }
  }

  const getCategoryRowClassName = () =>
    "border-l-4 border-l-sky-300 bg-sky-50/80 hover:bg-sky-100/70"

  const getProgramRowClassName = () =>
    "border-l-4 border-l-amber-300 bg-amber-50/70 hover:bg-amber-100/60"

  const getPapRowClassName = (level = 1) => {
    if (level === 1) {
      return "border-l-4 border-l-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/50"
    }

    if (level === 2) {
      return "border-l-4 border-l-teal-300 bg-teal-50/60 hover:bg-teal-100/50"
    }

    return "border-l-4 border-l-cyan-300 bg-cyan-50/60 hover:bg-cyan-100/50"
  }

  const getSuccessIndicatorRowClassName = (level = 1) => {
    if (level === 1) {
      return "border-l-4 border-l-rose-300 bg-rose-50/70 hover:bg-rose-100/60"
    }

    if (level === 2) {
      return "border-l-4 border-l-fuchsia-300 bg-fuchsia-50/70 hover:bg-fuchsia-100/60"
    }

    return "border-l-4 border-l-violet-300 bg-violet-50/70 hover:bg-violet-100/60"
  }

  const getCategoryMetricClassName = () => "text-sm font-semibold text-slate-900 tabular-nums"

  const getPapMetricClassName = () => "text-sm font-semibold text-slate-900 tabular-nums"

  const getSuccessIndicatorMetricClassName = () => "text-xs font-normal text-slate-900 tabular-nums"

  const getPapAllocationCap = (papNode) => ({
    weight: hasPositiveNumber(papNode?.weight) ? Number(papNode.weight) : null,
    amount: hasPositiveNumber(papNode?.amount ?? papNode?.budget) ? Number(papNode.amount ?? papNode.budget) : null,
  })

  const getPapUsageTotalsFromNode = (papNode) => {
    const branchTotals = getPapBranchTotalsFromNode(papNode)
    const ownWeight = hasPositiveNumber(papNode?.weight) ? Number(papNode.weight) : 0
    const ownAmount = hasPositiveNumber(papNode?.amount ?? papNode?.budget) ? Number(papNode.amount ?? papNode.budget) : 0

    return {
      weight: Math.max(branchTotals.weight - ownWeight, 0),
      amount: Math.max(branchTotals.amount - ownAmount, 0),
    }
  }

  const validatePapCapacity = (papNode, candidatePapNode = papNode) => {
    if (!papNode || !candidatePapNode) {
      return null
    }

    const cap = getPapAllocationCap(papNode)
    if (cap.weight === null && cap.amount === null) {
      return null
    }

    const usage = getPapUsageTotalsFromNode(candidatePapNode)

    if (cap.weight !== null && usage.weight > cap.weight + 0.0001) {
      return {
        title: "Weight exceeds MFO/PAP ceiling",
        description: `The success indicators under ${formatText(papNode.activity)} exceed its weight limit of ${formatFixedNumber(cap.weight)}%.`,
      }
    }

    if (cap.amount !== null && usage.amount > cap.amount + 0.0001) {
      return {
        title: "Allocated budget exceeds MFO/PAP ceiling",
        description: `The success indicators under ${formatText(papNode.activity)} exceed its allocated budget limit of ${formatFixedNumber(cap.amount)}.`,
      }
    }

    return null
  }

  const getCategoryDisplayTotals = (category) => {
    const childTotals = getPapTotals(Array.isArray(category?.paps) ? category.paps : [])

    return {
      weight: hasPositiveNumber(category?.weight) ? Number(category.weight) : childTotals.weight,
      amount: hasPositiveNumber(category?.amount ?? category?.budget)
        ? Number(category.amount ?? category.budget)
        : childTotals.amount,
    }
  }

  const categoryWeightTotal = useMemo(() => {
    return categoryRows.reduce((total, row) => total + getCategoryDisplayTotals(row).weight, 0)
  }, [categoryRows])
  const categoryWeightBalance = useMemo(() => 100 - categoryWeightTotal, [categoryWeightTotal])
  const categoryWeightIsBalanced = Math.abs(categoryWeightBalance) < 0.01
  const hasAnyExplicitCategoryCap = useMemo(
    () => categoryRows.some((row) => hasPositiveNumber(row.weight) || hasPositiveNumber(row.amount ?? row.budget)),
    [categoryRows]
  )

  const getCategoryDisplayWeight = (category) => getCategoryDisplayTotals(category).weight

  const getCategoryDisplayAmount = (category) => getCategoryDisplayTotals(category).amount

  const findPapNodeInTree = (paps = [], papId) => {
    for (const pap of paps || []) {
      if (String(pap.id) === String(papId)) {
        return pap
      }

      const found = findPapNodeInTree(pap.children ?? [], papId)
      if (found) {
        return found
      }
    }

    return null
  }

  const findPapPathInTree = (paps = [], papId, path = []) => {
    for (const pap of paps || []) {
      const nextPath = [...path, pap]
      if (String(pap.id) === String(papId)) {
        return nextPath
      }

      const foundPath = findPapPathInTree(pap.children ?? [], papId, nextPath)
      if (foundPath.length > 0) {
        return foundPath
      }
    }

    return []
  }

  const updatePapNodeInTree = (paps = [], papId, updater) =>
    (paps || []).map((pap) => {
      if (String(pap.id) === String(papId)) {
        return updater(pap)
      }

      const children = Array.isArray(pap.children) ? pap.children : []
      if (!children.length) {
        return pap
      }

      return {
        ...pap,
        children: updatePapNodeInTree(children, papId, updater),
      }
    })

  const removePapNodeFromTree = (paps = [], papId) =>
    (paps || [])
      .filter((pap) => String(pap.id) !== String(papId))
      .map((pap) => {
        const children = Array.isArray(pap.children) ? pap.children : []
        if (!children.length) {
          return pap
        }

        return {
          ...pap,
          children: removePapNodeFromTree(children, papId),
        }
      })

  const reorderArrayBeforeTarget = (items = [], draggedId, targetId, getId = (item) => item.id) => {
    const list = Array.isArray(items) ? [...items] : []
    const sourceIndex = list.findIndex((item) => String(getId(item)) === String(draggedId))
    const targetIndex = list.findIndex((item) => String(getId(item)) === String(targetId))

    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
      return list
    }

    const [moved] = list.splice(sourceIndex, 1)
    const insertIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex
    list.splice(Math.max(insertIndex, 0), 0, moved)
    return list
  }

  const insertPapNodeIntoTree = (paps = [], papNode, targetParentPapId = null, beforePapId = null) => {
    const list = Array.isArray(paps) ? [...paps] : []

    if (!targetParentPapId) {
      if (!beforePapId) {
        return [...list, papNode]
      }

      const targetIndex = list.findIndex((item) => String(item.id) === String(beforePapId))
      if (targetIndex === -1) {
        return [...list, papNode]
      }

      const next = [...list]
      next.splice(targetIndex, 0, papNode)
      return next
    }

    return list.map((node) => {
      if (String(node.id) === String(targetParentPapId)) {
        const children = Array.isArray(node.children) ? [...node.children] : []
        if (!beforePapId) {
          return {
            ...node,
            children: [...children, papNode],
          }
        }

        const targetIndex = children.findIndex((item) => String(item.id) === String(beforePapId))
        if (targetIndex === -1) {
          return {
            ...node,
            children: [...children, papNode],
          }
        }

        const nextChildren = [...children]
        nextChildren.splice(targetIndex, 0, papNode)
        return {
          ...node,
          children: nextChildren,
        }
      }

      const children = Array.isArray(node.children) ? node.children : []
      if (!children.length) {
        return node
      }

      return {
        ...node,
        children: insertPapNodeIntoTree(children, papNode, targetParentPapId, beforePapId),
      }
    })
  }

  const insertSuccessIndicatorIntoTree = (paps = [], papId, indicatorNode, beforeIndicatorId = null) =>
    (paps || []).map((pap) => {
      if (String(pap.id) === String(papId)) {
        const indicators = Array.isArray(pap.successIndicators) ? [...pap.successIndicators] : []

        if (!beforeIndicatorId) {
          return {
            ...pap,
            successIndicators: [...indicators, indicatorNode],
          }
        }

        const targetIndex = indicators.findIndex((item) => String(item.id ?? item.value) === String(beforeIndicatorId))
        if (targetIndex === -1) {
          return {
            ...pap,
            successIndicators: [...indicators, indicatorNode],
          }
        }

        const nextIndicators = [...indicators]
        nextIndicators.splice(targetIndex, 0, indicatorNode)
        return {
          ...pap,
          successIndicators: nextIndicators,
        }
      }

      const children = Array.isArray(pap.children) ? pap.children : []
      if (!children.length) {
        return pap
      }

      return {
        ...pap,
        children: insertSuccessIndicatorIntoTree(children, papId, indicatorNode, beforeIndicatorId),
      }
    })

  const updateSuccessIndicatorNodeInTree = (paps = [], papId, indicatorId, updater) =>
    (paps || []).map((pap) => {
      const successIndicators = Array.isArray(pap.successIndicators) ? pap.successIndicators : []
      const updatedIndicators = successIndicators.map((indicator) =>
        String(indicator.id ?? indicator.value) === String(indicatorId) ? updater(indicator) : indicator
      )

      const children = Array.isArray(pap.children) ? pap.children : []
      const nextChildren = children.length
        ? updateSuccessIndicatorNodeInTree(children, papId, indicatorId, updater)
        : children

      if (String(pap.id) === String(papId)) {
        return {
          ...pap,
          successIndicators: updatedIndicators,
          children: nextChildren,
        }
      }

      if (children.length) {
        return {
          ...pap,
          children: nextChildren,
        }
      }

      return pap
    })

  const removeSuccessIndicatorNodeFromTree = (paps = [], papId, indicatorId) =>
    (paps || []).map((pap) => {
      const successIndicators = Array.isArray(pap.successIndicators) ? pap.successIndicators : []
      const nextSuccessIndicators = String(pap.id) === String(papId)
        ? successIndicators.filter((indicator) => String(indicator.id ?? indicator.value) !== String(indicatorId))
        : successIndicators

      const children = Array.isArray(pap.children) ? pap.children : []
      const nextChildren = children.length
        ? removeSuccessIndicatorNodeFromTree(children, papId, indicatorId)
        : children

      if (String(pap.id) === String(papId)) {
        return {
          ...pap,
          successIndicators: nextSuccessIndicators,
          children: nextChildren,
        }
      }

      if (children.length) {
        return {
          ...pap,
          children: nextChildren,
        }
      }

      return pap
    })

  const openEdit = (item) => {
    setEditingItem(item)
    setData({
      category_id: item.category_id ? String(item.category_id) : "",
      pap_id: item.pap_id ? String(item.pap_id) : "",
      weight: item.weight ?? "",
      allocated_budget: item.allocated_budget ?? item.budget ?? "",
      remarks: item.remarks || "",
      sort_order: item.sort_order ?? "",
    })
    clearErrors()
    setEditorOpen(true)
  }

  const setPap = (value) => {
    setData("pap_id", value)
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!record?.id) return

    const options = {
      preserveScroll: true,
      onSuccess: () => {
        toast({
          title: editingItem ? "Updated" : "Saved",
          description: editingItem ? "OPCR item updated successfully." : "OPCR item added successfully.",
        })
        setEditorOpen(false)
        if (editingItem && !editingItem.id) {
          setDraftRows((currentRows) => currentRows.filter((row) => String(row.temp_id) !== String(editingItem.temp_id)))
        }
        setEditingItem(null)
        reset()
      },
    }

    if (editingItem) {
      put(route("opcrs.items.update", editingItem.id), options)
      return
    }

    post(route("opcrs.items.store", { recordId: record.id }), options)
  }

  const handleDelete = (item) => {
    if (!item?.id) {
      setDraftRows((currentRows) => currentRows.filter((row) => String(row.temp_id) !== String(item?.temp_id)))
      return
    }

    router.delete(route("opcrs.items.destroy", item.id), {
      preserveScroll: true,
      onSuccess: () => {
        toast({
          title: "Deleted",
          description: "OPCR item deleted successfully.",
        })
      },
    })
  }

  const handleRemoveCategory = (categoryId) => {
    if (!canManage) return
    const existingDraft = draftRows.find((item) => String(item.category_id) === String(categoryId))

    if (existingDraft) {
      handleDelete(existingDraft)
      return
    }

    const existingItem = itemRows.find((item) => String(item.category_id) === String(categoryId))

    if (existingItem) {
      handleDelete(existingItem)
      return
    }

    setCategoryRows((currentRows) => currentRows.filter((row) => String(row.id) !== String(categoryId)))
  }

  const promptRemoveCategory = (category) => {
    if (!canManage) return
    setPendingCategoryRemoval(category)
  }

  const handleSelectCategory = (categoryItem) => {
    const categoryId = categoryItem?.id ?? categoryItem?.value
    if (!categoryId) return

    const exists = categoryRows.some((row) => String(row.id) === String(categoryId))
    if (exists) return

    const normalizedCategory = {
      ...categoryItem,
      id: categoryId,
      category: categoryItem?.category ?? categoryItem?.label ?? "",
      description: categoryItem?.description ?? "",
      sort_order: categoryItem?.sort_order ?? categoryRows.length + 1,
      paps: [],
    }

    setCategoryRows((currentRows) => [...currentRows, normalizedCategory])
    setAddCategoryOpen(false)
  }

  const handleOpenCreateCategory = (term) => {
    setCategoryCreateValue(term || "")
    setCategoryCreateOpen(true)
    setAddCategoryOpen(false)
  }

  const handleCreateCategory = async () => {
    const category = categoryCreateValue.trim()
    if (!category) return

    try {
      setCategoryCreating(true)
      const response = await axios.post(route("performance.categories.store"), {
        category,
        description: "",
      })

      const createdCategory = response?.data?.data || response?.data?.category || response?.data
      if (!createdCategory?.id) {
        throw new Error("Unable to create category.")
      }

      handleSelectCategory({
        id: createdCategory.id,
        category: createdCategory.category || category,
        description: createdCategory.description || "",
        sort_order: createdCategory.sort_order ?? categoryRows.length + 1,
      })

      setCategoryCreateOpen(false)
      setCategoryCreateValue("")
      toast({
        title: "Saved",
        description: "New category added successfully.",
      })
    } catch (error) {
      const message =
        error?.response?.data?.errors?.category?.[0] ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create category."

      toast({
        title: "Unable to add category",
        description: message,
        variant: "destructive",
      })
    } finally {
      setCategoryCreating(false)
    }
  }

  const addPapToCategoryRow = (categoryId, pap, parentPapId = null) => {
    const papKey = pap?.value ?? pap?.id
    if (!categoryId || !papKey) return

    const normalizedPap = {
      ...pap,
      value: String(papKey),
      id: pap.id ?? papKey,
      program_id: pap.program_id ?? null,
      program_title: pap.program_title ?? "",
      weight: pap.weight ?? "",
      amount: pap.amount ?? pap.budget ?? "",
      budget: pap.budget ?? pap.amount ?? "",
    }

    const addChildPap = (paps = []) =>
      paps.map((node) => {
        if (String(node.id) === String(parentPapId)) {
          const currentChildren = Array.isArray(node.children) ? node.children : []
          if (currentChildren.some((item) => String(item.value ?? item.id) === String(papKey))) {
            return node
          }

      return {
        ...node,
        children: [
          ...currentChildren,
          {
            ...normalizedPap,
            children: [],
            successIndicators: normalizeSuccessIndicatorTree(pap.successIndicators ?? pap.success_indicators ?? []),
            program_id: pap.program_id ?? null,
            program_title: pap.program_title ?? "",
          },
        ],
      }
        }

        const children = Array.isArray(node.children) ? node.children : []
        if (children.length === 0) {
          return node
        }

        return {
          ...node,
          children: addChildPap(children),
        }
      })

    setCategoryRows((currentRows) =>
      currentRows.map((row) => {
        if (String(row.id) !== String(categoryId)) return row

        const currentPaps = Array.isArray(row.paps) ? row.paps : []
        if (
          !parentPapId &&
          currentPaps.some((item) => String(item.value ?? item.id) === String(papKey))
        ) {
          return row
        }

        if (parentPapId) {
          return {
            ...row,
            paps: addChildPap(currentPaps),
          }
        }

        return {
          ...row,
          paps: [
            ...currentPaps,
            {
              ...normalizedPap,
              children: [],
              successIndicators: normalizeSuccessIndicatorTree(pap.successIndicators ?? pap.success_indicators ?? []),
              program_id: pap.program_id ?? null,
              program_title: pap.program_title ?? "",
            },
          ],
        }
      })
    )
  }

  const openPapPicker = (categoryId, parentPapId = null) => {
    setPapPickerCategoryId(categoryId)
    setPapPickerParentPapId(parentPapId)
    setPapPickerOpen(true)
  }

  const closePapPicker = (preserveSelection = false) => {
    setPapPickerOpen(false)
    if (!(preservePapCategoryOnClose || preserveSelection)) {
      setPapPickerCategoryId(null)
      setPapPickerParentPapId(null)
    }
    setPreservePapCategoryOnClose(false)
  }

  const handleSelectPap = (categoryId, pap, parentPapId = null) => {
    if (!categoryId || !pap?.value) return

    setPapPickerCategoryId(categoryId)
    setPapPickerParentPapId(parentPapId)
    setSelectedPapToAdd(pap)
    setPapCreateValue(pap.label || pap.activity || pap.title || "")
    setPapCreateWeight(pap.weight ?? "")
    setPapCreateAmount(pap.amount ?? pap.budget ?? "")
    setPapCreateLocked(true)
    closePapPicker(true)
    setPapCreateOpen(true)
  }

  const handleOpenCreatePap = (term) => {
    setSelectedPapToAdd(null)
    setPapCreateLocked(false)
    setPapCreateValue(term || "")
    setPapCreateWeight("")
    setPapCreateAmount("")
    setPreservePapCategoryOnClose(true)
    setPapCreateOpen(true)
  }

  const handleCreatePap = async () => {
    if (!papPickerCategoryId) return

    const activity = papCreateValue.trim()
    if (!activity) return

    if (selectedPapToAdd) {
      addPapToCategoryRow(
        papPickerCategoryId,
        {
          ...selectedPapToAdd,
          label: selectedPapToAdd.label || selectedPapToAdd.activity || selectedPapToAdd.title || activity,
          activity: selectedPapToAdd.activity || selectedPapToAdd.label || selectedPapToAdd.title || activity,
          weight: papCreateWeight,
          amount: papCreateAmount,
          budget: papCreateAmount,
          successIndicators: normalizeSuccessIndicatorTree(selectedPapToAdd.successIndicators ?? selectedPapToAdd.success_indicators ?? []),
        },
        papPickerParentPapId
      )
      setPapCreateOpen(false)
      setPapCreateValue("")
      setPapCreateWeight("")
      setPapCreateAmount("")
      setSelectedPapToAdd(null)
      setPapCreateLocked(false)
      setPreservePapCategoryOnClose(false)
      closePapPicker()
      toast({
        title: "Saved",
        description: "MFO/PAP added successfully.",
      })
      return
    }

    try {
      setPapCreating(true)
      const response = await axios.post(route("performance.ppas.store"), {
        activity,
        title: activity,
        weight: papCreateWeight,
        budget: papCreateAmount,
      })
      const createdPap = response?.data?.data || response?.data?.pap || response?.data
      if (!createdPap?.id) {
        throw new Error("Unable to create MFO/PAP.")
      }

      addPapToCategoryRow(papPickerCategoryId, {
        value: String(createdPap.id),
        label: createdPap.label || createdPap.activity || createdPap.title || createdPap.pap || activity,
        activity: createdPap.label || createdPap.activity || createdPap.title || createdPap.pap || activity,
        program_id: createdPap.program_id ?? null,
        program_title: createdPap.program_title ?? "",
        description: createdPap.description || "",
        sort_order: createdPap.sort_order ?? 0,
        weight: createdPap.weight ?? papCreateWeight,
        amount: createdPap.budget ?? papCreateAmount,
        successIndicators: [],
      }, papPickerParentPapId)
      setPapCreateOpen(false)
      setPapCreateValue("")
      setPapCreateWeight("")
      setPapCreateAmount("")
      setPapCreateLocked(false)
      setSelectedPapToAdd(null)
      setPreservePapCategoryOnClose(false)
      closePapPicker()
      toast({
        title: "Saved",
        description: "New MFO/PAP added successfully.",
      })
    } catch (error) {
      const message =
        error?.response?.data?.errors?.title?.[0] ||
        error?.response?.data?.errors?.activity?.[0] ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create MFO/PAP."

      toast({
        title: "Unable to add MFO/PAP",
        description: message,
        variant: "destructive",
      })
    } finally {
      setPapCreating(false)
    }
  }

  const addSuccessIndicatorToPapRow = (categoryId, papId, successIndicator) => {
    const successKey = successIndicator?.value ?? successIndicator?.id
    if (!categoryId || !papId || !successKey) return

    const cloneSuccessIndicator = (indicator) => ({
      ...indicator,
      value: String(indicator.value ?? indicator.id ?? successKey),
      id: indicator.id ?? successKey,
      title: indicator.title ?? indicator.label ?? indicator.target ?? "",
      target: indicator.target ?? "",
      measurement: indicator.measurement ?? "",
      weight: indicator.weight ?? "",
      amount: indicator.amount ?? indicator.budget ?? "",
      performance_rating_id: indicator.performance_rating_id ?? null,
      division_assignments: Array.isArray(indicator.division_assignments) ? indicator.division_assignments.map((item) => String(item)) : [],
      group_assignments: Array.isArray(indicator.group_assignments) ? indicator.group_assignments.map((item) => String(item)) : [],
      employee_assignments: Array.isArray(indicator.employee_assignments) ? indicator.employee_assignments.map((item) => String(item)) : [],
      rating_rows: Array.isArray(indicator.rating_rows) ? indicator.rating_rows.map((row) => ({ ...row })) : [],
      sort_order: indicator.sort_order ?? 0,
    })

    setCategoryRows((currentRows) =>
      currentRows.map((row) => {
        if (String(row.id) !== String(categoryId)) return row

        const updatePaps = (paps = []) =>
          paps.map((node) => {
            if (String(node.id) === String(papId)) {
              const currentSuccessIndicators = Array.isArray(node.successIndicators) ? node.successIndicators : []
              if (currentSuccessIndicators.some((item) => String(item.value ?? item.id) === String(successKey))) {
                return node
              }

              return {
                ...node,
                successIndicators: [...currentSuccessIndicators, cloneSuccessIndicator(successIndicator)],
              }
            }

            const children = Array.isArray(node.children) ? node.children : []
            if (!children.length) {
              return node
            }

            return {
              ...node,
              children: updatePaps(children),
            }
          })

        return {
          ...row,
          paps: updatePaps(Array.isArray(row.paps) ? row.paps : []),
        }
      })
    )
  }

  const openSuccessIndicatorEdit = (category, pap, indicator) => {
    if (!category || !pap || !indicator) return

    setEditingSuccessIndicator({
      categoryId: category.id,
      papId: pap.id,
      id: indicator.id ?? indicator.value,
      target: indicator.target ?? indicator.title ?? "",
      performance_activity_id: indicator.performance_activity_id ?? indicator.activity?.id ?? null,
      performance_rating_id: indicator.performance_rating_id ?? null,
      weight: indicator.weight ?? "",
      amount: indicator.amount ?? indicator.budget ?? "",
      division_assignments: Array.isArray(indicator.division_assignments) ? indicator.division_assignments.map((item) => String(item)) : [],
      group_assignments: Array.isArray(indicator.group_assignments) ? indicator.group_assignments.map((item) => String(item)) : [],
      employee_assignments: Array.isArray(indicator.employee_assignments) ? indicator.employee_assignments.map((item) => String(item)) : [],
      rating_rows: Array.isArray(indicator.rating_rows) ? indicator.rating_rows.map((row) => ({ ...row })) : [],
    })
    setSuccessIndicatorCreateValue(indicator.target ?? indicator.title ?? "")
    setSuccessIndicatorCreateActivityId(indicator.performance_activity_id ?? indicator.activity?.id ?? null)
    setSuccessIndicatorCreatePerformanceRatingId(indicator.performance_rating_id ?? null)
    setSuccessIndicatorCreateWeight(indicator.weight ?? "")
    setSuccessIndicatorCreateAmount(indicator.amount ?? indicator.budget ?? "")
    const nextMatrixSource = indicator.performance_rating_id ? "default" : "custom"
    setSuccessIndicatorCreateMatrixSource(nextMatrixSource)
    if (nextMatrixSource === "default") {
      setSuccessIndicatorCreateMatrixPayload(buildMatrixPayloadFromRows(indicator.rating_rows ?? []))
    } else {
      setSuccessIndicatorCreateMatrixPayload(buildMatrixPayloadFromRows(indicator.rating_rows ?? []))
    }
    setSuccessIndicatorCreateDivisionAssignments(
      normalizeSuccessIndicatorDivisionAssignments(
        Array.isArray(indicator.division_assignments) ? indicator.division_assignments.map((item) => String(item)) : [],
        activeDivisionIds
      )
    )
    setSuccessIndicatorCreateGroupAssignments(Array.isArray(indicator.group_assignments) ? indicator.group_assignments.map((item) => String(item)) : [])
    setSuccessIndicatorCreateEmployeeAssignments(Array.isArray(indicator.employee_assignments) ? indicator.employee_assignments.map((item) => String(item)) : [])
    setSuccessIndicatorEditOpen(true)
  }

  const handleSaveSuccessIndicatorEdit = () => {
    if (!editingSuccessIndicator?.categoryId || !editingSuccessIndicator?.papId || !editingSuccessIndicator?.id) return

    const nextTarget = successIndicatorCreateValue.trim()
    if (!nextTarget) return

    const parentCategory = categoryRows.find((row) => String(row.id) === String(editingSuccessIndicator.categoryId))
    const currentPapNode = findPapNodeInTree(Array.isArray(parentCategory?.paps) ? parentCategory.paps : [], editingSuccessIndicator.papId)
    if (!currentPapNode) return

    const nextIndicatorNode = {
      ...editingSuccessIndicator,
      target: nextTarget,
      title: nextTarget,
      performance_activity_id: successIndicatorCreateActivityId,
      performance_rating_id: successIndicatorCreateMatrixSource === "default" ? successIndicatorCreatePerformanceRatingId : null,
      activity_output: activityMap[String(successIndicatorCreateActivityId)] ?? editingSuccessIndicator.activity_output ?? "",
      weight: successIndicatorCreateWeight,
      amount: successIndicatorCreateAmount,
      division_assignments: [...successIndicatorCreateDivisionAssignments],
      group_assignments: [...successIndicatorCreateGroupAssignments],
      employee_assignments: [...successIndicatorCreateEmployeeAssignments],
      rating_rows: flattenMatrixPayload(successIndicatorCreateMatrixPayload),
    }

    const updatedPaps = updateSuccessIndicatorNodeInTree(
      Array.isArray(parentCategory.paps) ? parentCategory.paps : [],
      editingSuccessIndicator.papId,
      editingSuccessIndicator.id,
      (indicator) => ({
        ...indicator,
        ...nextIndicatorNode,
      })
    )
    const candidatePapNode = findPapNodeInTree(updatedPaps, editingSuccessIndicator.papId)
    const capacityError = validatePapCapacity(currentPapNode, candidatePapNode)

    if (capacityError) {
      toast({
        title: capacityError.title,
        description: capacityError.description,
        variant: "destructive",
      })
      return
    }

    setCategoryRows((currentRows) =>
      currentRows.map((row) => {
        if (String(row.id) !== String(editingSuccessIndicator.categoryId)) return row

        return {
          ...row,
          paps: updateSuccessIndicatorNodeInTree(
            Array.isArray(row.paps) ? row.paps : [],
            editingSuccessIndicator.papId,
            editingSuccessIndicator.id,
            (indicator) => ({
              ...indicator,
              target: nextTarget,
              title: nextTarget,
              performance_activity_id: successIndicatorCreateActivityId,
              performance_rating_id: successIndicatorCreateMatrixSource === "default" ? successIndicatorCreatePerformanceRatingId : null,
              activity_output: activityMap[String(successIndicatorCreateActivityId)] ?? indicator.activity_output ?? "",
              weight: successIndicatorCreateWeight,
              amount: successIndicatorCreateAmount,
              division_assignments: [...successIndicatorCreateDivisionAssignments],
              group_assignments: [...successIndicatorCreateGroupAssignments],
              employee_assignments: [...successIndicatorCreateEmployeeAssignments],
              rating_rows: flattenMatrixPayload(successIndicatorCreateMatrixPayload),
            })
          ),
        }
      })
    )

    setSuccessIndicatorEditOpen(false)
    setEditingSuccessIndicator(null)
    setSuccessIndicatorCreateValue("")
    setSuccessIndicatorCreateActivityId(null)
    setSuccessIndicatorCreateMatrixSource("custom")
    setSuccessIndicatorCreatePerformanceRatingId(null)
    setSuccessIndicatorCreateMatrixPayload([createMatrixBlock()])
    setSuccessIndicatorCreateWeight("")
    setSuccessIndicatorCreateAmount("")
    setSuccessIndicatorCreateDivisionAssignments([])
    setSuccessIndicatorCreateGroupAssignments([])
    setSuccessIndicatorCreateEmployeeAssignments([])
  }

  const promptRemoveSuccessIndicator = (category, pap, indicator) => {
    if (!category || !pap || !indicator) return

    setPendingSuccessIndicatorRemoval({
      categoryId: category.id,
      papId: pap.id,
      indicator,
      categoryName: category.category,
      papName: pap.activity,
    })
  }

  const handleRemoveSuccessIndicator = (categoryId, papId, indicatorId) => {
    if (!categoryId || !papId || !indicatorId) return

    setCategoryRows((currentRows) =>
      currentRows.map((row) => {
        if (String(row.id) !== String(categoryId)) return row

        return {
          ...row,
          paps: removeSuccessIndicatorNodeFromTree(Array.isArray(row.paps) ? row.paps : [], papId, indicatorId),
        }
      })
    )
  }

  const handleTreeDragStart = (payload) => {
    setDraggedTreeNode(payload)
  }

  const handleTreeDragEnd = () => {
    setDraggedTreeNode(null)
  }

  const movePapNode = ({
    sourceCategoryId,
    targetCategoryId,
    papNode,
    targetParentPapId = null,
    beforePapId = null,
  }) => {
    if (!sourceCategoryId || !targetCategoryId || !papNode?.id) return

    setCategoryRows((currentRows) =>
      currentRows.map((row) => {
        const rowId = String(row.id)
        const sourceMatch = rowId === String(sourceCategoryId)
        const targetMatch = rowId === String(targetCategoryId)

        if (!sourceMatch && !targetMatch) {
          return row
        }

        const sourcePaps = sourceMatch ? removePapNodeFromTree(Array.isArray(row.paps) ? row.paps : [], papNode.id) : Array.isArray(row.paps) ? row.paps : []

        if (sourceMatch && targetMatch) {
          return {
            ...row,
            paps: insertPapNodeIntoTree(sourcePaps, papNode, targetParentPapId, beforePapId),
          }
        }

        if (sourceMatch) {
          return {
            ...row,
            paps: sourcePaps,
          }
        }

        return {
          ...row,
          paps: insertPapNodeIntoTree(Array.isArray(row.paps) ? row.paps : [], papNode, targetParentPapId, beforePapId),
        }
      })
    )
  }

  const moveSuccessIndicatorNode = ({
    sourceCategoryId,
    sourcePapId,
    targetCategoryId,
    targetPapId,
    indicatorNode,
    beforeIndicatorId = null,
  }) => {
    if (!sourceCategoryId || !sourcePapId || !targetCategoryId || !targetPapId || !indicatorNode?.id) return

    setCategoryRows((currentRows) =>
      currentRows.map((row) => {
        const rowId = String(row.id)
        const sourceMatch = rowId === String(sourceCategoryId)
        const targetMatch = rowId === String(targetCategoryId)

        if (!sourceMatch && !targetMatch) {
          return row
        }

        const sourcePaps = sourceMatch
          ? removeSuccessIndicatorNodeFromTree(Array.isArray(row.paps) ? row.paps : [], sourcePapId, indicatorNode.id)
          : Array.isArray(row.paps) ? row.paps : []

        if (sourceMatch && targetMatch) {
          return {
            ...row,
            paps: insertSuccessIndicatorIntoTree(sourcePaps, targetPapId, indicatorNode, beforeIndicatorId),
          }
        }

        if (sourceMatch) {
          return {
            ...row,
            paps: sourcePaps,
          }
        }

        return {
          ...row,
          paps: insertSuccessIndicatorIntoTree(Array.isArray(row.paps) ? row.paps : [], targetPapId, indicatorNode, beforeIndicatorId),
        }
      })
    )
  }

  const reorderPapWithinCategory = (categoryId, parentPapId, draggedPapId, targetPapId) => {
    setCategoryRows((currentRows) =>
      currentRows.map((row) => {
        if (String(row.id) !== String(categoryId)) return row

        if (!parentPapId) {
          return {
            ...row,
            paps: reorderArrayBeforeTarget(Array.isArray(row.paps) ? row.paps : [], draggedPapId, targetPapId),
          }
        }

        const reorderChildren = (paps = []) =>
          (Array.isArray(paps) ? paps : []).map((node) => {
            if (String(node.id) === String(parentPapId)) {
              return {
                ...node,
                children: reorderArrayBeforeTarget(Array.isArray(node.children) ? node.children : [], draggedPapId, targetPapId),
              }
            }

            const children = Array.isArray(node.children) ? node.children : []
            if (!children.length) {
              return node
            }

            return {
              ...node,
              children: reorderChildren(children),
            }
          })

        return {
          ...row,
          paps: reorderChildren(Array.isArray(row.paps) ? row.paps : []),
        }
      })
    )
  }

  const reorderSuccessIndicatorWithinPap = (categoryId, papId, draggedIndicatorId, targetIndicatorId) => {
    setCategoryRows((currentRows) =>
      currentRows.map((row) => {
        if (String(row.id) !== String(categoryId)) return row

        const reorderIndicators = (paps = []) =>
          (Array.isArray(paps) ? paps : []).map((pap) => {
            if (String(pap.id) === String(papId)) {
              return {
                ...pap,
                successIndicators: reorderArrayBeforeTarget(
                  Array.isArray(pap.successIndicators) ? pap.successIndicators : [],
                  draggedIndicatorId,
                  targetIndicatorId,
                  (item) => item.id ?? item.value
                ),
              }
            }

            const children = Array.isArray(pap.children) ? pap.children : []
            if (!children.length) {
              return pap
            }

            return {
              ...pap,
              children: reorderIndicators(children),
            }
          })

        return {
          ...row,
          paps: reorderIndicators(Array.isArray(row.paps) ? row.paps : []),
        }
      })
    )
  }

  const reorderCategoryRows = (draggedCategoryId, targetCategoryId) => {
    setCategoryRows((currentRows) => reorderArrayBeforeTarget(currentRows, draggedCategoryId, targetCategoryId))
  }

  const isPapDescendantInCategory = (categoryId, ancestorPapId, candidatePapId) => {
    if (!categoryId || !ancestorPapId || !candidatePapId) return false

    const category = categoryRows.find((row) => String(row.id) === String(categoryId))
    if (!category) return false

    const path = findPapPathInTree(Array.isArray(category.paps) ? category.paps : [], candidatePapId)
    return path.some((node) => String(node.id) === String(ancestorPapId))
  }

  const openSuccessIndicatorPicker = (categoryId, papId) => {
    setSuccessIndicatorPickerCategoryId(categoryId)
    setSuccessIndicatorPickerPapId(papId)
    setSuccessIndicatorPickerOpen(true)
  }

  const closeSuccessIndicatorPicker = () => {
    setSuccessIndicatorPickerOpen(false)
    setSuccessIndicatorPickerCategoryId(null)
    setSuccessIndicatorPickerPapId(null)
  }

  const handleSelectSuccessIndicator = (categoryId, papId, successIndicator) => {
    if (!categoryId || !papId || !successIndicator?.value) return

    setSelectedSuccessIndicatorToAdd({
      ...successIndicator,
      value: String(successIndicator.value ?? successIndicator.id),
    })
    setSuccessIndicatorCreateCategoryId(categoryId)
    setSuccessIndicatorCreatePapId(papId)
    setSuccessIndicatorCreateValue(successIndicator.target ?? successIndicator.title ?? successIndicator.label ?? "")
    setSuccessIndicatorCreateActivityId(successIndicator.performance_activity_id ?? successIndicator.activity?.id ?? null)
    setSuccessIndicatorCreateWeight(successIndicator.weight ?? "")
    setSuccessIndicatorCreateAmount(successIndicator.amount ?? successIndicator.budget ?? "")
    const nextMatrixSource = successIndicator.performance_rating_id ? "default" : "custom"
    setSuccessIndicatorCreateMatrixSource(nextMatrixSource)
    setSuccessIndicatorCreatePerformanceRatingId(successIndicator.performance_rating_id ?? null)
    setSuccessIndicatorCreateMatrixPayload(buildMatrixPayloadFromRows(successIndicator.rating_rows ?? []))
    setSuccessIndicatorCreateDivisionAssignments(
      normalizeSuccessIndicatorDivisionAssignments(successIndicator.division_assignments ?? [], activeDivisionIds)
    )
    setSuccessIndicatorCreateGroupAssignments(
      Array.isArray(successIndicator.group_assignments) ? successIndicator.group_assignments.map((item) => String(item)) : []
    )
    setSuccessIndicatorCreateEmployeeAssignments(
      Array.isArray(successIndicator.employee_assignments) ? successIndicator.employee_assignments.map((item) => String(item)) : []
    )
    setSuccessIndicatorCreateOpen(true)
    closeSuccessIndicatorPicker()
  }

  const handleOpenCreateSuccessIndicator = (term) => {
    setSelectedSuccessIndicatorToAdd(null)
    setSuccessIndicatorCreateValue(term || "")
    setSuccessIndicatorCreateActivityId(null)
    setSuccessIndicatorCreateWeight("")
    setSuccessIndicatorCreateAmount("")
    const defaultRating = ratings[0] ?? null
    setSuccessIndicatorCreateMatrixSource(defaultRating ? "default" : "custom")
    setSuccessIndicatorCreatePerformanceRatingId(defaultRating ? String(defaultRating.id) : null)
    setSuccessIndicatorCreateMatrixPayload(
      defaultRating?.matrix_rows?.length
        ? normalizeMatrixPayload(defaultRating.matrix_rows)
        : [createMatrixBlock()]
    )
    setSuccessIndicatorCreateCategoryId(successIndicatorPickerCategoryId)
    setSuccessIndicatorCreatePapId(successIndicatorPickerPapId)
      setSuccessIndicatorCreateOpen(true)
    }

  const handleCreateSuccessIndicator = async () => {
    const target = successIndicatorCreateValue.trim()
    if (!target) return

    const parentCategory = categoryRows.find((row) => String(row.id) === String(successIndicatorCreateCategoryId))
    const currentPapNode = findPapNodeInTree(Array.isArray(parentCategory?.paps) ? parentCategory.paps : [], successIndicatorCreatePapId)
    if (!currentPapNode) return

    const nextIndicatorNode = {
      value: "__pending__",
      label: target,
      target,
      title: target,
      performance_activity_id: successIndicatorCreateActivityId,
      performance_rating_id: successIndicatorCreateMatrixSource === "default" ? successIndicatorCreatePerformanceRatingId : null,
      weight: successIndicatorCreateWeight,
      amount: successIndicatorCreateAmount,
      division_assignments: [...successIndicatorCreateDivisionAssignments],
      group_assignments: [...successIndicatorCreateGroupAssignments],
      employee_assignments: [...successIndicatorCreateEmployeeAssignments],
      rating_rows: flattenMatrixPayload(successIndicatorCreateMatrixPayload),
    }

    const candidatePaps = insertSuccessIndicatorIntoTree(
      Array.isArray(parentCategory.paps) ? parentCategory.paps : [],
      successIndicatorCreatePapId,
      nextIndicatorNode
    )
    const candidatePapNode = findPapNodeInTree(candidatePaps, successIndicatorCreatePapId)
    const capacityError = validatePapCapacity(currentPapNode, candidatePapNode)

    if (capacityError) {
      toast({
        title: capacityError.title,
        description: capacityError.description,
        variant: "destructive",
      })
      return
    }

    try {
      setSuccessIndicatorCreating(true)

      if (selectedSuccessIndicatorToAdd?.value) {
        const selectedIndicator = {
          ...selectedSuccessIndicatorToAdd,
          value: String(selectedSuccessIndicatorToAdd.value ?? selectedSuccessIndicatorToAdd.id),
          label: target,
          target,
          title: target,
          performance_activity_id: successIndicatorCreateActivityId,
          activity_output:
            activityMap[String(successIndicatorCreateActivityId)] ??
            selectedSuccessIndicatorToAdd.activity_output ??
            "",
          performance_rating_id:
            successIndicatorCreateMatrixSource === "default"
              ? successIndicatorCreatePerformanceRatingId
              : selectedSuccessIndicatorToAdd.performance_rating_id ?? null,
          weight: successIndicatorCreateWeight,
          amount: successIndicatorCreateAmount,
          budget: successIndicatorCreateAmount,
          division_assignments: [...successIndicatorCreateDivisionAssignments],
          group_assignments: [...successIndicatorCreateGroupAssignments],
          employee_assignments: [...successIndicatorCreateEmployeeAssignments],
          rating_rows: flattenMatrixPayload(successIndicatorCreateMatrixPayload),
        }

        const candidatePaps = insertSuccessIndicatorIntoTree(
          Array.isArray(parentCategory.paps) ? parentCategory.paps : [],
          successIndicatorCreatePapId,
          {
            ...selectedIndicator,
            value: String(selectedIndicator.value ?? selectedIndicator.id),
          }
        )
        const candidatePapNode = findPapNodeInTree(candidatePaps, successIndicatorCreatePapId)
        const capacityError = validatePapCapacity(currentPapNode, candidatePapNode)

        if (capacityError) {
          toast({
            title: capacityError.title,
            description: capacityError.description,
            variant: "destructive",
          })
          return
        }

        addSuccessIndicatorToPapRow(successIndicatorCreateCategoryId, successIndicatorCreatePapId, selectedIndicator)
      } else {
        const response = await axios.post(route("performance.success-indicators.store"), {
          level: "OPCR",
          performance_activity_id: successIndicatorCreateActivityId,
          performance_rating_id: successIndicatorCreateMatrixSource === "default" ? successIndicatorCreatePerformanceRatingId : null,
          target,
          division_assignments: successIndicatorCreateDivisionAssignments,
          group_assignments: successIndicatorCreateGroupAssignments,
          employee_assignments: successIndicatorCreateEmployeeAssignments,
          matrix_payload: successIndicatorCreateMatrixPayload,
        })

        const createdIndicator =
          response?.data?.data?.record ||
          response?.data?.record ||
          response?.data?.data?.indicator ||
          response?.data?.indicator ||
          response?.data?.data ||
          response?.data
        if (!createdIndicator?.id) {
          throw new Error("Unable to create success indicator.")
        }

        if (successIndicatorCreateCategoryId && successIndicatorCreatePapId) {
          addSuccessIndicatorToPapRow(successIndicatorCreateCategoryId, successIndicatorCreatePapId, {
            value: String(createdIndicator.id),
            label: createdIndicator.label || createdIndicator.target || target,
            target: createdIndicator.target || target,
            performance_activity_id: createdIndicator.performance_activity_id ?? successIndicatorCreateActivityId,
            activity_output: createdIndicator.activity_output ?? activityMap[String(createdIndicator.performance_activity_id ?? successIndicatorCreateActivityId)] ?? "",
            performance_rating_id: createdIndicator.performance_rating_id ?? (successIndicatorCreateMatrixSource === "default" ? successIndicatorCreatePerformanceRatingId : null),
            weight: createdIndicator.weight ?? successIndicatorCreateWeight,
            amount: createdIndicator.budget ?? successIndicatorCreateAmount,
            division_assignments: createdIndicator.division_assignments ?? successIndicatorCreateDivisionAssignments,
            group_assignments: createdIndicator.group_assignments ?? successIndicatorCreateGroupAssignments,
            employee_assignments: createdIndicator.employee_assignments ?? successIndicatorCreateEmployeeAssignments,
            rating_rows: flattenMatrixPayload(successIndicatorCreateMatrixPayload),
          })
        }
      }

      setSuccessIndicatorCreateOpen(false)
      setSuccessIndicatorCreateValue("")
      setSuccessIndicatorCreateActivityId(null)
      setSuccessIndicatorCreateMatrixSource("custom")
      setSuccessIndicatorCreatePerformanceRatingId(null)
      setSuccessIndicatorCreateMatrixPayload([createMatrixBlock()])
      setSuccessIndicatorCreateWeight("")
      setSuccessIndicatorCreateAmount("")
      setSuccessIndicatorCreateDivisionAssignments([])
      setSuccessIndicatorCreateGroupAssignments([])
      setSuccessIndicatorCreateEmployeeAssignments([])
      setSuccessIndicatorCreateCategoryId(null)
      setSuccessIndicatorCreatePapId(null)
      setSelectedSuccessIndicatorToAdd(null)
      closeSuccessIndicatorPicker()
      toast({
        title: "Saved",
        description: "New success indicator added successfully.",
      })
    } catch (error) {
      const message =
        error?.response?.data?.errors?.target?.[0] ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create success indicator."

      toast({
        title: "Unable to add success indicator",
        description: message,
        variant: "destructive",
      })
    } finally {
      setSuccessIndicatorCreating(false)
    }
  }

  const handleRemovePap = (categoryId, papId, parentPapId = null) => {
    if (!categoryId || !papId) return

    setCategoryRows((currentRows) =>
      currentRows.map((row) => {
        if (String(row.id) !== String(categoryId)) return row

        return {
          ...row,
          paps: removePapNodeFromTree(Array.isArray(row.paps) ? row.paps : [], papId),
        }
      })
    )
  }

  const promptRemovePap = (categoryId, pap) => {
    if (!categoryId || !pap) return
    setPendingPapRemoval({
      categoryId,
      pap,
      parentPapId: pap.parentPapId ?? pap.parent_item_id ?? null,
    })
  }

  const openCategoryEdit = (category) => {
    if (!canManage) return
    setEditingCategory(category)
    setEditingPap(null)
    setCategoryDraft({
      weight: category.weight ?? "",
      amount: category.amount ?? category.budget ?? "",
    })
    setCategoryEditorOpen(true)
  }

  const openPapEdit = (category, pap, parentPapId = null) => {
    if (!category || !pap) return

    const parentCategory = categoryRows.find((row) => String(row.id) === String(category.id)) || category

    setEditingPap({
      categoryId: category.id,
      parentPapId,
      id: pap.id,
      activity: pap.activity,
      weight: pap.weight ?? "",
      amount: pap.amount ?? pap.budget ?? "",
    })
    setEditingCategory(parentCategory)
    setCategoryDraft({
      weight: pap.weight ?? "",
      amount: pap.amount ?? pap.budget ?? "",
    })
    setCategoryEditorOpen(true)
  }

  const handleSaveCategory = () => {
    if (!canManage) return
    if (!editingCategory && !editingPap) return

    if (editingPap) {
      const parentCategory = categoryRows.find((row) => String(row.id) === String(editingPap.categoryId))
      if (!parentCategory) return

      const nextPapWeight = Number(categoryDraft.weight)
      const nextPapAmount = Number(categoryDraft.amount)
      const updatedPaps = updatePapNodeInTree(Array.isArray(parentCategory.paps) ? parentCategory.paps : [], editingPap.id, (pap) => ({
        ...pap,
        weight: categoryDraft.weight,
        amount: categoryDraft.amount,
      }))
      const updatedCurrentNode = findPapNodeInTree(updatedPaps, editingPap.id)
      const ancestorPath = findPapPathInTree(updatedPaps, editingPap.id).slice(0, -1)
      const nodesToValidate = [updatedCurrentNode, ...ancestorPath].filter(Boolean)

      for (const node of nodesToValidate) {
        const nodeTotals = getPapBranchTotalsFromNode(node)
        const nodeCap = getPapAllocationCap(node)

        if (nodeCap.weight !== null && nodeTotals.weight > nodeCap.weight + 0.0001) {
          toast({
            title: "Weight exceeds allowed total",
            description: "A lower-level MFO/PAP exceeded the weight cap of its parent.",
            variant: "destructive",
          })
          return
        }

        if (nodeCap.amount !== null && nodeTotals.amount > nodeCap.amount + 0.0001) {
          toast({
            title: "Allocated budget exceeds allowed total",
            description: "A lower-level MFO/PAP exceeded the budget cap of its parent.",
            variant: "destructive",
          })
          return
        }
      }

      setCategoryRows((currentRows) =>
        currentRows.map((row) => {
          if (String(row.id) !== String(editingPap.categoryId)) return row

          return {
            ...row,
            paps: updatedPaps,
          }
        })
      )
      setCategoryEditorOpen(false)
      setEditingCategory(null)
      setEditingPap(null)
      return
    }

    const nextWeight = Number(categoryDraft.weight)
    const currentWeight = getCategoryDisplayWeight(editingCategory)
    const safeNextWeight = Number.isFinite(nextWeight) ? nextWeight : 0
    const safeCurrentWeight = Number.isFinite(currentWeight) ? currentWeight : 0
    const nextTotal = categoryWeightTotal - safeCurrentWeight + safeNextWeight

    if (nextTotal > 100.0001) {
      toast({
        title: "Weight exceeds 100%",
        description: "The total category weight cannot go above 100%.",
        variant: "destructive",
      })
      return
    }

    setCategoryRows((currentRows) =>
      currentRows.map((row) =>
        String(row.id) === String(editingCategory.id)
          ? { ...row, weight: categoryDraft.weight, amount: categoryDraft.amount }
          : row
      )
    )
    setCategoryEditorOpen(false)
    setEditingCategory(null)
    setEditingPap(null)
  }
  const canReorderItems = canManage && draftRows.length === 0
  const sectionLabel = "Planning and Commitment"
  const sectionDescription = "During this stage, success indicators are determined. Success indicators are performance level yardsticks consisting of performance measures and performance targets. These shall serve as bases in the officeÃ¢â‚¬â„¢s and individual employeeÃ¢â‚¬â„¢s preparation of their performance contract and rating form."

  const persistTree = async (nodes) => {
    if (!record?.id) return
    const payloadNodes = nodes ?? serializedTree

    try {
      if (autosaveStatusTimerRef.current) {
        clearTimeout(autosaveStatusTimerRef.current)
      }
      setAutosaveStatus("saving")
      await axios.post(route("opcrs.items.sync-tree", { recordId: record.id }), {
        nodes: payloadNodes,
      })

      lastSavedTreeRef.current = JSON.stringify(payloadNodes)
      setAutosaveStatus("saved")
      autosaveStatusTimerRef.current = setTimeout(() => {
        setAutosaveStatus("idle")
      }, 1500)
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.nodes?.[0] ||
        error?.message ||
        "Failed to save the OPCR tree."

      setAutosaveStatus("dirty")
      toast({
        title: "Unable to save tree",
        description: message,
        variant: "destructive",
      })
    }
  }

  const serializedTree = useMemo(() => serializeOpcrTree(categoryRows), [categoryRows])

  useEffect(() => {
    if (!canManage || !record?.id) return
    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false
      return
    }

    const serializedPayload = JSON.stringify(serializedTree)
    if (serializedPayload === lastSavedTreeRef.current) return

    setAutosaveStatus("dirty")
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current)
    }

    autosaveTimerRef.current = setTimeout(() => {
      persistTree(serializedTree)
    }, 800)

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
    }
  }, [canManage, record?.id, serializedTree])

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
      if (autosaveStatusTimerRef.current) {
        clearTimeout(autosaveStatusTimerRef.current)
      }
    }
  }, [])

  const renderSuccessIndicatorRows = (
    category,
    pap,
    successIndicators = [],
    level = 1,
    pathPrefix = "",
    parentPapName = ""
  ) =>
    (Array.isArray(successIndicators) ? successIndicators : []).map((indicator, indicatorIndex) => {
      const rowNumber = `${pathPrefix}.${indicatorIndex + 1}`
      const indicatorTotals = getSuccessIndicatorTotalsFromNode(indicator)
      const rowClassName = getSuccessIndicatorRowClassName(level)
      const indicatorParentLabel = parentPapName || pap.activity || category.category
      const accountabilityLabel = formatAssignments([
        ...(indicator.division_assignments ?? []),
        ...(indicator.group_assignments ?? []),
        ...(indicator.employee_assignments ?? []),
      ])
      const accountabilityDisplay = accountabilityLabel !== "-" ? accountabilityLabel : formatText(indicator.accountable, "-")

      return (
        <TableRow
          key={`${category.id}-${pap.id}-si-${indicator.id ?? rowNumber}`}
          className={rowClassName}
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
          <TableCell className="align-middle px-3 py-1 text-sm text-slate-400 whitespace-normal break-words">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${(level + 1) * 1.25}rem` }}>
              <span className="text-slate-300">-</span>
              <span className="whitespace-normal break-words">{formatText(indicatorParentLabel)}</span>
            </div>
          </TableCell>
          <TableCell className="align-middle px-3 py-1 text-sm text-slate-400 whitespace-normal break-words">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${(level + 1) * 1.25}rem` }}>
              <span className="text-slate-300">-</span>
              <span className="whitespace-normal break-words">{formatText(pap.activity)}</span>
            </div>
          </TableCell>
          <TableCell className="align-middle px-3 py-1 text-sm text-slate-900 whitespace-normal break-words">
            <div className="whitespace-normal break-words">{formatText(indicator.target ?? indicator.title, "-")}</div>
          </TableCell>
          <TableCell className="align-middle px-3 py-1 text-xs text-slate-700 whitespace-normal break-words">
            <div className="whitespace-normal break-words">{accountabilityDisplay}</div>
          </TableCell>
          <TableCell className={`align-middle px-3 py-1 text-right ${getSuccessIndicatorMetricClassName()}`}>
            {`${formatFixedNumber(indicatorTotals.weight)}%`}
          </TableCell>
          <TableCell className={`align-middle px-3 py-1 text-right ${getSuccessIndicatorMetricClassName()}`}>
            {formatFixedNumber(indicatorTotals.amount)}
          </TableCell>
          <TableCell className="align-middle px-3 py-1 text-right">
            {canManage && (
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
            )}
          </TableCell>
        </TableRow>
      )
    })
  const renderPapRows = (
    category,
    paps = [],
    level = 1,
    parentPapId = null,
    parentPapName = "",
    pathPrefix = "",
    categoryNumber = ""
  ) =>
    (Array.isArray(paps) ? paps : []).map((pap, papIndex) => {
      const rowNumber = pathPrefix ? `${pathPrefix}.${papIndex + 1}` : `${categoryNumber}.${papIndex + 1}`
      const childPaps = Array.isArray(pap.children) ? pap.children : []
      const successIndicators = Array.isArray(pap.successIndicators) ? pap.successIndicators : []
      const childLevel = level > 1
      const papTotals = getPapDisplayTotals(pap)
      const rowClassName = getPapRowClassName(level)

      return (
        <Fragment key={`${category.id}-${pap.id}-${rowNumber}`}>
          <TableRow
            className={rowClassName}
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
            <TableCell className="align-middle px-3 py-1 text-sm text-slate-400 whitespace-normal break-words min-w-0">
              <div className="flex min-w-0 items-center gap-2" style={{ paddingLeft: `${level * 1.25}rem` }}>
                <span className="text-slate-300">{childLevel ? "-" : "-"}</span>
                {childLevel ? (
                  <div className="flex min-w-0 flex-col">
                    <span className="break-words text-sm text-slate-400">{formatText(parentPapName)}</span>
                  </div>
                ) : (
                  <span className="whitespace-normal break-words">{formatText(category.category)}</span>
                )}
              </div>
            </TableCell>
            <TableCell className="align-middle px-3 py-1 text-sm text-slate-900 whitespace-normal break-words min-w-0">
              <div className="flex min-w-0 items-center gap-2" style={{ paddingLeft: `${level * 1.25}rem` }}>
                <span className="text-slate-300">-</span>
                <div className="min-w-0">
                  <div className="whitespace-normal break-words">{formatText(pap.activity)}</div>
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
                          <div className="text-xs text-slate-500">
                            Choose an existing success indicator or add a new one if it is not in the library yet.
                          </div>
                        </div>
                        <SearchableComboBox
                          apiUrl={route("performance.success-indicators.index")}
                          placeholder="Search success indicators..."
                          addLabel="Add New Item"
                          canAdd
                          excludeValues={successIndicators.map((item) => item.id)}
                          onChange={(_, item) => {
                            if (item) {
                              handleSelectSuccessIndicator(category.id, pap.id, item)
                            }
                          }}
                          onAdd={handleOpenCreateSuccessIndicator}
                          width="w-full"
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
            <TableCell className={`align-middle px-3 py-1 text-right ${getPapMetricClassName()}`}>
              {`${formatFixedNumber(papTotals.weight)}%`}
            </TableCell>
            <TableCell className={`align-middle px-3 py-1 text-right ${getPapMetricClassName()}`}>
              {formatFixedNumber(papTotals.amount)}
            </TableCell>
            <TableCell className="align-middle px-3 py-1 text-right">
              {canManage && (
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
              )}
            </TableCell>
          </TableRow>

          {renderSuccessIndicatorRows(category, pap, successIndicators, level, rowNumber, parentPapName)}

          {childPaps.length > 0
            ? renderPapRows(category, childPaps, level + 1, pap.id, pap.activity, rowNumber, categoryNumber)
            : null}
        </Fragment>
      )
    })

  const persistItemOrder = async (nextRows) => {
    setItemRows(nextRows)

    try {
      await axios.post(route("opcrs.items.reorder", { recordId: record.id }), {
        ids: nextRows.map((row) => row.id),
      })
    } catch (error) {
      console.error("Failed to reorder OPCR items", error)
    }
  }

  const handleItemDragStart = (itemId) => {
    setDraggedItemId(itemId)
  }

  const handleItemDrop = (targetId) => {
    if (!draggedItemId || draggedItemId === targetId) {
      setDraggedItemId(null)
      return
    }

    const currentIndex = itemRows.findIndex((row) => String(row.id) === String(draggedItemId))
    const targetIndex = itemRows.findIndex((row) => String(row.id) === String(targetId))

    if (currentIndex === -1 || targetIndex === -1) {
      setDraggedItemId(null)
      return
    }

    const nextRows = [...itemRows]
    const [moved] = nextRows.splice(currentIndex, 1)
    nextRows.splice(targetIndex, 0, moved)

    setDraggedItemId(null)
    persistItemOrder(nextRows)
  }

  const handleItemDragOver = (event) => {
    event.preventDefault()
  }

  if (!record) {
    return (
      <TooltipProvider delayDuration={0}>
        <Card className="border border-slate-200 bg-white shadow-none">
          <CardHeader>
            <CardTitle className="text-base">OPCR Items</CardTitle>
            <CardDescription>No active OPCR record was found for the selected period.</CardDescription>
          </CardHeader>
        </Card>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider delayDuration={0}>
      <>
      <OpcrTreeTable
        canManage={canManage}
        categoryRows={categoryRows}
        addCategoryOpen={addCategoryOpen}
        setAddCategoryOpen={setAddCategoryOpen}
        handleSelectCategory={handleSelectCategory}
        handleOpenCreateCategory={handleOpenCreateCategory}
        categoryWeightTotal={categoryWeightTotal}
        categoryWeightIsBalanced={categoryWeightIsBalanced}
        categoryWeightBalance={categoryWeightBalance}
        hasAnyExplicitCategoryCap={hasAnyExplicitCategoryCap}
        formatNumber={formatNumber}
        formatFixedNumber={formatFixedNumber}
        formatText={formatText}
        formatAssignments={formatAssignments}
        getCategoryDisplayWeight={getCategoryDisplayWeight}
        getCategoryDisplayAmount={getCategoryDisplayAmount}
        getPapDisplayTotals={getPapDisplayTotals}
        draggedTreeNode={draggedTreeNode}
        handleTreeDragStart={handleTreeDragStart}
        handleTreeDragEnd={handleTreeDragEnd}
        autosaveStatus={autosaveStatus}
        reorderCategoryRows={reorderCategoryRows}
        movePapNode={movePapNode}
        isPapDescendantInCategory={isPapDescendantInCategory}
        reorderPapWithinCategory={reorderPapWithinCategory}
        reorderSuccessIndicatorWithinPap={reorderSuccessIndicatorWithinPap}
        moveSuccessIndicatorNode={moveSuccessIndicatorNode}
        openPapPicker={openPapPicker}
        closePapPicker={closePapPicker}
        papPickerOpen={papPickerOpen}
        papPickerCategoryId={papPickerCategoryId}
        papPickerParentPapId={papPickerParentPapId}
        handleSelectPap={handleSelectPap}
        handleOpenCreatePap={handleOpenCreatePap}
        successIndicatorPickerOpen={successIndicatorPickerOpen}
        successIndicatorPickerCategoryId={successIndicatorPickerCategoryId}
        successIndicatorPickerPapId={successIndicatorPickerPapId}
        openSuccessIndicatorPicker={openSuccessIndicatorPicker}
        closeSuccessIndicatorPicker={closeSuccessIndicatorPicker}
        handleSelectSuccessIndicator={handleSelectSuccessIndicator}
        handleOpenCreateSuccessIndicator={handleOpenCreateSuccessIndicator}
        openCategoryEdit={openCategoryEdit}
        promptRemoveCategory={promptRemoveCategory}
        openPapEdit={openPapEdit}
        promptRemovePap={promptRemovePap}
        openSuccessIndicatorEdit={openSuccessIndicatorEdit}
        promptRemoveSuccessIndicator={promptRemoveSuccessIndicator}
        onPreviewOpen={() => setPreviewOpen(true)}
      />

      <PreviewOpcrDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        categoryRows={categoryRows}
        periodLabel={periodLabel}
        formatText={formatText}
        formatFixedNumber={formatFixedNumber}
        formatAssignments={formatAssignments}
      />

      <Sheet open={editorOpen} onOpenChange={setEditorOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-3xl">
          <SheetHeader className="text-left">
            <SheetTitle className="text-base">{editingPap ? "Edit MFO/PAP" : editingItem ? "Edit OPCR Item" : "Add OPCR Item"}</SheetTitle>
            <SheetDescription>
              {editingPap
                ? "Set the local weight and allocated budget for this MFO/PAP row."
                : "Build the OPCR commitment line from the performance libraries, then fill in the accomplishment data."}
            </SheetDescription>
          </SheetHeader>

          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Commitment / Targeting</div>
                  <div className="text-xs text-slate-500">Select the category and PAP for this row.</div>
                </div>

                <div className="space-y-2">
                  <Label>{editingPap ? "MFO/PAP" : "Category"}</Label>
                  <Input value={editingCategory?.category ?? editingPap?.activity ?? ""} disabled />
                </div>

              <div className="space-y-2">
                <Label>PAP</Label>
                <Select value={data.pap_id} onValueChange={setPap}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select PAP" />
                  </SelectTrigger>
                  <SelectContent>
                    {ppas.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.pap_id && <p className="text-xs text-red-600">{errors.pap_id}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                <div className="space-y-2">
                  <Label>Weight</Label>
                  <Input type="number" step="0.01" value={data.weight} onChange={(event) => setData("weight", event.target.value)} />
                  {errors.weight && <p className="text-xs text-red-600">{errors.weight}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Allocated Budget</Label>
                  <Input type="number" step="0.01" value={data.allocated_budget} onChange={(event) => setData("allocated_budget", event.target.value)} />
                  {errors.allocated_budget && <p className="text-xs text-red-600">{errors.allocated_budget}</p>}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Sort Order</Label>
                  <Input type="number" min="0" value={data.sort_order} onChange={(event) => setData("sort_order", event.target.value)} />
                  {errors.sort_order && <p className="text-xs text-red-600">{errors.sort_order}</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setEditorOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={processing} className="bg-slate-900 hover:bg-slate-800">
                {processing ? "Saving..." : editingItem ? "Update Item" : "Save Item"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
      <CategoryEditorSheet
        open={categoryEditorOpen && !editingPap}
        onOpenChange={setCategoryEditorOpen}
        category={editingCategory}
        categoryDraft={categoryDraft}
        setCategoryDraft={setCategoryDraft}
        onSave={handleSaveCategory}
      />

      <PapEditorSheet
        open={categoryEditorOpen && Boolean(editingPap)}
        onOpenChange={setCategoryEditorOpen}
        categoryName={editingCategory?.category}
        pap={editingPap}
        categoryDraft={categoryDraft}
        setCategoryDraft={setCategoryDraft}
        onSave={handleSaveCategory}
      />

      <CategoryCreateDialog
        open={categoryCreateOpen}
        onOpenChange={(open) => {
          setCategoryCreateOpen(open)
          if (!open) {
            setCategoryCreateValue("")
          }
        }}
        value={categoryCreateValue}
        onValueChange={setCategoryCreateValue}
        onCancel={() => {
          setCategoryCreateOpen(false)
          setCategoryCreateValue("")
        }}
        onCreate={handleCreateCategory}
        creating={categoryCreating}
      />

      <PapCreateDialog
        open={papCreateOpen}
        onOpenChange={(open) => {
          setPapCreateOpen(open)
          if (!open) {
            setPapCreateValue("")
            setPapCreateWeight("")
            setPapCreateAmount("")
            setPapCreateLocked(false)
            setSelectedPapToAdd(null)
            setPreservePapCategoryOnClose(false)
          }
        }}
        categoryName={formatText(categoryRows.find((row) => String(row.id) === String(papPickerCategoryId))?.category, "this category")}
        value={papCreateValue}
        onValueChange={setPapCreateValue}
        valueDisabled={papCreateLocked}
        weight={papCreateWeight}
        amount={papCreateAmount}
        onWeightChange={setPapCreateWeight}
        onAmountChange={setPapCreateAmount}
        onCancel={() => {
          setPapCreateOpen(false)
          setPapCreateValue("")
          setPapCreateWeight("")
          setPapCreateAmount("")
          setPapCreateLocked(false)
          setSelectedPapToAdd(null)
          setPreservePapCategoryOnClose(false)
          setPapPickerCategoryId(null)
        }}
        onCreate={handleCreatePap}
        creating={papCreating}
      />

      <SuccessIndicatorCreateDialog
        open={successIndicatorCreateOpen}
        onOpenChange={(open) => {
          setSuccessIndicatorCreateOpen(open)
          if (!open) {
            setSelectedSuccessIndicatorToAdd(null)
            setSuccessIndicatorCreateValue("")
            setSuccessIndicatorCreateActivityId(null)
            setSuccessIndicatorCreateWeight("")
            setSuccessIndicatorCreateAmount("")
            setSuccessIndicatorCreateMatrixSource("custom")
            setSuccessIndicatorCreatePerformanceRatingId(null)
            setSuccessIndicatorCreateMatrixPayload([createMatrixBlock()])
            setSuccessIndicatorCreateCategoryId(null)
            setSuccessIndicatorCreatePapId(null)
          }
        }}
        title={selectedSuccessIndicatorToAdd?.value ? "Add Selected Success Indicator" : "Add Success Indicator"}
        description="Type the success indicator details for this MFO/PAP row."
        activityId={successIndicatorCreateActivityId}
        target={successIndicatorCreateValue}
        weight={successIndicatorCreateWeight}
        amount={successIndicatorCreateAmount}
        assignmentValues={combineSuccessIndicatorAssignments(
          successIndicatorCreateDivisionAssignments,
          successIndicatorCreateGroupAssignments,
          successIndicatorCreateEmployeeAssignments
        )}
        onActivityChange={setSuccessIndicatorCreateActivityId}
        onTargetChange={setSuccessIndicatorCreateValue}
        onWeightChange={setSuccessIndicatorCreateWeight}
        onAmountChange={setSuccessIndicatorCreateAmount}
        onAssignmentsChange={(values) => {
          const split = splitSuccessIndicatorAssignments(values)
          setSuccessIndicatorCreateDivisionAssignments(normalizeSuccessIndicatorDivisionAssignments(split.division_assignments, activeDivisionIds))
          setSuccessIndicatorCreateGroupAssignments(split.group_assignments)
          setSuccessIndicatorCreateEmployeeAssignments(split.employee_assignments)
        }}
        onCancel={() => {
          setSuccessIndicatorCreateOpen(false)
          setSelectedSuccessIndicatorToAdd(null)
          setSuccessIndicatorCreateValue("")
          setSuccessIndicatorCreateActivityId(null)
          setSuccessIndicatorCreateMatrixSource("custom")
          setSuccessIndicatorCreatePerformanceRatingId(null)
          setSuccessIndicatorCreateMatrixPayload([createMatrixBlock()])
          setSuccessIndicatorCreateWeight("")
          setSuccessIndicatorCreateAmount("")
          setSuccessIndicatorCreateDivisionAssignments([])
          setSuccessIndicatorCreateGroupAssignments([])
          setSuccessIndicatorCreateEmployeeAssignments([])
          setSuccessIndicatorCreateCategoryId(null)
          setSuccessIndicatorCreatePapId(null)
        }}
        onCreate={handleCreateSuccessIndicator}
        submitLabel="Create & Add Success Indicator"
        submittingLabel="Creating..."
        creating={successIndicatorCreating}
        activities={activities}
        divisions={divisions}
        groups={groups}
        employees={employees}
        activityMap={activityMap}
        divisionMap={divisionMap}
        groupMap={groupMap}
        employeeMap={employeeMap}
        matrixSource={successIndicatorCreateMatrixSource}
        ratingItems={ratingItems}
        selectedRating={ratingMap[String(successIndicatorCreatePerformanceRatingId)] ?? null}
        onMatrixSourceChange={(value) => {
          const nextSource = value || "custom"
          setSuccessIndicatorCreateMatrixSource(nextSource)

          if (nextSource === "default") {
            const fallbackRating = ratingMap[String(successIndicatorCreatePerformanceRatingId)] ?? ratings[0] ?? null
            if (fallbackRating) {
              setSuccessIndicatorCreatePerformanceRatingId(String(fallbackRating.id))
              setSuccessIndicatorCreateMatrixPayload(
                fallbackRating.matrix_rows?.length
                  ? normalizeMatrixPayload(fallbackRating.matrix_rows)
                  : [createMatrixBlock()]
              )
            }
            return
          }

          setSuccessIndicatorCreatePerformanceRatingId(null)
        }}
        onPerformanceRatingChange={(value) => {
          const selected = ratingMap[String(value)] ?? null
          setSuccessIndicatorCreatePerformanceRatingId(value ? String(value) : null)
          setSuccessIndicatorCreateMatrixPayload(
            selected?.matrix_rows?.length
              ? normalizeMatrixPayload(selected.matrix_rows)
              : [createMatrixBlock()]
          )
        }}
        matrixPayload={successIndicatorCreateMatrixPayload}
        onMatrixPayloadChange={setSuccessIndicatorCreateMatrixPayload}
      />

      <SuccessIndicatorCreateDialog
        open={successIndicatorEditOpen}
        onOpenChange={(open) => {
          setSuccessIndicatorEditOpen(open)
          if (!open) {
            setEditingSuccessIndicator(null)
            setSuccessIndicatorCreateValue("")
            setSuccessIndicatorCreateActivityId(null)
            setSuccessIndicatorCreateMatrixSource("custom")
            setSuccessIndicatorCreatePerformanceRatingId(null)
            setSuccessIndicatorCreateMatrixPayload([createMatrixBlock()])
            setSuccessIndicatorCreateWeight("")
            setSuccessIndicatorCreateAmount("")
            setSuccessIndicatorCreateDivisionAssignments([])
            setSuccessIndicatorCreateGroupAssignments([])
            setSuccessIndicatorCreateEmployeeAssignments([])
          }
        }}
        title="Edit Success Indicator"
        description="Update the success indicator details for this MFO/PAP row."
        activityId={successIndicatorCreateActivityId}
        target={successIndicatorCreateValue}
        weight={successIndicatorCreateWeight}
        amount={successIndicatorCreateAmount}
        assignmentValues={combineSuccessIndicatorAssignments(
          successIndicatorCreateDivisionAssignments,
          successIndicatorCreateGroupAssignments,
          successIndicatorCreateEmployeeAssignments
        )}
        onActivityChange={setSuccessIndicatorCreateActivityId}
        onTargetChange={setSuccessIndicatorCreateValue}
        onWeightChange={setSuccessIndicatorCreateWeight}
        onAmountChange={setSuccessIndicatorCreateAmount}
        onAssignmentsChange={(values) => {
          const split = splitSuccessIndicatorAssignments(values)
          setSuccessIndicatorCreateDivisionAssignments(normalizeSuccessIndicatorDivisionAssignments(split.division_assignments, activeDivisionIds))
          setSuccessIndicatorCreateGroupAssignments(split.group_assignments)
          setSuccessIndicatorCreateEmployeeAssignments(split.employee_assignments)
        }}
        onCancel={() => {
          setSuccessIndicatorEditOpen(false)
          setEditingSuccessIndicator(null)
          setSuccessIndicatorCreateValue("")
          setSuccessIndicatorCreateActivityId(null)
          setSuccessIndicatorCreateMatrixSource("custom")
          setSuccessIndicatorCreatePerformanceRatingId(null)
          setSuccessIndicatorCreateMatrixPayload([createMatrixBlock()])
          setSuccessIndicatorCreateWeight("")
          setSuccessIndicatorCreateAmount("")
          setSuccessIndicatorCreateDivisionAssignments([])
          setSuccessIndicatorCreateGroupAssignments([])
          setSuccessIndicatorCreateEmployeeAssignments([])
        }}
        onCreate={handleSaveSuccessIndicatorEdit}
        submitLabel="Save Success Indicator"
        submittingLabel="Saving..."
        creating={false}
        activities={activities}
        divisions={divisions}
        groups={groups}
        employees={employees}
        activityMap={activityMap}
        divisionMap={divisionMap}
        groupMap={groupMap}
        employeeMap={employeeMap}
        matrixSource={successIndicatorCreateMatrixSource}
        ratingItems={ratingItems}
        selectedRating={ratingMap[String(successIndicatorCreatePerformanceRatingId)] ?? null}
        onMatrixSourceChange={(value) => {
          const nextSource = value || "custom"
          setSuccessIndicatorCreateMatrixSource(nextSource)

          if (nextSource === "default") {
            setSuccessIndicatorCreateMatrixPayload(buildMatrixPayloadFromRows(editingSuccessIndicator?.rating_rows ?? []))
            return
          }

          setSuccessIndicatorCreatePerformanceRatingId(null)
        }}
        onPerformanceRatingChange={(value) => {
          const selected = ratingMap[String(value)] ?? null
          setSuccessIndicatorCreatePerformanceRatingId(value ? String(value) : null)
          setSuccessIndicatorCreateMatrixPayload(
            selected?.matrix_rows?.length
              ? normalizeMatrixPayload(selected.matrix_rows)
              : buildMatrixPayloadFromRows(editingSuccessIndicator?.rating_rows ?? [])
          )
        }}
        matrixPayload={successIndicatorCreateMatrixPayload}
        onMatrixPayloadChange={setSuccessIndicatorCreateMatrixPayload}
      />

      <AlertDialog
        open={Boolean(pendingCategoryRemoval)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingCategoryRemoval(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Category?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {formatText(pendingCategoryRemoval?.category)}? This will also remove all related entries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingCategoryRemoval(null)} className="border-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingCategoryRemoval?.id) {
                  handleRemoveCategory(pendingCategoryRemoval.id)
                }
                setPendingCategoryRemoval(null)
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Remove Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(pendingPapRemoval)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingPapRemoval(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove MFO/PAP?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {formatText(pendingPapRemoval?.pap?.activity)}? This will also remove all related entries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingPapRemoval(null)} className="border-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingPapRemoval?.categoryId && pendingPapRemoval?.pap?.id) {
                  handleRemovePap(
                    pendingPapRemoval.categoryId,
                    pendingPapRemoval.pap.id,
                    pendingPapRemoval.parentPapId ?? pendingPapRemoval.pap?.parentPapId ?? null
                  )
                }
                setPendingPapRemoval(null)
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Remove MFO/PAP
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(pendingSuccessIndicatorRemoval)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingSuccessIndicatorRemoval(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Success Indicator?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {formatText(pendingSuccessIndicatorRemoval?.indicator?.target ?? pendingSuccessIndicatorRemoval?.indicator?.title)}?
              This will also remove all related entries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingSuccessIndicatorRemoval(null)} className="border-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingSuccessIndicatorRemoval?.categoryId && pendingSuccessIndicatorRemoval?.papId && pendingSuccessIndicatorRemoval?.indicator?.id) {
                  handleRemoveSuccessIndicator(
                    pendingSuccessIndicatorRemoval.categoryId,
                    pendingSuccessIndicatorRemoval.papId,
                    pendingSuccessIndicatorRemoval.indicator.id
                  )
                }
                setPendingSuccessIndicatorRemoval(null)
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Remove Success Indicator
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      </>
    </TooltipProvider>
  )
}




























