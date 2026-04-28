const toNumber = (value) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

const hasPositiveNumber = (value) => {
  if (value === null || value === undefined || value === "") return false
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0
}

const getAmountValue = (node = {}) => node.amount ?? node.allocated_budget ?? node.budget ?? 0

const getSuccessIndicatorTotals = (indicator = {}) => ({
  weight: toNumber(indicator.weight),
  amount: toNumber(getAmountValue(indicator)),
})

const getProgramGroupKey = (pap = {}) => {
  const title = String(pap.program_title ?? "").trim().toLowerCase()
  if (title) {
    return `title:${title}`
  }

  const programId = String(pap.program_id ?? "").trim()
  return programId ? `id:${programId}` : ""
}

const getPapBranchTotals = (pap = {}) => {
  const childPaps = Array.isArray(pap.children) ? pap.children : []
  const successIndicators = Array.isArray(pap.successIndicators) ? pap.successIndicators : []

  const childTotals = childPaps.reduce(
    (totals, childPap) => {
      const branchTotals = getPapBranchTotals(childPap)
      return {
        weight: totals.weight + branchTotals.weight,
        amount: totals.amount + branchTotals.amount,
      }
    },
    { weight: 0, amount: 0 }
  )

  const successIndicatorTotals = successIndicators.reduce(
    (totals, indicator) => {
      const indicatorTotals = getSuccessIndicatorTotals(indicator)
      return {
        weight: totals.weight + indicatorTotals.weight,
        amount: totals.amount + indicatorTotals.amount,
      }
    },
    { weight: 0, amount: 0 }
  )

  return {
    weight: (hasPositiveNumber(pap.weight) ? toNumber(pap.weight) : 0) + childTotals.weight + successIndicatorTotals.weight,
    amount: (hasPositiveNumber(pap.amount ?? pap.allocated_budget ?? pap.budget) ? toNumber(getAmountValue(pap)) : 0) + childTotals.amount + successIndicatorTotals.amount,
  }
}

export const getPreviewCategoryTotals = (category = {}) => {
  const childTotals = (Array.isArray(category.paps) ? category.paps : []).reduce(
    (totals, pap) => {
      const branchTotals = getPapBranchTotals(pap)
      return {
        weight: totals.weight + branchTotals.weight,
        amount: totals.amount + branchTotals.amount,
      }
    },
    { weight: 0, amount: 0 }
  )

  return {
    weight: hasPositiveNumber(category.weight) ? toNumber(category.weight) : childTotals.weight,
    amount: hasPositiveNumber(category.amount ?? category.allocated_budget ?? category.budget) ? toNumber(getAmountValue(category)) : childTotals.amount,
  }
}

const buildPapPreviewRows = ({
  category,
  pap,
  categoryIndex,
  showCategory = false,
  path = "",
  depth = 0,
  programState = { lastProgramKey: null },
}) => {
  const childPaps = Array.isArray(pap.children) ? pap.children : []
  const successIndicators = Array.isArray(pap.successIndicators) ? pap.successIndicators : []
  const programKey = getProgramGroupKey(pap)
  const programLabel = pap.program_title ?? ""
  const shouldRenderProgramRow = Boolean(programLabel) && programKey && programKey !== programState.lastProgramKey
  const papTotals = getPapBranchTotals(pap)
  const rows = []

  if (shouldRenderProgramRow) {
    programState.lastProgramKey = programKey
    rows.push({
      key: `${category.id}-${pap.id}-${path || "root"}-program`,
      rowNumber: path || String(categoryIndex + 1),
      type: "program",
      showCategory: false,
      categoryLabel: "",
      papLabel: programLabel,
      papDepth: depth,
      indicatorLabel: "-",
      indicatorDepth: depth,
      weight: null,
      amount: null,
      assignments: [],
      categoryWeight: null,
      categoryAmount: null,
    })
  }

  if (programKey) {
    programState.lastProgramKey = programKey
  }

    rows.push({
      key: `${category.id}-${pap.id}-${path || "root"}`,
      rowNumber: showCategory ? String(categoryIndex + 1) : path || String(categoryIndex + 1),
      type: "pap",
      showCategory,
    categoryLabel: showCategory ? category.category ?? category.label ?? "" : "",
    papLabel: pap.activity ?? pap.title ?? pap.label ?? "",
    papDepth: depth,
    indicatorLabel: "",
    indicatorDepth: depth,
    weight: papTotals.weight,
    amount: papTotals.amount,
    assignments: [],
    categoryWeight: null,
      categoryAmount: null,
    })

    successIndicators.forEach((indicator, indicatorIndex) => {
      const indicatorTotals = getSuccessIndicatorTotals(indicator)
    rows.push({
      key: `${category.id}-${pap.id}-${path || "root"}-si-${indicator.id ?? indicatorIndex + 1}`,
      rowNumber: `${path || categoryIndex + 1}.${indicatorIndex + 1}`,
      type: "successIndicator",
      showCategory: false,
      categoryLabel: "",
      papLabel: "",
      papDepth: depth,
      indicatorLabel: indicator.target ?? indicator.title ?? indicator.label ?? "",
      indicatorDepth: depth,
        weight: indicatorTotals.weight,
        amount: indicatorTotals.amount,
        sourceItem: indicator,
        assignments: [
          ...(Array.isArray(indicator.division_assignments) ? indicator.division_assignments : []),
          ...(Array.isArray(indicator.group_assignments) ? indicator.group_assignments : []),
          ...(Array.isArray(indicator.employee_assignments) ? indicator.employee_assignments : []),
        ],
      categoryWeight: null,
      categoryAmount: null,
    })
  })

  childPaps.forEach((childPap, childIndex) => {
    rows.push(
      ...buildPapPreviewRows({
        category,
        pap: childPap,
        categoryIndex,
        showCategory: false,
        path: `${path || categoryIndex + 1}.${childIndex + 1}`,
        depth: depth + 1,
        programState,
      })
    )
  })

  return rows
}

export const buildPreviewOpcrRows = (categoryRows = []) => {
  const rows = []

  ;(Array.isArray(categoryRows) ? categoryRows : []).forEach((category, categoryIndex) => {
    const paps = Array.isArray(category.paps) ? category.paps : []
    const categoryTotals = getPreviewCategoryTotals(category)
    const programState = { lastProgramKey: null }

    if (paps.length === 0) {
      rows.push({
        key: `${category.id}-category-${categoryIndex}`,
        rowNumber: String(categoryIndex + 1),
        type: "category",
        showCategory: true,
        categoryLabel: category.category ?? category.label ?? "",
        papLabel: "-",
        papDepth: 0,
        indicatorLabel: "-",
        indicatorDepth: 0,
        weight: null,
        amount: null,
        sourceItem: null,
        assignments: [],
        categoryWeight: categoryTotals.weight,
        categoryAmount: categoryTotals.amount,
      })
      return
    }

    rows.push({
      key: `${category.id}-category-${categoryIndex}`,
      rowNumber: String(categoryIndex + 1),
      type: "category",
      showCategory: true,
      categoryLabel: category.category ?? category.label ?? "",
      papLabel: "-",
      papDepth: 0,
      indicatorLabel: "-",
      indicatorDepth: 0,
      weight: null,
      amount: null,
      sourceItem: null,
      assignments: [],
      categoryWeight: categoryTotals.weight,
      categoryAmount: categoryTotals.amount,
    })

    paps.forEach((pap, papIndex) => {
      const papRows = buildPapPreviewRows({
        category,
        pap,
        categoryIndex,
        showCategory: false,
        path: `${categoryIndex + 1}.${papIndex + 1}`,
        depth: 0,
        programState,
      })

      if (papRows.length > 0) {
        rows.push(...papRows)
      }
    })
  })

  return rows
}
