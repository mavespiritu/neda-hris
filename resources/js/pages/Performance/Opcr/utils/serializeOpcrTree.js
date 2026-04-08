const normalizeAssignments = (values = []) =>
  (Array.isArray(values) ? values : []).map((value) => String(value)).filter(Boolean)

const serializeSuccessIndicatorNode = (indicator = {}) => ({
  id: indicator.id ?? indicator.value ?? null,
  target: indicator.target ?? indicator.title ?? indicator.label ?? "",
  measurement: indicator.measurement ?? "",
  weight: indicator.weight ?? "",
  amount: indicator.amount ?? indicator.allocated_budget ?? indicator.budget ?? "",
  allocated_budget: indicator.allocated_budget ?? indicator.amount ?? indicator.budget ?? "",
  performance_rating_id: indicator.performance_rating_id ?? null,
  division_assignments: normalizeAssignments(indicator.division_assignments),
  group_assignments: normalizeAssignments(indicator.group_assignments),
  employee_assignments: normalizeAssignments(indicator.employee_assignments),
  sort_order: indicator.sort_order ?? 0,
  rating_rows: Array.isArray(indicator.rating_rows) ? indicator.rating_rows.map((row) => ({ ...row })) : [],
})

const serializePapNode = (pap = {}) => ({
  id: pap.id ?? pap.value ?? null,
  activity: pap.activity ?? pap.title ?? pap.label ?? "",
  program_id: pap.program_id ?? null,
  program_title: pap.program_title ?? "",
  weight: pap.weight ?? "",
  amount: pap.amount ?? pap.allocated_budget ?? pap.budget ?? "",
  allocated_budget: pap.allocated_budget ?? pap.amount ?? pap.budget ?? "",
  sort_order: pap.sort_order ?? 0,
  children: serializePapTree(pap.children ?? pap.paps ?? []),
  successIndicators: (Array.isArray(pap.successIndicators) ? pap.successIndicators : []).map(serializeSuccessIndicatorNode),
})

export const serializePapTree = (paps = []) =>
  (Array.isArray(paps) ? paps : []).map(serializePapNode)

export const serializeOpcrTree = (categoryRows = []) =>
  (Array.isArray(categoryRows) ? categoryRows : []).map((category) => ({
    id: category.id ?? null,
    category: category.category ?? category.label ?? "",
    description: category.description ?? "",
    weight: category.weight ?? "",
    amount: category.amount ?? category.allocated_budget ?? category.budget ?? "",
    allocated_budget: category.allocated_budget ?? category.amount ?? category.budget ?? "",
    sort_order: category.sort_order ?? 0,
    paps: serializePapTree(category.paps ?? []),
  }))
