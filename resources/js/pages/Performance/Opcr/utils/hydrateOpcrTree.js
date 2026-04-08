const sortByTreeOrder = (items = [], ...fallbackKeys) =>
  [...(Array.isArray(items) ? items : [])].sort((left, right) => {
    for (const key of fallbackKeys) {
      const leftValue = Number(left?.[key] ?? 0)
      const rightValue = Number(right?.[key] ?? 0)
      if (leftValue !== rightValue) {
        return leftValue - rightValue
      }
    }

    return Number(left?.id ?? 0) - Number(right?.id ?? 0)
  })

const toStringId = (value) => String(value ?? "")

const normalizeAssignments = (values = []) =>
  (Array.isArray(values) ? values : []).map((value) => String(value)).filter(Boolean)

const buildSuccessIndicatorNode = (item) => ({
  id: item.success_indicator_id ?? item.id,
  value: item.success_indicator_id ?? item.id,
  target: item.success_indicator_title ?? "",
  title: item.success_indicator_title ?? "",
  measurement: item.measurement ?? item.remarks ?? "",
  weight: item.weight ?? "",
  amount: item.amount ?? item.allocated_budget ?? item.budget ?? "",
  allocated_budget: item.allocated_budget ?? item.amount ?? item.budget ?? "",
  performance_rating_id: item.performance_rating_id ?? null,
  division_assignments: normalizeAssignments(item.division_assignments),
  group_assignments: normalizeAssignments(item.group_assignments),
  employee_assignments: normalizeAssignments(item.employee_assignments),
  sort_order: item.success_indicator_sort_order ?? item.sort_order ?? 0,
  opcr_item_id: item.id,
  rating_rows: Array.isArray(item.rating_rows) ? item.rating_rows.map((row) => ({ ...row })) : [],
})

const buildPapNode = (item, childItemsByParent, childItems = []) => {
  const children = sortByTreeOrder(
    childItems.filter((child) => !child.success_indicator_id),
    "pap_sort_order",
    "sort_order"
  )

  const successIndicators = sortByTreeOrder(
    childItems.filter((child) => child.success_indicator_id),
    "success_indicator_sort_order",
    "sort_order"
  ).map(buildSuccessIndicatorNode)

  return {
    id: item.pap_id ?? item.id,
    value: item.pap_id ?? item.id,
    activity: item.pap_title ?? "",
    title: item.pap_title ?? "",
    program_id: item.pap_program_id ?? item.program_id ?? null,
    program_title: item.pap_program_title ?? item.program_title ?? "",
    weight: item.weight ?? "",
    amount: item.allocated_budget ?? item.budget ?? "",
    allocated_budget: item.allocated_budget ?? item.budget ?? "",
    sort_order: item.pap_sort_order ?? item.sort_order ?? 0,
    opcr_item_id: item.id,
    children: children.map((child) => buildPapNode(child, childItemsByParent, childItemsByParent.get(toStringId(child.id)) ?? [])),
    successIndicators,
  }
}

export const hydrateOpcrTree = (categories = [], items = []) => {
  const flatItems = Array.isArray(items) ? items : []
  const childItemsByParent = flatItems.reduce((map, item) => {
    const parentKey = toStringId(item.parent_item_id)
    if (!map.has(parentKey)) {
      map.set(parentKey, [])
    }
    map.get(parentKey).push(item)
    return map
  }, new Map())

  if (flatItems.length === 0) {
    return sortByTreeOrder((Array.isArray(categories) ? categories : []).map((category, index) => ({
      ...category,
      sort_order: category.sort_order ?? index + 1,
      paps: [],
    })), "sort_order")
  }

  const normalizedCategories = (Array.isArray(categories) ? categories : []).map((category, index) => {
    const categoryItems = flatItems.filter((item) => toStringId(item.category_id) === toStringId(category.id))
    const rootItem = categoryItems.find((item) => !item.parent_item_id && Number(item.item_level ?? 1) === 1) ?? null

    if (!rootItem) {
      return null
    }

    const rootChildren = rootItem ? childItemsByParent.get(toStringId(rootItem.id)) ?? [] : []

    return {
      ...category,
      weight: rootItem?.weight ?? category.weight ?? "",
      amount: rootItem?.allocated_budget ?? rootItem?.budget ?? category.amount ?? category.budget ?? "",
      allocated_budget: rootItem?.allocated_budget ?? rootItem?.budget ?? category.allocated_budget ?? category.amount ?? category.budget ?? "",
      sort_order: rootItem?.category_sort_order ?? category.sort_order ?? index + 1,
      paps: sortByTreeOrder(rootChildren, "pap_sort_order", "sort_order").map((papItem) =>
        buildPapNode(papItem, childItemsByParent, childItemsByParent.get(toStringId(papItem.id)) ?? [])
      ),
    }
  }).filter(Boolean)

  return sortByTreeOrder(normalizedCategories, "sort_order")
}
