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
}) => {
  const childPaps = Array.isArray(pap.children) ? pap.children : []
  const successIndicators = Array.isArray(pap.successIndicators) ? pap.successIndicators : []
  const firstSuccessIndicator = successIndicators[0] ?? null
  const firstSuccessIndicatorTotals = firstSuccessIndicator ? getSuccessIndicatorTotals(firstSuccessIndicator) : null
  const baseRow = {
    key: `${category.id}-${pap.id}-${path || "root"}`,
    rowNumber: showCategory ? String(categoryIndex + 1) : path || String(categoryIndex + 1),
    showCategory,
    categoryLabel: showCategory ? category.category ?? category.label ?? "" : "",
    papLabel: pap.activity ?? pap.title ?? pap.label ?? "",
    papDepth: depth,
    indicatorLabel: firstSuccessIndicator ? firstSuccessIndicator.target ?? firstSuccessIndicator.title ?? firstSuccessIndicator.label ?? "" : "-",
    indicatorDepth: depth,
    weight: firstSuccessIndicatorTotals?.weight ?? null,
    amount: firstSuccessIndicatorTotals?.amount ?? null,
    assignments: firstSuccessIndicator
      ? [
          ...(Array.isArray(firstSuccessIndicator.division_assignments) ? firstSuccessIndicator.division_assignments : []),
          ...(Array.isArray(firstSuccessIndicator.group_assignments) ? firstSuccessIndicator.group_assignments : []),
          ...(Array.isArray(firstSuccessIndicator.employee_assignments) ? firstSuccessIndicator.employee_assignments : []),
        ]
      : [],
    categoryWeight: null,
    categoryAmount: null,
  }

  const rows = [baseRow]

  successIndicators.slice(1).forEach((indicator, indicatorIndex) => {
    const indicatorTotals = getSuccessIndicatorTotals(indicator)
    rows.push({
      key: `${category.id}-${pap.id}-${path || "root"}-si-${indicator.id ?? indicatorIndex + 2}`,
      rowNumber: `${path || categoryIndex + 1}.si${indicatorIndex + 2}`,
      showCategory: false,
      categoryLabel: "",
      papLabel: "",
      papDepth: depth,
      indicatorLabel: indicator.target ?? indicator.title ?? indicator.label ?? "",
      indicatorDepth: depth,
      weight: indicatorTotals.weight,
      amount: indicatorTotals.amount,
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

    if (paps.length === 0) {
      rows.push({
        key: `${category.id}-category-${categoryIndex}`,
        rowNumber: String(categoryIndex + 1),
        showCategory: true,
        categoryLabel: category.category ?? category.label ?? "",
        papLabel: "-",
        papDepth: 0,
        indicatorLabel: "-",
        indicatorDepth: 0,
        weight: null,
        amount: null,
        assignments: [],
        categoryWeight: categoryTotals.weight,
        categoryAmount: categoryTotals.amount,
      })
      return
    }

    paps.forEach((pap, papIndex) => {
      const papRows = buildPapPreviewRows({
        category,
        pap,
        categoryIndex,
        showCategory: papIndex === 0,
        path: `${categoryIndex + 1}.${papIndex + 1}`,
        depth: 0,
      })

      if (papRows.length > 0) {
        if (papRows[0].showCategory) {
          papRows[0].categoryWeight = categoryTotals.weight
          papRows[0].categoryAmount = categoryTotals.amount
        }
        rows.push(...papRows)
      }
    })
  })

  return rows
}
